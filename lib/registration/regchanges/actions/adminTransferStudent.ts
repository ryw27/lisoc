import { db } from "@/lib/db";
import { 
    classregistration, 
    familybalance,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { uiClasses } from "@/lib/registration/types";
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
    toESTString 
} from "@/lib/utils";
import { getArrSeason, getTotalPrice, isEarlyReg, isLateReg } from "../../helpers";
import { famBalanceInsert } from "@/lib/shared/types";


export async function adminTransferStudent(regid: number, studentid: number, familyid: number, newArrange: uiClasses, override: boolean) {
    // TODO: Parse data
    await db.transaction(async (tx) => {
        // 1. Get old registration
        const oldReg = await tx.query.classregistration.findFirst({
            where: (cr, { eq }) => and(eq(cr.regid, regid), eq(cr.studentid, studentid))
        });
        if (!oldReg) {
            throw new Error("Did not find old class registration being transferred out of ");
        }

        // 2. Check if already transferred or dropped out
        if (oldReg.statusid !== REGSTATUS_SUBMITTED && oldReg.statusid !== REGSTATUS_REGISTERED) {
            throw new Error("Invalid registration. Student has already transferred or dropped this class");
        }

        // 3. Find the old arrangement to check cancel deadline
        // Having the arrangeid check is nice, but it's not technically postgres level enforced to be an actual arrangement, which is why there is another check
        const oldArr = await tx.query.arrangement.findFirst({
            where: (arr, { and, or, eq }) => or(
                eq(arr.arrangeid, oldReg.arrangeid),
                and(
                    eq(arr.classid, oldReg.classid),
                    eq(arr.seasonid, oldReg.seasonid)
                )
            ),
            with: {
                season: {
                    columns: {
                        canceldeadline: true
                    }
                }
            }
        })
        if (!oldArr) {
            throw new Error("Cannot find original class in transfer.");
        }

        // 4. Check if it's past cancel deadline and there is no admin override
        if (new Date(oldArr.season.canceldeadline) <= new Date(toESTString(new Date())) && !override) {
            throw new Error("Transfer is not allowed. Cancel deadline has passed");
        }

        // 5. Check if they haven't paid yet. In this case just delete the old registration
        if (oldReg.statusid === REGSTATUS_SUBMITTED) {
            await tx
                .delete(classregistration)
                .where(eq(classregistration.regid, oldReg.regid));
        } else {
            // 6. Old reg has been paid: set it to transferred
            await tx
                .update(classregistration)
                .set({
                    statusid: REGSTATUS_TRANSFERRED,
                })
                .where(and(eq(classregistration.regid, regid), eq(classregistration.studentid, studentid)))
                .returning()
        }

        // 6. Take away the tuition from this class by inserting a new family balance row
        const oldTotalPrice = await getTotalPrice(tx, oldArr);
        // Made these outside of the insert because there's some weird typescript error which i'm pretty sure is a drizzle bug
        // TODO: Check these values to ensure the price calculations are correct. Remove reg fee? What do you do about early discounts? etc.
        const removeFamBalValues = {
            appliedregid: oldReg.regid,
            appliedid: oldReg.familybalanceid || 0, // TODO: Not postgres enforced. 
            seasonid: oldArr.seasonid,
            familyid: familyid,
            regfee: (oldArr.waiveregfee ? 0 : -REGISTRATION_FEE).toString(),
            tuition: (-oldTotalPrice).toString(),
            totalamount: ((oldArr.waiveregfee ? 0 : -REGISTRATION_FEE) - oldTotalPrice).toString(),
            typeid: FAMILYBALANCE_TYPE_TRANSFER,
            statusid: FAMILYBALANCE_STATUS_PENDING,
            notes: "Admin transfer student out, subtract old class fees"
        } satisfies famBalanceInsert

        const [removeOldPrice] = await tx
            .insert(familybalance)
            .values(removeFamBalValues)
            .returning();

        // 7. If the original class was already paid for, pay the family back since we just removed the old balance
        // Old reg was queried before all updates
        if (oldReg.statusid === REGSTATUS_REGISTERED) { 
            // Insert paypal/official transaction here
            const payFamValues = {
                appliedregid: oldReg.regid,
                appliedid: removeOldPrice.balanceid,
                seasonid: oldArr.seasonid,
                familyid: familyid,
                regfee: (oldArr.waiveregfee ? REGISTRATION_FEE : 0).toString(),
                // earlyregdiscount: probably want to take this back, but how?
                // lateregfee: same with this value
                tuition: oldTotalPrice.toString(),
                totalamount:((oldArr.waiveregfee ? 0 : REGISTRATION_FEE) + oldTotalPrice).toString(),
                typeid: FAMILYBALANCE_TYPE_PAYMENT, // TODO: Check this
                statusid: FAMILYBALANCE_STATUS_PROCESSED,
                notes: "Admin transfer student out, refund family reg fee"
            } satisfies famBalanceInsert

            await tx
                .insert(familybalance)
                .values(payFamValues);
        }

        // 8. Insert new class registration
        const arrTerm = await getArrSeason(tx, newArrange);
        const now = toESTString(new Date());
        const [newReg] = await tx
            .insert(classregistration)
            .values({
                appliedid: oldReg.regid,
                studentid: studentid,
                arrangeid: newArrange.arrangeid,
                seasonid: newArrange.seasonid,
                isyearclass: arrTerm === "year",
                classid: newArrange.classid,
                registerdate: now,
                familyid: familyid,
                byadmin: true,
                notes: `Admin transfer student to ${newArrange.arrangeid} from ${oldReg.arrangeid}`
            })
            .returning()
        // 9. Insert new family balance with registration prices
        // TODO: Another field to consider is extrafee4newfamily
        const newTotalPrice = await getTotalPrice(tx, newArrange, arrTerm);
        const regFee = newArrange.waiveregfee ? 0 : REGISTRATION_FEE ;
        const earlyregdiscount = (await isEarlyReg(tx, newArrange)) ? EARLY_REG_DISCOUNT : 0;
        const lateregfee = (await isLateReg(tx, newArrange)) ? LATE_REG_FEE_1 : 0;
        const totalamount =  newTotalPrice + regFee + lateregfee - earlyregdiscount;

        const newBalVals = {
            appliedid: oldReg.familybalanceid || 0,
            appliedregid: newReg.regid,
            seasonid: newArrange.seasonid,
            familyid: familyid,
            regfee: regFee.toString(),
            earlyregdiscount: earlyregdiscount.toString(),
            lateregfee: lateregfee.toString(),
            tuition: (newTotalPrice).toString(),
            totalamount: (totalamount).toString(),
            typeid: FAMILYBALANCE_TYPE_TRANSFER,
            registerdate: now,
            notes: "Admin transferred student, new balance" 
        } satisfies famBalanceInsert

        const [newRegBal] = await tx
            .insert(familybalance)
            .values(newBalVals)
            .returning();

        await tx
            .update(classregistration)
            .set({
                familybalanceid: newRegBal.balanceid
            })

        return newRegBal;
    })
}