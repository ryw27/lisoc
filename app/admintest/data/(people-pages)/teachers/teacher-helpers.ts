import { teacher} from "@/lib/db/schema";
import { generateColumnDefs } from "@/lib/data-view";
import { z } from 'zod';
import { makeEntity } from "@/lib/data-view/actions/makeEntity/makeEntity";
import { type Extras, type enrichFields, type uniqueCheckFields, type parsedParams, type EntityConfig } from "@/lib/data-view/types";
import { PKVal } from "@/lib/data-view/types";

//----------------------------------------------------------------------------------------
// TEACHERS
//----------------------------------------------------------------------------------------

// Form Schema: Form schema for teacher - updated to match current schema
export const teacherFormSchema = z.object({
    namecn: z.string().min(1),
    address1: z.string().min(1),
})

// Type of any teacher insertions: for compile-time type checking
export type teacherObject = typeof teacher.$inferSelect
export type teacherTable = typeof teacher

export const teacherColumns = generateColumnDefs<teacherObject>(teacher, {
    teacherid: {
        header: "Teacher ID",
    },
    userid: {
        header: "User ID",
    },
    namecn: {
        header: "Name (CN)",
        enableHiding: false
    },
    address1: {
        header: "Address Line 1",
    },
});

const teacherEnrichFields: enrichFields<typeof teacherFormSchema>[] =  [
]

const teacherUniqueConstraints: uniqueCheckFields<"teacher", teacherTable, typeof teacherFormSchema>[] = [
    {tableCol: "namecn", formCol: "namecn"},
]

const insertExtras: Extras<"teacher", teacherTable>= {
    "userid": "", // This will be set elsewhere
    "createby": "admin",
    "updateby": "admin",
}

const updateExtras: Extras<"teacher", teacherTable>= {
    "updateby": "admin",
}

export const teacherConfig: EntityConfig<"teacher", teacherTable> = makeEntity({
    table: teacher,
    tableName: "teacher",
    primaryKey: "teacherid",
    formSchema: teacherFormSchema,
    mainPath: "/admintest/dashboard/data/teachers",
    enrichFields: teacherEnrichFields,
    uniqueConstraints: teacherUniqueConstraints,
    insertExtras: insertExtras,
    updateExtras: updateExtras,
    columns: teacherColumns
})

export const teacherOperations = teacherConfig.ops;

export async function deleteTeacherRows(id: PKVal<"teacher">[]) {
  "use server";
  return teacherOperations.deleteRows(id);
}

export async function insertTeacherRow(formData: FormData) {
  "use server";
  return teacherOperations.insertRow(formData);
}

export async function updateTeacherRow(id: number, formData: FormData) {
  "use server";
  return teacherOperations.updateRow(id, formData);
}

// Server-only helpers – no action wrapper needed
export async function pageTeacherRows(opts: parsedParams) {
  "use server";
  return teacherOperations.pageRows(opts);
}

export async function allTeacherRows() {
  "use server";
  return teacherOperations.allRows();
}

export async function idTeacherRow(id: number) {
  "use server";
  return teacherOperations.idRow(id);
}