"use server";
import { and, eq } from "drizzle-orm";
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
// import { requireRole } from "@/lib/auth";

async function createRemoveFamBalanceVals(tx: Transaction, oldReg: InferSelectModel<typeof classregistration>, oldArr: uiClasses, deleteReg: boolean) {
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
    // TODO: Parse data
    // const user = await requireRole(["FAMILY"]);
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

        // 3. Find the old arrangement to check cancel deadline
        // Having the arrangeid check is nice, but it's not technically postgres level enforced to be an actual arrangement, which is why there is another possible condition
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
            // Client should prevent getting here
            await tx
                .delete(classregistration)
                .where(eq(classregistration.regid, oldReg.regid));

            const deleteReg = true;
            const removeFamBalValues = await createRemoveFamBalanceVals(tx, oldReg, oldArr, deleteReg);
            await tx
                .insert(familybalance)
                .values(removeFamBalValues)
            revalidatePath("/dashboard/classes");
            revalidatePath("/admintest/management/regchangerequests");
            return;
            // throw new Error("No payment found for this registration. The registration has been deleted");
        }

        // 5. Check two things: whether the new arrangement has closed registration and if the old arr is past the cancel deadline
        const newArrSeason = await tx.query.seasons.findFirst({
            where: (s, { eq }) => eq(s.seasonid, newArrange.seasonid),
        });
        if (!newArrSeason) {
            throw new Error("No corresponding season for class being transferred into");
        }
        if (!canTransferOutandIn(oldArr.season, newArrSeason, newArrange.closeregistration)) {
            throw new Error("Transfer is not allowed. Either cancel deadline for old class has passed, or new class registration hasn't opened");
        }

        // Don't do this. 6. Old reg has been paid: set it to transferred
        // await tx
        //     .update(classregistration)
        //     .set({
        //         statusid: REGSTATUS_TRANSFERRED,
        //     })
        //     .where(and(eq(classregistration.regid, regid), eq(classregistration.studentid, studentid)));

        // 6. Insert into regchangerequest
        // When admin is handling, they will take all information needed for new classregister here 
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
        
        revalidatePath("/admintest/management/regchangerequests");
        revalidatePath("/dashboard/classes");
    });
}