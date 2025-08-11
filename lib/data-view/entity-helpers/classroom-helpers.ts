import { classrooms } from "@/lib/db/schema";
import { z } from "zod/v4";
import { type EntityConfig } from "@/lib/data-view/types";
import { type Extras } from "@/lib/data-view/types";
import { toESTString } from "@/lib/utils";
import { DefaultSession } from "next-auth";
import { InferSelectModel } from "drizzle-orm";

// 1. Types
export type ClassroomTable = typeof classrooms 
export type ClassroomObject = InferSelectModel<typeof classrooms>

// 2. Form Schema
export const classroomFormSchema = z.object({
    roomno: z
        .string()
        .min(1, { message: "Room number is required" }),
    roomcapacity: z
        .coerce.number({ message: "Room capacity must be a number" })
        .int({ message: "Room capacity must be an integer" })
        .min(0, { message: "Room capacity cannot be negative" }),
    status: z.enum(["Active", "Inactive"], { message: "Status must be either Active or Inactive" }),
    notes: z
        .string()
        .max(1000, { message: "Note must be less than 1000 characters"})
        .optional()
})

// 3. Classroom config
export const classroomConfig: EntityConfig<ClassroomTable> = {
    table: classrooms,
    tableName: "classrooms",
    primaryKey: "roomid",
    formSchema: classroomFormSchema
}