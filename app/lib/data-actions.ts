import { AnyPgColumn, AnyPgTable, ForeignKeyBuilder, PgTransaction } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel, eq, gt, lt, lte, gte, and, or, getTableColumns, inArray, sql, desc, asc, SQL } from "drizzle-orm";
import { db } from "./db";
import * as schema from "./db/schema";
import { formatISO } from "date-fns";
import { z, ZodError, ZodSchema } from "zod";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ParsedFilter } from "./handle-params";
import { Table, TableName, ColKey, ColVal, PKVal, PKName, FKCol, FKVal } from "./entity-types";
import { primKeyMap } from './entity-types';
import { parsedParams } from './handle-params';

// ------------------------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------------------------

export function buildSQL<N extends TableName, T extends Table<N>>(table: T, filters: ParsedFilter[], match: string): SQL<unknown> | undefined {
    const columns = getTableColumns(table as AnyPgTable); // For compile-time type checking
    const conds = filters.map(filter => {
        if (!(filter.field in columns) && filter.field != "match") throw new Error(`Unknown filter field ${filter.field}`);
        const col = columns[filter.field as keyof typeof columns] as AnyPgColumn;
        const value = filter.value instanceof Date ? formatISO(filter.value) : filter.value;
        switch(filter.op) {
            case 'eq': return eq(col, value)
            case 'lt': return lt(col, value)
            case 'gt': return gt(col, value)
            case 'lte': return lte(col, value)
            case 'gte': return gte(col, value)
        }
    }).filter(Boolean); // Filter out any undefined conditions

    if (conds.length === 0) return undefined;
    return match === "all" ? and(...conds) : or(...conds);
}

export type Extras<N extends TableName> = {[K in ColKey<N>]?: ColVal<N,K>};

export type uniqueCheckFields<N extends TableName, FormSchema extends ZodSchema> = {
	tableCol: ColKey<N>;
	formVal: keyof FormSchema;
}

export type enrichFields<N extends TableName, FormSchema extends ZodSchema> = {
	[FK in FKCol<N>]?: {
		formFields: keyof z.infer<FormSchema>;
		lookupTable: TableName;
		lookupField: ColKey<N>;
		returnField: string;
	}
}

// ------------------------------------------------------------------------------------------------
// Create CRUD operations for an entity
// -------------------------------------------------------------------------------------------------


export async function uniqueCheck<N extends TableName, T extends Table<N>, FormSchema extends ZodSchema>(
	table: T,
	entity_name: string,
	parsed: z.infer<FormSchema>,
	tx: PgTransaction<any, typeof schema, any>,
	uniqueConstraints: uniqueCheckFields<N, FormSchema>[]
): Promise<void> {
	// TODO: Implement
	let chainedQueries: SQL<unknown> | undefined;
	const columns = getTableColumns(table as AnyPgTable);
	for (const constraint of uniqueConstraints) {
		const condition = eq(columns[constraint.tableCol], parsed[constraint.formVal]);
		chainedQueries = chainedQueries ? and(chainedQueries, condition) : condition;
	}

	const exists = await tx
		.select()
		.from(table as AnyPgTable)
		.where(chainedQueries)
		.limit(1);

	if (exists.length) {
		throw new Error(`${entity_name} already exists`);
	}
}

export async function enrich<N extends TableName, T extends Table<N>, FormSchema extends ZodSchema>(
	tableName: N,
	table: T,
	parsed: z.infer<FormSchema>,
	tx: PgTransaction<any, typeof schema, any>,
	enrichFields: enrichFields<N, FormSchema>[]
): Promise<Omit<InferInsertModel<T>, keyof z.infer<FormSchema> | 'createby' | 'updateby' | 'createon' | 'updateon' | 'lastmodify'>> {
	// TODO: Implement
	// You want to change a bunch of form elements to their actual internal representation in the
	return parsed;
}

export function makeOperations<
	N extends TableName,
	T extends Table<N>,
	FormSchema extends ZodSchema
