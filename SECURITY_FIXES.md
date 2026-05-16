# Security Fixes — Critical Items

Date: 2026-05-15
Branch: `gamma`

This document records the critical security fixes applied in this branch. It maps each item from the external engineering review to the specific code changes that address it, the threat model, and how each fix was verified.

---

## Summary

| # | Critical item from review | Status |
|---|---|---|
| 1 | Unauthenticated payment API + client-trusted amounts | Fixed |
| 2 | Silent failure after money is taken | Fixed |
| 2b | No payment idempotency | Fixed |
| 3 | Commented-out role checks in mutating server actions | Fixed (5 sites) |
| 4 | Weak email-verification code entropy | Fixed (6 → 8 digits) |
| 5 | No rate-limiting / brute-force protection | Fixed (login, password reset, reg code, payment) |

Type-check: `npx tsc --noEmit` clean.
Behavioural smoke tests: see "Verification" sections per item below.

---

## 1. Payment API — authentication, server-side amounts, ownership checks

**File:** [`app/api/payment/route.ts`](app/api/payment/route.ts) (rewritten)

### Before

- Middleware excluded `/api/*` so no auth gate. ([`middleware.ts:63`](middleware.ts:63))
- Request body supplied `familyId`, `balanceId`, `amount` — all trusted as-is.
- `applyCheck` was called with the client's amount, ignoring PayPal's captured amount.
- `applyCheck` had its own `requireRole(["ADMIN"])` commented out.

Net effect: anyone (including unauthenticated callers) could make a $1 PayPal payment and post `{amount: "99999", familyId: <any>, balanceId: <any>, orderID: <their captureID>}` to credit any family's balance for any value.

### Changes

1. **Auth gate.** Calls `auth()`; rejects unauthenticated callers with `401 Unauthorized`.
2. **Strict request schema** (Zod):

   ```ts
   const paymentRequestSchema = z.object({
       orderID: z.string().min(1).max(64),
       balanceId: z.coerce.number().int().positive(),
   });
   ```

   The previously-accepted `amount`, `familyId`, `name`, `email` fields are no longer read from the request body.

3. **Server-side balance lookup + ownership check.** The route loads the target `familybalance` row by `balanceId`, then:

   - If `role === "FAMILY"`: looks up the user's `family` row by `users.id` and requires `fam.familyid === target.familyid` (otherwise `403 Forbidden`).
   - If `role === "ADMIN"`: allowed.
   - Anything else: `403 Forbidden`.

4. **Amount sourced from PayPal, not from the request.** After capture, the route reads the amount strictly from the capture response:

   ```ts
   const capturedUnit = captureData.purchase_units?.[0]?.payments?.captures?.[0];
   const capturedAmountStr = capturedUnit?.amount?.value;
   const capturedCurrency = capturedUnit?.amount?.currency_code;
   ```

   Currency is asserted to be `"USD"`; the amount is parsed and validated as a positive finite number.

5. **PayPal credentials checked.** `getPayPalAccessToken()` now throws if `NEXT_PUBLIC_PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` are missing, rather than producing a broken token request.

### Verification

| Test | Expected | Result |
|---|---|---|
| Anonymous POST | 401 | 401 `{"error":"Unauthorized"}` |
| Authed family, malformed body | 400 | 400 `{"error":"Invalid request body"}` |
| Authed family, non-existent `balanceId` | 404 | 404 `{"error":"Invoice not found"}` |
| Authed family paying another family's balance | 403 | 403 `{"error":"Forbidden"}` |
| Authed family paying own balance, PayPal creds missing | 502 | 502 `{"error":"Payment processor unavailable…"}` |

---

## 2. Silent failure after PayPal capture

**File:** [`app/api/payment/route.ts`](app/api/payment/route.ts) (was lines 106-110 in the previous version)

### Before

```ts
try {
    await applyCheck(paymentRecord, fid);
} catch (error) {
    console.error(error);
}
// returns success: true regardless
```

If PayPal captured the customer's money but the DB write failed, the API returned `success: true`. No audit trail; the operator had no signal to reconcile.

### Changes

- The `applyCheck` failure path now returns **HTTP 500** with:

  ```json
  {
    "error": "Payment was captured but failed to apply. Please contact the administrator with the Capture ID below; do not retry the payment.",
    "captureID": "<paypal-capture-id>",
    "needsManualReconciliation": true
  }
  ```

