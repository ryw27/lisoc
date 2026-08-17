import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", async () => {
    const h = await import("../helpers/db");
    const { db, tx } = h.makeDb([...h.ALL_TABLES, "adminuser"]);
    // Expose tx for assertions on the transactional writes.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).__tx = tx;
    return { db };
});

vi.mock("@/lib/auth", () => ({
    pgadapter: {
        createVerificationToken: vi.fn(async () => undefined),
        useVerificationToken: vi.fn(async () => undefined),
    },
}));

vi.mock("@/server/auth/data", () => ({
    sendAdminPasswordResetEmail: vi.fn(async () => undefined),
}));

vi.mock("@/server/auth/actions", () => ({
    requireRole: vi.fn(async () => ({ user: { id: "admin-1", role: "ADMIN" } })),
}));

vi.mock("@/lib/rateLimit", () => ({
    clientIp: vi.fn(async () => "1.2.3.4"),
    enforceRateLimit: vi.fn(),
    rateLimit: vi.fn(() => ({ ok: true, remaining: 1, resetAt: Date.now() + 1000 })),
}));

vi.mock("next/headers", () => ({
    cookies: vi.fn(async () => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() })),
}));

vi.mock("bcrypt", () => ({
    default: { hash: vi.fn(async () => "hashed-password") },
}));

// Import AFTER mocks are registered.
import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/actions";
import { sendAdminPasswordResetEmail } from "@/server/auth/data";
import { adminResetUserPassword } from "@/server/auth/accountSetup.actions";
import { makeChain } from "../helpers/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyDb = db as any;
const tx = anyDb.__tx;
const mockRequireRole = vi.mocked(requireRole);
const mockSendEmail = vi.mocked(sendAdminPasswordResetEmail);

const A_VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

const teacherUser = {
    id: A_VALID_UUID,
    email: "teacher@example.com",
    roles: ["TEACHER"],
    emailVerified: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
    anyDb.query.users.findFirst.mockResolvedValue(undefined);
    mockRequireRole.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } } as never);
});

describe("adminResetUserPassword", () => {
    it("clears emailVerified, stores a hashed 3-day token, and emails the user", async () => {
        anyDb.query.users.findFirst.mockResolvedValue(teacherUser);
        const updateChain = makeChain();
        const insertChain = makeChain();
        const deleteChain = makeChain();
        tx.update.mockReturnValueOnce(updateChain);
        tx.insert.mockReturnValueOnce(insertChain);
        tx.delete.mockReturnValueOnce(deleteChain);

        const before = Date.now();
        const res = await adminResetUserPassword({ userid: A_VALID_UUID });

        expect(res.ok).toBe(true);
        if (res.ok) {
            expect(res.data?.email).toBe("teacher@example.com");
        }

        // Old links for this address are wiped first.
        expect(tx.delete).toHaveBeenCalledTimes(1);

        // The account is knocked back to unverified, which is what locks the
        // old password out (every credentials provider requires it).
        const setArg = updateChain.set.mock.calls[0][0];
        expect(setArg.emailVerified).toBeNull();

        // The token row is the account-setup identifier, hashed, ~3 days out.
        const values = insertChain.values.mock.calls[0][0];
        expect(values.identifier).toBe("account-setup:teacher@example.com");
        expect(values.token).toMatch(/^[a-f0-9]{64}$/);
        const expiresMs = new Date(values.expires).getTime();
        expect(expiresMs).toBeGreaterThanOrEqual(before + THREE_DAYS_MS - 5_000);
        expect(expiresMs).toBeLessThanOrEqual(Date.now() + THREE_DAYS_MS + 5_000);

        // The raw token is emailed, never the stored hash.
        expect(mockSendEmail).toHaveBeenCalledTimes(1);
        const [toEmail, rawToken, type] = mockSendEmail.mock.calls[0];
        expect(toEmail).toBe("teacher@example.com");
        expect(rawToken).not.toBe(values.token);
        expect(type).toBe("Teacher");
    });

    it("labels an ADMINUSER account as Admin", async () => {
        anyDb.query.users.findFirst.mockResolvedValue({
            ...teacherUser,
            email: "admin@example.com",
            roles: ["ADMINUSER"],
        });

        const res = await adminResetUserPassword({ userid: A_VALID_UUID });

        expect(res.ok).toBe(true);
        expect(mockSendEmail.mock.calls[0][2]).toBe("Admin");
    });

    it("refuses when the caller is not an ADMIN", async () => {
        mockRequireRole.mockRejectedValue(new Error("Access denied. Required role not found"));
        anyDb.query.users.findFirst.mockResolvedValue(teacherUser);

        const res = await adminResetUserPassword({ userid: A_VALID_UUID });

        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.errorMessage).toContain("Access denied");
        }
        expect(anyDb.transaction).not.toHaveBeenCalled();
        expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("refuses an account that is neither teacher nor admin", async () => {
        anyDb.query.users.findFirst.mockResolvedValue({
            ...teacherUser,
            email: "family@example.com",
            roles: ["FAMILY"],
        });

        const res = await adminResetUserPassword({ userid: A_VALID_UUID });

        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.errorMessage).toContain("cannot be reset from here");
        }
        expect(anyDb.transaction).not.toHaveBeenCalled();
        expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("refuses an unknown user", async () => {
        anyDb.query.users.findFirst.mockResolvedValue(undefined);

        const res = await adminResetUserPassword({ userid: A_VALID_UUID });

        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.errorMessage).toBe("User not found");
        }
        expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("rejects a non-uuid userid before touching the DB", async () => {
        const res = await adminResetUserPassword({ userid: "not-a-uuid" });

        expect(res.ok).toBe(false);
        expect(anyDb.query.users.findFirst).not.toHaveBeenCalled();
        expect(mockSendEmail).not.toHaveBeenCalled();
    });
});