>(
	tableName: N,
	table: T,
	formSchema: FormSchema,
	revalidatePath: string,
	enrich: ( // Changes form elements to match the actual schema, i.e. classupid should be inputted as a classname, but changed to ID
		parsed: z.infer<FormSchema>,
		tx: PgTransaction<any, typeof schema, any>,
	) => Promise<Omit<InferInsertModel<T>, keyof z.infer<FormSchema> | 'createby' | 'updateby' | 'createon' | 'updateon' | 'lastmodify'>>, 
	uniqueCheck?: ( // Check before inserting the entity. ATP the data is ready to be inserted, just needs to be checked for existence
		item: InferInsertModel<T>,
		tx: PgTransaction<any, typeof schema, any>,
	) => Promise<void>, // Should just throw an error
) {
	// type RowSelect = typeof table["$inferSelect"]; // Use instead of 
	// type RowInsert = typeof table["$inferInsert"];
	type RowSelect = InferSelectModel<T>;
	type RowInsert = InferInsertModel<T>;

	type PK = PKName<N>;
	type ID = PKVal<N>;


	// Must do to satisfy drizzle since N is a union type which drizzle complains about
	// Strict type checking on paramaters means it's not a big deal, we already know the table and prim key at this point is fine
	const anyTable = table as unknown as AnyPgTable;
	const anyColumn = (table as any)[primKeyMap[tableName] as PK] as AnyPgColumn; 

	// Check if need to add updatedBy and createdBy fields
	const columns = getTableColumns(anyTable);
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
				.where(eq(anyColumn, id))
				.limit(1)
			) as unknown as RowSelect[];

			if (!row) throw new Error(`ID ${id} not found in ${tableName} `);
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
		async insertRow(formData: FormData, insertExtras?: Extras<N>): Promise<RowInsert> {
			"use server";
			// TODO: Add auth check
			const user = "testuser";
			const insertSchema = createInsertSchema(table);
			try {
				const form = formSchema.parse(Object.fromEntries(formData));
				return await db.transaction(async tx => {
					const enrichedForm = await enrich(form, tx);
					const userInfo = hasCreateBy ? hasUpdateBy ? {createby: user, updateby: user} : {createby: user} : {};
					// TODO: Make sure all ID cols are serial in people tables
					// TODO: Entity tables should probably be UUID
					const fullData = {
						...form, 
						...enrichedForm,
						...(insertExtras ?? {}),
						...userInfo
					};
					const insertItem: RowInsert = fullData;
					insertSchema.parse(insertItem);

					if (uniqueCheck) {
						await uniqueCheck(insertItem, tx);
					}

					await tx.insert(anyTable).values(insertItem);
					return insertItem;
				});
			} catch (error) {
				console.error(error);
				const msg = 
					error instanceof ZodError
						? error.errors[0].message
						: error instanceof Error
							? error.message
							: "Unknown error occured";
				redirect(`${revalidatePath}?error=${encodeURIComponent(msg)}`);	
			}
		},
		async deleteRows(id: ID[]): Promise<RowSelect[]> {
			"use server";
			const result = await db.delete(anyTable).where(inArray(anyColumn, id)).returning();
			if (result.length === 0) throw new Error(`Elements not found in ${tableName}`);
			return result as unknown as RowSelect[];
		}, 
		async updateRow(id: ID, formData: FormData, updateExtras: Extras<N>): Promise<RowInsert> {
			"use server";
			// TODO: Add auth checking
			const user = "testuser";
			const updateSchema = createUpdateSchema(table);
			try {
				const form = formSchema.parse(Object.fromEntries(formData));
				await db.transaction(async tx => {
					const enrichedForm = await enrich(form, tx);

					const userInfo = hasUpdateBy ? {updateby: user} : {};

					const fullItemData = {
						...form,
						...enrichedForm,
						...(updateExtras?? {}),
						...userInfo
					};

					if (uniqueCheck) {
						await uniqueCheck(fullItemData, tx);
					}

					const itemToUpdate: RowInsert = fullItemData;
					updateSchema.parse(itemToUpdate); // Validate against table schema
					await tx.update(anyTable).set(itemToUpdate).where(eq(anyColumn, id));
				})
				// TODO: fix
				// revalidatePath(revalidatePath);
				redirect(revalidatePath)
			} catch (error) {
				console.error(error);
				const msg = 
					error instanceof ZodError
						? error.errors[0].message
						: error instanceof Error
							? error.message
							: "Unknown error occured";
				redirect(`${revalidatePath}?error=${encodeURIComponent(msg)}`);
			}	
		}
		
	}

}


// export async function getAllRows<N extends TableName, T extends Table<N>>(table: T) {
//     return await db.select().from(table as AnyPgTable);
// }

export async function getRows<N extends TableName, T extends Table<N>>(
	table: T, 
	page: number, 
	pageSize: number, 
	match: 'all' | 'any',
	sortBy: ColKey<N> | undefined,
	sortOrder: 'asc' | 'desc' | undefined,
	query:ParsedFilter[]
) {
    // const where = buildClassSQL(query, match);
	// Build SQL query with helper function
    const where = query ? buildSQL(table, query, match) : undefined;

    const columns = getTableColumns(table as AnyPgTable);
	// Process sort by and sort order
    const sortbycolumn = sortBy ? columns[sortBy] : undefined;
    const orderByClause = sortbycolumn
      ? (sortOrder === 'asc' ? asc(sortbycolumn) : desc(sortbycolumn))
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
        .limit(pageSize)
        .offset((page - 1) * pageSize);

	// Obtain total count of rows in this table
	// TODO: ADD CACHING TO PREVENT REPEATS
    const [{ count }] = await db
        .select({ count: sql<number>`count(*)`})
        .from(table as AnyPgTable)
        .where(where);

    return {
        rows: result,
        totalCount: count,
    };
}


// export async function deleteRows<N extends TableName, T extends Table<N>, PrimaryKey extends keyof T['_']['columns'] & string>
// (
//     table: T, 
//     pk: PrimaryKey,
//     values: InferSelectModel<T>[PrimaryKey] | InferSelectModel<T>[PrimaryKey][] //number, number[]
// ) {
//     // const session = await requireRole(["ADMIN"]);
//     // if (!session?.user) {
//     //     throw new Error("Not authorized ");
//     //     return;
//     // } 

