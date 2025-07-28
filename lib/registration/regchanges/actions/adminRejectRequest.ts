import { db } from "@/lib/db";
import { regchangerequest } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/app/lib/auth-lib/auth-actions";
import { toESTString } from "@/lib/utils";

// TODO: Check
export async function adminRejectRequest(requestid: number) {
    const user = await requireRole(["ADMIN"]);
    await db.transaction(async (tx) => {
        await tx.query.regchangerequest.findFirst({
            where: (rgr, { eq }) => eq(rgr.requestid, requestid)
        });

        const adminuser = await tx.query.adminuser.findFirst({
            where: (u, { eq }) => eq(u.userid, user.user.userid)
        });

        if (!adminuser) {
            throw new Error("Admin does not exist");
        }

        await tx
            .update(regchangerequest)
            .set({
                regstatusid: 3,
                processdate: toESTString(new Date()),
                adminuserid: String(adminuser.adminid)
            })
            .where(eq(regchangerequest.requestid, requestid))
    })
}