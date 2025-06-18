import { pgEnum } from "drizzle-orm/pg-core"

export const userRole = pgEnum("user_role", ['ADMIN', 'TEACHER', 'FAMILY'])