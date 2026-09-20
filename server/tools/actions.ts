"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import {
    classregistration,
    familybalance,
    familybalanceSave,
    registrationSave,
} from "@/lib/db/schema";
import { requireRole } from "@/server/auth/actions";

const saveidSchema = z.number().int().positive();

const TOOLS_PATH = "/admin/other/tools";

/**
 * Admin-only: move an archived classregistration row (registration_save) back to
 * classregistration and drop it from the recycle bin, in one transaction.
 * regid is GENERATED ALWAYS AS IDENTITY, so the insert overrides the system value.
 */
export async function restoreRegistration(saveid: number) {
    await requireRole(["ADMIN"], { redirect: false });
    const id = saveidSchema.parse(saveid);

    const familyid = await db.transaction(async (tx) => {
        const saved = await tx.query.registrationSave.findFirst({
            where: (rs, { eq }) => eq(rs.saveid, id),
        });
        if (!saved) {
            throw new Error("Archived registration not found");
        }

        const existing = await tx.query.classregistration.findFirst({
            where: (cr, { eq }) => eq(cr.regid, saved.regid),
            columns: { regid: true },
        });
        if (existing) {
            throw new Error(`Registration ${saved.regid} already exists in classregistration`);
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { saveid: _saveid, deletedon: _deletedon, deletedby: _deletedby, ...row } = saved;
        await tx.insert(classregistration).overridingSystemValue().values(row);
        await tx.delete(registrationSave).where(eq(registrationSave.saveid, id));
        return saved.familyid;
    });

    revalidatePath(TOOLS_PATH);
    revalidatePath(`/admin/management/${familyid}`);
}

/**
 * Admin-only: move an archived familybalance row (familybalance_save) back to
 * familybalance and drop it from the recycle bin, in one transaction.
 */
export async function restoreBalance(saveid: number) {
    await requireRole(["ADMIN"], { redirect: false });
    const id = saveidSchema.parse(saveid);

    const familyid = await db.transaction(async (tx) => {
        const saved = await tx.query.familybalanceSave.findFirst({
            where: (fs, { eq }) => eq(fs.saveid, id),
        });
        if (!saved) {
            throw new Error("Archived balance not found");
        }

        const existing = await tx.query.familybalance.findFirst({
            where: (fb, { eq }) => eq(fb.balanceid, saved.balanceid),
            columns: { balanceid: true },
        });
        if (existing) {
            throw new Error(`Balance ${saved.balanceid} already exists in familybalance`);
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { saveid: _saveid, deletedon: _deletedon, deletedby: _deletedby, ...row } = saved;
        await tx.insert(familybalance).overridingSystemValue().values(row);
        await tx.delete(familybalanceSave).where(eq(familybalanceSave.saveid, id));
        return saved.familyid;
    });

    revalidatePath(TOOLS_PATH);
    revalidatePath(`/admin/management/${familyid}`);
}

/**
 * Admin-only: permanently delete an archived registration from the recycle bin.
 * This is the final delete - the row is gone for good afterwards.
 */
export async function purgeRegistration(saveid: number) {
    await requireRole(["ADMIN"], { redirect: false });
    const id = saveidSchema.parse(saveid);

    const deleted = await db
        .delete(registrationSave)
        .where(eq(registrationSave.saveid, id))
        .returning({ saveid: registrationSave.saveid });
    if (deleted.length === 0) {
        throw new Error("Archived registration not found");
    }

    revalidatePath(TOOLS_PATH);
}

/**
 * Admin-only: permanently delete an archived balance from the recycle bin.
 */
export async function purgeBalance(saveid: number) {
    await requireRole(["ADMIN"], { redirect: false });
    const id = saveidSchema.parse(saveid);

    const deleted = await db
        .delete(familybalanceSave)
        .where(eq(familybalanceSave.saveid, id))
        .returning({ saveid: familybalanceSave.saveid });
    if (deleted.length === 0) {
        throw new Error("Archived balance not found");
    }

    revalidatePath(TOOLS_PATH);
}
