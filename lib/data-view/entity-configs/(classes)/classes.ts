import { classes } from "@/lib/db/schema";
import { z } from "zod/v4";
import { type EntityConfig } from "@/lib/data-view/types";
import { type Extras } from "@/lib/data-view/types";
import { toESTString } from "@/lib/utils";
import { DefaultSession } from "next-auth";
import { InferSelectModel } from "drizzle-orm";


// 1. Types
export type ClassTable = typeof classes
export type ClassObject = InferSelectModel<typeof classes>

// 2. Form Schema: Form schema is not necessarily the same as database schema
export const classFormSchema = z.object({
	ageid: z.coerce.number({ message: "Age ID must be a number"}).int().min(1, { message: "Age ID must be positive"}),
    typeid: z.coerce.number({ message: "Type ID must be a number"})
        .int()
        .min(1, { message: "Type ID must be positive"}),
    gradeclassid: z.coerce.number({ message: "Grade Class ID must be a number" })
        .transform(val => val === 0 ? 1 : val)
        .pipe(z.number().int().min(0, { message: "Grade Class ID must be positive" })),
    classno: z.coerce.number({ message: "Grade Level must be a number"})
        .int()
        .min(0, { message: "Grade level must be positive"}),
    classnamecn: z
        .string()
        .min(1, { message: "Class Name (CN) is required" })
        .max(100, { message: "Class Name (CN) is too long" }),
    classnameen: z
        .string()
        .min(1, { message: "Class Name (EN) is required" })
        .max(100, { message: "Class Name (EN) is too long" }),
    classupid: z.coerce.number({ message: "Upgrade Class ID must be a number"})
        .int()
        .min(1, { message: "Upgrade Class ID must be positive"}),
    sizelimits: z.coerce.number({ message: "Size Limits must be a number"})
        .int()
        .min(0, { message: "Size Limits must be positive or 0. If you don't want to set a size limit, leave it blank"})
        .default(0),
    status: z.enum(["Active", "Inactive"], { message: "Status must be Active or Inactive"}),
    description: z.string().optional(),
})

// 3. Create Insert and update extras. Used for when there are non obvious fields that can be easily resolved
export const makeClassInsertExtras = (user: DefaultSession["user"]) => {
    const insertExtras: Extras<ClassTable>= {
        "createon": toESTString(new Date()),
        "lastmodify": toESTString(new Date()),
        "updateon": toESTString(new Date()),
        "createby": user?.name || "",
        "updateby": user?.name || ""
    }
    return insertExtras;
}
const makeClassUpdateExtras = (user: DefaultSession["user"]) => {
    const updateExtras: Extras<ClassTable>= {
        "lastmodify": toESTString(new Date()),
        "updateon": toESTString(new Date()),
        "updateby": user?.name || ""
    }
    return updateExtras;
}


// 4. The Class Config
export const classConfig: EntityConfig<ClassTable> = {
    table: classes,
    tableName: "classes",
    primaryKey: "classid",
    formSchema: classFormSchema,
    makeInsertExtras: makeClassInsertExtras,
    makeUpdateExtras: makeClassUpdateExtras
}

