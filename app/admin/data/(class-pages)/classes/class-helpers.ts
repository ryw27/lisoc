import { classes } from "@/lib/db/schema";
import { generateColumnDefs } from "@/lib/data-view";
import { z } from 'zod';
import { formatISO } from "date-fns";
import { makeEntity } from "@/lib/data-view/actions/makeEntity/makeEntity";
import { EntityConfig } from "@/lib/data-view/types";
import { type Extras, type enrichFields, type uniqueCheckFields } from "@/lib/data-view/types";
import { parsedParams } from "@/lib/data-view/types";

//----------------------------------------------------------------------------------------
// CLASSES
//----------------------------------------------------------------------------------------


// Form Schema: Form schema is not necessarily the same as database schema
export const classFormSchema = z.object({
    classnamecn: z.string().min(1),
    classnameen: z.string().min(1),
    typeid: z.coerce.number().int().positive(), // Select strings from dropdown, but values are numbers increasing from 1 correctly
    classno: z.coerce.number().int().nonnegative(), // Coerce string from form to number
    sizelimits: z.coerce.number().int().nonnegative().optional(), // Coerce string from form to number, optional
    status: z.enum(["Active", "Inactive"]), 
    // ENRICHED
    classupid: z.string().min(1), // Start as a string, selected class name. id found later
    description: z.string().optional() // optional
})

// Type of any class insertions: for compile-time type checking. This is just the shape of the table schema
// inferSelect is used to get the type of the table, classes is just the drizzle schema table
export type classObject = typeof classes.$inferSelect
// This is the actual internal representation from drizzle, PgTable type
export type classTable = typeof classes



export const classColumns = generateColumnDefs<classObject>(classes, {
    classid: {
        header: "Class ID",
    },
    classindex: {
        header: "Class Index",
    },
    ageid: {
        header: "Age ID",
    },
    typeid: {
        header: "Type ID",
    },
    classno: {
        header: "Class Number",
    },
    classnamecn: {
        header: "Class Name (CN)",
        enableHiding: false
    },
    classupid: {
        header: "Upgrade Class ID",
    },
    classnameen: {
        header: "Class Name (EN)",
        enableHiding: false
    },
    sizelimits: {
        header: "Size Limits",
    },
    status: {
        header: "Status",
    },
    description: {
        header: "Description",
    },
    lastmodify: {
        header: "Last Modified",
    },
    createby: {
        header: "Created By",
    },
    createon: {
        header: "Created On",
    },
    updateby: {
        header: "Updated By",
    },
    updateon: {
        header: "Updated On",
    },
});
// const classEnrichFields: enrichField<"classes",typeof classFormSchema>[] = [
//     {formField: "upgradeclass", lookupTable: "classes", lookupField: "classnamecn", returnField: "classid"}
// ]

const classEnrichFields: enrichFields<typeof classFormSchema>[] =  [
    { formField: "classupid", lookupTable: "classes", lookupField: "classnamecn", returnField: "classid" }
]

const classUniqueConstraints: uniqueCheckFields<"classes", classTable, typeof classFormSchema>[] = [
    {tableCol: "classnamecn", formCol: "classnamecn"},
]

const insertExtras: Extras<"classes", classTable>= {
    "classindex": undefined,
    "ageid": undefined,
    "createon": formatISO(new Date()),
    "lastmodify": formatISO(new Date()),
    "updateon": formatISO(new Date())
}

const updateExtras: Extras<"classes", classTable>= {
    "classindex": undefined,
    "ageid": undefined,
    "lastmodify": formatISO(new Date()),
    "updateon": formatISO(new Date())
}





export const classConfig: EntityConfig<"classes", classTable> = makeEntity({
    table: classes,
    tableName: "classes",
    primaryKey: "classid",
    formSchema: classFormSchema,
    mainPath: "/admintest/dashboard/data/classes",
    enrichFields: classEnrichFields,
    uniqueConstraints: classUniqueConstraints,
    insertExtras: insertExtras,
    updateExtras: updateExtras,
    columns: classColumns
})

export const classOperations = classConfig.ops;

export async function deleteClassRows(ids: number[]) {
  "use server";
  return classOperations.deleteRows(ids);
}

export async function insertClassRow(formData: FormData) {
  "use server";
  return classOperations.insertRow(formData);
}

export async function updateClassRow(id: number, formData: FormData) {
  "use server";
  return classOperations.updateRow(id, formData);
}

// Server-only helpers – no action wrapper needed
export async function pageClassRows(opts: parsedParams) {
  "use server";
  return classOperations.pageRows(opts);
}

export async function allClassRows() {
  "use server";
  return classOperations.allRows();
}

export async function idClassRow(id: number) {
  "use server";
  return classOperations.idRow(id);
}

