"use server";

import { revalidatePath } from "next/cache";
import { eq, InferSelectModel } from "drizzle-orm";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { classregistration, familybalance } from "@/lib/db/schema";
import {
    FAMILYBALANCE_STATUS_PAID,
    FAMILYBALANCE_STATUS_PROCESSED,
    REGSTATUS_REGISTERED,
    toESTString,
} from "@/lib/utils";
import { famBalanceInsert } from "@/types/shared.types";
import { requireRole } from "@/server/auth/actions";
import { checkApplySchema } from "@/server/payments/schema";

function isFullPayment(originalFB: InferSelectModel<typeof familybalance>) {
    const total =
        Number(originalFB.childnumRegfee) +
        Number(originalFB.regfee) -
        Number(originalFB.earlyregdiscount) +
        Number(originalFB.lateregfee) +
        Number(originalFB.extrafee4newfamily) +
        Number(originalFB.managementfee) +
        Number(originalFB.dutyfee) +
        Number(originalFB.cleaningfee) +
        Number(originalFB.otherfee) +
        Number(originalFB.tuition);
    return total;
}

export async function applyCheck(data: z.infer<typeof checkApplySchema>, familyid: number) {
    // 1. Auth: require a session; FAMILY users may only credit their own family.
    //    ADMINs may credit any family. Anonymous callers are rejected here as
    //    defense-in-depth — the /api/payment route also gates this, but other
    //    server-action callers should not be able to bypass auth.
    const session = await auth();
    if (!session?.user) {
        throw new Error("Authentication required");
    }
    if (session.user.role === "FAMILY") {
        const fam = await db.query.family.findFirst({
            where: (f, { eq }) => eq(f.userid, session.user.id),
        });
        if (!fam || fam.familyid !== familyid) {
            throw new Error("Forbidden");
        }
    } else if (session.user.role !== "ADMIN") {
        throw new Error("Forbidden");
    }

    // 2. Parse
    const parsed = checkApplySchema.parse(data);

    await db.transaction(async (tx) => {
        // 2. Find old family balance vals
        const oldFB = await tx.query.familybalance.findFirst({
            where: (fb, { and, eq }) =>
                and(eq(fb.familyid, familyid), eq(fb.balanceid, parsed.balanceid)),
        });
        if (!oldFB) {
            throw new Error("No family balance found");
        }

        // 3. Insert new family balance of check amount value
        const newFBVals = {
            appliedid: oldFB.balanceid,
            familyid: familyid,
            seasonid: oldFB.seasonid,
            typeid: data.feeTypeId,
            statusid: FAMILYBALANCE_STATUS_PAID, // Because we're applying a payment
            checkno: parsed.checkNo,
            totalamount: (-parsed.amount).toString(),
            paiddate: toESTString(parsed.paidDate),
            tuition: "0",
            //notes: "Tuition paid with check"
            notes: parsed.note || "",
        } satisfies famBalanceInsert;
        await tx.insert(familybalance).values(newFBVals).returning();

        // update old family balance to processed
        await tx
            .update(familybalance)
            .set({
                statusid: FAMILYBALANCE_STATUS_PROCESSED,
            })
            .where(eq(familybalance.balanceid, oldFB.balanceid));

        // 4. Find class registrations linked to the balance being paid.
        //    findMany ALWAYS returns an array, so the `if (!classreg)` guard
        //    below never actually fires — kept as a no-op for safety, but the
        //    real signal is `classreg.length`.
        const classreg = await tx.query.classregistration.findMany({
            where: (cr, { eq }) => eq(cr.familybalanceid, oldFB.balanceid),
        });

        // 5. Decide whether this payment fully clears the invoice. Log the
        //    decision inputs so we can diagnose the "status didn't flip"
        //    case from production logs without a DB dump.
        const owed = isFullPayment(oldFB);
        const isFull = owed - parsed.amount < 0.01;
        const updatedRegIds: number[] = [];
        if (isFull) {
            for (const cr of classreg) {
                await tx
                    .update(classregistration)
                    .set({
                        statusid: REGSTATUS_REGISTERED,
                        previousstatusid: cr.statusid,
                    })
                    .where(eq(classregistration.regid, cr.regid));
                updatedRegIds.push(cr.regid);
            }
        }

        console.log("[PAYMENT-APPLY]", {
            balanceId: oldFB.balanceid,
            familyId: oldFB.familyid,
            seasonId: oldFB.seasonid,
            paidAmount: parsed.amount,
            owedFromFees: owed,
            owedMinusPaid: owed - parsed.amount,
            isFullPayment: isFull,
            classregMatched: classreg.length,
            classregUpdated: updatedRegIds,
            feeBreakdown: {
                tuition: Number(oldFB.tuition),
                regfee: Number(oldFB.regfee),
                earlyregdiscount: Number(oldFB.earlyregdiscount),
                lateregfee: Number(oldFB.lateregfee),
                managementfee: Number(oldFB.managementfee),
                dutyfee: Number(oldFB.dutyfee),
                cleaningfee: Number(oldFB.cleaningfee),
                otherfee: Number(oldFB.otherfee),
                extrafee4newfamily: Number(oldFB.extrafee4newfamily),
                childnumRegfee: Number(oldFB.childnumRegfee),
            },
            storedTotalAmount: Number(oldFB.totalamount),
        });

        if (!isFull) {
            // Partial payment path is not yet implemented. The credit row
            // was still inserted above so the family's balance reflects the
            // payment; classregistration rows just don't flip to REGISTERED.
            console.log(
                "[PAYMENT-APPLY] partial payment — classregistration left at previous status",
                { balanceId: oldFB.balanceid, shortBy: owed - parsed.amount }
            );
        } else if (classreg.length === 0) {
            // Full payment but nothing to update. Most likely cause is that
            // the classregistration rows were inserted without
            // familybalanceid pointing at this balance, or were already
            // detached (e.g. drop/transfer requests). Worth investigating
            // when this fires.
            console.warn(
                "[PAYMENT-APPLY] full payment matched zero classregistration rows",
                { balanceId: oldFB.balanceid, familyId: oldFB.familyid }
            );
        }

        // Revalidate both the admin family-detail page and the family-side
        // dashboard pages so neither view shows stale "S/提交" after a
        // successful payment. Previously only the admin path was
        // invalidated, so families paying through the dashboard would see
        // the old status until they hard-refreshed.
        revalidatePath(`/admin/management/${oldFB.familyid}`);
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/register");
        revalidatePath("/dashboard/reghistory");
        revalidatePath("/dashboard/balhistory");
    });
}

export async function removeBalance(balanceid: number) {
    // 1. Auth and parse
    await requireRole(["ADMIN"]);
    await db.transaction(async (tx) => {
        // 2. Find old family balance vals
        const oldFB = await tx.query.familybalance.findFirst({
            where: (fb, { eq }) => eq(fb.balanceid, balanceid),
        });

        if (!oldFB) {
            throw new Error("No family balance found");
        }

        const familyid = oldFB.familyid;
        await tx.delete(familybalance).where(eq(familybalance.balanceid, balanceid));

        revalidatePath(`/admin/management/${familyid}`);
    });
}
