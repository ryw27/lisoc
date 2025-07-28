import { pgEnum, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const userRoles = pgEnum("user_roles", ['FAMILY', 'TEACHER', 'ADMINUSER'])

export const status = pgEnum("status", ["Active", "Inactive"])

// ----------------------------------------------------------------
// TIMESTAMP HELPERS - Use these for ALL timestamp columns
// ----------------------------------------------------------------

/**
 * Standard timestamp with timezone - USE THIS FOR ALL TIMESTAMPS
 * Stores in UTC, can be displayed in any timezone
 */
export const timestampWithTz = () => timestamp({ withTimezone: true, mode: 'string' });

/**
 * Audit timestamp - auto-updates on creation
 */
export const createdAt = () => timestampWithTz().default(sql`CURRENT_TIMESTAMP`).notNull();

/**
 * Audit timestamp - auto-updates on modification
 */
export const updatedAt = () => timestampWithTz().default(sql`CURRENT_TIMESTAMP`).notNull();