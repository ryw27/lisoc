"use server";
import { db } from "@/lib/db";
import {
  classregistration,
  familybalance,
  regchangerequest,
} from "@/lib/db/schema";
import { eq, InferSelectModel } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { canDrop, getTotalPrice, Transaction } from "../../helpers";
import {
  FAMILYBALANCE_STATUS_PROCESSED,
  FAMILYBALANCE_TYPE_PAYMENT,
  REGISTRATION_FEE,
  REGSTATUS_REGISTERED,
  REGSTATUS_SUBMITTED,
  REQUEST_STATUS_PENDING,
  toESTString,
} from "@/lib/utils";
import { famBalanceInsert } from "@/lib/shared/types";
import { uiClasses } from "../../types";


async function createRemoveFamBalanceVals(tx: Transaction, oldReg: InferSelectModel<typeof classregistration>, oldArr: uiClasses) {
    // TODO: Use a drop specific getPrice which uses getTotalPrice instead
    const oldTotalPrice = await getTotalPrice(tx, oldArr);
    // Made these outside of the insert because there's some weird typescript error which i'm pretty sure is a drizzle bug
    // TODO: Check these values to ensure the price calculations are correct. Remove reg fee? What do you do about early discounts? etc.
    const removeFamBalValues = {
        appliedregid: oldReg.regid,
        appliedid: oldReg.familybalanceid || 0, // TODO: Not postgres enforced. 
        seasonid: oldArr.seasonid,
        familyid: oldReg.familyid,
        regfee: (oldArr.waiveregfee ? 0 : -REGISTRATION_FEE).toString(),
        tuition: (-oldTotalPrice).toString(),
        totalamount: ((oldArr.waiveregfee ? 0 : -REGISTRATION_FEE) - oldTotalPrice).toString(),
        typeid: FAMILYBALANCE_TYPE_PAYMENT,
        statusid: FAMILYBALANCE_STATUS_PROCESSED, // Because of where you use this. 
        notes: "FAmilydrop student, subtract old class fees"
    } satisfies famBalanceInsert;

    return removeFamBalValues
}

// Family overrides as well in this case. They just have to take the losses.
export async function familyRequestDrop(regid: number, studentid: number, familyid: number, override: boolean) {
    await db.transaction(async (tx) => {
        // 1. Get old registration
        const oldReg = await tx.query.classregistration.findFirst({
            where: (cr, { and, eq }) => and(eq(cr.regid, regid), eq(cr.studentid, studentid)),
        });
        if (!oldReg) {
            throw new Error("Did not find old class registration being dropped");
        }
        // 2. Check if the registration is in a valid state to be dropped. Should only be submitted or registered
        if (oldReg.statusid !== REGSTATUS_SUBMITTED && oldReg.statusid !== REGSTATUS_REGISTERED) {
            throw new Error("Registration is not in a valid state to be dropped");
        }

        // 3. Find the old arrangement 
        const oldArr = await tx.query.arrangement.findFirst({
            where: (arr, { and, or, eq }) =>
                or(
                    eq(arr.arrangeid, oldReg.arrangeid),
                    and(
                        eq(arr.classid, oldReg.classid),
                        eq(arr.seasonid, oldReg.seasonid)
                    )
                ),
            with: {
                season: {
                    columns: {
                        canceldeadline: true,
                        earlyregdate: true,
                    },
                },
            },
        });
        if (!oldArr) {
            throw new Error("Cannot find original class in transfer.");
        }

        // 4. Check if they haven't paid yet. In this case just delete the old registration and create a new balance removing the tuition
        if (oldReg.statusid === REGSTATUS_SUBMITTED) {
            // TODO: Possibly delete the family balance altogether to prevent bloat?
            await tx
                .delete(classregistration)
                .where(eq(classregistration.regid, regid));
            const removeFamBalValues = await createRemoveFamBalanceVals(tx, oldReg, oldArr) ;
            await tx
                .insert(familybalance)
                .values(removeFamBalValues)
            
            revalidatePath("/dashboard/classes");
            revalidatePath("/admin/management/regchangerequests");
            return;
            // throw new Error("No payment found for this registration. The registration has been deleted");
        }

        // 5. Check if can drop and that there is no override. Drops can be overriden. Family just has to take the losses
        // TODO: Enforce this as a "are you sure" on the client
        if (!canDrop(oldArr.season) && !override) {
            throw new Error("Cannot drop this registration")
        }

        await tx
            .insert(regchangerequest)
            .values({
                regid: oldReg.regid,
                appliedid: oldReg.regid,
                studentid: studentid,
                seasonid: oldReg.seasonid,
                isyearclass: oldReg.isyearclass,
                relatedseasonid: oldReg.seasonid,
                classid: oldReg.classid,
                registerdate: oldReg.registerdate,
                regstatusid: oldReg.statusid,
                reqstatusid: REQUEST_STATUS_PENDING,
                familybalanceid: oldReg.familybalanceid,
                familyid: familyid,
                submitdate: toESTString(new Date()),
                notes: `Family request transfer`,
            });
        
        // // 6. Set old registration as dropped out
        // await tx
        //     .update(classregistration)
        //     .set({
        //         previousstatusid: oldReg.statusid,
        //         statusid: REGSTATUS_DROPOUT,
        //         lastmodify: toESTString(new Date()),
        //         notes: "Dropped by family"
        //     })

        // // 7. Remove the tuition of the old class 
        // if (oldReg.statusid === REGSTATUS_REGISTERED) {
        //     // Should always be in here
        //     const removeFamBalValues = await createRemoveFamBalanceVals(tx, oldReg, oldArr) ;
        //     await tx
        //         .insert(familybalance)
        //         .values(removeFamBalValues)
        // }

        revalidatePath("/admin/management/regchangerequests");
        revalidatePath("/dashboard/classes");
    })
}