import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted so the (hoisted) vi.mock factory below can reference it.
const mocks = vi.hoisted(() => ({
    cookieStore: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
}));

vi.mock("@/lib/db", async () => {
    const h = await import("../helpers/db");
    return { db: h.makeDb(h.ALL_TABLES).db };
});

// pgadapter is the Node-runtime PG NextAuth adapter; mock its verification-token
// helpers so no real DB / NextAuth machinery loads.
vi.mock("@/lib/auth", () => ({
    pgadapter: {
        createVerificationToken: vi.fn(async () => undefined),
        useVerificationToken: vi.fn(async () => undefined),
    },
}));

// The actual email sender. Mocking here lets us assert it is NOT called on the
// user-enumeration-defense branch.
vi.mock("@/server/auth/data", () => ({
    sendFPEmail: vi.fn(async () => undefined),
}));

// Rate limiting must never block in tests.
vi.mock("@/lib/rateLimit", () => ({
    clientIp: vi.fn(async () => "1.2.3.4"),
    enforceRateLimit: vi.fn(),
    rateLimit: vi.fn(() => ({ ok: true, remaining: 1, resetAt: Date.now() + 1000 })),
}));

vi.mock("next/headers", () => ({
    cookies: vi.fn(async () => mocks.cookieStore),
}));

vi.mock("bcrypt", () => ({
    default: { hash: vi.fn(async () => "hashed-password") },
}));

// Import AFTER mocks are registered.
import bcrypt from "bcrypt";
import { db } from "@/lib/db";
import { pgadapter } from "@/lib/auth";
import { sendFPEmail } from "@/server/auth/data";
import {
    exchangePasswordResetToken,
    requestPasswordReset,
    resetPassword,
} from "@/server/auth/resetpw.actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any;
const mockSendFP = vi.mocked(sendFPEmail);
const mockCreateToken = vi.mocked(pgadapter.createVerificationToken);
const mockUseToken = vi.mocked(pgadapter.useVerificationToken);
const mockHash = vi.mocked(bcrypt.hash);
const cookieStore = mocks.cookieStore;

const RESET_SESSION_COOKIE = "lisoc_pw_reset";
const A_VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const future = () => new Date(Date.now() + 15 * 60 * 1000);
const futureISO = () => future().toISOString();

beforeEach(() => {
    // clearMocks (vitest.config) clears call data but keeps implementations, so
    // reset resolved values / cookie reads to a clean default each test.
    anyDb.query.users.findFirst.mockResolvedValue(undefined);
    anyDb.query.verificationToken.findFirst.mockResolvedValue(undefined);
    mockUseToken.mockResolvedValue(null);
    mockHash.mockResolvedValue("hashed-password" as never);
    cookieStore.get.mockReturnValue(undefined);
});

describe("requestPasswordReset", () => {
    it("creates a hashed token and sends the email when the account exists", async () => {
        anyDb.query.users.findFirst.mockResolvedValue({ id: "u1", email: "user@example.com" });

        const res = await requestPasswordReset({ email: "user@example.com" });

        expect(res.ok).toBe(true);
        expect(mockCreateToken).toHaveBeenCalledTimes(1);
        // Token stored is hashed (sha256 hex), never the raw uuid.
        const stored = mockCreateToken.mock.calls[0][0];
        expect(stored.identifier).toBe("pwreset:user@example.com");
        expect(stored.token).toMatch(/^[a-f0-9]{64}$/);
        expect(mockSendFP).toHaveBeenCalledTimes(1);
        expect(mockSendFP).toHaveBeenCalledWith("user@example.com", expect.any(String));
    });

    it("silently succeeds WITHOUT sending an email when the account is missing (enumeration defense)", async () => {
        anyDb.query.users.findFirst.mockResolvedValue(undefined);

        const res = await requestPasswordReset({ email: "nobody@example.com" });

        expect(res.ok).toBe(true);
        expect(mockSendFP).not.toHaveBeenCalled();
        expect(mockCreateToken).not.toHaveBeenCalled();
    });

    it("rejects an invalid email with a field error", async () => {
        const res = await requestPasswordReset({ email: "not-an-email" });

        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.fieldErrors?.email).toBeTruthy();
        }
        expect(mockSendFP).not.toHaveBeenCalled();
    });
});

describe("resetPassword", () => {
    it("fails when there is no reset-session cookie", async () => {
        cookieStore.get.mockReturnValue(undefined);

        const res = await resetPassword({
            password: "GoodPass123",
            confirmPassword: "GoodPass123",
        });

        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.errorMessage).toContain("Invalid or expired reset session");
        }
        expect(anyDb.update).not.toHaveBeenCalled();
    });

    it("hashes the new password, updates the user, and clears the cookie on success", async () => {
        cookieStore.get.mockReturnValue({ value: "session-token" });
        anyDb.query.verificationToken.findFirst.mockResolvedValue({
            identifier: "pwreset-session:user@example.com",
            token: "hash",
            expires: futureISO(),
        });
        mockUseToken.mockResolvedValue({
            identifier: "pwreset-session:user@example.com",
            token: "hash",
            expires: future(),
        } as never);

        const res = await resetPassword({
            password: "GoodPass123",
            confirmPassword: "GoodPass123",
        });

        expect(res.ok).toBe(true);
        expect(mockHash).toHaveBeenCalledWith("GoodPass123", 10);
        expect(anyDb.update).toHaveBeenCalledTimes(1);
        const updateChain = anyDb.update.mock.results[0].value;
        expect(updateChain.set).toHaveBeenCalledWith({ password: "hashed-password" });
        expect(cookieStore.delete).toHaveBeenCalledWith(RESET_SESSION_COOKIE);
    });

    it("rejects mismatched password/confirmPassword via the zod refine", async () => {
        const res = await resetPassword({
            password: "GoodPass123",
            confirmPassword: "OtherPass456",
        });

        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.fieldErrors?.confirmPassword).toBeTruthy();
        }
        expect(anyDb.update).not.toHaveBeenCalled();
    });
});

describe("exchangePasswordResetToken", () => {
    it("fails for an invalid/expired token", async () => {
        anyDb.query.verificationToken.findFirst.mockResolvedValue(undefined);

        const res = await exchangePasswordResetToken({ token: A_VALID_UUID });

        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.errorMessage).toContain("Invalid or expired reset link.");
        }
        expect(cookieStore.set).not.toHaveBeenCalled();
    });

    it("consumes the token and sets a reset-session cookie on success", async () => {
        anyDb.query.verificationToken.findFirst.mockResolvedValue({
            identifier: "pwreset:user@example.com",
            token: "hash",
            expires: futureISO(),
        });
        mockUseToken.mockResolvedValue({
            identifier: "pwreset:user@example.com",
            token: "hash",
            expires: future(),
        } as never);

        const res = await exchangePasswordResetToken({ token: A_VALID_UUID });

        expect(res.ok).toBe(true);
        // A new session token (hashed) is stored...
        expect(mockCreateToken).toHaveBeenCalledTimes(1);
        expect(mockCreateToken.mock.calls[0][0].identifier).toBe(
            "pwreset-session:user@example.com"
        );
        // ...and the reset-session cookie is set.
        expect(cookieStore.set).toHaveBeenCalledWith(
            RESET_SESSION_COOKIE,
            expect.any(String),
            expect.any(Object)
        );
    });
});
