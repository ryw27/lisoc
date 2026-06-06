"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { regchangerequest } from "@/lib/db/schema";
import { requireFamily } from "@/server/auth/actions";

// Family request undo , just remove request  if it is alreayd deleted will do noting result revalidate.
export async function familyRequestUndo(regid: number, familyid: number) {
    const { family: userFamily } = await requireFamily();
    if (userFamily.familyid !== familyid) {
        throw new Error("Forbidden");
    }
    await db.transaction(async (tx) => {
        await tx
            .delete(regchangerequest)
            .where(and(eq(regchangerequest.regid, regid), eq(regchangerequest.familyid, familyid)));

        revalidatePath("/dashboard/register");
    });
}
