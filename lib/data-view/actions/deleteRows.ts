import { PKName, PKVal, Table } from "../types";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getTableColumns, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

export function makeDeleteRows<T extends Table>(
    table: T,
    primaryKey: PKName<T>,
    deleteSchema: z.ZodObject,
    mainPath: string,
) {
    const columns = getTableColumns(table) as Record<string, AnyPgColumn>;
    const pkCol = columns[String(primaryKey)];

    // All delete schemas are of the form pkname: z.array(something). So to access the actual elements, you need to do ids[pkname] or ids.pkname

    return async function deleteRows(ids: z.infer<typeof deleteSchema>): Promise<InferSelectModel<T>[]> {
        "use server";
        await requireRole(["ADMIN"]);
        const result = await db
            .delete(table)
            .where(inArray(pkCol, ids[primaryKey] as PKVal<T>[]))
            .returning();
        if (result.length === 0) throw new Error(`Elements not found in ${table._.name}`);
        revalidatePath(mainPath);
        return result as InferSelectModel<T>[];
    };
}