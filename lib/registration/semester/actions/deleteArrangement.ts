"use server";
import { db } from "@/lib/db";
import { 
    classregistration, 
    arrangement, 
    familybalance
} from "@/lib/db/schema";
import { uiClasses } from "../../types";
import { eq, and } from "drizzle-orm";
import { classRegObj, famBalanceInsert } from "@/lib/shared/types";
import { getTotalPrice, type Transaction } from "../../helpers";
import { FAMILYBALANCE_STATUS_PENDING, FAMILYBALANCE_TYPE_OTHER, REGISTRATION_FEE } from "@/lib/utils";
import { requireRole } from "@/lib/auth";


async function deleteAllRegistrations(tx: Transaction, registrations: classRegObj[], classData: uiClasses) {
    await requireRole(["ADMIN"])

    const totalPrice = await getTotalPrice(tx, classData);
    for (const reg of registrations) {
        // Delete the class registration
        await tx
            .delete(classregistration)
            .where(eq(classregistration.regid, reg.regid));

        const orgBal = await tx.query.familybalance.findFirst({
            where: (fb, { eq }) => eq(fb.appliedregid, reg.regid)
        });

        // Insert a negative balance adjustment for the family
        const removeRegFee = classData.waiveregfee ? -REGISTRATION_FEE : 0
        const fbvalues = {
            appliedid: orgBal?.balanceid || 0,
            seasonid: reg.seasonid,
            familyid: reg.familyid,
            regfee: removeRegFee.toString(),
            tuition: (-totalPrice).toString(),
            totalamount: (removeRegFee - totalPrice).toString(),
            typeid: FAMILYBALANCE_TYPE_OTHER, // Otherfee
            statusid: FAMILYBALANCE_STATUS_PENDING,
            notes: "Admin delete whole class and corresponding registrations"
        } satisfies famBalanceInsert;

        await tx
            .insert(familybalance)
            .values(fbvalues);
    }
}


// TODO: Change based on new format
export async function deleteArrangement(classData: uiClasses, override: boolean) {
    return await db.transaction(async (tx) => {
        if (typeof classData.arrangeid !== "number" || isNaN(classData.arrangeid)) {
            throw new Error("Update data does not contain a valid arrange ID identifier");
        }

        // Check for existing registrations
        const registrations = await tx.query.classregistration.findMany({
            where: (cr, { and, eq }) => and(eq(cr.classid, classData.classid), eq(cr.seasonid, classData.seasonid))
        });

        if (registrations.length !== 0) {
            if (!override) {
                throw new Error("This class has existing registrations")
            }
            deleteAllRegistrations(tx, registrations, classData);
        }

        // Then delete the arrangement
        const deleted = await tx
            .delete(arrangement)
            .where(and(
                eq(arrangement.arrangeid, classData.arrangeid),
                eq(arrangement.seasonid, classData.seasonid)
            ))
            .returning();

        if (!deleted.length) {
            throw new Error("Failed to delete class arrangement");
        }

        return deleted[0];
    });
}