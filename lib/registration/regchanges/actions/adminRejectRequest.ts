"use server";
import { db } from "@/lib/db";
import { regchangerequest } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
// import { requireRole } from "@/app/lib/auth-lib/auth-actions";
import { REGSTATUS_REGISTERED, REQUEST_STATUS_PENDING, REQUEST_STATUS_REJECTED, toESTString } from "@/lib/utils";
import { revalidatePath } from "next/cache";

// TODO: Check
export async function adminRejectRequest(requestid: number, registerid: number) {
    // TODO: Parse data
    // const user = await requireRole(["ADMIN"]);
    await db.transaction(async (tx) => {
        // 1. Get the request
        const famRequest = await tx.query.regchangerequest.findFirst({
            where: (rgr, { eq }) => eq(rgr.requestid, requestid)
        });
        if (!famRequest) {
            throw new Error("Cannot find reg change request");
        }
        if (famRequest.reqstatusid !== REQUEST_STATUS_PENDING) {
            throw new Error("Reg change request has already been processed");
        }
        
        // 2. Find the old registration
        const oldReg = await tx.query.classregistration.findFirst({
            where: (cr, { eq }) => eq(cr.regid, registerid)
        });
        if (!oldReg) {
            throw new Error("Cannot find original registration");
        }

        // 3. Check if the old registration is actually only submitted, not paid 
        if (oldReg.statusid !== REGSTATUS_REGISTERED) {
            await tx
                .delete(regchangerequest)
                .where(eq(regchangerequest.requestid, requestid));
            revalidatePath("/dashboard/classes");
            revalidatePath("/admin/management/semester");
            return;
            // throw new Error("This student has either already transferred or dropped this class or not paid for the class. Request has been deleted");
        }

        // 4. Update the regchange status
        // TODO: Add adminid
        await tx
            .update(regchangerequest)
            .set({
                reqstatusid: REQUEST_STATUS_REJECTED,
                processdate: toESTString(new Date()),
                lastmodify: toESTString(new Date()),
                adminmemo: "Denied reg change request"
            })
            .where(eq(regchangerequest.requestid, requestid))
    })
}