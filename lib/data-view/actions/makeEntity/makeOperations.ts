import { SQL, asc, desc, getTableColumns, eq, and, ne, inArray, sql, InferSelectModel, InferInsertModel } from "drizzle-orm";
import { AnyPgTable, AnyPgColumn } from "drizzle-orm/pg-core";
import { 
    Table, 
    PKName, 
    uniqueCheckFields, 
    Extras, 
    PKVal, 
    parsedParams, 
    enrichFields,
} from "../../types";
import { z } from "zod";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { buildSQL } from "../../helpers";
import { ZodSchema } from "zod";
import * as schema from "@/lib/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { ZodError } from "zod";
import { Transaction } from "@/lib/registration/helpers";

export async function uniqueCheck<T extends Table, FormSchema extends ZodSchema>(
	table: T,
	entity_name: string,
	itemToCheck: z.infer<FormSchema>, // ✅ Fixed: Use inferred type, not ZodSchema
	tx: Transaction,
	uniqueConstraints: uniqueCheckFields<T, FormSchema>[],
	// Included if updating
	PKCol?: AnyPgColumn, // Type safe from driver function
	exclude?: PKVal<T> // Exclude the row itself for updating
): Promise<void> {
	let chainedQueries: SQL<unknown> | undefined;
	const columns = getTableColumns(table as AnyPgTable);
	
	for (const constraint of uniqueConstraints) {
		if (constraint.formCol) {
			// EX: Check if this class (by name) exists already
			const colVal = itemToCheck[constraint.formCol];
			if (colVal === undefined) {
				continue;
			}	
			const condition = eq(columns[constraint.tableCol], colVal);
			chainedQueries = chainedQueries ? and(chainedQueries, condition) : condition;
		} else if (constraint.wantedValue) {
			// EX: Only check active classes
			const condition = eq(columns[constraint.tableCol], constraint.wantedValue);
			chainedQueries = chainedQueries ? and(chainedQueries, condition) : condition;
		}	
	}

	if (!chainedQueries) {
		return; // No constraints to check
	}

	// If updating, must exclude the ID itself
	if (exclude !== undefined && PKCol !== undefined) {
		chainedQueries = and(chainedQueries, ne(PKCol, exclude));
	}

	const exists = await tx
		.select()
		.from(table as AnyPgTable)
		.where(chainedQueries)
		.limit(1);

	if (exists.length > 0) {
		throw new Error(`${entity_name} already exists`);
	}
}


// Form names for matching fields in field and actual schema for a table should be different. They should make sense to a reader
export async function enrich<FormSchema extends ZodSchema>(
	parsed: z.infer<FormSchema>,
	tx: Transaction,
	enrichFields: enrichFields<FormSchema>[] // Information should be in the foreign key table
): Promise<Partial<Record<string, string | number | boolean | null | undefined>>> {
	const enriched: Record<string, string | number | boolean | null | undefined> = {}
	
	for (const field of enrichFields) {
		const { formField, lookupTable, lookupField, returnField } = field;
		const formValue = parsed[formField];
		
		// Get the actual table object from schema using the table name
		const anyTable = schema[lookupTable] as AnyPgTable;
		const columns = getTableColumns(anyTable);
		
		// Get the specific column objects for type-safe querying
		const searchColumn = columns[lookupField] as AnyPgColumn;
		const returnColumn = columns[returnField] as AnyPgColumn;
		
		// Execute the query properly
		const [lookupResult] = await tx
			.select({ result: returnColumn })
			.from(anyTable)
			.where(eq(searchColumn, formValue))
			.limit(1);

		if (!lookupResult) {
			throw new Error(`No matching ${lookupTable} found for ${String(formField)}=${formValue}`);
		}

		// Store the result using the return field name as key
		enriched[formField as string] = (lookupResult.result as string | number | boolean | null | undefined);
	}

	return enriched;
}

export function makeOperations<
	T extends Table,
	FormSchema extends ZodSchema
