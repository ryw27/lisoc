"use server";
import { Extras, PKName, PKVal, Table } from "../types";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { DefaultSession } from "next-auth";
import { eq, getTableColumns, InferInsertModel, InferSelectModel } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";
import { AnyPgColumn } from "drizzle-orm/pg-core";

// export function makeUpdateRow<T extends Table>(

//     table: T,
//     formSchema: z.ZodObject,
//     primaryKey: PKName<T>,
//     mainPath: string,
//     createUpdateExtras?: (user: DefaultSession["user"]) => Extras<T>,
// ) {
//     type RowInsert = InferInsertModel<T>;

//     return async function updateRow(id: PKVal<T>, formData: z.infer<typeof formSchema>): Promise<void> {
// 		"use server";
// 		const user = await requireRole(["ADMIN"]);
// 		const updateExtras = createUpdateExtras ? createUpdateExtras(user.user) : {};

// 		const data = formSchema.parse(formData) as Partial<RowInsert>;

// 		const fullData = { ...data, ...updateExtras } as Partial<RowInsert>;

// 		// Resolve columns at call time to avoid capturing complex Drizzle objects in the closure
// 		const columns = getTableColumns(table) as Record<string, AnyPgColumn>;
// 		const pkCol = columns[String(primaryKey)];

// 		const [row] = await db
// 			.update(table)
// 			// eslint-disable-next-line
// 			.set(fullData as any)
// 			.where(eq(pkCol, id))
// 			.returning({ pk: pkCol });

// 		if (!row) throw new Error(`Elements not found in ${table._.name}`);
// 		revalidatePath(`${mainPath}/${row.pk}`);
//     };
// }

export async function updateRow<T extends Table, FormSchema extends z.ZodObject>(
    table: T,
    primaryKey: PKName<T>,
	idUpdated: PKVal<T>,
    data: z.infer<FormSchema>, 
    formSchema: FormSchema,
    createUpdateExtras?: (user: DefaultSession["user"]) => Extras<T>
) {
    const user = await requireRole(["ADMIN"]);
    const updateExtras = createUpdateExtras ? createUpdateExtras(user.user) : {};

    const parsedData = formSchema.parse(data);

    // const columns = getTableColumns(table) as Record<string, AnyPgColumn>;

    const updateData = {
        ...parsedData,
        ...updateExtras
    } as Partial<InferInsertModel<T>>

	const columns = getTableColumns(table);
	const pkCol = columns[primaryKey];

	const result = await db	
		.update(table)
		// @ts-ignore No clue how to solve this one
		.set(updateData)
		.where(eq(pkCol as AnyPgColumn, idUpdated))
		.returning()


    const newrow = result as InferSelectModel<T>;
    const pkValue = newrow[primaryKey];
    revalidatePath(`${ADMIN_DATAVIEW_LINK}/${pkValue}`);
}