import { arrangement } from "@/lib/db/schema";
import { z } from "zod/v4";
import { type EntityConfig } from "@/lib/data-view/types";
import { type Extras } from "@/lib/data-view/types";
import { toESTString } from "@/lib/utils";
import { DefaultSession } from "next-auth";
import { InferSelectModel } from "drizzle-orm";


// 1. Types
export type ArrangementTable = typeof arrangement
export type ArrangementObject = InferSelectModel<ArrangementTable>


// 2. Form Schema
export const arrangementFormSchema = z.object({
	seasonid: z.coerce.number({ message: "Invalid season selected"}).int().min(0, { message: "Invalid season selected"}).default(0),
	classid: z.coerce.number({ message: "Invalid class selected"}).int().min(0, { message: "Invalid class selected"}).default(0),
	teacherid: z.coerce.number({ message: "Invalid teacher selected"}).int().min(0, { message: "Invalid teacher selected"}).default(0),
	roomid: z.coerce.number({ message: "Invalid room selected"}).int().min(0, { message: "Invalid room selected"}).default(0),
	timeid: z.coerce.number({ message: "Invalid time selected"}).int().min(0, { message: "Invalid time selected"}).default(0),
	seatlimit: z.coerce.number({ message: "Invalid seat limit"}).int().min(0, { message: "Seat limit must be positive"}).default(25),
	agelimit: z.coerce.number({ message: "Invalid age limit"}).int().min(0, { message: "Age limit must be positive"}).default(0),
	suitableterm: z.coerce.number({ message: "Invalid suitable term"}).int().min(0, { message: "Invalid suitable term"}).default(1),
	waiveregfee: z.boolean().default(false),
	activestatus: z.enum(["Active", "Inactive"]).default("Active"),
	regstatus: z.enum(["Open", "Closed"]).default("Closed"),
	closeregistration: z.boolean().default(false),
	notes: z.string().max(250, { message: "Notes must be at most 250 characters" }).optional(),
	lastmodify: z.date({ message: "Invalid last modified date" }).default(new Date(toESTString(new Date('1900-01-01')))),
	updateby: z.string().max(50, { message: "Update by must be at most 50 characters" }).default(""),
	tuitionW: z.coerce.number({ message: "Invalid tuition W"}).min(0, { message: "Tuition W must be positive"}).default(0),
	specialfeeW: z.coerce.number({ message: "Invalid special fee W"}).min(0, { message: "Special fee W must be positive"}).default(0),
	bookfeeW: z.coerce.number({ message: "Invalid book fee W"}).min(0, { message: "Book fee W must be positive"}).default(0),
	tuitionH: z.coerce.number({ message: "Invalid tuition H"}).min(0, { message: "Tuition H must be positive"}).default(0),
	specialfeeH: z.coerce.number({ message: "Invalid special fee H"}).min(0, { message: "Special fee H must be positive"}).default(0),
	bookfeeH: z.coerce.number({ message: "Invalid book fee H"}).min(0, { message: "Book fee H must be positive"}).default(0),
	isregclass: z.boolean().default(false),
})


// 3. Create/Update extras
export const makeArrangementInsertExtras = (user: DefaultSession["user"]) => {
    const insertExtras: Extras<ArrangementTable> = {
        lastmodify: toESTString(new Date()),
        updateby: user?.name || user?.email || "Unknown admin"
    };
    return insertExtras;
}

export const makeArrangementUpdateExtras = (user: DefaultSession["user"]) => {
    const updateExtras: Extras<ArrangementTable> = {
        lastmodify: toESTString(new Date()),
        updateby: user?.name || user?.email || "Unknown admin"
    }
    return updateExtras;
}


// 4. The Arrangement Config
export const arrangementConfig: EntityConfig<ArrangementTable> = {
    table: arrangement,
    tableName: "arrangement",
    primaryKey: "arrangeid",
    formSchema: arrangementFormSchema,
    makeInsertExtras: makeArrangementInsertExtras,
    makeUpdateExtras: makeArrangementUpdateExtras
}