import { db } from "@/lib/db";
import { 
    classregistration, 
    familybalance,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { uiClasses } from "@/lib/registration/types";
import { REGISTRATION_FEE } from "@/lib/utils";
import { revalidatePath } from "next/cache";


export async function adminDeleteRegistration(regid: number, curClass: uiClasses) {
    await db.transaction(async (tx) => {
        const reg = await tx.query.classregistration.findFirst({
            where: (r, { eq }) => eq(r.regid, regid),
            with: {
                season: {}
            }
        });
        if (!reg) {
            throw new Error("Registration not found");
        }

        const orgBalance = await tx.query.familybalance.findFirst({
            where: (fb, { and, eq }) => and(eq(fb.familyid, reg.familyid), eq(fb.seasonid, reg.seasonid))
        });

        if (!orgBalance) {
            throw new Error("Original family balance corresponding to this registration was not found");
        }

        const orgTuition = reg.season.seasonid < reg.season.beginseasonid && reg.season.seasonid < reg.season.relatedseasonid 
            ? Number(curClass.tuitionW) + Number(curClass.specialfeeW) + Number(curClass.bookfeeW) - (curClass.waiveregfee ? 0 : REGISTRATION_FEE) 
            : Number(curClass.tuitionH) + Number(curClass.specialfeeH) + Number(curClass.bookfeeH) - (curClass.waiveregfee ? 0 : REGISTRATION_FEE);

        await tx.update(familybalance).set({
            tuition: (Number(orgBalance.tuition) - orgTuition).toString(),
            totalamount: (Number(orgBalance.totalamount) - orgTuition).toString()
        }).where(eq(familybalance.balanceid, orgBalance.balanceid));

        await tx.delete(classregistration).where(eq(classregistration.regid, regid));
        revalidatePath("/admintest/management/semester");
        revalidatePath("/dashboard/classes");
    })
}