>(
	table: T,
	primaryKey: PKName<T>,
	formSchema: FormSchema,
	mainPath: string,
	enrichFields: enrichFields<FormSchema>[],// Enrichment fields configuration
	uniqueConstraints?: uniqueCheckFields<T, FormSchema>[], // Unique constraint checks
	insertExtras?: Extras<T>,
	updateExtras?: Extras<T>
) {
	type RowSelect = InferSelectModel<T>;
	type RowInsert = InferInsertModel<T>;

	// type PK = PKName<N, T>;
	type ID = PKVal<T>;

	// Must do to satisfy drizzle since N is a union type which drizzle complains about
	// Strict type checking on parameters means it's not a big deal, we already know the table and prim key at this point is fine
	const anyTable = table as AnyPgTable;
	const columns = getTableColumns(anyTable);
	const pkCol = columns[primaryKey as string] as AnyPgColumn;

	// Check if need to add updatedBy and createdBy fields
	const hasCreateBy = "createby" in columns;
	const hasUpdateBy = "updateby" in columns;

	return {
		async allRows(): Promise<RowSelect[]> {
			// Have to do type assertions unfortunately
			return db.select().from(anyTable) as unknown as RowSelect[];
		},
		async idRow(id: ID): Promise<RowSelect> {
			const [row] = (await db
				.select()
				.from(anyTable)
				.where(eq(pkCol, id))
				.limit(1)
			) as unknown as RowSelect[];

			if (!row) throw new Error(`ID ${id} not found in ${table.name}`);
			return row;
		},
		async pageRows(opts: parsedParams) {
			// Take parsed params type from handle-params.ts
			// Build SQL query with helper function
			const where = opts.query ? buildSQL(table, opts.query, opts.match) : undefined;

			const columns = getTableColumns(table as AnyPgTable);
			// Process sort by and sort order
			const sortbycolumn = opts.sortBy ? columns[opts.sortBy] : undefined;
			const orderByClause = sortbycolumn
				? (opts.sortOrder === 'asc' ? asc(sortbycolumn) : desc(sortbycolumn))
				: undefined;

			// Build drizzle query, don't execute yet
			const baseQuery = db
				.select()
				.from(table as AnyPgTable) // Type assertion to satisfy drizzle
				.where(where);

			// Add sorting if necessary as well as pagesize and page and execute
			const result = await (
				orderByClause
					? baseQuery.orderBy(orderByClause)
					: baseQuery
				)
				.limit(opts.pageSize)
				.offset((opts.page - 1) * opts.pageSize);

			// Obtain total count of rows in this table
			// TODO: ADD CACHING TO PREVENT REPEATS
			const [{ count }] = await db
				.select({ count: sql<number>`count(*)`})
				.from(table as AnyPgTable)
				.where(where);

			return {
				rows: result as unknown as RowSelect[],
				totalCount: count,
			};
		},
		async insertRow(formData: FormData): Promise<void> {
			// TODO: Add auth check
			const user = "testuser";
			const insertSchema = createInsertSchema(table);

			let insertedPk: PKVal<T>;
			
			try {
				insertedPk = await db.transaction(async tx => {
					const form = formSchema.parse(Object.fromEntries(formData));
					// Check unique constraints if provided
					if (uniqueConstraints && uniqueConstraints.length > 0) {
						await uniqueCheck(table, table.name, form, tx, uniqueConstraints);
					}

					// Enrich form data with foreign key lookups
					const enrichedForm = await enrich(form, tx, enrichFields);
					
					// Add user tracking fields
					const userInfo = hasCreateBy 
						? (hasUpdateBy ? {createby: user, updateby: user} : {createby: user}) 
						: {};
					
					// Combine all data
					const fullData: Partial<RowInsert> = {
						...form, 
						...enrichedForm,
						...(insertExtras ?? {}),
						...userInfo
					};

					// Validate against table schema
					// I don't think this should create problems with serial ID's
					const insertItem = insertSchema.parse(fullData);

					// Insert and return
					const [inserted] = await tx.insert(anyTable).values(insertItem).returning();
					return inserted[primaryKey as keyof typeof inserted] as PKVal<T>;
				});
			} catch (error) {
				console.error(error);
				const msg = error instanceof ZodError
					? error.errors[0].message
					: error instanceof Error
						? error.message
						: "Unknown error occurred";
				redirect(`${mainPath}/add?error=${encodeURIComponent(msg)}`);
			}

			revalidatePath(`${mainPath}/${insertedPk}`);
			redirect(mainPath);

		},
		async deleteRows(ids: ID[]): Promise<RowSelect[]> {
			// TODO: Add auth check
			const result = await db.delete(anyTable).where(inArray(pkCol, ids)).returning();
			if (result.length === 0) throw new Error(`Elements not found in ${table.name}`);
			revalidatePath(mainPath);
			return result as unknown as RowSelect[];
		}, 
		async updateRow(id: ID, formData: FormData): Promise<void> {
			// TODO: Add auth check
			const user = "testuser";
			const updateSchema = createUpdateSchema(table);

			let updatedPk: PKVal<T>;
			
			try {
				updatedPk = await db.transaction(async tx => {
					const form = formSchema.parse(Object.fromEntries(formData));
					// Check unique constraints if provided (excluding current record)
					if (uniqueConstraints && uniqueConstraints.length > 0) {
						await uniqueCheck(table, table.name, form, tx, uniqueConstraints, pkCol, id);
					}
					// Enrich form data with foreign key lookups
					const enrichedForm = await enrich(form, tx, enrichFields);

					// Add user tracking fields
					const userInfo = hasUpdateBy ? {updateby: user} : {};

					// Combine all data
					const fullData: Partial<RowInsert> = {
						...form,
						...enrichedForm,
						...(updateExtras ?? {}),
						...userInfo
					};

					// Validate against table schema
					const updateItem = updateSchema.parse(fullData);

					// Update and return
					const [updated] = await tx
						.update(anyTable)
						.set(updateItem)
						.where(eq(pkCol, id))
						.returning();
					
					if (!updated) throw new Error(`Failed to update ${table.name} with ID ${id}`);

					return updated[primaryKey as keyof typeof updated] as PKVal<T>;
				});
			} catch (error) {
				console.error(error);
				const msg = 
					error instanceof ZodError
						? error.errors[0].message
						: error instanceof Error
							? error.message
							: "Unknown error occurred";
				redirect(`${mainPath}/${id}/edit?error=${encodeURIComponent(msg)}`);
			}	

			revalidatePath(`${mainPath}/${updatedPk}`);
			redirect(mainPath);
		}
	}
}


