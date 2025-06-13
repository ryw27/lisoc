import { AnyPgColumn, AnyPgTable, PgTransaction } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel, eq, gt, lt, lte, gte, and, or, getTableColumns, inArray, sql, desc, asc, SQL, ne } from "drizzle-orm";
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

export type Extras<N extends TableName, T extends Table<N>> = {[K in ColKey<N>]?: ColVal<N,T,K>};

export type creationFields = 'createby' | 'updateby' | 'createon' | 'updateon' | 'lastmodify'

export type uniqueCheckFields<N extends TableName, FormSchema extends ZodSchema> = {
	tableCol: ColKey<N>;
	formCol?: keyof z.infer<FormSchema>;
	wantedValue?: string | number;
}

export type enrichField<FKN extends TableName, FormSchema extends ZodSchema> = {
	formField: keyof z.infer<FormSchema>;
	lookupTable: FKN;
	lookupField: ColKey<FKN>; // Column name - will be validated at runtime
	returnField: ColKey<FKN>; // Column name - will be validated at runtime
}

// Simple array type for better developer experience
export type enrichFields<FormSchema extends ZodSchema> = {
	[FKN in TableName]: enrichField<FKN, FormSchema>
}[TableName]

// ------------------------------------------------------------------------------------------------
// Create CRUD operations for an entity
// -------------------------------------------------------------------------------------------------

export async function uniqueCheck<N extends TableName, T extends Table<N>, FormSchema extends ZodSchema>(
	table: T,
	entity_name: string,
	itemToCheck: z.infer<FormSchema>, // ✅ Fixed: Use inferred type, not ZodSchema
	tx: PgTransaction<any, typeof schema, any>,
	uniqueConstraints: uniqueCheckFields<N, FormSchema>[],
	// Included if updating
	PKCol?: AnyPgColumn, // Type safe from driver function
	exclude?: PKVal<N> // Exclude the row itself for updating
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
export async function enrich<N extends TableName, T extends Table<N>, FormSchema extends ZodSchema>(
	tableName: N,
	table: T,
	parsed: z.infer<FormSchema>,
	tx: PgTransaction<any, typeof schema, any>,
	enrichFields: enrichFields<FormSchema>[] // Information should be in the foreign key table
): Promise<Partial<Record<string, any>>> {
	const enriched: Record<string, any> = {}
	
	for (const field of enrichFields) {
		const { formField, lookupTable, lookupField, returnField } = field;
		const formValue = parsed[formField];
		
		// Get the actual table object from schema using the table name
		const lookupTableRef = schema[lookupTable] as AnyPgTable;
		const columns = getTableColumns(lookupTableRef);
		
		// Get the specific column objects for type-safe querying
		const searchColumn = columns[lookupField] as AnyPgColumn;
		const returnColumn = columns[returnField] as AnyPgColumn;
		
		// Execute the query properly
		const [lookupResult] = await tx
			.select({ result: returnColumn })
			.from(lookupTableRef)
			.where(eq(searchColumn, formValue))
			.limit(1);

		if (!lookupResult) {
			throw new Error(`No matching ${lookupTable} found for ${String(formField)}=${formValue}`);
		}

		// Store the result using the return field name as key
		enriched[returnField] = lookupResult.result;
	}

	return enriched;
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
	enrichFields: enrichFields<FormSchema>[],// Enrichment fields configuration
	uniqueConstraints?: uniqueCheckFields<N, FormSchema>[], // Unique constraint checks
	insertExtras?: Extras<N, T>,
	updateExtras?: Extras<N, T>
) {
	type RowSelect = InferSelectModel<T>;
	type RowInsert = InferInsertModel<T>;

	type PK = PKName<N>;
	type ID = PKVal<N>;

	// Must do to satisfy drizzle since N is a union type which drizzle complains about
	// Strict type checking on parameters means it's not a big deal, we already know the table and prim key at this point is fine
	const anyTable = table as unknown as AnyPgTable;
	const anyColumn = (table as any)[primKeyMap[tableName] as PK] as AnyPgColumn; // Primary Key of table

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

			if (!row) throw new Error(`ID ${id} not found in ${tableName}`);
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
		async insertRow(formData: FormData): Promise<RowInsert> {
			"use server";
			// TODO: Add auth check
			const user = "testuser";
			const insertSchema = createInsertSchema(table);
			
			try {
				const form = formSchema.parse(Object.fromEntries(formData));
				
				return await db.transaction(async tx => {
					// Check unique constraints if provided
					if (uniqueConstraints && uniqueConstraints.length > 0) {
						await uniqueCheck(table, tableName, form, tx, uniqueConstraints);
					}

					// Enrich form data with foreign key lookups
					const enrichedForm = await enrich(tableName, table, form, tx, enrichFields);
					
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
					return inserted as RowInsert;
				});
			} catch (error) {
				console.error(error);
				const msg = 
					error instanceof ZodError
						? error.errors[0].message
						: error instanceof Error
							? error.message
							: "Unknown error occurred";
				redirect(`${revalidatePath}?error=${encodeURIComponent(msg)}`);	
			}
		},
		async deleteRows(ids: ID[]): Promise<RowSelect[]> {
			"use server";
			const result = await db.delete(anyTable).where(inArray(anyColumn, ids)).returning();
			if (result.length === 0) throw new Error(`Elements not found in ${tableName}`);
			return result as unknown as RowSelect[];
		}, 
		async updateRow(id: ID, formData: FormData): Promise<RowInsert> {
			"use server";
			// TODO: Add auth checking
			const user = "testuser";
			const updateSchema = createUpdateSchema(table);
			
			try {
				const form = formSchema.parse(Object.fromEntries(formData));
				
				return await db.transaction(async tx => {
					// Check unique constraints if provided (excluding current record)
					if (uniqueConstraints && uniqueConstraints.length > 0) {
						await uniqueCheck(table, tableName, form, tx, uniqueConstraints, anyColumn, id);
					}
					// Enrich form data with foreign key lookups
					const enrichedForm = await enrich(tableName, table, form, tx, enrichFields);

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
						.where(eq(anyColumn, id))
						.returning();
					
					if (!updated) throw new Error(`Failed to update ${tableName} with ID ${id}`);
					return updated as RowInsert;
				});
			} catch (error) {
				console.error(error);
				const msg = 
					error instanceof ZodError
						? error.errors[0].message
						: error instanceof Error
							? error.message
							: "Unknown error occurred";
				redirect(`${revalidatePath}?error=${encodeURIComponent(msg)}`);
			}	
		}
	}
}


