import { db } from "@/lib/db";
import { 
    classregistration, 
    regchangerequest,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { toESTString } from "@/lib/utils";
import { revalidatePath } from "next/cache";


// TODO: Ensure that this is a valid transfer, that the family has paid for the original class. Enforced on client at the current moment.
export async function familyRequestTransfer(regid: number) {
    await db.transaction(async (tx) => {
        const regObj = await tx.query.classregistration.findFirst({
            where: (cr, { eq }) => eq(cr.regid, regid)
        });
        if (!regObj) {
            throw new Error("Cannot find given registration");
        }

        await tx
            .update(classregistration)
            .set({
                previousstatusid: regObj.statusid, 
            })
            .where(eq(classregistration.regid, regid))
        await tx
            .insert(regchangerequest)
            .values({
                regid: regid,
                appliedid: regid,
                studentid: regObj.studentid,
                seasonid: regObj.seasonid,
                isyearclass: regObj.isyearclass,
                classid: regObj.classid,
                registerdate: regObj.registerdate,
                oriregstatusid: regObj.statusid,
                regstatusid: regObj.statusid,
                reqstatusid: 1, // Pending
                familybalanceid: regObj.familybalanceid,
                familyid: regObj.familyid,
                submitdate: toESTString(new Date()),
                notes: "Transfer Request",
            })
        revalidatePath("/admintest/management/semester");
        revalidatePath("/dashboard/register");
    })
}