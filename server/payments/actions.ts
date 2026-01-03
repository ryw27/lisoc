"use server";

import { revalidatePath } from "next/cache";
import { eq, InferSelectModel } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { classregistration, familybalance } from "@/lib/db/schema";
import { famBalanceInsert } from "@/lib/types.shared";
import {
    FAMILYBALANCE_STATUS_PAID,
    FAMILYBALANCE_STATUS_PROCESSED,
    FAMILYBALANCE_TYPE_PAYMENT,
    REGSTATUS_REGISTERED,
    toESTString,
} from "@/lib/utils";
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
    // 1. Auth and parse
    await requireRole(["ADMIN"]);
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
            typeid: FAMILYBALANCE_TYPE_PAYMENT, // this may need to be changed based on payment type
            statusid: FAMILYBALANCE_STATUS_PAID, // Because we're applying a payment
            checkno: parsed.checkNo,
            totalamount: (-parsed.amount).toString(),
            paiddate: toESTString(parsed.paidDate),
            tuition: (-parsed.amount).toString(),
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

        // 4. Get the class reg
        //            where: (cr, { eq }) => eq(cr.regid, oldFB.appliedregid),
        // find class regsitrations which are linked to the oldFB.balancedid
        // it is ok not find, but if found we need to update depends if full amount is paid

        const classreg = await tx.query.classregistration.findMany({
            where: (cr, { eq }) => eq(cr.familybalanceid, oldFB.balanceid),
            // eq(cr.familyid, family.familyid),
            // eq(cr.seasonid, oldFB.seasonid),
            // We need the arrangement to check the price
            /*
            with: {
                class: {
                    columns: {classid: true}
                },
                season: {
                    columns: {seasonid: true}
                }
            }
                */
        });
        if (!classreg) {
            // throw new Error("Cannot find corresponding registrations");
            console.warn("Cannot find corresponding registrations");
            return;
        }

        // 5. Update the class reg
        if (isFullPayment(oldFB) - parsed.amount < 0.01) {
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

            /*
            await tx
                .update(classregistration)
                .set({
                    statusid: REGSTATUS_REGISTERED,
                    previousstatusid: classreg.statusid,
                    familybalanceid: oldFB.balanceid,
                    newbalanceid: newFB.balanceid,
                })
                .where(eq(classregistration.regid, classreg.regid));*/
        } else {
            /*
            await tx
                .update(classregistration)
                .set({
                    familybalanceid: oldFB.balanceid,
                    newbalanceid: newFB.balanceid
                })
                    */
            console.log("to be implemented - partial payment case");
        }

        revalidatePath(`/admin/management/${oldFB.familyid}`);
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