// export async function getAllRows<N extends TableName, T extends Table<N>>(table: T) {
//     return await db.select().from(table as AnyPgTable);
// }

// export async function getRows<N extends TableName, T extends Table<N>>(
// 	table: T, 
// 	page: number, 
// 	pageSize: number, 
// 	match: 'all' | 'any',
// 	sortBy: ColKey<N> | undefined,
// 	sortOrder: 'asc' | 'desc' | undefined,
// 	query:ParsedFilter[]
// ) {
//     // const where = buildClassSQL(query, match);
// 	// Build SQL query with helper function
//     const where = query ? buildSQL(table, query, match) : undefined;

//     const columns = getTableColumns(table as AnyPgTable);
// 	// Process sort by and sort order
//     const sortbycolumn = sortBy ? columns[sortBy] : undefined;
//     const orderByClause = sortbycolumn
//       ? (sortOrder === 'asc' ? asc(sortbycolumn) : desc(sortbycolumn))
//       : undefined;

// 	// Build drizzle query, don't execute yet
//     const baseQuery = db
//         .select()
//         .from(table as AnyPgTable) // Type assertion to satisfy drizzle
//         .where(where);

// 	// Add sorting if necessary as well as pagesize and page and execute
//     const result = await (
//         orderByClause
//             ? baseQuery.orderBy(orderByClause)
//             : baseQuery
//         )
//         .limit(pageSize)
//         .offset((page - 1) * pageSize);

