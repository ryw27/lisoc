import { db } from "@/lib/db";
import { 
    familybalance, 
    classregistration 
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { familyObj } from "@/lib/shared/types";
import { checkApplySchema } from "../validation";




export async function applyCheck(data: z.infer<typeof checkApplySchema>, family: familyObj) {
    const parsed = checkApplySchema.parse(data);
    await db.transaction(async (tx) => {
        const fb = await tx.query.familybalance.findFirst({
            where: (fb, { and, eq }) => and(eq(fb.familyid, family.familyid), eq(fb.balanceid, parsed.balanceid))
        })
        if (!fb) {
            throw new Error("No family balance found")
        }
        const [updated] = await tx
            .update(familybalance)
            .set({
                checkno: parsed.checkNo,
                totalamount: (Number(fb.totalamount) - parsed.amount).toString(),
                tuition: (Number(fb.tuition) - parsed.amount).toString()
            })
            .where(eq(familybalance.balanceid, fb.balanceid)).returning();
            
        const classreg = await tx.query.classregistration.findFirst({
            where: (cr, { eq }) => and(eq(cr.familyid, family.familyid), eq(cr.seasonid, fb.seasonid))
        });

        if (!classreg) {
            throw new Error("Cannot find corresponding registrations");
        }

        await tx
            .update(classregistration)
            .set({
                statusid: 2,
                previousstatusid: classreg.statusid,
                familybalanceid: fb.balanceid
            })
            .where(eq(classregistration.regid, classreg.regid));

        revalidatePath(`admintest/management/${fb.familyid}`);
    })
}