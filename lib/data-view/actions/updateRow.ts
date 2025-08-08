import { Extras, PKName, PKVal, Table } from "../types";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { DefaultSession } from "next-auth";
import { eq, InferInsertModel, getTableColumns } from "drizzle-orm";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";

export function makeUpdateRow<T extends Table>(
    table: T,
    formSchema: z.ZodObject,
    primaryKey: PKName<T>,
    mainPath: string,
    createUpdateExtras?: (user: DefaultSession["user"]) => Extras<T>,
) {
    type RowInsert = InferInsertModel<T>;

    const columns = getTableColumns(table) as Record<string, AnyPgColumn>;
    const pkCol = columns[String(primaryKey)];

    return async function updateRow(id: PKVal<T>, formData: z.infer<typeof formSchema>): Promise<void> {
		"use server";
		const user = await requireRole(["ADMIN"]);
		const updateExtras = createUpdateExtras ? createUpdateExtras(user.user) : {};

		const data = formSchema.parse(formData) as Partial<RowInsert>;

		const fullData = { ...data, ...updateExtras } as Partial<RowInsert>;

		const [row] = await db
			.update(table)
			// eslint-disable-next-line
			.set(fullData as any)
			.where(eq(pkCol, id))
			.returning({ pk: pkCol });

		if (!row) throw new Error(`Elements not found in ${table._.name}`);
		revalidatePath(`${mainPath}/${row.pk}`);
    };
}