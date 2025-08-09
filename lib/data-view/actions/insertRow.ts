"use server";
import { Extras, PKName, Table } from "../types";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { DefaultSession } from "next-auth";
import { InferInsertModel } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";

// export function makeInsertAction<T extends Table>(
//     table: T,
//     formSchema: z.ZodObject,
//     primaryKey: PKName<T>,
//     mainPath: string,
//     createInsertExtras?: (user: DefaultSession["user"]) => Extras<T>,
// ) {
//     type RowInsert = InferInsertModel<T>;

//     return async function insertRow(formData: z.infer<typeof formSchema>): Promise<void> {
//         "use server"
//         const user = await requireRole(["ADMIN"]);
//         const insertExtras = createInsertExtras ? createInsertExtras(user.user) : {};

//         const data = formSchema.parse(formData) as RowInsert;

//         const columns = getTableColumns(table) as Record<string, AnyPgColumn>;
//         const pkCol = columns[String(primaryKey)];

//         const [row] = await db
//             .insert(table)
//             .values({ ...data, ...insertExtras })
//             .returning({ pk: pkCol });

//         if (!row) throw new Error(`Insert failed for ${table._.name}`);
//         revalidatePath(`${mainPath}/${row.pk}`);
//     };
// }

export async function insertRow<T extends Table, FormSchema extends z.ZodObject>(
    table: T,
    primaryKey: PKName<T>,
    data: z.infer<FormSchema>, 
    formSchema: FormSchema,
    createInsertExtras?: (user: DefaultSession["user"]) => Extras<T>
) {
    const user = await requireRole(["ADMIN"]);
    const insertExtras = createInsertExtras ? createInsertExtras(user.user) : {};

    const parsedData = formSchema.safeParse(data);
    if (parsedData.error) {
        return { ok: false, message: z.flattenError(parsedData.error)}
    }

    const insertData = {
        ...parsedData,
        ...insertExtras
    } as InferInsertModel<T>;

    const [row] = await db
        .insert(table)
        .values(insertData)
        .returning()

    if (!row) {
        console.error(`Insert failed for ${table._.name} with row ${row}`);
        return { ok: false, message: "Unknown database error occured" }
    }

    revalidatePath(`${ADMIN_DATAVIEW_LINK}/${row[primaryKey as keyof typeof row]}`);
}