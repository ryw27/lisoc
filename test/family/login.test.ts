// Unit tests for the LISOC FAMILY "login" logic.
//
// COVERAGE NOTE — read before extending this file:
// The family sign-in path lives in the `Credentials({ id: "family-credentials",
// ... authorize })` provider in `lib/auth.ts`. That `authorize` callback is
// defined INLINE inside the `NextAuth({ providers: [...] })` config and is NOT
// exported. The custom error classes it throws (IncorrectEmailPasswordError,
// InternalServerError, RateLimitExceededError, NewAccountError) and the
// `enforceLoginRateLimit` helper are likewise module-private, and importing
// `lib/auth.ts` at all would construct the NextAuth instance + Postgres adapter
// at module load. None of that is reachable in a unit test WITHOUT a production
// refactor to export the callback — which we deliberately do NOT do here.
//
// Instead we test the pieces the family authorize path is BUILT FROM and that
// gate it directly:
//   1. `credSchema`  — the first `safeParse(credentials)` gate. On failure the
//                      callback throws InternalServerError.
//   2. `loginSchema` — the second `safeParse({ emailUsername, password })` gate.
//                      On failure the callback throws IncorrectEmailPasswordError.
//   3. The rate-limit primitive (`rateLimit`) that `enforceLoginRateLimit` uses,
//      exercised at the family thresholds (per-id max 10, per-ip max 15).
//
// The bcrypt password comparison and the DB `users.findFirst` role/verified
// checks live entirely inside the un-exported callback and are therefore only
// covered INDIRECTLY (via the validation schemas that guard them). Full
// end-to-end authorize coverage would require exporting the callback.

import { beforeEach, describe, expect, it } from "vitest";
import { credSchema, loginSchema, loginPasswordSchema } from "@/server/auth/schema";
import { rateLimit, __resetRateLimitForTests } from "@/lib/rateLimit";

describe("credSchema — first gate of family authorize (safeParse(credentials))", () => {
    it("accepts a valid email + password", () => {
        const res = credSchema.safeParse({ email: "fam@example.com", password: "secret1" });
        expect(res.success).toBe(true);
    });

    it("accepts a username + password (email omitted)", () => {
        const res = credSchema.safeParse({ username: "familyuser", password: "secret1" });
        expect(res.success).toBe(true);
    });

    it("accepts password only — email and username are optional", () => {
        const res = credSchema.safeParse({ password: "secret1" });
        expect(res.success).toBe(true);
    });

    it("rejects missing password (would make the callback throw InternalServerError)", () => {
        const res = credSchema.safeParse({ email: "fam@example.com" });
        expect(res.success).toBe(false);
    });

    it("rejects an empty password (min 1)", () => {
        const res = credSchema.safeParse({ email: "fam@example.com", password: "" });
        expect(res.success).toBe(false);
    });

    it("rejects a password longer than 72 chars", () => {
        const res = credSchema.safeParse({
            email: "fam@example.com",
            password: "a".repeat(73),
        });
        expect(res.success).toBe(false);
    });

    it("rejects a non-string password", () => {
        const res = credSchema.safeParse({ email: "fam@example.com", password: 12345678 });
        expect(res.success).toBe(false);
    });
});

describe("loginSchema — second gate of family authorize (emailUsername + password)", () => {
    it("accepts a valid email identifier + password", () => {
        const res = loginSchema.safeParse({
            emailUsername: "fam@example.com",
            password: "hunter2",
        });
        expect(res.success).toBe(true);
        if (res.success) {
            expect(res.data.emailUsername).toBe("fam@example.com");
            expect(res.data.password).toBe("hunter2");
        }
    });

    it("rejects a non-email identifier (family login is email-only)", () => {
        // The family provider feeds the trimmed identifier here; a bare username
        // fails loginSchema, so the callback throws IncorrectEmailPasswordError.
        const res = loginSchema.safeParse({ emailUsername: "familyuser", password: "hunter2" });
        expect(res.success).toBe(false);
    });

    it("rejects a malformed email", () => {
        const res = loginSchema.safeParse({ emailUsername: "not-an-email@", password: "hunter2" });
        expect(res.success).toBe(false);
    });

    it("rejects an empty password", () => {
        const res = loginSchema.safeParse({ emailUsername: "fam@example.com", password: "" });
        expect(res.success).toBe(false);
    });

    it("rejects a password longer than 72 chars", () => {
        const res = loginSchema.safeParse({
            emailUsername: "fam@example.com",
            password: "a".repeat(73),
        });
        expect(res.success).toBe(false);
    });

    it("rejects a missing emailUsername field entirely", () => {
        const res = loginSchema.safeParse({ password: "hunter2" });
        expect(res.success).toBe(false);
    });
});

describe("loginPasswordSchema — the loose login-only password validator", () => {
    it("accepts a legacy short password (no composition rules on login)", () => {
        // Login intentionally keeps a lower floor than the registration policy
        // so legacy 6-char accounts can still sign in; the bcrypt compare is the
        // real gate inside the callback.
        expect(loginPasswordSchema.safeParse({ password: "abc123" }).success).toBe(true);
    });

    it("accepts a single-character password", () => {
        expect(loginPasswordSchema.safeParse({ password: "x" }).success).toBe(true);
    });

    it("rejects an empty password", () => {
        expect(loginPasswordSchema.safeParse({ password: "" }).success).toBe(false);
    });

    it("rejects a password over 72 chars", () => {
        expect(loginPasswordSchema.safeParse({ password: "a".repeat(73) }).success).toBe(false);
    });
});

describe("rate-limit primitive — powers enforceLoginRateLimit for family login", () => {
    beforeEach(() => {
        __resetRateLimitForTests();
    });

    it("allows attempts up to the per-identifier max (10) then denies", () => {
        const key = "login:family:id:fam@example.com";
        const opts = { max: 10, windowMs: 15 * 60_000 };
        for (let i = 0; i < 10; i++) {
            expect(rateLimit(key, opts).ok).toBe(true);
        }
        // 11th attempt within the window is denied — the callback would throw
        // RateLimitExceededError.
        const denied = rateLimit(key, opts);
        expect(denied.ok).toBe(false);
        if (!denied.ok) {
            expect(denied.remaining).toBe(0);
            expect(denied.retryAfterMs).toBeGreaterThan(0);
        }
    });

    it("allows attempts up to the per-IP max (15) then denies", () => {
        const key = "login:family:ip:1.2.3.4";
        const opts = { max: 15, windowMs: 15 * 60_000 };
        for (let i = 0; i < 15; i++) {
            expect(rateLimit(key, opts).ok).toBe(true);
        }
        expect(rateLimit(key, opts).ok).toBe(false);
    });

    it("tracks separate identifiers independently", () => {
        const opts = { max: 10, windowMs: 15 * 60_000 };
        for (let i = 0; i < 10; i++) rateLimit("login:family:id:a@x.com", opts);
        // A different family email is unaffected by another's exhausted bucket.
        expect(rateLimit("login:family:id:b@x.com", opts).ok).toBe(true);
    });
});
