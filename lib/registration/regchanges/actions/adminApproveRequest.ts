"use server";
import { db } from "@/lib/db";
import {
  regchangerequest,
  familybalance,
  classregistration,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  EARLY_REG_DISCOUNT,
  FAMILYBALANCE_STATUS_PENDING,
  FAMILYBALANCE_TYPE_PAYMENT,
  FAMILYBALANCE_TYPE_TRANSFER,
  LATE_REG_FEE_1,
  REGISTRATION_FEE,
  REGSTATUS_DROPOUT,
  REGSTATUS_REGISTERED,
  REGSTATUS_TRANSFERRED,
  REQUEST_STATUS_APPROVED,
  REQUEST_STATUS_PENDING,
  toESTString,
} from "@/lib/utils";
import { famBalanceInsert } from "@/lib/shared/types";
import {
  getArrSeason,
  getTotalPrice,
  isEarlyReg,
  isLateReg,
} from "../../helpers";
import { revalidatePath } from "next/cache";
// import { requireRole } from "@/lib/auth/actions/requireRole";


export async function adminApproveRequest(requestid: number, registerid: number) {
    // TODO: Parse
    // 1. Auth check
    // const user = await requireRole(["ADMIN"]);
    await db.transaction(async (tx) => {
        // 2. Get original reg request
        const orgReq = await tx.query.regchangerequest.findFirst({
            where: (rgr, { eq }) => eq(rgr.requestid, requestid)
        });
        if (!orgReq) {
            throw new Error("Cannot find request");
        }

        if (orgReq.reqstatusid !== REQUEST_STATUS_PENDING) {
            throw new Error("Reg change request has already been processed");
        }

        // 3. Get old registration
        const oldReg = await tx.query.classregistration.findFirst({
            where: (cr, { eq }) => eq(cr.regid, registerid)
        });
        if (!oldReg) {
            throw new Error("Cannot find registration");
        }
        // 4. Check if the registration is paid or not. 
        // If it isn't, return. Delete the regchangerequest as the registration hasn't been paid and isn't valid for registration or they already transferred
        // TODO: Confirm how transactions work - is it one after the other or concurrently? In that case deleting may cause issues
        if (oldReg.statusid !== REGSTATUS_REGISTERED) {
            await tx
                .delete(regchangerequest)
                .where(eq(regchangerequest.requestid, requestid));
            revalidatePath("/dashboard/classes");
            revalidatePath("/admin/management/semester");
            return;
            // throw new Error("This student has either already transferred or dropped this class or not paid for the class. Request has been deleted");
        }

        // 5. Find original arrangement to obtain price. Rely on two methods in case.
        const oldArr = await tx.query.arrangement.findFirst({
            where: (arr, { and, or, eq }) => or(
                and(
                    eq(arr.seasonid, oldReg.seasonid),
                    eq(arr.classid, oldReg.classid)
                ),
                eq(arr.arrangeid, oldReg.arrangeid)
            )
        });
        if (!oldArr){
            throw new Error("Arrangement not found");
        }

        // 6. Update the regchange status
        await tx
            .update(regchangerequest)
            .set({
                oriregstatusid: REGSTATUS_REGISTERED,
                regstatusid: orgReq.notes?.includes("transfer") ? REGSTATUS_TRANSFERRED : REGSTATUS_DROPOUT, // TODO: Is there a more reliable way to know whether dropping or transferring
                reqstatusid: REQUEST_STATUS_APPROVED,
                processdate: toESTString(new Date()),
                lastmodify: toESTString(new Date()),
                adminmemo: "Approved Transfer"
            })


        // Officially transfer or drop. Same procedure found in admin transfer/drop
        // 7. Create a new family balance taking away the old tuition
        const oldTotalPrice = await getTotalPrice(tx, oldArr);
        const removeFamBalValues = {
            appliedregid: oldReg.regid,
            appliedid: oldReg.familybalanceid || 0, // TODO: Not postgres enforced. 
            paiddate: toESTString(new Date()),
            seasonid: oldArr.seasonid,
            familyid: oldReg.familyid,
            regfee: (oldArr.waiveregfee ? 0 : -REGISTRATION_FEE).toString(),
            tuition: (-oldTotalPrice).toString(),
            totalamount: ((oldArr.waiveregfee ? 0 : -REGISTRATION_FEE) - oldTotalPrice).toString(),
            typeid: FAMILYBALANCE_TYPE_TRANSFER,
            statusid: FAMILYBALANCE_STATUS_PENDING,
            notes: "Admin transfer student out, subtract old class fees"
        } satisfies famBalanceInsert;

        const [removeOldPrice] = await tx
            .insert(familybalance)
            .values(removeFamBalValues)
            .returning();

        // 7. Pay the family back since we just removed the old balance
        // Old reg was queried before all updates
        if (oldReg.statusid === REGSTATUS_REGISTERED) {
            // Should always be true
            // TODO: Insert paypal/official transaction here
            const payFamValues = {
                appliedregid: oldReg.regid,
                appliedid: removeOldPrice.balanceid,
                paiddate: toESTString(new Date()),
                seasonid: oldArr.seasonid,
                familyid: oldReg.familyid,
                regfee: (oldArr.waiveregfee ? REGISTRATION_FEE : 0).toString(),
                // earlyregdiscount: probably want to take this back, but how?
                // lateregfee: same with this value
                tuition: oldTotalPrice.toString(),
                totalamount: ((oldArr.waiveregfee ? 0 : REGISTRATION_FEE) + oldTotalPrice).toString(),
                typeid: FAMILYBALANCE_TYPE_PAYMENT, // TODO: Check this
                statusid: FAMILYBALANCE_STATUS_PENDING,
                notes: "Approve transfer request, refund family"
            } satisfies famBalanceInsert;

            await tx
                .insert(familybalance)
                .values(payFamValues);
        } 

        // 8. Insert new class registration
        if (orgReq.notes?.includes("transfer")) {
            const newArrange = await tx.query.arrangement.findFirst({
                where: (arr, { and, eq }) => and(eq(arr.seasonid, orgReq.seasonid as number), eq(arr.classid, orgReq.classid))
            });
            if (!newArrange) {
                throw new Error("Cannot find class to transfer into");
            }

            const arrTerm = await getArrSeason(tx, newArrange);
            const now = toESTString(new Date());
            const [newReg] = await tx
                .insert(classregistration)
                .values({
                    appliedid: oldReg.regid,
                    studentid: oldReg.studentid,
                    arrangeid: newArrange.arrangeid,
                    seasonid: newArrange.seasonid,
                    isyearclass: arrTerm === "year",
                    classid: newArrange.classid,
                    registerdate: now,
                    familyid: oldReg.familyid,
                    notes: `Requested transfer of student ${oldReg.studentid}` 
                })
                .returning();
            
            // 9. Open new family balances
            // TODO: Another field to consider is extrafee4newfamily
            const newTotalPrice = await getTotalPrice(tx, newArrange, arrTerm);
            const regFee = newArrange.waiveregfee ? 0 : REGISTRATION_FEE;
            const earlyregdiscount = (await isEarlyReg(tx, newArrange)) ? EARLY_REG_DISCOUNT : 0;
            const lateregfee = (await isLateReg(tx, newArrange)) ? LATE_REG_FEE_1 : 0;
            const totalamount = newTotalPrice + regFee + lateregfee - earlyregdiscount;

            const newBalVals = {
                appliedid: oldReg.familybalanceid || 0,
                appliedregid: newReg.regid,
                seasonid: newArrange.seasonid,
                familyid: oldReg.familyid,
                regfee: regFee.toString(),
                earlyregdiscount: earlyregdiscount.toString(),
                lateregfee: lateregfee.toString(),
                tuition: newTotalPrice.toString(),
                totalamount: totalamount.toString(),
                typeid: FAMILYBALANCE_TYPE_TRANSFER,
                registerdate: now,
                notes: "Requested transfer, new balance"
            } satisfies famBalanceInsert;

            const [newRegBal] = await tx
                .insert(familybalance)
                .values(newBalVals)
                .returning();
            // 10. Update new reg
            await tx
                .update(classregistration)
                .set({
                    familybalanceid: newRegBal.balanceid
                })
                .where(eq(classregistration.regid, newReg.regid));
            
            // 11. Update old reg
            await tx
                .update(classregistration)
                .set({
                    statusid: orgReq.notes?.includes("transfer") ? REGSTATUS_TRANSFERRED : REGSTATUS_DROPOUT,
                    previousstatusid: oldReg.statusid
                })
                .where(eq(classregistration.regid, oldReg.regid));

            // 12. Update regchangerequest to link the new family balances together
            await tx
                .update(regchangerequest)
                .set({
                    newbalanceid: newRegBal.balanceid
                })
                .where(eq(regchangerequest.requestid, orgReq.requestid));
        }
    })
}