"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { classregistration, registrationSave } from "@/lib/db/schema";
import { requireRole } from "@/server/auth/actions";

const regidSchema = z.number().int().positive();

/**
 * Admin-only hard delete of a classregistration row from the family
 * management page. The row is copied to registration_save first (same
 * transaction) so a mistaken delete can be restored manually.
 */
export async function removeRegistration(regid: number) {
    const session = await requireRole(["ADMIN"], { redirect: false });
    const id = regidSchema.parse(regid);
    const deletedby = session.user.email || session.user.id;

    const familyid = await db.transaction(async (tx) => {
        const oldReg = await tx.query.classregistration.findFirst({
            where: (cr, { eq }) => eq(cr.regid, id),
        });
        if (!oldReg) {
            throw new Error("Registration not found");
        }

        await tx.insert(registrationSave).values({ ...oldReg, deletedby });
        await tx.delete(classregistration).where(eq(classregistration.regid, id));
        return oldReg.familyid;
    });

    revalidatePath(`/admin/management/${familyid}`);
}