- A structured `[PAYMENT-RECONCILE]` console.error logs `orderID`, `captureID`, `balanceId`, `amount`, and the original error — searchable in logs for manual reconciliation.
- Similar `[PAYMENT-RECONCILE]` log line for the case where PayPal's capture response is malformed.

### Follow-up

A future change should call PayPal's refund API automatically in this branch.

---

## 2b. Payment idempotency

**File:** [`app/api/payment/route.ts`](app/api/payment/route.ts) (idempotency block)

### Before

A retried POST with the same `orderID` would double-credit the family balance.

### Changes

Before the PayPal capture call, the route looks up an existing `familybalance` row whose `checkno` equals the supplied `orderID`. If one exists, the request returns 200 with `idempotent: true` and skips the capture + write. PayPal's own idempotency for the capture call layers on top.

### Limitation / Follow-up

This is a read-then-write check, not enforced by a unique DB index. Two requests within a few milliseconds could both pass the check. Recommend a partial unique index:

```sql
CREATE UNIQUE INDEX familybalance_checkno_unique
  ON familybalance(checkno) WHERE checkno IS NOT NULL;
```

### Verification

After seeding a `familybalance` row with `checkno='IDEMPOTENT-TEST-1'`, re-POSTing returns:

```json
{"success":true,"idempotent":true,"message":"Payment already recorded","captureID":"IDEMPOTENT-TEST-1"}
```

with HTTP 200, without re-capturing.

---

## 3. Commented-out role checks in mutating server actions

Five sites in `server/` had role-gating either commented out or absent. All are restored, and where the action accepts client-supplied identity (`familyRegister`, `applyCheck`) the server now re-derives identity from the session.

### 3.1 `server/registration/actions/adminRegister.ts:35`

- Was: `// const user = await requireRole(["ADMIN"]);`
- Now: `await requireRole(["ADMIN"]);`
- Impact: registering students and creating family balances now requires ADMIN.

### 3.2 `server/seasons/actions/createArrangement.ts:18`

- Was: commented out.
- Now: `await requireRole(["ADMIN"]);`
- Impact: creating class arrangements / tuition prices requires ADMIN.

### 3.3 `server/seasons/actions/editArrangement.ts:18`

- Was: commented out.
- Now: `await requireRole(["ADMIN"]);`
- Impact: editing class arrangements / tuition prices requires ADMIN.

### 3.4 `server/registration/actions/familyRegister.ts:26`

- Was: commented out, and the function trusted the client-supplied `family: familyObj` parameter.
- Now: requires FAMILY role **and** re-derives the family from the session, rejecting any caller whose own family doesn't match `family.familyid`. The server-derived family then shadows the parameter for the rest of the function.

  ```ts
  const session = await requireRole(["FAMILY"], { redirect: false });
  const userFamily = await db.query.family.findFirst({
      where: (f, { eq }) => eq(f.userid, session.user.id),
  });
  if (!userFamily || userFamily.familyid !== family.familyid) {
      throw new Error("Forbidden");
  }
  family = userFamily as typeof family;
  ```

- Impact: a logged-in family can no longer register classes against a different family by lying in the request payload.

### 3.5 `server/payments/actions.ts:35` — `applyCheck()`

`applyCheck` is called from both the family payment flow (via `/api/payment`) and admin manual-payment tooling. A simple `requireRole(["ADMIN"])` would break the family case. The fix self-gates on session + ownership:

```ts
const session = await auth();
if (!session?.user) throw new Error("Authentication required");
if (session.user.role === "FAMILY") {
    const fam = await db.query.family.findFirst({
        where: (f, { eq }) => eq(f.userid, session.user.id),
    });
    if (!fam || fam.familyid !== familyid) throw new Error("Forbidden");
} else if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
}
```

This is defence-in-depth: the API route already does the same check, but a future caller of `applyCheck` cannot accidentally bypass it.

---

## 4. Verification-code entropy

**Files:** [`server/auth/schema.ts:33`](server/auth/schema.ts:33), [`server/auth/familyreg.actions.ts`](server/auth/familyreg.actions.ts)

### Before

- `randomInt(100000, 1000000)` — 6-digit codes (~10⁶ values, ~20 bits).
- No attempt counter on `checkRegCode`.
- 10-minute expiry. Brute-forcing was feasible inside the window for a scripted attacker.

### Changes

