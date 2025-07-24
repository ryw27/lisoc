import { classrooms } from "@/app/lib/db/schema";
import { generateColumnDefs } from "@/app/lib/column-actions";
import { z } from 'zod';
import { makeEntity, EntityConfig } from "@/app/lib/entity-config";
import { type Extras, type uniqueCheckFields } from "@/app/lib/data-actions";
import { parsedParams } from "@/app/lib/handle-params";

//----------------------------------------------------------------------------------------
// CLASSROOMS
//----------------------------------------------------------------------------------------


// Form Schema: Form schema is not necessarily the same as database schema
export const classroomFormSchema = z.object({
    roomno: z.string().min(1),
    roomcapacity: z.coerce.number().int().nonnegative(),
    status: z.enum(["Active", "Inactive"]), 
    notes: z.string().optional()
})

// Type of any class insertions: for compile-time type checking. This is just the shape of the table schema
// inferSelect is used to get the type of the table, classes is just the drizzle schema table
export type classroomObject = typeof classrooms.$inferSelect
// This is the actual internal representation from drizzle, PgTable type
export type classroomTable = typeof classrooms



export const classroomColumns = generateColumnDefs<classroomObject>(classrooms, {
    roomid: {
        header: "Room ID",
    },
    roomno: {
        header: "Room Number",
        enableHiding: false
    },
    roomcapacity: {
        header: "Room Capacity",
    },
    status: {
        header: "Status",
    },
    notes: {
        header: "Notes",
    },
});



const classroomUniqueConstraints: uniqueCheckFields<"classrooms", classroomTable, typeof classroomFormSchema>[] = [
    {tableCol: "roomno", formCol: "roomno"},
]

const insertExtras: Extras<"classrooms", classroomTable>= {
}

const updateExtras: Extras<"classrooms", classroomTable>= {
}





export const classroomConfig: EntityConfig<"classrooms", classroomTable> = makeEntity({
    table: classrooms,
    tableName: "classrooms",
    primaryKey: "roomid",
    formSchema: classroomFormSchema,
    mainPath: "/admintest/dashboard/data/classrooms",
    enrichFields: [],
    uniqueConstraints: classroomUniqueConstraints,
    insertExtras: insertExtras,
    updateExtras: updateExtras,
    columns: classroomColumns
})

export const classroomOperations = classroomConfig.ops;

export async function deleteClassroomRows(ids: number[]) {
  "use server";
  return classroomOperations.deleteRows(ids);
}

export async function insertClassroomRow(formData: FormData) {
  "use server";
  return classroomOperations.insertRow(formData);
}

export async function updateClassroomRow(id: number, formData: FormData) {
  "use server";
  return classroomOperations.updateRow(id, formData);
}

// Server-only helpers – no action wrapper needed
export async function pageClassroomRows(opts: parsedParams) {
  "use server";
  return classroomOperations.pageRows(opts);
}

export async function allClassroomRows() {
  "use server";
  return classroomOperations.allRows();
}

export async function idClassroomRow(id: number) {
  "use server";
  return classroomOperations.idRow(id);
}

