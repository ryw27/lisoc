import { db } from "@/lib/db";
import { Table } from "@/lib/data-view/types";
import { InferSelectModel } from "drizzle-orm";
import { AnyPgTable } from "drizzle-orm/pg-core";

export default async function allRows<T extends Table>(table: T): Promise<InferSelectModel<T>[]> {
    const rows = await db
        .select()
        .from(table as AnyPgTable)

    if (!rows) throw new Error(`No rows found in ${table._.name}`);

    return rows as InferSelectModel<T>[];
}