- Code generator centralised in a helper:

  ```ts
  function generateVerificationCode(): string {
      return randomInt(10_000_000, 100_000_000).toString();
  }
  ```

  Always 8 digits, search space 9 × 10⁷. Combined with rate-limiting (next section), the expected number of guesses required exceeds the 10-minute token expiry by orders of magnitude.

- `codeSchema` length updated to `length(8)` with a matching error message. Affects the registration form's code input field (no client change required — the existing input accepts the longer value).

### Verification

`tsc --noEmit` clean across the codebase. Only one verification-code path exists, so no other consumers need updating.

---

## 5. Rate limiting

**New file:** [`lib/rateLimit.ts`](lib/rateLimit.ts)
**Applied in:** [`lib/auth.ts`](lib/auth.ts), [`server/auth/familyreg.actions.ts`](server/auth/familyreg.actions.ts), [`server/auth/resetpw.actions.ts`](server/auth/resetpw.actions.ts), [`app/api/payment/route.ts`](app/api/payment/route.ts)

### Design

In-memory sliding-window limiter; per-process counters keyed by `<purpose>:<dimension>:<value>`. Two dimensions per call site so an attacker can't sidestep one bucket by varying the other:

- `id` — the credential being attacked (email, username, user id).
- `ip` — derived from `x-forwarded-for` / `x-real-ip` with `"unknown"` fallback for local dev.

A 60-second sweep removes expired buckets to keep the map bounded.

```ts
export function rateLimit(key, opts: { max, windowMs }): { ok, … }
export function enforceRateLimit(key, opts) // throws RateLimitError on deny
export async function clientIp(): Promise<string>
```

### Limits applied

| Endpoint | Per identifier | Per IP | Window |
|---|---|---|---|
| Login (admin, teacher, family providers) | 10 | 20 | 15 min |
| Password reset — request | 3 | 10 | 15 min |
| Password reset — redeem token | 10 | 30 | 15 min |
| `requestRegCode` | 3 | 10 | 10 min |
| `resendCode` | 3 | 10 | 10 min |
| `checkRegCode` | 5 | 20 | 10 min |
| `/api/payment` | 10 (per user) | 30 | 5 min |

### Login integration

A new `RateLimitExceededError extends CredentialsSignin` is thrown when the bucket trips, producing `code=rate-limit-exceeded` in the NextAuth callback redirect — distinguishable client-side from `incorrect-email-password`, so legitimate users get useful feedback.

### Verification

- 7th–15th bad login on the same email returned `code=rate-limit-exceeded` (combined with prior test traffic, the bucket tripped at attempt 7).
- After dev-server restart (clearing in-memory buckets), the next login succeeded.

### Limitation / Follow-up

Buckets are per-process. For multi-instance / serverless deployment (Vercel), the in-memory map must be swapped for Upstash Redis (or similar). The `rateLimit(key, opts)` and `enforceRateLimit(key, opts)` interface should remain the same, so the change is local to `lib/rateLimit.ts`.

A persistent log of denied attempts (and notifications on sustained bursts) is also worth adding.

---

## Files changed

```
M  app/api/payment/route.ts                              (rewritten)
M  lib/auth.ts                                           (rate limit on all 3 providers)
A  lib/rateLimit.ts                                      (new helper)
M  server/auth/familyreg.actions.ts                      (8-digit code, rate limit)
M  server/auth/resetpw.actions.ts                        (rate limit)
M  server/auth/schema.ts                                 (codeSchema 6 -> 8)
M  server/payments/actions.ts                            (auth + ownership in applyCheck)
M  server/registration/actions/adminRegister.ts          (require ADMIN)
M  server/registration/actions/familyRegister.ts         (require FAMILY + server-derive family)
M  server/seasons/actions/createArrangement.ts           (require ADMIN)
M  server/seasons/actions/editArrangement.ts             (require ADMIN)
A  SECURITY_FIXES.md                                     (this document)
```

## Out of scope for this PR

These are noted in the engineering review but not addressed here. Each is a reasonable separate change:

- Centralised `authedAction(roles, schema, fn)` wrapper (covered by case-by-case re-enables in this PR).
- Switch payment math off JavaScript floats to integer cents / decimal library.
- Automatic refund-on-DB-failure for the payment route.
- Drizzle migrations workflow (config + committed migrations).
- Persistent rate-limit store (Upstash / Redis).
- Stronger password policy and account-lockout on login.
- User-enumeration cleanup on password-reset responses.
- Security headers (CSP, HSTS) in `next.config.ts`.
- Audit-log table for financial mutations.
