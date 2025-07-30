import { db } from "@/lib/db";
import { classregistration, familybalance, regchangerequest } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { 
    EARLY_REG_DISCOUNT,
    FAMILYBALANCE_STATUS_PENDING,
    FAMILYBALANCE_STATUS_PROCESSED, 
    FAMILYBALANCE_TYPE_PAYMENT, 
    FAMILYBALANCE_TYPE_TRANSFER, 
    LATE_REG_FEE_1, 
    REGISTRATION_FEE, 
    REGSTATUS_REGISTERED, 
    REGSTATUS_SUBMITTED, 
    REGSTATUS_TRANSFERRED, 
    REQUEST_STATUS_PENDING, 
    toESTString 
} from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { uiClasses } from "../../types";
import { canTransferOutandIn, getArrSeason, getTotalPrice, isEarlyReg, isLateReg } from "../../helpers";
import { famBalanceInsert } from "@/lib/shared/types";
// import { requireRole } from "@/lib/auth";


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

        // 2. Check if they haven't paid yet. In this case just delete the old registration
        if (oldReg.statusid === REGSTATUS_SUBMITTED) {
            // Client should prevent getting here
            await tx
                .delete(classregistration)
                .where(eq(classregistration.regid, oldReg.regid));
            throw new Error("No payment found for this registration. The registration has been deleted");
        }

        // 3. Check if this family can request a transfer - only if they've already paid. If they didn't they can just delete their registration
        if (oldReg.statusid !== REGSTATUS_REGISTERED) {
            throw new Error("Invalid request. Either this registration has been transferred or dropped, or the registration has not been paid for. You may simply delete this registration if not paid for yet.");
        }

        // 4. Find the old arrangement to check cancel deadline
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

        // 6. Old reg has been paid: set it to transferred
        await tx
            .update(classregistration)
            .set({
                statusid: REGSTATUS_TRANSFERRED,
            })
            .where(and(eq(classregistration.regid, regid), eq(classregistration.studentid, studentid)));

        // 7. Insert into regchangerequest
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
                regstatusid: oldReg.statusid,
                reqstatusid: REQUEST_STATUS_PENDING,
                familybalanceid: oldReg.familybalanceid,
                familyid: familyid,
                submitdate: toESTString(new Date()),
                notes: `Family request transfer`,
            });
        
        revalidatePath("/admintest/management/regchangerequests");

    });
}