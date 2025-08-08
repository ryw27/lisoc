"use server";
import { safeAction } from "@/lib/safeAction";
import { Extras, PKName, Table } from "../types";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { DefaultSession } from "next-auth";
import { InferInsertModel } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function makeInsertAction<T extends Table>(
    table: T, 
    formSchema: z.ZodAny, 
    primaryKey: PKName<T>,
    mainPath: string,
    createInsertExtras?: (user: DefaultSession["user"]) => Extras<T>,
) {
    type RowInsert = InferInsertModel<T>;

    const user = await requireRole(["ADMIN"]);
    let insertExtras = {}
    if (createInsertExtras) {
        insertExtras = createInsertExtras(user.user);
    }

    return safeAction(
        formSchema,
        async function(data: z.infer<typeof formSchema>) {
            const insertedPK = await db.transaction(async (tx) => {
                const fullData: RowInsert = {
                    ...data,
                    ...insertExtras
                }

                const [insertedRow] = await tx
                    .insert(table)
                    .values(fullData)
                    .returning()
                return insertedRow[primaryKey as keyof typeof insertedRow]
            })
            revalidatePath(`${mainPath}/${insertedPK}`)
        }
    )
}