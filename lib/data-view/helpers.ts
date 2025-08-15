import { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";
import { ParsedFilter, Table } from "./types";
import { getTableColumns } from "drizzle-orm";
import { eq, lt, gt, lte, gte, and, or } from "drizzle-orm";
import { SQL } from "drizzle-orm";
import { SITE_LINK, toESTString } from "../utils";
import { transporter } from "../nodemailer";


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


export async function sendUserRegEmail(emailTo: string, password: string, type: "Admin" | "Teacher") {
    await transporter.sendMail({
        from: "LISOC Registration <regadmin@lisoc.org>",
        to: emailTo,
        subject: `LISOC ${type} Registration`,
        html: `
            <p>Login with the following <a href="${SITE_LINK}/login/${type.toLowerCase()}">link</a></p>
            <p>If the link is not working, please try copy and pasting the following into your browser: ${SITE_LINK}/login/${type.toLowerCase()}</p>
            <p>Use the following credentials:</p>
            <p><strong>Email:</strong> ${emailTo}</p>
            <p><strong>Password:</strong> ${password}</p>
        `
    })
}