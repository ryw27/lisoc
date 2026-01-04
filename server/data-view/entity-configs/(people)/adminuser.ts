import { InferSelectModel } from "drizzle-orm";
import { DefaultSession } from "next-auth";
import { z } from "zod/v4";
import { adminuser } from "@/lib/db/schema";
import { type EntityConfig, type Extras } from "@/types/dataview.types";
import { UserObject, UserSchema } from "./users";

// 1. Types
export type AdminUserTable = typeof adminuser;
export interface AdminUserJoined extends InferSelectModel<AdminUserTable>, UserObject {}

// 2. Form Schema
export const AdminSchema = z.object({
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
});
export const AdminUserSchema = z.object({
    ...UserSchema.shape,
    ...AdminSchema.shape,
});

// 3. Create/Update extras
export const makeAdminUserInsertExtras = (user: DefaultSession["user"]) => {
    const insertExtras: Extras<AdminUserTable> = {
        createby: user?.name || user?.email || "Unknown admin",
        updateby: user?.name || user?.email || "Unknown admin",
    };
    return insertExtras;
};

export const makeAdminUserUpdateExtras = (user: DefaultSession["user"]) => {
    const updateExtras: Extras<AdminUserTable> = {
        updateby: user?.name || user?.email || "Unknown admin",
    };
    return updateExtras;
};

// 4. The Admin User Config
export const adminUserConfig: EntityConfig<AdminUserTable> = {
    table: adminuser,
    tableName: "adminuser",
    primaryKey: "adminid",
    formSchema: AdminUserSchema,
    makeInsertExtras: makeAdminUserInsertExtras,
    makeUpdateExtras: makeAdminUserUpdateExtras,
};
