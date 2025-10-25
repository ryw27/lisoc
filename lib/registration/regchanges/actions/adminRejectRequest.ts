"use server";
import { db } from "@/lib/db";
import { regchangerequest } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
// import { requireRole } from "@/app/lib/auth-lib/auth-actions";
import { REGSTATUS_REGISTERED, REQUEST_STATUS_PENDING, REQUEST_STATUS_REJECTED, toESTString } from "@/lib/utils";
//import { revalidatePath } from "next/cache";

// TODO: Check
export async function adminRejectRequest(requestid: number, registerid: number, adminMemo: string) {
    try {
        // need lock and check,  it is possible some one else change it     
        //const txResult = await db.transaction(async (tx) => {
        await db.transaction(async (tx) => {
            // 1. Get the request
            const [famRequest] = await tx
                            .select()
                            .from(regchangerequest)
                            .where(eq(regchangerequest.requestid, requestid))
                            .for('update'); // This is the key part for SELECT FOR UPDATE


            if (!famRequest) {
                throw new Error( `Cannot find reg change request requestid =${requestid}`);
            }

            if (famRequest.reqstatusid !== REQUEST_STATUS_PENDING) {
                throw new Error( `some one changed requst  requestid =${requestid}`);
            }

            // 2. Find the old registration this should not happen
            // but needs check 
            const oldReg = await tx.query.classregistration.findFirst({
                where: (cr, { eq }) => eq(cr.regid, registerid)
            });
            if (!oldReg) {
                throw new Error(`releated registration can not be found requestid =${requestid}, regid=${registerid}`)
            }

            // 3. Check if the old registration is actually only submitted, not paid 
            if (oldReg.statusid !== REGSTATUS_REGISTERED) {
                /*
                await tx
                    .delete(regchangerequest)
                    .where(eq(regchangerequest.requestid, requestid));
                revalidatePath("/dashboard/classes");
                revalidatePath("/admin/management/semester");
                return { ok: true };
                */
               throw new Error(`registration regid=${registerid} changed status on request=${requestid}`)
            }

            // 4. Update the regchange status
            // TODO: Add adminid
            await tx
                .update(regchangerequest)
                .set({
                    reqstatusid: REQUEST_STATUS_REJECTED,
                    processdate: toESTString(new Date()),
                    lastmodify: toESTString(new Date()),
                    adminmemo: adminMemo ,
                })
                .where(eq(regchangerequest.requestid, requestid))

            return { ok: true };
        });

        //if (txResult && typeof txResult === 'object' && 'ok' in txResult) return txResult;
        return { ok: true };
    } catch (error) {
        console.error('adminRejectRequest error', error);
        const message = error instanceof Error ? error.message : 'Server error. Please try again later.';
        return { ok: false, errormsg: message };
    }
}