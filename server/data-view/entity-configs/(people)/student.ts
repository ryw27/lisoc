import { InferSelectModel } from "drizzle-orm";
import { z } from "zod/v4";
import { student } from "@/lib/db/schema";
import { toESTString } from "@/lib/utils";
import { type EntityConfig, type Extras } from "@/types/dataview.types";

// 1. Types
export type StudentTable = typeof student;
export type StudentObject = InferSelectModel<StudentTable>;

// 2. Form Schema
export const studentFormSchema = z.object({
    familyid: z.coerce
        .number({ message: "Family ID must be a number" })
        .int()
        .min(1, { message: "Family ID must be positive" }),
    studentno: z.string().max(20, { message: "Student number must be at most 20 characters" }),
    namecn: z
        .string()
        .min(1, { message: "Chinese name is required" })
        .max(50, { message: "Chinese name must be at most 50 characters" }),
    namelasten: z
        .string()
        .min(1, { message: "Last name is required" })
        .max(50, { message: "Last name must be at most 50 characters" }),
    namefirsten: z
        .string()
        .min(1, { message: "First name is required" })
        .max(50, { message: "First name must be at most 50 characters" }),
    gender: z.enum(["Male", "Female", "Other"]),
    age: z.coerce
        .number({ message: "Age must be a number" })
        .int()
        .min(0, { message: "Age must be positive" }),
    dob: z
        .date({ message: "Date of birth must be a valid date" })
        .default(new Date(toESTString(new Date("1900-01-01")))),
    active: z.boolean().default(false),
    notes: z.string().max(200, { message: "Notes must be at most 200 characters" }).optional(),
});

// 3. Create and update extras
export const makeStudentInsertExtras = () => {
    const insertExtras: Extras<StudentTable> = {
        createddate: toESTString(new Date()),
        lastmodify: toESTString(new Date()),
    };
    return insertExtras;
};

export const makeStudentUpdateExtras = () => {
    const updateExtras: Extras<StudentTable> = {
        lastmodify: toESTString(new Date()),
    };
    return updateExtras;
};

// 4. The Student Config
export const studentConfig: EntityConfig<StudentTable> = {
    table: student,
    tableName: "student",
    primaryKey: "studentid",
    formSchema: studentFormSchema,
    makeInsertExtras: makeStudentInsertExtras,
    makeUpdateExtras: makeStudentUpdateExtras,
};
