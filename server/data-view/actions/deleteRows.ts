"use server";

import { revalidatePath } from "next/cache";
import { getTableColumns, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";
import { requireRole } from "@/server/auth/actions";
import { getEntityConfig, Registry } from "../registry";

export async function deleteRows(entity: keyof Registry, ids: number[]) {
    try {
        await requireRole(["ADMIN"]);
        if (!Array.isArray(ids) || ids.length === 0)
            throw new Error("Invalid 'ids' argument: must be a non-empty array.");

        const { table, primaryKey, tableName } = getEntityConfig(entity);
        const columns = getTableColumns(table);
        const pkCol = columns[primaryKey as keyof typeof columns];

        const result = await db.delete(table).where(inArray(pkCol, ids)).returning();

        if (result.length === 0) throw new Error(`Elements not found in ${tableName}`);
        revalidatePath(`${ADMIN_DATAVIEW_LINK}/${tableName}`);
        return { ok: true, data: result };
    } catch (error) {
        console.error(error);
        return {
            ok: false,
            message:
                error instanceof Error ? error.message : "Server error. Please try again later.",
        };
    }
}