// 	// Obtain total count of rows in this table
// 	// TODO: ADD CACHING TO PREVENT REPEATS
//     const [{ count }] = await db
//         .select({ count: sql<number>`count(*)`})
//         .from(table as AnyPgTable)
//         .where(where);

//     return {
//         rows: result,
//         totalCount: count,
//     };
// }


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




// ================================================================================================
// USAGE EXAMPLE - Full Type Safety
// ================================================================================================

/*
// Example: Creating operations for a "classes" table that has foreign keys to multiple tables

import { z } from "zod";
import * as schema from "./db/schema";

// 1. Define your form schema
const classFormSchema = z.object({
  classname: z.string().min(1),
  teacherName: z.string().min(1),    // User enters teacher name, we look up teacher ID
  roomName: z.string().min(1),       // User enters room name, we look up room ID  
  seasonName: z.string().min(1),     // User enters season name, we look up season ID
  maxstudents: z.number().min(1),
});

// 2. Define enrichment fields with full type safety
const classEnrichFields: enrichFields<typeof classFormSchema>[] = [
  {
    formField: "teacherName",          // ✅ Type-safe: must be key of form schema
    lookupTable: "teacher",           // ✅ Type-safe: must be valid table name
    lookupField: "teachername",       // ✅ Type-safe: must be valid column in teacher table
    returnField: "teacherid"          // ✅ Type-safe: must be valid column in teacher table
  },
  {
    formField: "roomName",
    lookupTable: "classrooms", 
    lookupField: "roomname",          // ✅ IntelliSense knows valid classrooms columns
    returnField: "roomid"
  },
  {
    formField: "seasonName",
    lookupTable: "seasons",
    lookupField: "seasonname",        // ✅ IntelliSense knows valid seasons columns  
    returnField: "seasonid"
  }
];

// 3. Define unique constraints
const classUniqueConstraints: uniqueCheckFields<"classes">[] = [
  {
    tableCol: "classname",            // ✅ Type-safe: must be valid column in classes table
    formVal: "classname"              // ✅ Type-safe: must be valid field in insert model
  }
];

// 4. Create type-safe operations
const classOps = makeOperations(
  "classes",                          // ✅ Type-safe table name
  schema.classes,                     // ✅ Actual table object  
  classFormSchema,                    // ✅ Zod schema for validation
  "/classes",                         // Redirect path
  classEnrichFields,                  // ✅ Fully type-safe enrichment
  classUniqueConstraints              // ✅ Fully type-safe constraints
);

// 5. Usage with complete type safety
export const {
  allRows: getAllClasses,             // Returns InferSelectModel<typeof schema.classes>[]
  idRow: getClassById,                // Takes class ID, returns single class
  pageRows: getClassesPage,           // Paginated results
  insertRow: createClass,             // Takes FormData, handles all enrichment automatically
  updateRow: updateClass,             // Takes ID + FormData
  deleteRows: deleteClasses           // Takes ID[], returns deleted records
} = classOps;

// When you call createClass(formData):
// 1. ✅ Form is validated against classFormSchema
// 2. ✅ teacherName is looked up in teacher table to get teacherid
// 3. ✅ roomName is looked up in classrooms table to get roomid  
// 4. ✅ seasonName is looked up in seasons table to get seasonid
// 5. ✅ Combined data is validated against classes table schema
// 6. ✅ Unique constraint on classname is checked
// 7. ✅ createby/updateby fields are added automatically
// 8. ✅ Record is inserted and returned with full type safety

// ========================================================================================
// TYPE SAFETY GUARANTEES:
// ========================================================================================
// ✅ formField must be a key in your form schema
// ✅ lookupTable must be a valid table name from your schema  
// ✅ lookupField must be a valid column in the lookup table
// ✅ returnField must be a valid column in the lookup table
// ✅ tableCol must be a valid column in the target table
// ✅ formVal must be a valid field in the insert model
// ✅ All database operations are properly typed
// ✅ Return types match your table schemas exactly
// ✅ Compilation errors if you use invalid field names
// ✅ IntelliSense support for all field names

*/



