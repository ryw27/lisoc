"use server";
import { db } from "@/lib/db";
import { z } from "zod/v4";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { eq, getTableColumns } from "drizzle-orm";
import { getEntityConfig, type Registry } from "@/lib/data-view/registry";


export interface UpdateActionResult {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
}

export async function updateRow(
  entity: keyof Registry,
  formInput: FormData
): Promise<UpdateActionResult> {
	try {
		const user = await requireRole(["ADMIN"]);
		const { table, primaryKey, formSchema, makeUpdateExtras } = getEntityConfig(entity);
		const updateExtras = makeUpdateExtras ? makeUpdateExtras(user.user) : {};

		const rawObject = Object.fromEntries(formInput.entries());
		console.log(rawObject);

		const pkRaw = rawObject[primaryKey];
		if (pkRaw === undefined) {
			return { ok: false, message: "Missing identifier for update." };
		}

		const parsed = formSchema.safeParse(rawObject);
		if (!parsed.success) {
			const flat = z.flattenError(parsed.error);
			return {
				ok: false,
				message: "Validation failed. Please correct the highlighted fields.",
				fieldErrors: flat.fieldErrors as Record<string, string[]>,
				formErrors: flat.formErrors,
			};
		}

		const updateData = {
			...parsed.data,
			...updateExtras,
		};

		const columns = getTableColumns(table) as Record<string, AnyPgColumn>;
		const pkCol = columns[String(primaryKey)];

		const [row] = await db
			.update(table)
			.set(updateData)
			.where(eq(pkCol, pkRaw))
			.returning({ pk: pkCol });

		if (!row) {
			return { ok: false, message: "Update failed. Row not found." };
		}

		revalidatePath(`${ADMIN_DATAVIEW_LINK}/${row.pk as string | number}`);
		return { ok: true, message: "Updated successfully" };
	} catch (error) {
		console.error("updateRow error", error);
		const message = error instanceof Error ? error.message : "Server error. Please try again later.";
		return { ok: false, message, formErrors: [message] };
	}
}