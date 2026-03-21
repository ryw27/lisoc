// src/app/actions.ts or inside the component file with "use server"
"use server";

import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { feelist } from "@/lib/db/schema";

export async function updateFeeAmount(id: number, newAmount: number) {
    try {
        await db
            .update(feelist)
            .set({ feeamount: String(newAmount) })
            .where(eq(feelist.feeid, id));
        revalidatePath("/"); // Revalidate the home path to show the updated data
        return { success: true };
    } catch (error) {
        console.error("Error updating fee amount:", error);
        return { success: false, error: "Failed to update fee amount" };
    }
}
