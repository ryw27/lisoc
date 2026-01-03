"use server";

import { request } from "http";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classregistration, familybalance, regchangerequest } from "@/lib/db/schema";
import { type famBalanceInsert } from "@/lib/types.shared";
import {
    EARLY_REG_DISCOUNT,
    FAMILYBALANCE_STATUS_PENDING,
    //FAMILYBALANCE_STATUS_PENDING,
    FAMILYBALANCE_TYPE_DROPOUT,
    //FAMILYBALANCE_TYPE_PAYMENT,
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
import { getArrSeason, getTotalPrice, isEarlyReg, isLateReg } from "../../data";

// import { requireRole } from "@/lib/auth/actions/requireRole";

export async function adminApproveRequest(
    requestid: number,
    registerid: number,
    adminMemo: string,
    balanceType: number,
    extraFee: number
) {
    // TODO: Parse
    // 1. Auth check
    // const user = await requireRole(["ADMIN"]);

    try {
        // because of foregin key order needs to be regchangerequest balance class registration
        // it is possible before update someone change it
        await db.transaction(async (tx) => {
            // 2. Get original reg request
            // this should lock for update

            const [orgReq] = await tx
                .select()
                .from(regchangerequest)
                .where(eq(regchangerequest.requestid, requestid))
                .for("update"); // This is the key part for SELECT FOR UPDATE

            if (!orgReq) {
                throw new Error(`Cannot find request requestid = ${requestid}`);
            }

            if (orgReq.reqstatusid !== REQUEST_STATUS_PENDING) {
                throw new Error(`system error  request id = ${requestid} is not in pending stage`);
            }

            const isTransfer = orgReq.appliedid !== 0;

            // 3. Get old registration and lock it

            const [oldReg] = await tx
                .select()
                .from(classregistration)
                .where(eq(classregistration.regid, registerid))
                .for("update"); // This is the key part for SELECT FOR UPDATE

            if (!oldReg) {
                throw new Error("Cannot find registration");
            }
            // 4. Check if the registration is paid or not.
            // If it isn't, return. Delete the regchangerequest as the registration hasn't been paid and isn't valid for registration or they already transferred
            // TODO: Confirm how transactions work - is it one after the other or concurrently? In that case deleting may cause issues
            // it is possible other users changed the registration if that is case eturn
            if (oldReg.statusid !== REGSTATUS_REGISTERED) {
                /*await tx
                    .delete(regchangerequest)
                    .where(eq(regchangerequest.requestid, requestid));*/
                throw new Error(
                    `request id = ${request}, regid = ${registerid} is not in registered status , someone else may have change it`
                );
            }

            // 5. Find original arrangement to obtain price. Rely on two methods in case.
            const oldArr = await tx.query.arrangement.findFirst({
                where: (arr, { and, or, eq }) =>
                    or(
                        and(eq(arr.seasonid, oldReg.seasonid), eq(arr.classid, oldReg.classid)),
                        eq(arr.arrangeid, oldReg.arrangeid)
                    ),
            });
            if (!oldArr) {
                throw new Error("Arrangement not found");
            }
            // all records are locked

            // 6. Update the regchange status
            await tx
                .update(regchangerequest)
                .set({
                    oriregstatusid: oldReg.statusid,
                    regstatusid: isTransfer ? REGSTATUS_TRANSFERRED : REGSTATUS_DROPOUT,
                    reqstatusid: REQUEST_STATUS_APPROVED,
                    processdate: toESTString(new Date()),
                    lastmodify: toESTString(new Date()),
                    adminmemo: adminMemo,
                })
                .where(eq(regchangerequest.requestid, requestid));

            // Officially transfer or drop. Same procedure found in admin transfer/drop
            // 7. Create a new family balance taking away the old tuition
            const oldTotalPrice = await getTotalPrice(tx, oldArr);
            /*
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
            */

            // 11. Update old reg
            await tx
                .update(classregistration)
                .set({
                    statusid: isTransfer ? REGSTATUS_TRANSFERRED : REGSTATUS_DROPOUT,
                    previousstatusid: oldReg.statusid,
                })
                .where(eq(classregistration.regid, oldReg.regid));

            // 8. Insert new class registration
            if (isTransfer) {
                const newArrange = await tx.query.arrangement.findFirst({
                    where: (arr, { and, eq }) =>
                        and(
                            eq(arr.seasonid, orgReq.seasonid as number),
                            eq(arr.classid, orgReq.classid)
                        ),
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
                        familybalanceid: oldReg.familybalanceid,
                        newbalanceid: 0, // not yet decided this is not foregin key
                        familyid: oldReg.familyid,
                        statusid: oldReg.statusid, // it will inherit old values regardless
                        notes: `transfer of student ${oldReg.studentid} from request ${requestid}`,
                    })
                    .returning();

                // 9. Open new family balances
                // TODO: Another field to consider is extrafee4newfamily
                const newTotalPrice = await getTotalPrice(tx, newArrange, arrTerm);
                const regFee = newArrange.waiveregfee ? 0 : REGISTRATION_FEE;
                const earlyregdiscount = (await isEarlyReg(tx, newArrange))
                    ? EARLY_REG_DISCOUNT
                    : 0;
                const lateregfee = (await isLateReg(tx, newArrange)) ? LATE_REG_FEE_1 : 0;
                const totalamount = newTotalPrice + regFee + lateregfee - earlyregdiscount;

                const diff = totalamount - oldTotalPrice + extraFee;
                if (Math.abs(diff) > 0.01) {
                    // there is money involved here , no adjustment on balance

                    const newBalVals = {
                        appliedid: oldReg.familybalanceid || 0,
                        appliedregid: newReg.regid,
                        seasonid: newArrange.seasonid,
                        familyid: oldReg.familyid,
                        regfee: "0.0", //regFee.toString(),
                        earlyregdiscount: "0.0", //earlyregdiscount.toString(),
                        lateregfee: "0.0", //lateregfee.toString(),
                        tuition: "0.0", //newTotalPrice.toString(),
                        totalamount: diff.toString(), //totalamount.toString(),
                        typeid: FAMILYBALANCE_TYPE_TRANSFER,
                        statusid: FAMILYBALANCE_STATUS_PENDING,
                        registerdate: now,
                        notes: `Requested transfer, new balance from ${requestid}`,
                    } satisfies famBalanceInsert;

                    const [newRegBal] = await tx
                        .insert(familybalance)
                        .values(newBalVals)
                        .returning();
                    // 10. Update new reg
                    await tx
                        .update(classregistration)
                        .set({
                            newbalanceid: newRegBal.balanceid,
                        })
                        .where(eq(classregistration.regid, newReg.regid));
                    // 12. Update regchangerequest to link the new family balances together
                    // and new regid
                    await tx
                        .update(regchangerequest)
                        .set({
                            newbalanceid: newRegBal.balanceid,
                            regid: newReg.regid,
                        })
                        .where(eq(regchangerequest.requestid, orgReq.requestid));
                } else {
                    // no money involved, only update regchangerequest
                    await tx
                        .update(regchangerequest)
                        .set({
                            regid: newReg.regid,
                        })
                        .where(eq(regchangerequest.requestid, orgReq.requestid));
                }
            } else {
                //drop out only need to update balance
                const credit = -1.0 * oldTotalPrice;

                const dropBalVals = {
                    appliedid: oldReg.familybalanceid || 0,
                    appliedregid: oldReg.regid,
                    seasonid: oldArr.seasonid,
                    familyid: oldReg.familyid,
                    regfee: "0.0", //regFee.toString(),
                    earlyregdiscount: "0.0", //earlyregdiscount.toString(),
                    lateregfee: "0.0", //lateregfee.toString(),
                    tuition: "0.0", //newTotalPrice.toString(),
                    totalamount: credit.toString(), //totalamount.toString(),
                    typeid: FAMILYBALANCE_TYPE_DROPOUT,
                    statusid: FAMILYBALANCE_STATUS_PENDING,
                    registerdate: toESTString(new Date()),
                    notes: `Requested drop old balance ${requestid}`,
                } satisfies famBalanceInsert;

                const [newRegBal] = await tx.insert(familybalance).values(dropBalVals).returning();

                if (Math.abs(extraFee) > 0.01) {
                    // add extra fee
                    const extraBalVals = {
                        appliedid: newRegBal.balanceid || 0,
                        appliedregid: oldReg.regid,
                        seasonid: oldArr.seasonid,
                        familyid: oldReg.familyid,
                        regfee: "0.0", //regFee.toString(),
                        earlyregdiscount: "0.0", //earlyregdiscount.toString(),
                        lateregfee: "0.0", //lateregfee.toString(),
                        tuition: "0.0", //newTotalPrice.toString(),
                        totalamount: extraFee.toString(), //totalamount.toString(),
                        typeid: balanceType,
                        statusid: FAMILYBALANCE_STATUS_PENDING,
                        registerdate: toESTString(new Date()),
                        notes: `Requested drop extra fee ${requestid}`,
                    } satisfies famBalanceInsert;

                    await tx.insert(familybalance).values(extraBalVals);
                }

                // 10. Update old reg (stauts is updated above)
                await tx
                    .update(classregistration)
                    .set({
                        newbalanceid: newRegBal.balanceid,
                    })
                    .where(eq(classregistration.regid, oldReg.regid));

                // 12. Update regchangerequest to link the new family balances together
                await tx
                    .update(regchangerequest)
                    .set({
                        newbalanceid: newRegBal.balanceid,
                    })
                    .where(eq(regchangerequest.requestid, orgReq.requestid));
            }
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Server error. Please try again later.";
        console.error("adminRejectRequest error", message);

        revalidatePath("/dashboard/classes");
        revalidatePath("/admin/management/semester");
    }
}
