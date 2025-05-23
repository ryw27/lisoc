import { FilterableColumn, filterTypes } from "@/app/lib/column-actions";
import { AnyPgColumn, AnyPgTable, parsePgNestedArray, PgColumn, PgTransaction } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel, eq, gt, lt, lte, gte, and, or, getTableColumns, inArray, sql, desc, asc } from "drizzle-orm";
import { db } from "./db";
import { formatISO } from "date-fns";
import { z, ZodError, ZodObject, ZodSchema } from "zod";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ------------------------------------------------------------------------------------------------
// Schema-Specific Column Definitions
// -------------------------------------------------------------------------------------------------

export async function getAllRows<T extends AnyPgTable>(table: T) {
    return await db.select().from(table as AnyPgTable);
}

export async function getRows<T extends AnyPgTable>(table: T, page: number, pageSize: number, match: string, sortBy: string | undefined, sortOrder: string | undefined, query:ParsedFilter[]) {
    // const where = buildClassSQL(query, match);
    const where = query ? buildSQL(table, query, match) : undefined;
    const columns = getTableColumns(table);
    const sortbycolumn = sortBy ? columns[sortBy as keyof typeof columns] : undefined;
    const orderByClause = sortbycolumn
      ? (sortOrder === 'asc' ? asc(sortbycolumn) : desc(sortbycolumn))
      : undefined;

    const baseQuery = db
        .select()
        .from(table as AnyPgTable)
        .where(where);

    const result = await (
        orderByClause
            ? baseQuery.orderBy(orderByClause)
            : baseQuery
        )
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    const [{ count }] = await db
        .select({ count: sql<number>`count(*)`})
        .from(table as AnyPgTable)
        .where(where);

    return {
        rows: result,
        totalCount: count,
    };
}


export async function deleteRows<T extends AnyPgTable, PrimaryKey extends keyof T['_']['columns'] & string>
(
    table: T, 
    pk: PrimaryKey,
    values: InferSelectModel<T>[PrimaryKey] | InferSelectModel<T>[PrimaryKey][] //number, number[]
) {
    // const session = await requireRole(["ADMIN"]);
    // if (!session?.user) {
    //     throw new Error("Not authorized ");
    //     return;
    // } 

    const valueslist = Array.isArray(values) ? values : [values]
    const column = getTableColumns(table)[pk]
    return await db.delete(table).where(inArray(column, valueslist)).returning();
}



// Helper zod to turn all query paramaters into the correct type
export const primitive = z.union([
    z.enum(["Active", "Inactive"]),
    z.coerce.number(),
    z.coerce.date(),
    z.string(),
])

// Parsed filters only, not including page, pageSize, sortBy, sortOrder, match
export type ParsedFilter = {
    field: string, // The column that is being filtered
    op: 'eq' | 'lt' | 'gt' | 'gte' | 'lte', // Operation on clumn
    value: z.infer<typeof primitive> // Correctly coerce value into the correct JS type
}

// Paramaters after proper parsing done
export type parsedParams = {
	page: number,
	pageSize: number,
	sortBy: string | undefined,
	sortOrder: 'asc' | 'desc' | undefined,
	match: 'all' | 'any'
	query: ParsedFilter[]
}

// General search params when they come in from the URL
export type SearchParams = {
    page: string | undefined;
    pageSizes: string | undefined;
    sortBy: string | undefined;
    sortOrder: 'asc' | 'desc' | undefined
    match: 'any' | 'all' | undefined
    [key: string]: string | undefined; // Allow for additional query parameters
}

export async function parseParams(searchParams: Promise<SearchParams>) {
	const params = await searchParams;
    const out: parsedParams = {
		page: 1,
		pageSize: 10,
		sortBy: undefined,
		sortOrder: undefined,
		match: 'all',
		query: []
	}

    Object.entries(params).forEach(([rawKey, rawValue]) => {
		if (rawValue === undefined) return;
		if (rawKey == "pageSize") {
			const parsed = parseInt(rawValue);
			if (!isNaN(parsed) && parsed > 0) out.pageSize = parsed;
		}
		if (rawKey == "page") {
			const parsed = parseInt(rawValue);
			if (!isNaN(parsed) && parsed > 0) out.page = parsed;
		}
		if (rawKey == "sortBy") {
			const parsed = rawValue;
			if (parsed !== undefined) out.sortBy = parsed;
		}
		if (rawKey == "sortOrder") {
			const parsed = rawValue;
			if (parsed !== undefined) out.sortOrder = parsed as 'asc' | 'desc';
		}
		if (rawKey == "match") out.match = rawValue as 'all' | 'any';
	})

	out.query = parseFilters(params);
	return out;
}


