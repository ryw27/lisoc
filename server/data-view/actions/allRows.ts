import { InferSelectModel } from "drizzle-orm";
import { db } from "@/lib/db";
import { Table } from "@/types/dataview.types";
import { requireRole } from "@/server/auth/actions";
import { getEntityConfig, Registry } from "../registry";

export async function allRows(entity: keyof Registry): Promise<InferSelectModel<Table>[]> {
    await requireRole(["ADMIN"]);
    const { table, tableName } = getEntityConfig(entity);
    const rows = await db.select().from(table);

    if (!rows) throw new Error(`No rows found in ${tableName}`);

    return rows as InferSelectModel<typeof table>[];
}
