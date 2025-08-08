import { db } from "@/lib/db";
import { parsedParams, Table } from "../types";
import { buildSQL } from "../helpers";
import { getTableColumns, asc, desc, sql, InferSelectModel, AnyColumn } from "drizzle-orm";
import { AnyPgTable } from "drizzle-orm/pg-core";
import { requireRole } from "@/lib/auth";

export async function pageRows<T extends Table>(table: T, opts: parsedParams) {
    await requireRole(["ADMIN"]);
    // Take parsed params type from handle-params.ts
    // Build SQL query with helper function
    const where = opts.query ? buildSQL(table, opts.query, opts.match) : undefined;

    const columns = getTableColumns(table) as Record<string, AnyColumn>;
    // Process sort by and sort order
    const sortbycolumn = opts.sortBy ? columns[opts.sortBy as keyof typeof columns] : undefined;
    const orderByClause = sortbycolumn
        ? (opts.sortOrder === 'asc' ? asc(sortbycolumn) : desc(sortbycolumn))
        : undefined;

    // Build drizzle query, don't execute yet
    const baseQuery = db
        .select()
        .from(table as AnyPgTable) 
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
    const [{ count }] = await db
        .select({ count: sql<number>`count(*)`})
        .from(table as AnyPgTable)
        .where(where);

    return {
        rows: result as InferSelectModel<T>[],
        totalCount: count,
    };
}