export function parseFilters(params: Record<string, string | undefined>) {
    const out: ParsedFilter[] = []
    Object.entries(params).forEach(([rawKey, rawValue]) => {
        if (rawValue === undefined) return; 
		if (rawKey == "match") return;
		if (rawKey == "pageSize" || rawKey == "page") return;
		if (rawKey == "sortBy" || rawKey == "sortOrder") return;
        let field = rawKey;
        let op: ParsedFilter['op'] = 'eq';
        const reg = rawKey.match(/^(.+)\[(gte|lte|gt|lt)\]$/)
        if (reg) {
            field = reg[1];
            op = reg[2] as ParsedFilter['op']
        }

        const value = primitive.parse(rawValue);
        out.push({field, op, value});
    })
    return out;
}

export function buildSQL<T extends AnyPgTable>(table: T, filters: ParsedFilter[], match: string) {
    const columns = getTableColumns(table); // For compile-time type checking
    const conds = filters.map(filter => {
        if (!(filter.field in columns) && filter.field != "match") throw new Error(`Unknown filter field ${filter.field}`);
        const col = columns[filter.field as keyof typeof columns]
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

export function addRow<
	T extends AnyPgTable, 
	Form extends ZodSchema, 
	Upgrade extends object = {},
	Extra extends object = {}
>(
	opts: {
		table: T;
		formSchema: Form;
		enrich: (
			parsed: z.infer<Form>,
			tx: PgTransaction<any, any, any>,
		) => Promise<Upgrade>;
		uniqueCheck?: (
			item: z.infer<Form> & Upgrade & Extra,
			tx: PgTransaction<any, any, any>,
		) => Promise<void>;
		extras: Extra,
		redirectPath: string
	}
) {
	type Row = InferInsertModel<T>;
	const insertSchema = createInsertSchema(opts.table);

	// TODO: Auth checks

	return async function createItem(formData: FormData) {
		"use server";
		try {
			const form = opts.formSchema.parse(Object.fromEntries(formData));
			await db.transaction(async tx => {
				const enrichedForm = await opts.enrich(form, tx);

				const fullItemData = {
					...form,
					...enrichedForm,
					...(opts.extras ?? {})
				};

				if (opts.uniqueCheck) {
					await opts.uniqueCheck(fullItemData as z.infer<Form> & Upgrade & Extra, tx);
				}

				const itemToInsert: Row = fullItemData as Row;
				insertSchema.parse(itemToInsert); // Validate against table schema
				await tx.insert(opts.table).values(itemToInsert);
			})
			revalidatePath(opts.redirectPath)
			redirect(opts.redirectPath)
		} catch (error) {
			console.error(error);
			const msg = 
				error instanceof ZodError
					? error.errors[0].message
					: error instanceof Error
						? error.message
						: "Unknown error occured";
			redirect(`${opts.redirectPath}?error=${encodeURIComponent(msg)}`);
		}
	}
}


// At this point it will have been parsed by form schema, now parse with update schema
export function updateRow<
	T extends AnyPgTable, 
	Form extends ZodSchema, 
	PrimaryKey extends keyof T['_']['columns'],
	Upgrade extends object = {},
	Extra extends object = {}
>(
	opts: {
		table: T;
		formSchema: Form;
		pk: PrimaryKey;
		enrich: (
			parsed: z.infer<Form>,
			tx: PgTransaction<any, any, any>,
		) => Promise<Upgrade>;
		uniqueCheck?: (
			item: z.infer<Form> & Upgrade & Extra,
			tx: PgTransaction<any, any, any>,
		) => Promise<void>;
		extras: Extra,
		redirectPath: string
	}
) {
	type Row = InferInsertModel<T>;
	const updateSchema = createUpdateSchema(opts.table);

	// TODO: Auth checks

	return async function updateItem(formData: FormData, id_col: string) {
		"use server";
		try {
			const form = opts.formSchema.parse(Object.fromEntries(formData));
			await db.transaction(async tx => {
				const enrichedForm = await opts.enrich(form, tx);

				const fullItemData = {
					...form,
					...enrichedForm,
					...(opts.extras ?? {})
				};

				if (opts.uniqueCheck) {
					await opts.uniqueCheck(fullItemData as z.infer<Form> & Upgrade & Extra, tx);
				}

				const itemToUpdate: Row = fullItemData as Row;
				updateSchema.parse(itemToUpdate); // Validate against table schema
				const pkColumn = getTableColumns(opts.table)[opts.pk];
				await tx.update(opts.table).set(itemToUpdate).where(eq(pkColumn, id_col));
			})
			revalidatePath(opts.redirectPath)
			redirect(opts.redirectPath)
		} catch (error) {
			console.error(error);
			const msg = 
				error instanceof ZodError
					? error.errors[0].message
					: error instanceof Error
						? error.message
						: "Unknown error occured";
			redirect(`${opts.redirectPath}?error=${encodeURIComponent(msg)}`);
		}
	}
}


// type rows<T extends AnyPgTable> = InferSelectMode<T>;

export function makeOperations<
	T extends AnyPgTable, 
	PrimaryKeyName extends keyof T['_']['columns'] & string,
>(
	opts:{
		table: T,
		pk: PrimaryKeyName,
		revalidatePath: string;
	}
) {
	const { table, pk: pkName, revalidatePath: defaultRedirectPath } = opts;

	// Queries
	const allRows = () => {
		return getAllRows<T>(table);
	}

	const someRows = (
		page: number,
		pageSize: number, 
		match: string, 
    	sortBy: keyof T['_']['columns'] & string | undefined, 
		sortOrder: 'asc' | 'desc' | undefined, 
		query:ParsedFilter[]
	) => getRows<T>(table, page, pageSize, match, sortBy, sortOrder, query);

	const deleteOp = async (ids: (InferSelectModel<T>[PrimaryKeyName])[]) => {
		'use server';
		await deleteRows(table, pkName, ids);
		revalidatePath(defaultRedirectPath);
	};

	const addOp = <
		FormSchema extends ZodSchema,
		EnrichReturn extends object = {},
		ExtraData extends object = {}
	>(
		addOpts: {
			formSchema: FormSchema;
			enrich: (
				parsed: z.infer<FormSchema>,
				tx: PgTransaction<any, any, any>,
			) => Promise<EnrichReturn>;
			uniqueCheck?: (
				item: z.infer<FormSchema> & EnrichReturn & ExtraData,
				tx: PgTransaction<any, any, any>,
			) => Promise<void>;
			extras?: ExtraData;
			redirectPath?: string;
		}
	) => {
		return addRow({
			table,
			formSchema: addOpts.formSchema,
			enrich: addOpts.enrich,
			uniqueCheck: addOpts.uniqueCheck,
			extras: addOpts.extras ?? {} as ExtraData,
			redirectPath: addOpts.redirectPath ?? defaultRedirectPath,
		});
	};

	const updateOp = <
		FormSchema extends ZodSchema,
		EnrichReturn extends object = {},
		ExtraData extends object = {}
	>(
		updateOpts: {
			formSchema: FormSchema;
			enrich: (
				parsed: z.infer<FormSchema>,
				tx: PgTransaction<any, any, any>,
			) => Promise<EnrichReturn>;
			uniqueCheck?: (
				item: z.infer<FormSchema> & EnrichReturn & ExtraData,
				tx: PgTransaction<any, any, any>,
			) => Promise<void>;
			extras?: ExtraData;
			redirectPath?: string;
		}
	) => {
		return updateRow({
			table,
			formSchema: updateOpts.formSchema,
			pk: pkName,
			enrich: updateOpts.enrich,
			uniqueCheck: updateOpts.uniqueCheck,
			extras: updateOpts.extras ?? {} as ExtraData,
			redirectPath: updateOpts.redirectPath ?? defaultRedirectPath,
		});
	};

	return {
		table,
		pk: pkName,
		allRows,
		someRows,
		deleteOp,
		addOp,
		updateOp		
	}
}