//     const valueslist = Array.isArray(values) ? values : [values]
//     const column = getTableColumns(table as AnyPgTable)[pk]
//     return await db.delete(table).where(inArray(column, valueslist)).returning();
// }





// export function addRow<
// 	N extends TableName, 
// 	T extends Table<N>, 
// 	FormSchema extends ZodSchema, 
// 	Upgrade extends object = {},
// 	Extra extends object = {[K in ColumnKey<N>]?: ColumnVal<N, K>}
// >(
// 	opts: {
// 		table: T;
// 		formSchema: FormSchema;
// 		enrich: (
// 			parsed: z.infer<FormSchema>,
// 			tx: PgTransaction<any, any, any>,
// 		) => Promise<Upgrade>;
// 		uniqueCheck?: (
// 			item: z.infer<FormSchema> & Upgrade & Extra,
// 			tx: PgTransaction<any, any, any>,
// 		) => Promise<void>;
// 		extras: Extra,
// 		redirectPath: string
// 	}
// ) {
// 	type Row = InferInsertModel<T>;
// 	const insertSchema = createInsertSchema(opts.table);

// 	// TODO: Auth checks

// 	return async function createItem(formData: FormData) {
// 		"use server";
// 		try {
// 			const form = opts.formSchema.parse(Object.fromEntries(formData));
// 			await db.transaction(async tx => {
// 				const enrichedForm = await opts.enrich(form, tx);

// 				const fullItemData = {
// 					...form,
// 					...enrichedForm,
// 					...(opts.extras ?? {})
// 				};

// 				if (opts.uniqueCheck) {
// 					await opts.uniqueCheck(fullItemData as z.infer<Form> & Upgrade & Extra, tx);
// 				}

// 				const itemToInsert: Row = fullItemData as Row;
// 				insertSchema.parse(itemToInsert); // Validate against table schema
// 				await tx.insert(opts.table).values(itemToInsert);
// 			})
// 			revalidatePath(opts.redirectPath)
// 			redirect(opts.redirectPath)
// 		} catch (error) {
// 			console.error(error);
// 			const msg = 
// 				error instanceof ZodError
// 					? error.errors[0].message
// 					: error instanceof Error
// 						? error.message
// 						: "Unknown error occured";
// 			redirect(`${opts.redirectPath}?error=${encodeURIComponent(msg)}`);
// 		}
// 	}
// }


// // At this point it will have been parsed by form schema, now parse with update schema
// export function updateRow<
// 	N extends TableName, 
// 	T extends Table<N>, 
// 	Form extends ZodSchema, 
// 	PrimaryKey extends keyof T['_']['columns'],
// 	Upgrade extends object = {},
// 	Extra extends object = {}
// >(
// 	opts: {
// 		table: T; // TODO: Make this a table object
// 		formSchema: Form;
// 		pk: PrimaryKey;
// 		enrich: (
// 			parsed: z.infer<Form>,
// 			tx: PgTransaction<any, any, any>,
// 		) => Promise<Upgrade>;
// 		uniqueCheck?: (
// 			item: z.infer<Form> & Upgrade & Extra,
// 			tx: PgTransaction<any, any, any>,
// 		) => Promise<void>;
// 		extras: Extra,
// 		redirectPath: string
// 	}
// ) {
// 	type Row = InferInsertModel<T>; // TODO: Make this a table object
// 	const updateSchema = createUpdateSchema(opts.table);

// 	// TODO: Auth checks

// 	return async function updateItem(formData: FormData, id_col: string) {
// 		"use server";
// 		try {
// 			const form = opts.formSchema.parse(Object.fromEntries(formData));
// 			await db.transaction(async tx => {
// 				const enrichedForm = await opts.enrich(form, tx);

// 				const fullItemData = {
// 					...form,
// 					...enrichedForm,
// 					...(opts.extras ?? {})
// 				};

// 				if (opts.uniqueCheck) {
// 					await opts.uniqueCheck(fullItemData as z.infer<Form> & Upgrade & Extra, tx);
// 				}

// 				const itemToUpdate: Row = fullItemData as Row;
// 				updateSchema.parse(itemToUpdate); // Validate against table schema
// 				const pkColumn = getTableColumns(opts.table as AnyPgTable)[opts.pk] as AnyPgColumn;
// 				await tx.update(opts.table).set(itemToUpdate).where(eq(pkColumn, id_col as PKVal<N>));
// 			})
// 			revalidatePath(opts.redirectPath)
// 			redirect(opts.redirectPath)
// 		} catch (error) {
// 			console.error(error);
// 			const msg = 
// 				error instanceof ZodError
// 					? error.errors[0].message
// 					: error instanceof Error
// 						? error.message
// 						: "Unknown error occured";
// 			redirect(`${opts.redirectPath}?error=${encodeURIComponent(msg)}`);
// 		}
// 	}
// }



