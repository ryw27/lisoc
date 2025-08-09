"use server";
import { PKName, PKVal, Table } from "../types";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getTableColumns, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";

// export function makeDeleteRows<T extends Table>(
//     table: T,
//     primaryKey: PKName<T>,
//     deleteSchema: z.ZodObject,
//     mainPath: string,
// ) {
//     // All delete schemas are of the form pkname: z.array(something). So to access the actual elements, you need to do ids[pkname] or ids.pkname

//     return async function deleteRows(ids: z.infer<typeof deleteSchema>): Promise<InferSelectModel<T>[]> {
//         "use server";
//         await requireRole(["ADMIN"]);
//         // Resolve columns at call time to avoid capturing complex Drizzle objects in the closure
//         const columns = getTableColumns(table) as Record<string, AnyPgColumn>;
//         const pkCol = columns[String(primaryKey)];
//         const result = await db
//             .delete(table)
//             .where(inArray(pkCol, ids[primaryKey] as PKVal<T>[]))
//             .returning();
//         if (result.length === 0) throw new Error(`Elements not found in ${table._.name}`);
//         revalidatePath(mainPath);
//         return result as InferSelectModel<T>[];
//     };
// }

export async function deleteRows<T extends Table>(
    table: T,
    primaryKey: PKName<T>,
    ids: PKVal<T>[],
    // mainPath: string
) {
    await requireRole(["ADMIN"]);

    if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error("Invalid 'ids' argument: must be a non-empty array.");
    }

    if (!ids.every(id => typeof id === "string" || typeof id === "number")) {
        throw new Error("Invalid 'ids' argument: all items must be string or number primary key values.");
    }

	const columns = getTableColumns(table);
	const pkCol = columns[primaryKey];

    const result = await db
        .delete(table)
        .where(inArray(pkCol as AnyPgColumn, ids))
        .returning()

    if (result.length === 0) throw new Error(`Elements not found in ${table._.name}`);
    revalidatePath(`${ADMIN_DATAVIEW_LINK}/${table._.name}`);
    return result;

}