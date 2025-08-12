import z from "zod/v4";
import { users } from "@/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { US_STATES } from "@/lib/utils";
import { toESTString } from "@/lib/utils";
import { EntityConfig, Extras } from "../../types";


export type UserTable = typeof users;
export type UserObject = InferSelectModel<UserTable>;


// Public/user-facing form schema (no server-managed fields, no roles)
export const userSchema = z.object({
    name: z.string().trim().max(50),
    email: z
        .string()
        .trim()
        .min(1, { message: "Email is required" })
        .max(255)
        .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, { message: "This is not a valid email" }),
    address: z
        .string()
        .trim()
        .max(100, { message: "Address must be at most 100 characters" })
        .optional(),
    city: z
        .string()
        .trim()
        .max(50, { message: "City must be at most 50 characters" })
        .optional(),
    state: z
        .string()
        .refine(
            (v) => v == null || (v.length === 2 && US_STATES.includes(v as typeof US_STATES[number])),
            { message: "Use a valid 2-letter US state code" }
        ),
    zip: z
        .string()
        .trim()
        .regex(/^\d{5}(-\d{4})?$/, { message: "Invalid ZIP" })
        .optional(),
    phone: z.string()
        .trim()
        .regex(/^\+?[0-9().\-\s]{7,20}$/, { message: "Invalid phone" })
        .optional()
        .transform((v) => (v === undefined || v === "" ? null : v)),
})


// 3. Create/Update extras
export const makeUserInsertExtras = () => {
    const insertExtras: Extras<UserTable> = {
        createon: toESTString(new Date())
    };
    return insertExtras;
}

export const makeUserUpdateExtras = () => {
    const updateExtras: Extras<UserTable> = {
        updateon: toESTString(new Date())
    }
    return updateExtras;
}

// 4. The User Config
export const userConfig: EntityConfig<UserTable> = {
    table: users,
    tableName: "users",
    primaryKey: "id",
    formSchema: userSchema,
    makeInsertExtras: makeUserInsertExtras,
    makeUpdateExtras: makeUserUpdateExtras
}