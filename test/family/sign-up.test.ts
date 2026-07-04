import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeChain } from "../helpers/db";

// --- Mocks (registered before importing the module under test) -----------------------------------

// Mock the Drizzle client the same way the canonical exemplar does. `db.query.<table>` and the
// `insert/update/delete/select` builders come from the shared helper.
vi.mock("@/lib/db", async () => {
    const h = await import("../helpers/db");
    return { db: h.makeDb(h.ALL_TABLES).db };
});

// NextAuth PostgresAdapter: only the two verification-token methods are used here.
vi.mock("@/lib/auth", () => ({
    pgadapter: {
        createVerificationToken: vi.fn(),
        useVerificationToken: vi.fn(),
    },
}));

// Email sender used by requestRegCode/resendCode. Mock the whole data module so no MS Graph call
// is attempted.
vi.mock("@/server/auth/data", () => ({
    sendRegEmail: vi.fn(),
}));

// Rate limiting is a no-op in tests; clientIp returns a fixed address.
vi.mock("@/lib/rateLimit", () => ({
    clientIp: vi.fn(async () => "1.2.3.4"),
    enforceRateLimit: vi.fn(),
}));

// bcrypt default export (source does `import bcrypt from "bcrypt"`).
vi.mock("bcrypt", () => ({
    default: {
        hash: vi.fn(async () => "hashed-password"),
    },
}));

// Import AFTER mocks are registered.
import { db } from "@/lib/db";
import { pgadapter } from "@/lib/auth";
import { sendRegEmail } from "@/server/auth/data";
import {
    checkRegCode,
    fullRegisterFamily,
    registerDraftFamily,
    requestRegCode,
} from "@/server/auth/familyreg.actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any;
const mockCreateToken = vi.mocked(pgadapter.createVerificationToken);
const mockUseToken = vi.mocked(pgadapter.useVerificationToken);
const mockSendRegEmail = vi.mocked(sendRegEmail);

// clearMocks only resets call history, not implementations set via mockResolvedValue — so reset the
// query defaults here to keep tests independent.
beforeEach(() => {
    anyDb.query.users.findFirst.mockResolvedValue(undefined);
    anyDb.query.registration_drafts.findFirst.mockResolvedValue(undefined);
    mockCreateToken.mockResolvedValue(undefined as never);
    mockUseToken.mockResolvedValue(null as never);
});

// A valid family profile (familySchema requires at least one parent's name).
const validFamilyData = {
    fatherfirsten: "John",
    fatherlasten: "Doe",
    fathernamecn: "",
    motherlasten: "",
    motherfirsten: "",
    mothernamecn: "",
};

const validRegData = { username: "newuser", email: "new@example.com" };

// -------------------------------------------------------------------------------------------------

describe("requestRegCode — duplicate email guard", () => {
    it("rejects when the email already belongs to a user, and does NOT send an email", async () => {
        anyDb.query.users.findFirst.mockResolvedValue({ id: "u1", email: "taken@example.com" });

        await expect(requestRegCode({ email: "taken@example.com" })).rejects.toThrow(
            "Email already exists"
        );

        expect(mockCreateToken).not.toHaveBeenCalled();
        expect(mockSendRegEmail).not.toHaveBeenCalled();
    });

    it("creates a verification token and sends the email on success", async () => {
        anyDb.query.users.findFirst.mockResolvedValue(undefined);

        await expect(requestRegCode({ email: "fresh@example.com" })).resolves.toBeUndefined();

        expect(mockCreateToken).toHaveBeenCalledTimes(1);
        const tokenArg = mockCreateToken.mock.calls[0][0];
        expect(tokenArg.identifier).toBe("fresh@example.com");
        expect(tokenArg.token).toMatch(/^\d{6}$/);
        expect(mockSendRegEmail).toHaveBeenCalledWith("fresh@example.com", tokenArg.token);
    });
});

describe("checkRegCode — code validation", () => {
    it("rejects an invalid code (no verification token returned)", async () => {
        mockUseToken.mockResolvedValue(null as never);

        await expect(checkRegCode({ code: "123456" }, "user@example.com")).rejects.toThrow(
            /Invalid or expired code/
        );
    });

    it("rejects an expired code", async () => {
        mockUseToken.mockResolvedValue({
            identifier: "user@example.com",
            token: "123456",
            expires: new Date(Date.now() - 60_000),
        } as never);

        await expect(checkRegCode({ code: "123456" }, "user@example.com")).rejects.toThrow(
            /Expired/
        );
    });
});

describe("registerDraftFamily — duplicate username guard", () => {
    it("rejects when the username is already taken", async () => {
        anyDb.query.users.findFirst.mockResolvedValue({ id: "u1", name: "newuser" });

        await expect(
            registerDraftFamily(
                {
                    username: "newuser",
                    password: "Abcd1234",
                    confirmPassword: "Abcd1234",
                },
                "new@example.com"
            )
        ).rejects.toThrow("Username already exists");

        // Must fail before writing a draft.
        expect(anyDb.insert).not.toHaveBeenCalled();
    });
});

describe("fullRegisterFamily — safeAction envelope", () => {
    it("returns ok:false with a 'session has expired' message when the draft is missing", async () => {
        anyDb.query.registration_drafts.findFirst.mockResolvedValue(undefined);

        const result = await fullRegisterFamily({
            fullData: validFamilyData,
            regData: validRegData,
            isTeacher: false,
        });

        expect(result.ok).toBe(false);
        // safeAction turns the thrown Error into { ok:false, errorMessage }.
        expect(result).toMatchObject({ ok: false });
        expect((result as { errorMessage?: string }).errorMessage).toMatch(/session has expired/i);
    });

    it("registers the family (deletes draft, inserts users then family) and returns ok:true", async () => {
        anyDb.query.registration_drafts.findFirst.mockResolvedValue({
            email: "new@example.com",
            name: "newuser",
            password: "hashed-password",
            expires: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        });

        // The users insert is awaited via `.returning(...)` destructured as `[{ id }]`.
        anyDb.insert.mockReturnValueOnce(makeChain([{ id: "user-1" }]));

        const result = await fullRegisterFamily({
            fullData: validFamilyData,
            regData: validRegData,
            isTeacher: false,
        });

        expect(result).toMatchObject({ ok: true });
        expect(anyDb.delete).toHaveBeenCalledTimes(1);
        // Two inserts: users, then the family profile row.
        expect(anyDb.insert).toHaveBeenCalledTimes(2);
    });
});
