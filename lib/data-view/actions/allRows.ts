import { db } from "@/lib/db";
import { InferSelectModel } from "drizzle-orm";
import { getEntityConfig, Registry } from "../registry";
import { Table } from "../types";
import { requireRole } from "@/lib/auth";


export async function allRows(entity: keyof Registry): Promise<InferSelectModel<Table>[]> {
    await requireRole(["ADMIN"]);
    const { table, tableName } = getEntityConfig(entity);
    const rows = await db
        .select()
        .from(table)

    if (!rows) throw new Error(`No rows found in ${tableName}`);

    return rows as InferSelectModel<typeof table>[];
}