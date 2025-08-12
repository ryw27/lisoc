import { classregistration } from "@/lib/db/schema";
import { z } from "zod/v4";
import { type EntityConfig } from "@/lib/data-view/types";
import { InferSelectModel } from "drizzle-orm";


// 1. Types
export type ClassRegistrationTable = typeof classregistration
export type ClassRegistrationObject = InferSelectModel<ClassRegistrationTable>


// 2. Form Schema. Class Registration should never be created or updated individually. It is only used for display.
// If it must, go to postgres itself.
export const classRegistrationFormSchema = z.object({
	// appliedid: z.coerce.number({ message: "Invalid applied ID"}).int().min(0, { message: "Applied ID must be positive"}).default(0),
	// studentid: z.coerce.number({ message: "Invalid student ID"}).int().min(0, { message: "Student ID must be positive"}),
	// arrangeid: z.coerce.number({ message: "Invalid arrange ID"}).int().min(0, { message: "Arrange ID must be positive"}).default(0),
	// seasonid: z.coerce.number({ message: "Invalid season ID"}).int().min(0, { message: "Season ID must be positive"}),
	// isyearclass: z.boolean().default(false),
	// classid: z.coerce.number({ message: "Invalid class ID"}).int().min(0, { message: "Class ID must be positive"}),
	// registerdate: z.date({ message: "Invalid register date" }).default(new Date(toESTString(new Date('1900-01-01')))),
	// statusid: z.coerce.number({ message: "Invalid status ID"}).int().min(0, { message: "Status ID must be positive"}).default(1),
	// previousstatusid: z.coerce.number({ message: "Invalid previous status ID"}).int().min(0, { message: "Previous status ID must be positive"}).default(0),
	// familybalanceid: z.coerce.number({ message: "Invalid family balance ID"}).int().min(0, { message: "Family balance ID must be positive"}).default(0),
	// familyid: z.coerce.number({ message: "Invalid family ID"}).int().min(0, { message: "Family ID must be positive"}).default(0),
	// newbalanceid: z.coerce.number({ message: "Invalid new balance ID"}).int().min(0, { message: "New balance ID must be positive"}).default(0),
	// isdropspring: z.boolean().default(false),
	// byadmin: z.boolean().default(false),
	// lastmodify: z.date({ message: "Invalid last modified date" }).default(new Date(toESTString(new Date('1900-01-01')))),
	// notes: z.string().max(500, { message: "Notes must be at most 500 characters" }).optional(),
})


// 3. Create/Update extras
// export const makeClassRegistrationInsertExtras = (user: DefaultSession["user"]) => {
//     const insertExtras: Extras<ClassRegistrationTable> = {
//         registerdate: toESTString(new Date()),
//         lastmodify: toESTString(new Date()),
//     };
//     return insertExtras;
// }

// export const makeClassRegistrationUpdateExtras = (user: DefaultSession["user"]) => {
//     const updateExtras: Extras<ClassRegistrationTable> = {
//         lastmodify: toESTString(new Date()),
//     }
//     return updateExtras;
// }


// 4. The Class Registration Config
export const classRegistrationConfig: EntityConfig<ClassRegistrationTable> = {
    table: classregistration,
    tableName: "classregistration",
    primaryKey: "regid",
    formSchema: classRegistrationFormSchema,
}