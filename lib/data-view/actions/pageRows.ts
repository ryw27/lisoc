// "use server";
import { db } from "@/lib/db";
import { parsedParams } from "../types";
import { buildSQL } from "../helpers";
import { getTableColumns, asc, desc, sql, AnyColumn, eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { getEntityConfig, type Registry } from "@/lib/data-view/registry";
import { users } from "@/lib/db/schema";

export interface PageRowsResult {
    ok: boolean;
    message?: string;
    rows?: unknown[];
    totalCount?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
    sortBy?: string | undefined;
    sortOrder?: 'asc' | 'desc' | undefined;
}

const USER_JOINED_TABLES = ["adminuser", "teacher", "family"];

export async function pageRows(entity: keyof Registry, opts: parsedParams): Promise<PageRowsResult> {
    try {
        const { table } = getEntityConfig(entity);
        await requireRole(["ADMIN"]);

        const page = Math.max(1, Number(opts.page || 1));
        const pageSize = Math.max(1, Math.min(Number(opts.pageSize || 25), 200));

        const where = opts.query && opts.query.length > 0 ? buildSQL(table, opts.query, opts.match) : undefined;

        const columns = getTableColumns(table) as Record<string, AnyColumn>;
        const sortByCol = opts.sortBy ? columns[String(opts.sortBy)] : undefined;
        const orderByClause = sortByCol
            ? (opts.sortOrder === 'asc' ? asc(sortByCol) : desc(sortByCol))
            : undefined;

        const baseQuery = db
            .select()
            .from(table)
            .where(where);

        // Handle user joined tables
        if (USER_JOINED_TABLES.includes(entity)) {
            baseQuery.leftJoin(users, eq(table["userid" as keyof (typeof table)["$inferSelect"]], users.id));
        } 

        const rows = await (
            orderByClause ? baseQuery.orderBy(orderByClause) : baseQuery
        )
            .limit(pageSize)
            .offset((page - 1) * pageSize);

        const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(table)
            .where(where);

        const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));

        return {
            ok: true,
            rows,
            totalCount: count,
            page,
            pageSize,
            totalPages,
            sortBy: opts.sortBy,
            sortOrder: opts.sortOrder,
        };
    } catch (error) {
        console.error('pageRows error', error);
        const message = error instanceof Error ? error.message : 'Server error. Please try again later.';
        return { ok: false, message };
    }
}