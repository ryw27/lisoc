# Registration Discount Gate at Payment Time

## Problem

The early-registration discount is applied **once at registration time** and stored on `familybalance.earlyregdiscount`. It is **never re-checked at payment time**. This opens a stale-discount window:

1. User registers on day N while the early window is still open → `canRegister()` returns `"early"` → discount is baked into the balance row.
2. User leaves and comes back days/weeks later to pay, **after** the early window has closed.
3. The payment route ([app/api/payment/route.ts:106-145](app/api/payment/route.ts:106)) loads the stored balance as-is and captures the PayPal amount. The user pays with a discount they no longer qualify for.

## Approach

Add a server-side **revalidation gate** at the payment boundary. Right before PayPal capture, re-compute what the early discount *should* be based on today's date, compare to what's stored on the balance, and if they differ:

- **Auto-recalculate**: update `familybalance.earlyregdiscount` and `totalamount` in place.
- **Reject the in-flight capture** with HTTP 409 + the new total. The already-authorized PayPal order is locked to the old amount, so the client must refresh and approve again with the updated price.

The same gate applies to the admin manual-payment path so all payment entry points are protected.

## Where the gate goes

### Primary: PayPal capture route
[app/api/payment/route.ts](app/api/payment/route.ts) — insert after the ownership/role check (around line 122) and **before** PayPal capture (line 144). Capture must not happen if the discount has lapsed; otherwise PayPal will capture the old (lower) amount and we get a partial-payment reconciliation problem.

### Secondary: admin manual payment
[app/admin/management/[familyid]/apply-button.tsx](app/admin/management/[familyid]/apply-button.tsx) — call the same helper before `applyCheck()`. Surface the updated total to the admin and require re-confirmation.

## New helper

`revalidateBalanceEarlyDiscount(tx, balanceId)` lives in [server/registration/data.ts](server/registration/data.ts) alongside the existing `canRegister()` it reuses.

**Steps:**

1. Load `familybalance` by id (use `.for("update")` to lock the row against concurrent payment races).
2. Find any linked `classregistration` (one is enough — the discount is per-balance, not per-class). If none, return `{ changed: false }` and stop.
3. Load the linked `arrangement` and the balance's `season`.
4. Call existing `canRegister(tx, arrData, season)` to get today's `regKind`.
5. Load `feelist` and read `feeid=7` (early discount, default `"50"`) and `feeid=11` (early2 discount, default `"0"`) — mirror [familyRegister.ts:74-85](server/registration/actions/familyRegister.ts:74).
6. Map `regKind` → expected discount using the same mapping as [familyRegister.ts:89-94](server/registration/actions/familyRegister.ts:89):
   - `"early"` → `earlyRegDiscount`
   - `"early2"` → `earlyRegDiscount2`
   - everything else → `"0"`
7. Compare expected to stored `balance.earlyregdiscount`:
   - **Equal** → return `{ changed: false }`.
   - **Different** → update the row. The discount is stored as a *positive* number that's *added* to `totalamount` (see [familyRegister.ts:198](server/registration/actions/familyRegister.ts:198)), so:

     ```
     newTotal = oldTotal − oldDiscount + expectedDiscount
     ```

     Persist `earlyregdiscount`, `totalamount`, and `lastmodify`. Return `{ changed: true, oldTotal, newTotal, oldDiscount, newDiscount, currentRegKind }`.

## Wiring in the payment route

```ts
// /app/api/payment/route.ts — after line 122, before idempotency/capture
const revalidation = await db.transaction(async (tx) =>
    revalidateBalanceEarlyDiscount(tx, balanceId)
);

if (revalidation.changed) {
    return NextResponse.json(
        {
            error: "Your early-registration discount has expired. Please refresh and approve the updated amount.",
            previousTotal: revalidation.oldTotal,
            currentTotal: revalidation.newTotal,
            currentRegKind: revalidation.currentRegKind,
            needsRefresh: true,
        },
        { status: 409 }
    );
}
```

**Optional belt-and-braces**: after capture (lines 162-185), compare captured `amountNumber` against the (now fresh) `balance.totalamount`. If captured < expected, flag `needsManualReconciliation: true` and log loudly — same pattern already used at lines 205-219.

## Client handling

In `register-students.tsx`'s `onApprove()` (lines 640-693), when the response is 409:

- Show a clear alert/toast: "Your early-registration discount has expired — total updated to $X. Please review and pay again."
- Refresh the registration view so the displayed total reflects the new amount.
- Reset the PayPal button state so the next click creates a fresh PayPal order with the updated total.

## Out of scope

- The semantic inconsistency I flagged earlier — `data.ts` treats `earlyregdate` as the last day of the early window (inclusive), but `sem-view.tsx` and `info-box-class.tsx` treat it as the day **before** registration opens. Tracked separately.
- **Late-fee revalidation.** This gate is specifically for the early-registration discount. If a registration was made when `"normal"` and the season has since rolled into `"late1"`, this gate does NOT add the late fee.
- Refund paths (drop/transfer). They don't apply a discount, so they don't need the gate.

## Verification plan

1. **Unit test** for `revalidateBalanceEarlyDiscount` covering three cases:
   - Stale `"early"` discount in a now-`"normal"` season → `changed: true`, discount zeroed, total adjusted up.
   - Stored discount matches today's regKind → `changed: false`, no row mutation.
   - No linked `classregistration` → `changed: false`, no throw.
2. **End-to-end (PayPal sandbox)**:
   - Register a class while the early window is open. Confirm `familybalance.earlyregdiscount > 0`.
   - In the admin semester editor, shift the season's `earlyregdate` into the past.
   - Attempt to pay → expect 409, balance recalculated, `totalamount` increased.
   - Refresh and pay again → capture succeeds, `applyCheck()` records the correct (higher) amount.
3. **Admin manual-payment path**: shift the date the same way, attempt "Apply Check" from `/admin/management/[familyid]`. Confirm the gate fires and surfaces the updated total.
4. **No regression**: register and pay immediately (no time gap). Confirm flow is unchanged and `changed: false`.

## Risk notes

- **Dangling PayPal authorization**: when we return 409 the PayPal order is *authorized* but not *captured*. The auth releases on PayPal's side without our intervention. Document for ops.
- **Concurrent payments**: the revalidation transaction must take a row-level lock on `familybalance` (use `.for("update")`, mirroring [familyRegister.ts:125](server/registration/actions/familyRegister.ts:125)) so two simultaneous payment attempts can't race.
- **`adminRegister.ts` not modified**: that path already gates registration via `canRegister()`. This plan only adds the **payment-side** gate; admin-created registrations are caught when the family (or admin) later tries to pay.
