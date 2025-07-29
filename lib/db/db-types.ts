import { pgEnum } from "drizzle-orm/pg-core"

export const userRoles = pgEnum("user_roles", ['FAMILY', 'TEACHER', 'ADMINUSER'])
