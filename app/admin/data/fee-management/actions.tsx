// src/app/actions.ts or inside the component file with "use server"
"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { feelist } from "@/lib/db/schema";
import { requireRole } from "@/server/auth/actions";

export async function updateFeeAmount(id: number, newAmount: number) {
    try {
        await requireRole(["ADMIN"], { redirect: false });

        await db
            .update(feelist)
            .set({ feeamount: String(newAmount) })
            .where(eq(feelist.feeid, id));
        revalidatePath("/admin/data/fee-management");
        return { success: true };
    } catch (error) {
        console.error("Error updating fee amount:", error);
        return { success: false, error: "Failed to update fee amount" };
    }
}
