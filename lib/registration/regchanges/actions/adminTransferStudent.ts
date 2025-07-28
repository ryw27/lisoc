import { db } from "@/lib/db";
import { 
    classregistration, 
    familybalance,
    arrangement
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { uiClasses } from "@/lib/registration/types";
import { REGISTRATION_FEE } from "@/lib/utils";


export async function adminTransferStudent(regid: number, orgArrange: uiClasses, newArrange: uiClasses) {
    await db.transaction(async (tx) => {
        const [newReg] = await tx
            .update(classregistration)
            .set({
                arrangeid: newArrange.arrangeid as number,
                classid: newArrange.classid
            })
            .where(eq(classregistration.regid, regid))
            .returning()

        // Update family balance
        // TODO: Factor in whether it's a half or whole semester (Whole classes can be half registered )
        let orgPrice = 0;
        if (orgArrange.suitableterm === 2) {
            orgPrice += Number(orgArrange.tuitionH) + Number(orgArrange.specialfeeH) + Number(orgArrange.bookfeeH) - (orgArrange.waiveregfee ? 0 : REGISTRATION_FEE);
        } else {
            orgPrice += Number(orgArrange.tuitionW) + Number(orgArrange.specialfeeW) + Number(orgArrange.bookfeeW) - (orgArrange.waiveregfee ? 0 : REGISTRATION_FEE);
        }
        let newPrice = 0;
        if (newArrange.suitableterm === 2) {
            newPrice += Number(newArrange.tuitionH) + Number(newArrange.specialfeeH) + Number(newArrange.bookfeeH) - (newArrange.waiveregfee ? 0 : REGISTRATION_FEE);
        } else {
            newPrice += Number(newArrange.tuitionW) + Number(newArrange.specialfeeW) + Number(newArrange.bookfeeW) - (newArrange.waiveregfee ? 0 : REGISTRATION_FEE);
        }

        const updated = await tx.query.familybalance.findFirst({
            where: (fb, { and, eq }) => and(eq(fb.familyid, newReg.familyid), eq(fb.seasonid, newReg.seasonid))
        });

        if (!updated) {
            throw new Error("Family balance not found");
        }

        await tx
            .update(familybalance)
            .set({
                tuition: (Number(updated.tuition) - orgPrice + newPrice).toString(),
                totalamount: (Number(updated.totalamount) - orgPrice + newPrice).toString()
            })
            .where(and(eq(familybalance.familyid, newReg.familyid), eq(familybalance.seasonid, newReg.seasonid)));
    })
}