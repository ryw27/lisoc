"use server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classregistration, familybalance, regchangerequest } from "@/lib/db/schema";
import { 
    FAMILYBALANCE_TYPE_PAYMENT,
    REGSTATUS_REGISTERED, 
    REGSTATUS_SUBMITTED, 
    REQUEST_STATUS_PENDING, 
    REGISTRATION_FEE,
    toESTString, 
    FAMILYBALANCE_STATUS_PROCESSED
} from "@/lib/utils";
import { famBalanceInsert } from "@/lib/shared/types";
import { revalidatePath } from "next/cache";
import { uiClasses } from "../../types";
import { canTransferOutandIn, getArrSeason, getTotalPrice } from "../../helpers";
import { Transaction } from "../../helpers";
import { InferSelectModel } from "drizzle-orm";
//import { ca } from "zod/v4/locales";
// import { requireRole } from "@/lib/auth";

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
        statusid: FAMILYBALANCE_STATUS_PROCESSED, // TODO: This is because of where it is. Move this to helpers and make more extensible, or come up with a better function
        notes: "Admin transfer student, subtract old class fees"
    } satisfies famBalanceInsert;

    return removeFamBalValues
}

// TODO: Ensure that this is a valid transfer, that the family has paid for the original class. Enforced on client at the current moment.
export async function familyRequestTransfer(regid: number, studentid: number, familyid: number, newArrange: uiClasses) {
    try {
        const txResult = await db.transaction(async (tx) => {
            // 1. Get old registration
            const oldReg = await tx.query.classregistration.findFirst({
                where: (cr, { and, eq }) => and(eq(cr.regid, regid), eq(cr.studentid, studentid)),
            });
            if (!oldReg) {
                return { ok: false, message: "Did not find old class registration being transferred out of" };
            }

            // 2. Check if the registration is in a valid state to be dropped. Should only be submitted or registered
            if (oldReg.statusid !== REGSTATUS_SUBMITTED && oldReg.statusid !== REGSTATUS_REGISTERED) {
                return { ok: false, message: "Registration is not in a valid state to be dropped" };
            }

            // 3. Find the old arrangement to check cancel deadline
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
                return { ok: false, message: "Cannot find original class in transfer." };
            }

            // 4. Check if they haven't paid yet. In this case just delete the old registration and create a new balance removing the tuition
            if (oldReg.statusid === REGSTATUS_SUBMITTED) {
                // Client should prevent getting here
                await tx
                    .delete(classregistration)
                    .where(eq(classregistration.regid, oldReg.regid));

                const removeFamBalValues = await createRemoveFamBalanceVals(tx, oldReg, oldArr);
                await tx
                    .insert(familybalance)
                    .values(removeFamBalValues);
                revalidatePath("/dashboard/classes");
                revalidatePath("/admin/management/regchangerequests");
                return { ok: true };
            }

            // 5. Check two things: whether the new arrangement has closed registration and if the old arr is past the cancel deadline
            const newArrSeason = await tx.query.seasons.findFirst({
                where: (s, { eq }) => eq(s.seasonid, newArrange.seasonid),
            });
            if (!newArrSeason) {
                return { ok: false, message: "No corresponding season for class being transferred into" };
            }
            try {

               if (!canTransferOutandIn(oldArr.season, newArrSeason, newArrange.closeregistration)) {
                   // return { ok: false, message: "Transfer is not allowed. Either cancel deadline for old class has passed, or new class registration hasn't opened" };
                    return { ok: false, message: "Transfer closed" };

                }
            }catch (e) {
                console.error("Error in canTransferOutandIn check", e);
                return { ok: false, message: "Error checking transfer validity" };
            }

            // 6. Insert into regchangerequest
            const newArrTerm = await getArrSeason(tx, newArrange);
            await tx
                .insert(regchangerequest)
                .values({
                    regid: oldReg.regid,
                    appliedid: oldReg.regid,
                    studentid: studentid,
                    seasonid: newArrSeason.seasonid,
                    isyearclass: newArrTerm === "year",
                    relatedseasonid: oldReg.seasonid,
                    classid: newArrange.classid,
                    registerdate: oldReg.registerdate,
                    oriregstatusid: oldReg.statusid,
                    regstatusid: oldReg.statusid,
                    reqstatusid: REQUEST_STATUS_PENDING,
                    familybalanceid: oldReg.familybalanceid,
                    familyid: familyid,
                    submitdate: toESTString(new Date()),
                    notes: `Family request transfer`,
                });

            revalidatePath("/admin/management/regchangerequests");
            revalidatePath("/dashboard/classes");
            return { ok: true };
        });

        // If the transaction returned a result object, forward it
        if (txResult && typeof txResult === 'object' && 'ok' in txResult) {
            return txResult;
        }

        return { ok: true };
    } catch (error) {
        console.error('familyRequestTransfer error', error);
        const message = error instanceof Error ? error.message : 'Server error. Please try again later.';
        return { ok: false, message };
    }
}