"use server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getTableColumns, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";
import { getEntityConfig, Registry } from "../registry";


export async function deleteRows(
    entity: keyof Registry,
    ids: number[],
) {
    try {
        await requireRole(["ADMIN"]);
        if (!Array.isArray(ids) || ids.length === 0) throw new Error("Invalid 'ids' argument: must be a non-empty array.");

        const { table, primaryKey } = getEntityConfig(entity);
        const columns = getTableColumns(table);
        const pkCol = columns[primaryKey as keyof typeof columns];

        const result = await db
            .delete(table)
            .where(inArray(pkCol, ids))
            .returning()

        if (result.length === 0) throw new Error(`Elements not found in ${table._.name}`);
        revalidatePath(`${ADMIN_DATAVIEW_LINK}/${table._.name}`);
        return { ok: true, data: result };
    } catch (error) {
        console.error(error);
        return { ok: false, message: error instanceof Error ? error.message : "Server error. Please try again later." };
    }
}
