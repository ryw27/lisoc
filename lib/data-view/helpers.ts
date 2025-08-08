import { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";
import { ParsedFilter, Table } from "./types";
import { getTableColumns } from "drizzle-orm";
import { eq, lt, gt, lte, gte, and, or } from "drizzle-orm";
import { SQL } from "drizzle-orm";
import { Table } from "./types";
import { toESTString } from "../utils";

/**
 * Checks if a column is a PgColumn
 * @param column The column to check
 * @returns True if the column is a PgColumn, false otherwise - used to filter out non-column properties like enableRLS
 */
export function isPgColumn(column: AnyPgColumn) {
  return !!column && typeof column === 'object' && 'dataType' in column;
}

// Build SQL from parsed filters
export function buildSQL<T extends Table>(table: T, filters: ParsedFilter[], match: 'all' | 'any'): SQL<unknown> | undefined {
    const columns = getTableColumns(table as AnyPgTable); // For compile-time type checking
    const conds = filters.map(filter => {
        if (!(filter.field in columns) && filter.field != "match") throw new Error(`Unknown filter field ${filter.field}`);
        const col = columns[filter.field as keyof typeof columns] as AnyPgColumn;
        const value = filter.value instanceof Date ? toESTString(filter.value) : filter.value;
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

