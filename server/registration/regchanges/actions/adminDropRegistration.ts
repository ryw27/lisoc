"use server";

import { revalidatePath } from "next/cache";
import { eq, InferSelectModel } from "drizzle-orm";
import { db } from "@/lib/db";
import { classregistration, familybalance } from "@/lib/db/schema";
import {
    FAMILYBALANCE_STATUS_PENDING,
    FAMILYBALANCE_STATUS_PROCESSED,
    FAMILYBALANCE_TYPE_PAYMENT,
    REGISTRATION_FEE,
    REGSTATUS_DROPOUT,
    REGSTATUS_REGISTERED,
    REGSTATUS_SUBMITTED,
    toESTString,
} from "@/lib/utils";
import { type famBalanceInsert, type uiClasses } from "@/types/shared.types";
import { canDrop, getTotalPrice, Transaction } from "../../data";

async function createRemoveFamBalanceVals(
    tx: Transaction,
    oldReg: InferSelectModel<typeof classregistration>,
    oldArr: uiClasses,
    deleteReg: boolean
) {
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
        statusid: deleteReg ? FAMILYBALANCE_STATUS_PROCESSED : FAMILYBALANCE_STATUS_PENDING,
        notes: "Admin drop student, subtract old class fees",
    } satisfies famBalanceInsert;

    return removeFamBalValues;
}

export async function adminDropRegistration(regid: number, studentid: number, override: boolean) {
    await db.transaction(async (tx) => {
        // 1. Get old registration
        const oldReg = await tx.query.classregistration.findFirst({
            where: (cr, { and, eq }) => and(eq(cr.regid, regid), eq(cr.studentid, studentid)),
        });
        if (!oldReg) {
            throw new Error("Did not find old class registration being transferred out of ");
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
                    and(eq(arr.classid, oldReg.classid), eq(arr.seasonid, oldReg.seasonid))
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

        // 4. Check if they haven't paid yet. In this case just delete the old registration
        if (oldReg.statusid === REGSTATUS_SUBMITTED) {
            // Client should prevent getting here
            await tx.delete(classregistration).where(eq(classregistration.regid, regid));

            const deleteReg = true;
            const removeFamBalValues = await createRemoveFamBalanceVals(
                tx,
                oldReg,
                oldArr,
                deleteReg
            );
            await tx.insert(familybalance).values(removeFamBalValues);

            revalidatePath("/dashboard/classes");
            revalidatePath("/admin/management/semester");
            return;
            // throw new Error("No payment found for this registration. The registration has been deleted");
        }

        // 5. Check if can drop and that there is no override
        if (!canDrop(oldArr.season) && !override) {
            throw new Error("Cannot drop this registration");
        }

        // 6. Set old registrations as dropped out
        await tx.update(classregistration).set({
            previousstatusid: oldReg.statusid,
            statusid: REGSTATUS_DROPOUT,
            lastmodify: toESTString(new Date()),
            byadmin: true,
            notes: "Dropped by admin",
        });

        // 7. Remove the tuition of the old class if paid
        if (oldReg.statusid === REGSTATUS_REGISTERED) {
            // TODO: Use a drop specific getPrice which uses getTotalPrice instead
            const deleteReg = false;
            const removeFamBalValues = await createRemoveFamBalanceVals(
                tx,
                oldReg,
                oldArr,
                deleteReg
            );
            const [removeOldPrice] = await tx
                .insert(familybalance)
                .values(removeFamBalValues)
                .returning();

            // 8. Pay it back
            // TODO: Fix this
            const oldTotalPrice = await getTotalPrice(tx, oldArr);
            // Insert paypal/official transaction here
            const payFamValues = {
                appliedregid: oldReg.regid,
                appliedid: removeOldPrice.balanceid,
                seasonid: oldArr.seasonid,
                familyid: oldReg.familyid,
                regfee: (oldArr.waiveregfee ? REGISTRATION_FEE : 0).toString(),
                // earlyregdiscount: probably want to take this back, but how?
                // lateregfee: same with this value
                tuition: oldTotalPrice.toString(),
                totalamount: (
                    (oldArr.waiveregfee ? 0 : REGISTRATION_FEE) + oldTotalPrice
                ).toString(),
                typeid: FAMILYBALANCE_TYPE_PAYMENT, // TODO: Check this
                statusid: FAMILYBALANCE_STATUS_PROCESSED,
                notes: "Admin drop student, refund family reg fee",
            } satisfies famBalanceInsert;

            await tx.insert(familybalance).values(payFamValues);
        }

        // 9. Revalidate
        revalidatePath("/admin/management/semester");
        revalidatePath("/dashboard/classes");

        //--------------------------------------- LEGACY ---------------------------------------------------------------
        // const reg = await tx.query.classregistration.findFirst({
        //     where: (r, { eq }) => eq(r.regid, regid),
        //     with: {
        //         season: {}
        //     }
        // });
        // if (!reg) {
        //     throw new Error("Registration not found");
        // }

        // const orgBalance = await tx.query.familybalance.findFirst({
        //     where: (fb, { and, eq }) => and(eq(fb.familyid, reg.familyid), eq(fb.seasonid, reg.seasonid))
        // });

        // if (!orgBalance) {
        //     throw new Error("Original family balance corresponding to this registration was not found");
        // }
        // const classTerm = await getArrSeason(tx, curClass);
        // const orgTuition = await getTotalPrice(tx, curClass);

        // await tx.update(familybalance).set({
        //     tuition: (Number(orgBalance.tuition) - orgTuition).toString(),
        //     totalamount: (Number(orgBalance.totalamount) - orgTuition).toString()
        // }).where(eq(familybalance.balanceid, orgBalance.balanceid));

        // await tx.delete(classregistration).where(eq(classregistration.regid, regid));
        // revalidatePath("/admin/management/semester");
        // revalidatePath("/dashboard/classes");
    });
}
