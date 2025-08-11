"use server";
import { db } from "@/lib/db";
import { z } from "zod/v4";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";
import { classes } from "@/lib/db/schema";
import { getEntityConfig, Registry } from "@/lib/data-view/registry";
import { eq, InferInsertModel } from "drizzle-orm";

export interface ActionResult {
    ok: boolean;
    message: string;
    id?: string | number;
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
}

export async function insertRow(
    entity: keyof Registry,
    formInput: FormData
) : Promise<ActionResult> {
    try {
        const user = await requireRole(["ADMIN"]);
        const { table, primaryKey, formSchema, makeInsertExtras } = getEntityConfig(entity);
        const insertExtras = makeInsertExtras ? makeInsertExtras(user.user) : {};

        const rawObject = Object.fromEntries(formInput.entries());
        const parsed = formSchema.safeParse(rawObject);
        if (!parsed.success) {
            const flat = z.flattenError(parsed.error);
            return {
                ok: false,
                message: "Validation failed. Please correct the highlighted fields.",
                fieldErrors: flat.fieldErrors as Record<string, string[]>,
                formErrors: flat.formErrors,
            };
        }

        const insertData = {
            ...(parsed.data),
            ...insertExtras
        } as InferInsertModel<typeof table>;

        const [row] = await db
            // drizzle generic table typing is too strict here; runtime is correct
            // @ts-ignore
            .insert(table)
            .values(insertData)
            .returning();

        if (!row) {
            console.error(`Insert failed for ${table._.name} with row ${row}`);
            return { ok: false, message: "Unknown database error occurred" };
        }

        // Exception placed for self referential columns, only for classes
        const itself = primaryKey === "classid";
        if (itself && primaryKey === "classid") {
            await db
                .update(classes)
                .set({
                    // @ts-ignore
                    gradeclassid: (row as any).classid,
                })
                // @ts-ignore
                .where(eq(classes.classid, (row as any).classid));
        }

        // @ts-ignore
        const id = (row as any)[primaryKey];

        revalidatePath(`${ADMIN_DATAVIEW_LINK}/${id ?? ''}`);

        return {
            ok: true,
            message: "Created successfully",
            id,
        };
    } catch (error) {
        console.error("insertRow error", error);
        const message = error instanceof Error ? error.message : "Server error. Please try again later.";
        return { ok: false, message, formErrors: [message] };
    }
}