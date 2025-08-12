import { teacher } from "@/lib/db/schema";
import { z } from "zod/v4";
import { Extras, type EntityConfig } from "@/lib/data-view/types";
import { InferSelectModel } from "drizzle-orm";
import { DefaultSession } from "next-auth";
import { toESTString } from "@/lib/utils";


// 1. Types
export type TeacherTable = typeof teacher
export type TeacherObject = InferSelectModel<TeacherTable>

// 2. Form Schema: Form schema is not necessarily the same as database schema
export const teacherFormSchema = z.object({
	namecn: z.string().min(1, { message: "Chinese name is required" }).max(50, { message: "Chinese name must be at most 50 characters" }),
	namelasten: z.string().min(1, { message: "Last name is required" }).max(50, { message: "Last name must be at most 50 characters" }),
	namefirsten: z.string().min(1, { message: "First name is required" }).max(50, { message: "First name must be at most 50 characters" }),
	teacherindex: z.coerce.number({ message: "Teacher index must be a number"}).int().min(0, { message: "Teacher index must be positive"}).optional(),
	classtypeid: z.coerce.number({ message: "Class type ID must be a number"}).int().min(0, { message: "Class type ID must be positive"}).default(1),
	status: z.enum(["Active", "Inactive"]).default("Active"),
	address1: z.string().max(100, { message: "Address must be at most 100 characters" }).optional(),
	subject: z
        .string()
        .max(20, { message: "Subject must be at most 20 characters" })
        .default("")
        .optional(),
	profile: z
        .string()
        .max(2000, { message: "Profile must be at most 2000 characters" })
        .default("")
        .optional(),
})

// 3. Create/Update extras
export const makeTeacherInsertExtras = (user: DefaultSession["user"]) => {
    const insertExtras: Extras<TeacherTable> = {
        createby: user?.name || user?.email || "Unknown admin",
        updateby: user?.name || user?.email || "Unknown admin"
    };
    return insertExtras;
}

export const makeTeacherUpdateExtras = (user: DefaultSession["user"]) => {
    const updateExtras: Extras<TeacherTable> = {
        updateby: user?.name || user?.email || "Unknown admin"
    }
    return updateExtras;
}


// 4. The Class Config
export const teacherConfig: EntityConfig<TeacherTable> = {
    table: teacher,
    tableName: "teacher",
    primaryKey: "teacherid",
    formSchema: teacherFormSchema,
    makeInsertExtras: makeTeacherInsertExtras,
    makeUpdateExtras: makeTeacherUpdateExtras
}
