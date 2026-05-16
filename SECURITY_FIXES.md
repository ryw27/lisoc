# Security Fixes — Critical & Moderate Items

Date: 2026-05-15
Branch: `gamma`

This document records the security fixes applied in this branch. It maps each item from the external engineering review to the specific code changes that address it, the threat model, and how each fix was verified.

---

## Summary

### Critical

| # | Critical item from review | Status |
|---|---|---|
| 1 | Unauthenticated payment API + client-trusted amounts | Fixed |
| 2 | Silent failure after money is taken | Fixed |
| 2b | No payment idempotency | Fixed |
| 3 | Commented-out role checks in mutating server actions | Fixed (5 sites) |
| 4 | Weak email-verification code entropy | Fixed (6 → 8 digits) |
| 5 | No rate-limiting / brute-force protection | Fixed (login, password reset, reg code, payment) |

### Moderate

| # | Moderate item from review | Status |
|---|---|---|
| M1 | User enumeration on password reset | Fixed |
| M2 | Password reset by username (broader attack surface) | Fixed (email-only now) |
| M3 | Weak password policy (min 6, no complexity) | Fixed (min 10 + letter+digit + common-list) |
| M4 | Two bcrypt libs installed (`bcrypt` + `bcryptjs`) | Fixed (`bcryptjs` removed) |
| M5 | Sensitive PII at rest with no encryption strategy | Documented (out of scope, see "Deferred items") |
| M6 | Legacy tables expose plaintext-style password columns | Audited (not in data-view registry) + recommended scrub SQL |
| M7 | HTML email injected with template literals | Fixed (escape helper, all templates use it) |
| M8 | Auth disabled if `ischangepwdnext=true` (typo'd-email takeover) | Fixed (invite-link flow replaces emailed-password flow) |
| M9 | No CSRF protection on `/api/payment` | Fixed (same-origin Origin/Referer check) |
| M10 | Stale role in JWT after demotion | Fixed (DB role refresh in jwt callback every 5 min, with hard-revoke on missing role) |

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

---

# Moderate Items

## M1. User enumeration on password reset

**File:** [`server/auth/resetpw.actions.ts`](server/auth/resetpw.actions.ts), [`components/auth/forgot-password-form.tsx`](components/auth/forgot-password-form.tsx), [`messages/en.json`](messages/en.json), [`messages/zh.json`](messages/zh.json).

### Before

`requestPasswordReset` returned different errors depending on whether the account existed (`"Account does not exist"` vs `"Invalid Email or Username"`). The forgot-password form surfaced these distinctions to the user, letting an attacker probe the user database.

### Changes

- The action **always returns success** (the safe-action `ok: true`) regardless of whether the email maps to an account. The DB lookup still happens (to keep timing roughly comparable), but the email is only actually sent for real accounts.
- All explicit "account does not exist" / "invalid identifier" branches were deleted.
- The form no longer treats a successful response as a confirmation that the account exists; the success copy now reads *"If an account exists for that email, a reset link has been sent"* (en + zh).

---

## M2. Password reset by username

**File:** [`server/auth/schema.ts`](server/auth/schema.ts), [`server/auth/resetpw.actions.ts`](server/auth/resetpw.actions.ts), [`components/auth/forgot-password-form.tsx`](components/auth/forgot-password-form.tsx).

### Before

`forgotPassSchema` accepted `emailUsername` (an email **or** a username) and the action would resolve a username to an email via a `users` lookup. Usernames are typically shorter / more guessable, expanding the enumeration surface.

### Changes

- `forgotPassSchema` is now `{ email }`, email only.
- The username branch (and the now-unused `checkExistence` import) has been removed from `requestPasswordReset`.
- The form input asks for "Email" only.

---

## M3. Weak password policy

**File:** [`server/auth/schema.ts`](server/auth/schema.ts), [`server/auth/teachadminreg.actions.ts`](server/auth/teachadminreg.actions.ts).

### Before

`passwordSchema` required `min(6)` with no composition rules. The same schema was used for both login parsing and new-password setting — strengthening it would lock out anyone whose existing password was weaker.

### Changes

- Two schemas now exist:
  - `passwordSchema` (strong policy, used when SETTING a password — registration, password reset, account setup): min 10 chars, must contain a letter + a digit, rejected against a small in-memory list of trivial passwords (`password`, `qwerty`, `12345678`, ...).
  - `loginPasswordSchema` (loose, used only for parsing the login form): min 1 char. Bcrypt remains the actual auth gate.
- `setPasswordSchema` in `teachadminreg.actions.ts` was rewritten to share `passwordSchema` instead of redefining a local 6-char minimum.
- Existing seeded users (e.g. `123456` test passwords) keep working for login. The next time anyone CHANGES their password, the strong policy applies.

This intentionally trades a tiny migration tail for not breaking established sessions. Follow-up: add a HIBP API check (`api.pwnedpasswords.com`) and a one-time forced-rotation banner for users on weak passwords.

---

## M4. Two bcrypt libraries installed

**File:** [`package.json`](package.json), [`package-lock.json`](package-lock.json).

`bcryptjs` was installed but never imported. Removed via `npm uninstall bcryptjs`. Only `bcrypt` (native binding) remains.

---

## M5. Sensitive PII at rest with no encryption strategy

**Status: documented, deferred.**

DOBs, addresses, phone numbers, and parents' names of minors are stored in plain `varchar` columns. Encryption-at-rest of these columns is non-trivial and out of scope here:

- It needs a key-management story (where does the key live, who can access it, rotation policy).
- App-side encryption breaks SQL `LIKE`/`ILIKE` searches and the data-view exports the system depends on.

Recommended approach when this is taken on:

- Use Postgres `pgcrypto` (`pgp_sym_encrypt`/`pgp_sym_decrypt`) with a key passed via env at app boot, OR application-layer AES-GCM with the key stored in Vercel/Supabase env + a KMS abstraction.
- Encrypt only fields that don't need search: address lines, phone, DOB.
- Wrap reads in a small `decryptColumn(row, field)` helper to keep the change local.
- Migrate in two passes: add `*_enc` columns, dual-write, backfill, swap reads, drop plaintext.

Until that lands, ensure the DB host enforces TLS, the role used by the app cannot dump tables to non-DB destinations, and backups are encrypted at rest.

---

## M6. Legacy tables expose plaintext-style password columns

**Status: audited.**

The original review flagged `legacy_adminuser` and `legacy_family` as risk surfaces because they have a `password varchar` column.

Audit results (this branch):

- `server/data-view/registry.ts` does **not** export the legacy tables. `data-view` only surfaces `users`, `adminuser`, `teacher`, `family`, `student`, `arrangement`, `classregistration`, `regchangerequest`, `parentduty`, `season`, `classes`, `classrooms`. So the admin data-view UI cannot read or expose these columns.
- A repo-wide grep for `legacyAdminuser` / `legacyFamily` returns hits **only** in `lib/db/schema.ts`, `lib/db/relations.ts`, and `types/dataview.types.ts` (where they're declared but commented out of the active config). No live runtime code reads `.password` from these tables.

Recommended scrub for production environments still carrying migrated rows (run once, after confirming the migration to `users` is complete):

```sql
-- Audit
SELECT count(*), count(password) FILTER (WHERE password IS NOT NULL AND password <> '') FROM legacy_adminuser;
SELECT count(*), count(password) FILTER (WHERE password IS NOT NULL AND password <> '') FROM legacy_family;

-- Scrub
UPDATE legacy_adminuser SET password = '' WHERE password IS NOT NULL;
UPDATE legacy_family    SET password = '' WHERE password IS NOT NULL;
```

Once the migration is complete, the cleanest path is to drop the legacy tables entirely (and their entries in `relations.ts`, `dataview.types.ts`).

---

## M7. HTML email injected with template literals

**Files:** [`lib/htmlEscape.ts`](lib/htmlEscape.ts) (new), [`server/auth/data.ts`](server/auth/data.ts).

### Before

`server/auth/data.ts` interpolated `${token}`, `${emailTo}`, `${SITE_LINK}` directly into raw HTML email bodies. The values were server-generated and safe today, but the pattern is XSS-shaped: any future change that interpolates user-controlled content (display name, parent name, comment) would land stored XSS in inboxes.

### Changes

- New `lib/htmlEscape.ts` exports `escapeHtml`, `escapeAttr`, and `safeHref`. `safeHref` rejects `javascript:`, `data:`, `vbscript:` schemes.
- `sendRegEmail`, `sendFPEmail`, `sendRegLinkEmail`, and the new `sendAccountSetupEmail` all route every interpolated value through these helpers.

---

## M8. `ischangepwdnext` bypass — invite-link flow replaces emailed-password flow

**Files:** [`server/data-view/actions/insertRow.ts`](server/data-view/actions/insertRow.ts), [`lib/auth.ts`](lib/auth.ts), [`server/auth/accountSetup.actions.ts`](server/auth/accountSetup.actions.ts) (new), [`server/auth/data.ts`](server/auth/data.ts) (`sendAccountSetupEmail`), [`app/(auth-pages)/setup-account/page.tsx`](app/(auth-pages)/setup-account/page.tsx) (new), [`components/auth/setup-account-form.tsx`](components/auth/setup-account-form.tsx) (new).

### Before

Admin creates teacher/admin user via the data-view → server bcrypts the password the admin typed → sends the **plaintext password** to the entered email. Auth permitted sign-in with `!emailVerified` as long as `ischangepwdnext` was true. The threat: if the admin typoed the email, the typoed address received working credentials and could pre-empt the rightful owner.

### Changes

1. **`insertRow` for `adminuser` / `teacher`** no longer trusts the password the admin typed. It writes an unguessable bcrypt placeholder (`unusableBcryptHash()`) so the `users.password` NOT NULL constraint is satisfied but no plaintext can authenticate against it.
2. **A 7-day verification token** is created via the existing pgadapter and sent to the user as an *invite link* (`sendAccountSetupEmail`) — not the password.
3. **New page `/setup-account?token=…&email=…`** (route + form) lets the user choose their own password.
4. **New `completeAccountSetup` server action** consumes the token (single-use, expiry-checked, rate-limited), writes the chosen `bcrypt`-hashed password, sets `emailVerified = NOW()`, and clears `ischangepwdnext`.
5. **`lib/auth.ts`** removes the `!emailVerified && ischangepwdnext` bypass from both the admin and teacher providers. Sign-in now requires `emailVerified` unconditionally.

The `setPasswordAfterLogin` flow remains for *existing* users who got `ischangepwdnext` set after an admin password reset. They already have `emailVerified=true` from their first onboarding, so the new auth check doesn't lock them out.

### Migration note

Any account created under the OLD flow but never finished onboarding (still `emailVerified=NULL`) will now be unable to sign in. Operators can either:

- Re-run "create user" via the data-view UI to issue a fresh setup link, **or**
- Manually mark `emailVerified` for known-good rows: `UPDATE users SET "emailVerified" = NOW() WHERE email = '...';` and have the user use the forgot-password flow to set their password.

---

## M9. CSRF on `/api/payment`

**File:** [`app/api/payment/route.ts`](app/api/payment/route.ts).

The route now rejects any request whose `Origin` (or `Referer`) header doesn't match the host serving the request (or `SITE_LINK` if set). Cookie-only auth would otherwise let a cross-site form submission ride a logged-in admin/family session and move money around.

### Verification

```
$ curl -s -X POST -H 'Content-Type: application/json' \
       -d '{"orderID":"X","balanceId":1}' \
       http://localhost:3000/api/payment -w '\nHTTP %{http_code}\n'
{"error":"Cross-origin request blocked"}
HTTP 403

$ curl -s -X POST -H 'Origin: https://evil.example' ...
{"error":"Cross-origin request blocked"}
HTTP 403

$ curl -s -X POST -H 'Origin: http://localhost:3000' ...
{"error":"Unauthorized"}
HTTP 401   # ← passes CSRF, fails auth (as expected)
```

---

## M10. Stale role in JWT after demotion

**File:** [`lib/auth.ts`](lib/auth.ts).

### Before

`auth.config.ts`'s `jwt` callback only copied `role` off the `user` object on initial sign-in. After that, the role baked into the JWT was authoritative until the JWT expired (max 1h). A demoted admin kept ADMIN powers for up to 1h.

### Changes

- `lib/auth.ts` now adds an extra `jwt` callback (overriding the base one only in the Node runtime; the edge-safe `auth.config.ts` callback is unchanged so middleware still works).
- The new callback checks `lastRoleCheckAt`. If at least 5 minutes have elapsed, it re-fetches the user from the DB.
- If the user no longer exists, or the role baked into the JWT is no longer present in `users.roles`, the callback returns `null` — NextAuth treats this as a forced sign-out.
- DB errors fall through with the cached token so a transient DB blip doesn't lock everyone out.

The middleware is intentionally left using the cheaper, edge-safe callback (it can't import `pg`); pages and API routes are the actual authorization gates and they all run in the Node runtime where the refresh fires.

---

## Files changed (cumulative for this branch)

```
A  SECURITY_FIXES.md                                     (this document)
A  app/(auth-pages)/setup-account/page.tsx               (new — invite-link landing page)
M  app/api/payment/route.ts                              (auth, server-side amount, idempotency, CSRF)
A  components/auth/setup-account-form.tsx                (new — set-password form)
M  components/auth/forgot-password-form.tsx              (email-only, generic success)
A  lib/htmlEscape.ts                                     (new — HTML/attr/href escapers)
M  lib/auth.ts                                           (rate limit, JWT role refresh, no ischangepwdnext bypass)
A  lib/rateLimit.ts                                      (new — in-memory rate limiter)
M  messages/en.json, messages/zh.json                    (generic reset-success copy)
M  package.json, package-lock.json                       (bcryptjs removed)
A  server/auth/accountSetup.actions.ts                   (new — invite-link verify + complete)
M  server/auth/data.ts                                   (HTML-escaped templates, sendAccountSetupEmail)
M  server/auth/familyreg.actions.ts                      (8-digit code, rate limit)
M  server/auth/resetpw.actions.ts                        (email-only, generic response, rate limit)
M  server/auth/schema.ts                                 (split password schemas, codeSchema 8-digit, forgotPass email-only)
M  server/auth/teachadminreg.actions.ts                  (use shared strong passwordSchema)
M  server/data-view/actions/insertRow.ts                 (invite-link flow, unusable placeholder hash)
M  server/payments/actions.ts                            (auth + ownership in applyCheck)
M  server/registration/actions/adminRegister.ts          (require ADMIN)
M  server/registration/actions/familyRegister.ts         (require FAMILY + server-derive family)
M  server/seasons/actions/createArrangement.ts           (require ADMIN)
M  server/seasons/actions/editArrangement.ts             (require ADMIN)
```

## Deferred items

These are noted in the engineering review but not addressed here. Each is a reasonable separate change:

- Centralised `authedAction(roles, schema, fn)` wrapper (covered by case-by-case re-enables in this PR).
- Switch payment math off JavaScript floats to integer cents / decimal library.
- Automatic refund-on-DB-failure for the payment route.
- Drizzle migrations workflow (config + committed migrations).
- Persistent rate-limit store (Upstash / Redis).
- Column-level encryption for sensitive PII (M5).
- HIBP password-breach check + one-time forced rotation for users on weak passwords.
- Security headers (CSP, HSTS) in `next.config.ts`.
- Audit-log table for financial mutations.
- Drop legacy tables once migration to `users` is complete (M6).
