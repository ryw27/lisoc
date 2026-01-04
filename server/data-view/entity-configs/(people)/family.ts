import { InferSelectModel } from "drizzle-orm";
import { z } from "zod/v4";
import { family } from "@/lib/db/schema";
import { type EntityConfig } from "@/types/dataview.types";
import { UserObject, UserSchema } from "./users";

// 1. Types
export type FamilyTable = typeof family;
export interface FamilyJoined extends InferSelectModel<FamilyTable>, UserObject {}

// 2. Form Schema: Form schema is not necessarily the same as database schema
export const FamilySchema = z.object({
    fatherfirsten: z
        .string()
        .max(50, { message: "Father's first name must be at most 50 characters" })
        .optional(),
    fatherlasten: z
        .string()
        .max(50, { message: "Father's last name must be at most 50 characters" })
        .optional(),
    fathernamecn: z
        .string()
        .max(50, { message: "Father's name (CN) must be at most 50 characters" })
        .optional(),
    motherfirsten: z
        .string()
        .max(50, { message: "Mother's first name must be at most 50 characters" })
        .optional(),
    motherlasten: z
        .string()
        .max(50, { message: "Mother's last name must be at most 50 characters" })
        .optional(),
    mothernamecn: z
        .string()
        .max(50, { message: "Mother's name (CN) must be at most 50 characters" })
        .optional(),
    contact: z.string().max(20, { message: "Contact must be at most 20 characters" }).optional(),
    address1: z.string().max(100, { message: "Address must be at most 100 characters" }).optional(),
    officephone: z
        .string()
        .max(50, { message: "Office phone must be at most 50 characters" })
        .regex(/^\d{7, 20}$/, { message: "Invalid phone number" })
        .optional(),
    cellphone: z
        .string()
        .max(50, { message: "Cell phone must be at most 50 characters" })
        .regex(/^\d{7, 20}$/, { message: "Invalid phone number" })
        .optional(),
    email2: z
        .string()
        .max(100, { message: "Email must be at most 100 characters" })
        .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{1,}$/, {
            message: "Invalid email address",
        })
        .optional()
        .default(""),
    status: z.boolean().default(true),
    remark: z.string().max(200, { message: "Remark must be at most 200 characters" }).optional(),
    // schoolmember: z.string().max(50, { message: "School member must be at most 50 characters" }).optional(),
});

export const familyUserSchema = z.object({
    ...UserSchema.shape,
    ...FamilySchema.shape,
});

// 3. The Class Config
export const familyConfig: EntityConfig<FamilyTable> = {
    table: family,
    tableName: "family",
    primaryKey: "familyid",
    formSchema: familyUserSchema,
};
