import { Extras, PKName, Table } from "../types";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { DefaultSession } from "next-auth";
import { InferInsertModel, getTableColumns } from "drizzle-orm";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";

export function makeInsertAction<T extends Table>(
    table: T,
    formSchema: z.ZodObject,
    primaryKey: PKName<T>,
    mainPath: string,
    createInsertExtras?: (user: DefaultSession["user"]) => Extras<T>,
) {
    type RowInsert = InferInsertModel<T>;

    return async function insertRow(formData: z.infer<typeof formSchema>): Promise<void> {
        "use server"
        const user = await requireRole(["ADMIN"]);
        const insertExtras = createInsertExtras ? createInsertExtras(user.user) : {};

        const data = formSchema.parse(formData) as RowInsert;

        const columns = getTableColumns(table) as Record<string, AnyPgColumn>;
        const pkCol = columns[String(primaryKey)];

        const [row] = await db
            .insert(table)
            .values({ ...data, ...insertExtras })
            .returning({ pk: pkCol });

        if (!row) throw new Error(`Insert failed for ${table._.name}`);
        revalidatePath(`${mainPath}/${row.pk}`);
    };
}