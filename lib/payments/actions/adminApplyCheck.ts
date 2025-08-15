"use server";
import { db } from "@/lib/db";
import { 
    familybalance, 
    classregistration 
} from "@/lib/db/schema";
import { eq, InferSelectModel } from "drizzle-orm";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { famBalanceInsert, familyObj } from "@/lib/shared/types";
import { checkApplySchema } from "../validation";
import { FAMILYBALANCE_STATUS_PROCESSED, FAMILYBALANCE_TYPE_SCHOOL_CHECK, REGSTATUS_REGISTERED, toESTString } from "@/lib/utils";
// import { requireRole } from "@/lib/auth";


function isFullPayment(originalFB: InferSelectModel<typeof familybalance>) {
    const total = Number(originalFB.childnumRegfee)
        + Number(originalFB.regfee) 
        - Number(originalFB.earlyregdiscount) 
        + Number(originalFB.lateregfee)
        + Number(originalFB.extrafee4newfamily)
        + Number(originalFB.managementfee)
        + Number(originalFB.dutyfee)
        + Number(originalFB.cleaningfee)
        + Number(originalFB.otherfee)
        + Number(originalFB.tuition)
    return total;
}

export async function applyCheck(data: z.infer<typeof checkApplySchema>, family: familyObj) {
    // 1. Auth and parse
    // const user = await requireRole(["ADMIN"]);
    const parsed = checkApplySchema.parse(data);

    await db.transaction(async (tx) => {
        // 2. Find old family balance vals
        const oldFB = await tx.query.familybalance.findFirst({
            where: (fb, { and, eq }) => and(eq(fb.familyid, family.familyid), eq(fb.balanceid, parsed.balanceid))
        })
        if (!oldFB) {
            throw new Error("No family balance found")
        }
        
        // 3. Insert new family balance of check amount value
        const newFBVals = {
            appliedid: oldFB.balanceid,
            familyid: family.familyid,
            seasonid: oldFB.seasonid,
            typeid: FAMILYBALANCE_TYPE_SCHOOL_CHECK,
            statusid: FAMILYBALANCE_STATUS_PROCESSED,
            checkno: parsed.checkNo,
            totalamount: (-parsed.amount).toString(),
            paiddate: toESTString(parsed.paidDate),
            tuition: (-parsed.amount).toString(),
            notes: "Tuition paid with check"
        } satisfies famBalanceInsert
        const [newFB] = await tx
            .insert(familybalance)
            .values(newFBVals)
            .returning();
            
        // 4. Get the class reg 
        const classreg = await tx.query.classregistration.findFirst({
            where: (cr, { eq }) => eq(cr.regid, oldFB.appliedregid),
                // eq(cr.familyid, family.familyid), 
                // eq(cr.seasonid, oldFB.seasonid),
            // We need the arrangement to check the price
            with: {
                class: {
                    columns: {classid: true}
                },
                season: {
                    columns: {seasonid: true}
                }
            }
        });
        if (!classreg) {
            throw new Error("Cannot find corresponding registrations");
        }

        // 5. Update the class reg
        if (isFullPayment(oldFB)) {
            await tx
                .update(classregistration)
                .set({
                    statusid: REGSTATUS_REGISTERED,
                    previousstatusid: classreg.statusid,
                    familybalanceid: oldFB.balanceid,
                    newbalanceid: newFB.balanceid,
                })
                .where(eq(classregistration.regid, classreg.regid));
        } else {
            await tx
                .update(classregistration)
                .set({
                    familybalanceid: oldFB.balanceid,
                    newbalanceid: newFB.balanceid
                })
        }

        revalidatePath(`/admin/management/${oldFB.familyid}`);
    })
}