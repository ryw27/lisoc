"use server";

import { db } from "@/lib/db";
import { classregistration, familybalance } from "@/lib/db/schema";
import {
    FAMILYBALANCE_STATUS_PAID,
    FAMILYBALANCE_STATUS_PROCESSED,
    REGSTATUS_REGISTERED,
    toESTString,
} from "@/lib/utils";
import { requireRole } from "@/server/auth/actions";
import { checkApplySchema } from "@/server/payments/schema";
import { famBalanceInsert } from "@/types/shared.types";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";

/*function isFullPayment(originalFB: InferSelectModel<typeof familybalance>) {
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
*/

export async function applyCheck(
    data: z.infer<typeof checkApplySchema>,
    familyid: number,
    fromAdmin = false
) {
    // 1. Auth and parse
    await requireRole(["ADMIN", "FAMILY"]);
    const parsed = checkApplySchema.parse(data);

    //read fee type id from database , adjust the sign
    let feeTyepeSign = 1;
    const feeType = await db.query.familybalancetype.findFirst({
        where: (ft, { eq }) => eq(ft.typeid, data.feeTypeId),
    });
    if (feeType) {
        if (feeType.isminusvalue) {
            feeTyepeSign = -1;
        }
    }

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
            totalamount: (parsed.amount * feeTyepeSign).toString(),
            paiddate: toESTString(parsed.paidDate),
            tuition: "0",
            //notes: "Tuition paid with check"
            notes: parsed.note || "",
        } satisfies famBalanceInsert;
        await tx.insert(familybalance).values(newFBVals).returning();

        const allFBs = await tx.query.familybalance.findMany({
            where: (fb, { and, eq, or }) =>
                and(
                    eq(fb.familyid, familyid),
                    or(eq(fb.balanceid, parsed.balanceid), eq(fb.appliedid, parsed.balanceid))
                ),
        });

        // check total amount of all balance records
        let totalAmount = 0;
        for (const bal of allFBs) {
            totalAmount += bal.totalamount ? Number(bal.totalamount) : 0;
        }

        if (totalAmount < 0.01) {
            // full payment or overpayment, update all related class registrations to registered

            // update old family balance to processed
            await tx
                .update(familybalance)
                .set({
                    statusid: FAMILYBALANCE_STATUS_PROCESSED,
                })
                .where(eq(familybalance.balanceid, oldFB.balanceid));

            // 4. Get the class reg
            //            where: (cr, { eq }) => eq(cr.regid, oldFB.appliedregid),
            // find class regsitrations which are linked to the oldFB.balancedid
            // it is ok not find, but if found we need to update depends if full amount is paid

            const classreg = await tx.query.classregistration.findMany({
                where: (cr, { eq }) => eq(cr.familybalanceid, oldFB.balanceid),
            });
            if (!classreg) {
                // throw new Error("Cannot find corresponding registrations");
                console.warn("Cannot find corresponding registrations");
                return;
            }

            // 5. Update the class reg

            // full payment or overpayment
            // for each class registration, update to registered
            for (const cr of classreg) {
                await tx
                    .update(classregistration)
                    .set({
                        statusid: REGSTATUS_REGISTERED,
                        previousstatusid: cr.statusid,
                    })
                    .where(eq(classregistration.regid, cr.regid));
            }
        }

        if (fromAdmin) {
            revalidatePath(`/admin/management/${familyid}`);
        } else {
            revalidatePath(`/dashboard/register`);
        }
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
