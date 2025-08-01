import { student } from "@/lib/db/schema";
import { generateColumnDefs } from "@/lib/data-view";
import { z } from 'zod';
import { formatISO } from "date-fns";
import { makeEntity } from "@/lib/data-view/actions/makeEntity/makeEntity";
import { type Extras, type enrichFields, type uniqueCheckFields, type parsedParams, type EntityConfig } from "@/lib/data-view/types";



//----------------------------------------------------------------------------------------
// STUDENTS
//----------------------------------------------------------------------------------------


// Form Schema: Form schema for student
export const studentFormSchema = z.object({
    familyid: z.coerce.number().int().positive(),
    studentno: z.string().optional(),
    namecn: z.string().optional(),
    namelasten: z.string().min(1),
    namefirsten: z.string().min(1),
    gender: z.string().optional(),
    ageof: z.string().optional(),
    age: z.coerce.number().int().nonnegative().optional(),
    dob: z.string().min(1),
    active: z.boolean().default(true),
    notes: z.string().optional(),
    upgradable: z.coerce.number().int().nonnegative().default(0)
})

// Type of any student insertions: for compile-time type checking. This is just the shape of the table schema
// inferSelect is used to get the type of the table, classes is just the drizzle schema table
export type studentObject = typeof student.$inferSelect
// This is the actual internal representation from drizzle, PgTable type
export type studentTable = typeof student

export const studentColumns = generateColumnDefs<studentObject>(student, {
    studentid: {
        header: "Student ID",
    },
    familyid: {
        header: "Family ID",
    },
    studentno: {
        header: "Student Number",
    },
    namecn: {
        header: "Name (CN)",
    },
    namelasten: {
        header: "Last Name",
        enableHiding: false
    },
    namefirsten: {
        header: "First Name",
        enableHiding: false
    },
    gender: {
        header: "Gender",
    },
    ageof: {
        header: "Age Group",
    },
    age: {
        header: "Age",
    },
    dob: {
        header: "Date of Birth",
        enableHiding: false
    },
    active: {
        header: "Active",
        enableHiding: false
    },
    createddate: {
        header: "Created Date",
    },
    lastmodify: {
        header: "Last Modified",
    },
    notes: {
        header: "Notes",
    },
    upgradable: {
        header: "Upgradable",
    }
})


const studentEnrichFields: enrichFields<typeof studentFormSchema>[] =  [
    { formField: "familyid", lookupTable: "family", lookupField: "familyid", returnField: "familyid" }
]

const studentUniqueConstraints: uniqueCheckFields<"student", studentTable, typeof studentFormSchema>[] = [
    {tableCol: "studentno", formCol: "studentno"},
]

const insertExtras: Extras<"student", studentTable>= {
    "lastmodify": formatISO(new Date()),
}

const updateExtras: Extras<"student", studentTable>= {
    "lastmodify": formatISO(new Date())
}

export const studentConfig: EntityConfig<"student", studentTable> = makeEntity({
    table: student,
    tableName: "student",
    primaryKey: "studentid",
    formSchema: studentFormSchema,
    mainPath: "/admintest/dashboard/data/students",
    enrichFields: studentEnrichFields,
    uniqueConstraints: studentUniqueConstraints,
    insertExtras: insertExtras,
    updateExtras: updateExtras,
    columns: studentColumns
})

export const studentOperations = studentConfig.ops;

export async function deleteStudentRows(ids: number[]) {
  "use server";
  return studentOperations.deleteRows(ids);
}

export async function insertStudentRow(formData: FormData) {
  "use server";
  return studentOperations.insertRow(formData);
}

export async function updateStudentRow(id: number, formData: FormData) {
  "use server";
  return studentOperations.updateRow(id, formData);
}

// Server-only helpers – no action wrapper needed
export async function pageStudentRows(opts: parsedParams) {
  "use server";
  return studentOperations.pageRows(opts);
}

export async function allStudentRows() {
  "use server";
  return studentOperations.allRows();
}

export async function idStudentRow(id: number) {
  "use server";
  return studentOperations.idRow(id);
}


