import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeChain } from "../helpers/db";

vi.mock("@/lib/db", async () => {
    const h = await import("../helpers/db");
    return { db: h.makeDb(h.ALL_TABLES).db };
});
vi.mock("@/server/auth/actions", () => ({
    requireRole: vi.fn(),
}));
// `familyResetPassword` uses a default import: `import bcrypt from "bcrypt"`.
// Provide both `default` and named exports so `bcrypt.compare`/`bcrypt.hash`
// are controllable regardless of interop.
vi.mock("bcrypt", () => ({
    default: { compare: vi.fn(), hash: vi.fn() },
    compare: vi.fn(),
    hash: vi.fn(),
}));

// Import AFTER mocks are registered.
import bcrypt from "bcrypt";
import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/actions";
import { familyResetPassword } from "@/server/auth/familyRestPassword";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any;
const mockRequireRole = vi.mocked(requireRole);
const mockCompare = vi.mocked(bcrypt.compare);
const mockHash = vi.mocked(bcrypt.hash);

/** Make requireRole() resolve to a FAMILY session whose user.name === `email`. */
function asFamily(email: string) {
    mockRequireRole.mockResolvedValue({
        user: { id: "u1", role: "FAMILY", name: email, email },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
}

const EMAIL = "alice@example.com";

describe("familyResetPassword — authorization", () => {
    it("returns Forbidden when session.user.name !== email (self-check)", async () => {
        mockRequireRole.mockResolvedValue({
            user: { id: "u1", role: "FAMILY", name: "alice", email: EMAIL },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const result = await familyResetPassword({
            email: EMAIL,
            oldpassword: "old",
            newpassword: "new",
        });

        expect(result.ok).toBe(false);
        expect(result.message).toEqual(expect.stringContaining("Forbidden"));
        // Must fail before touching the DB.
        expect(anyDb.query.users.findFirst).not.toHaveBeenCalled();
    });
});

describe("familyResetPassword — credential validation", () => {
    beforeEach(() => {
        asFamily(EMAIL);
    });

    it("returns Invalid credentials when the user is not found", async () => {
        anyDb.query.users.findFirst.mockResolvedValue(undefined);

        const result = await familyResetPassword({
            email: EMAIL,
            oldpassword: "old",
            newpassword: "new",
        });

        expect(result.ok).toBe(false);
        expect(result.message).toEqual(expect.stringContaining("Invalid credentials"));
        expect(mockCompare).not.toHaveBeenCalled();
    });

    it("returns Invalid credentials when the email is not verified", async () => {
        anyDb.query.users.findFirst.mockResolvedValue({
            name: EMAIL,
            password: "hashed-old",
            emailVerified: null,
            roles: ["FAMILY"],
        });

        const result = await familyResetPassword({
            email: EMAIL,
            oldpassword: "old",
            newpassword: "new",
        });

        expect(result.ok).toBe(false);
        expect(result.message).toEqual(expect.stringContaining("Invalid credentials"));
    });

    it("returns Invalid credentials when the user lacks the FAMILY role", async () => {
        anyDb.query.users.findFirst.mockResolvedValue({
            name: EMAIL,
            password: "hashed-old",
            emailVerified: new Date().toISOString(),
            roles: ["TEACHER"],
        });

        const result = await familyResetPassword({
            email: EMAIL,
            oldpassword: "old",
            newpassword: "new",
        });

        expect(result.ok).toBe(false);
        expect(result.message).toEqual(expect.stringContaining("Invalid credentials"));
    });

    it("returns Invalid old password when bcrypt.compare fails", async () => {
        anyDb.query.users.findFirst.mockResolvedValue({
            name: EMAIL,
            password: "hashed-old",
            emailVerified: new Date().toISOString(),
            roles: ["FAMILY"],
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockCompare.mockResolvedValue(false as any);

        const result = await familyResetPassword({
            email: EMAIL,
            oldpassword: "wrong-old",
            newpassword: "new",
        });

        expect(result.ok).toBe(false);
        expect(result.message).toEqual(expect.stringContaining("Invalid old password"));
        expect(mockHash).not.toHaveBeenCalled();
    });
});

describe("familyResetPassword — happy path", () => {
    beforeEach(() => {
        asFamily(EMAIL);
    });

    it("hashes the new password and updates the user row", async () => {
        anyDb.query.users.findFirst.mockResolvedValue({
            name: EMAIL,
            password: "hashed-old",
            emailVerified: new Date().toISOString(),
            roles: ["FAMILY"],
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockCompare.mockResolvedValue(true as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockHash.mockResolvedValue("hashed" as any);
        anyDb.update.mockReturnValue(makeChain(undefined));

        const result = await familyResetPassword({
            email: EMAIL,
            oldpassword: "old",
            newpassword: "brand-new",
        });

        expect(result.ok).toBe(true);
        expect(result.message).toEqual(expect.stringContaining("successfully"));

        // The user row was updated with the freshly hashed password.
        expect(anyDb.update).toHaveBeenCalled();
        const setCall = anyDb.update.mock.results[0].value.set.mock.calls[0][0];
        expect(setCall).toMatchObject({ password: "hashed" });
    });
});
