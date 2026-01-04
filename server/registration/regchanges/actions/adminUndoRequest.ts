"use server";

import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { classregistration, familybalance, regchangerequest } from "@/lib/db/schema";
import {
    //EARLY_REG_DISCOUNT,
    //FAMILYBALANCE_STATUS_PENDING,
    //FAMILYBALANCE_TYPE_DROPOUT,
    //FAMILYBALANCE_TYPE_PAYMENT,
    //FAMILYBALANCE_TYPE_TRANSFER,
    //LATE_REG_FEE_1,
    //REGISTRATION_FEE,
    REGSTATUS_DROPOUT,
    REGSTATUS_DROPOUT_SPRING,
    REGSTATUS_REGISTERED,
    //REGSTATUS_TRANSFERRED,
    REQUEST_STATUS_APPROVED,
    REQUEST_STATUS_PENDING,
    REQUEST_STATUS_REJECTED,
    toESTString,
} from "@/lib/utils";

// import { requireRole } from "@/lib/auth/actions/requireRole";

export async function adminUndoRequest(requestid: number, familyid: number, status: number) {
    // TODO: Parse
    // 1. Auth check
    // const user = await requireRole(["ADMIN"]);

    try {
        await db.transaction(async (tx) => {
            // 1. Get the request
            // there is possibility , this records is updated by others
            // needs lock and check
            const [orgReq] = await tx
                .select()
                .from(regchangerequest)
                .where(eq(regchangerequest.requestid, requestid))
                .for("update"); // This is the key part for SELECT FOR UPDATE

            if (!orgReq) {
                throw new Error(`requestid ${requestid} not found`);
            }

            if (
                status != orgReq.reqstatusid
            ) // status passed in must match in case some one changed in middle
            {
                throw new Error(`requestid ${requestid} has changed status `);
            }

            if (status == REQUEST_STATUS_REJECTED) {
                // this is relatively easy  just update the status of requestid
                // double check if status is changed by others
                // lock for update

                await tx
                    .update(regchangerequest)
                    .set({
                        reqstatusid: REQUEST_STATUS_PENDING,
                        oriregstatusid: orgReq.reqstatusid,
                        processdate: toESTString(new Date()),
                        lastmodify: toESTString(new Date()),
                        adminmemo: "undo",
                    })
                    .where(
                        and(
                            eq(regchangerequest.requestid, requestid),
                            eq(regchangerequest.familyid, familyid)
                        )
                    );
            } else if (status == REQUEST_STATUS_APPROVED) {
                // this needs to rollback  classregistration balance regchangerequest
                // there is possibility other ppl change records, so each step needs lock for update
                // and check because of foregin key , update  must be in order class registration,
                // familybalance regchange request

                const isTransfer = orgReq.appliedid !== 0;
                const relatedBalanceId = orgReq.newbalanceid || 0; // it could be 0 (transfer no money involved )

                // 3. Get old registration
                const [updatedReg] = await tx //this could be different than appliedreg (transfer)
                    .select()
                    .from(classregistration)
                    .where(eq(classregistration.regid, orgReq.regid))
                    .for("update"); // This is the key part for SELECT FOR UPDATE

                if (!updatedReg) {
                    throw new Error(`Cannot find registration for requestid ${requestid}`);
                }
                if (!isTransfer) {
                    // it must be drop, check status is it dropped
                    if (
                        updatedReg.statusid !== REGSTATUS_DROPOUT &&
                        updatedReg.statusid !== REGSTATUS_DROPOUT_SPRING
                    ) {
                        throw new Error(
                            `registration ${requestid} status has been changed can not rollback `
                        );
                    }

                    // class registration change
                    await tx
                        .update(classregistration)
                        .set({
                            previousstatusid: updatedReg.statusid,
                            statusid: REGSTATUS_REGISTERED,
                            newbalanceid: 0,
                            notes: updatedReg.notes + ",admin undo",
                        })
                        .where(
                            and(
                                eq(classregistration.regid, updatedReg.regid),
                                eq(classregistration.familyid, familyid)
                            )
                        );

                    // if dropped , we expected a new balance id,  there may be extra balance id

                    const [linkedBalance] = await tx
                        .select()
                        .from(familybalance)
                        .where(
                            and(
                                or(
                                    eq(familybalance.balanceid, relatedBalanceId),
                                    eq(familybalance.appliedid, relatedBalanceId)
                                ),
                                eq(familybalance.familyid, familyid)
                            )
                        )
                        .for("update");

                    if (!linkedBalance) {
                        //if it is 0 it will throw error drop must have balance linked
                        throw new Error(
                            `linked balance id relatedBalanceId, for requestid ${requestid} does not exist`
                        );
                    }

                    //2. delete familybalance
                    await tx
                        .delete(familybalance)
                        .where(
                            and(
                                or(
                                    eq(familybalance.balanceid, relatedBalanceId),
                                    eq(familybalance.appliedid, relatedBalanceId)
                                ),
                                eq(familybalance.familyid, familyid)
                            )
                        );
                    //4. regchangerequest will be updated below
                    // drop  regid does not change
                    await tx
                        .update(regchangerequest)
                        .set({
                            reqstatusid: REQUEST_STATUS_PENDING,
                            oriregstatusid: orgReq.regstatusid,
                            regstatusid: REGSTATUS_REGISTERED,
                            newbalanceid: 0,
                            processdate: toESTString(new Date()),
                            lastmodify: toESTString(new Date()),
                            adminmemo: "undo",
                        })
                        .where(
                            and(
                                eq(regchangerequest.requestid, requestid),
                                eq(regchangerequest.familyid, familyid)
                            )
                        );
                } else {
                    //this is transfer
                    // update class registration, familybalance, regchangerequest  in this order
                    // registration is already updated double check the status is correct
                    if (updatedReg.statusid !== REGSTATUS_REGISTERED) {
                        throw new Error(
                            `registration ${orgReq.regid} status has been changed can not rollback `
                        );
                    }

                    if (relatedBalanceId !== 0) {
                        //there is  new balance involved
                        await tx
                            .delete(familybalance)
                            .where(
                                and(
                                    or(
                                        eq(familybalance.balanceid, relatedBalanceId),
                                        eq(familybalance.appliedid, relatedBalanceId)
                                    ),
                                    eq(familybalance.familyid, familyid)
                                )
                            );
                    }

                    // transfered class needs to be deleted and original status restored
                    await tx
                        .update(classregistration)
                        .set({
                            previousstatusid: classregistration.statusid,
                            statusid: updatedReg.statusid,
                            notes: updatedReg.notes + ",admin undo",
                        })
                        .where(
                            and(
                                eq(classregistration.regid, orgReq.appliedid || 0), // should not be 0
                                eq(classregistration.familyid, familyid)
                            )
                        );
                    // delete classregistration of regid
                    await tx
                        .delete(classregistration)
                        .where(
                            and(
                                eq(classregistration.regid, orgReq.regid),
                                eq(classregistration.familyid, familyid)
                            )
                        );
                    // regchangerequest update below
                    // change regid back to original appliedid
                    await tx
                        .update(regchangerequest)
                        .set({
                            reqstatusid: REQUEST_STATUS_PENDING,
                            regstatusid: regchangerequest.oriregstatusid,
                            oriregstatusid: updatedReg.statusid,
                            regid: orgReq.appliedid || 0,
                            newbalanceid: 0,
                            processdate: toESTString(new Date()),
                            lastmodify: toESTString(new Date()),
                            adminmemo: "undo",
                        })
                        .where(
                            and(
                                eq(regchangerequest.requestid, requestid),
                                eq(regchangerequest.familyid, familyid)
                            )
                        );
                }
            } else {
                // should never come here
                console.log(`status =${status} , system error should never happen`);
                throw new Error(" status is no reject or approve should never come here ");
            }
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Server error. Please try again later.";
        console.error("adminUndoRequest error", message);
    }
}
