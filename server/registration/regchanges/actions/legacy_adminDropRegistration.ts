"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classregistration, familybalance } from "@/lib/db/schema";
import { toESTString } from "@/lib/utils";

export async function legacy_adminDropRegistration(regid: number, orgTuition: number) {
    await db.transaction(async (tx) => {
        const reg = await tx.query.classregistration.findFirst({
            where: (r, { eq }) => eq(r.regid, regid),
            with: {
                season: {},
            },
        });
        if (!reg) {
            throw new Error("Registration not found");
        }
        // 3 possibilities
        // 1. Delete the reg
        // 2. Drop out
        // 3. Refund
        // If after cancel deadline, drop out. If before, delete and refund
        const pastCancel = new Date(toESTString(new Date())) >= new Date(reg.season.canceldeadline);
        if (pastCancel) {
            await tx
                .update(classregistration)
                .set({
                    statusid: 4, // Dropout. Check validity of this
                    previousstatusid: reg.statusid,
                })
                .where(eq(classregistration.regid, regid));
            // No refund :(
        } else {
            await tx.delete(classregistration).where(eq(classregistration.regid, regid));
            const orgBalance = await tx.query.familybalance.findFirst({
                where: (fb, { and, eq }) =>
                    and(eq(fb.familyid, reg.familyid), eq(fb.seasonid, reg.seasonid)),
            });
            // Paranoia
            if (!orgBalance) {
                throw new Error(
                    "Original family balance corresponding to this registration was not found"
                );
            }

            await tx
                .update(familybalance)
                .set({
                    tuition: (Number(orgBalance.tuition) - orgTuition).toString(),
                    totalamount: (Number(orgBalance.totalamount) - orgTuition).toString(),
                })
                .where(
                    and(
                        eq(familybalance.familyid, reg.familyid),
                        eq(familybalance.seasonid, reg.seasonid)
                    )
                );
        }
        revalidatePath("/admin/management/semester");
        revalidatePath("/dashboard/classes");
    });
}
