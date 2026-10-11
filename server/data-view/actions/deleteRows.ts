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
        return { ok: false, message: deleteErrorMessage(error) };
    }
}

// Drizzle wraps the pg error as `cause`. A foreign-key violation (23503) means other
// records still point at the row; say which table instead of dumping the failed SQL.
function deleteErrorMessage(error: unknown) {
    const pgError = (error instanceof Error ? error.cause : undefined) as
        | { code?: string; table?: string }
        | undefined;
    if (pgError?.code === "23503") {
        const usedBy = pgError.table ? ` in "${pgError.table}"` : "";
        return `Cannot delete: still used by other records${usedBy}. Remove or reassign those first. / 无法删除：仍被其他记录引用${usedBy}，请先删除或重新分配这些记录。`;
    }
    return error instanceof Error ? error.message : "Server error. Please try again later.";
}
