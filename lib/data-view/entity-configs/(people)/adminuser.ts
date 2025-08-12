import { adminuser } from "@/lib/db/schema";
import { z } from "zod/v4";
import { type EntityConfig } from "@/lib/data-view/types";
import { type Extras } from "@/lib/data-view/types";
import { DefaultSession } from "next-auth";
import { InferSelectModel } from "drizzle-orm";
import { UserObject, userSchema } from "./users";


// 1. Types
export type AdminUserTable = typeof adminuser;
export interface AdminUserJoined extends InferSelectModel<AdminUserTable>, UserObject {}


// 2. Form Schema
export const AdminUserSchema = z.object({
    ...userSchema.shape,
    namecn: z
        .string()
        .min(1, { message: "Chinese name is required" })
        .max(50, { message: "Chinese name must be at most 50 characters" }),
    firstname: z
        .string()
        .min(1, { message: "First name is required" })
        .max(50, { message: "First name must be at most 50 characters" }),
    lastname: z
        .string()
        .min(1, { message: "Last name is required" })
        .max(50, { message: "Last name must be at most 50 characters" }),
    address1: z
        .string()
        .max(100, { message: "Address must be at most 100 characters" })
        .transform((val) => (val == null || val === "" ? "" : val)),
    status: z.enum(["Active", "Inactive"]).default("Active"),
    notes: z
        .string()
        .max(2000, { message: "Notes must be at most 2000 characters" })
        .optional()
        .default(""),
})


// 3. Create/Update extras
export const makeAdminUserInsertExtras = (user: DefaultSession["user"]) => {
    const insertExtras: Extras<AdminUserTable> = {
        createby: user?.name || user?.email || "Unknown admin",
        updateby: user?.name || user?.email || "Unknown admin"
    };
    return insertExtras;
}

export const makeAdminUserUpdateExtras = (user: DefaultSession["user"]) => {
    const updateExtras: Extras<AdminUserTable> = {
        updateby: user?.name || user?.email || "Unknown admin"
    }
    return updateExtras;
}


// 4. The Admin User Config
export const adminUserConfig: EntityConfig<AdminUserTable> = {
    table: adminuser,
    tableName: "adminuser",
    primaryKey: "adminid",
    formSchema: AdminUserSchema,
    makeInsertExtras: makeAdminUserInsertExtras,
    makeUpdateExtras: makeAdminUserUpdateExtras
}