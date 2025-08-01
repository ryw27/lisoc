import { family } from "@/lib/db/schema";
import { generateColumnDefs } from "@/lib/data-view";
import { z } from 'zod';
import { makeEntity } from "@/lib/data-view/actions/makeEntity/makeEntity";
import { type Extras, type uniqueCheckFields, type parsedParams, type EntityConfig } from "@/lib/data-view/types";

//----------------------------------------------------------------------------------------
// FAMILIES
//----------------------------------------------------------------------------------------

// Form Schema: Form schema for family - updated to match current schema
export const familyFormSchema = z.object({
    fatherfirsten: z.string().optional(),
    fatherlasten: z.string().optional(),
    fathernamecn: z.string().optional(),
    motherfirsten: z.string().optional(),
    motherlasten: z.string().optional(),
    mothernamecn: z.string().optional(),
    address1: z.string().optional(),
})

// Type of any family insertions: for compile-time type checking
export type familyObject = typeof family.$inferSelect
export type familyTable = typeof family

export const familyColumns = generateColumnDefs<familyObject>(family, {
    familyid: {
        header: "Family ID",
    },
    userid: {
        header: "User ID",
    },
    fatherfirsten: {
        header: "Father First Name",
    },
    fatherlasten: {
        header: "Father Last Name",
    },
    fathernamecn: {
        header: "Father Name (CN)",
    },
    motherfirsten: {
        header: "Mother First Name",
    },
    motherlasten: {
        header: "Mother Last Name",
    },
    mothernamecn: {
        header: "Mother Name (CN)",
    },
    address1: {
        header: "Address Line 1",
    },
});

const familyUniqueConstraints: uniqueCheckFields<"family", familyTable, typeof familyFormSchema>[] = []

const insertExtras: Extras<"family", familyTable>= {
    "userid": "", // This will be set elsewhere
}

const updateExtras: Extras<"family", familyTable>= {
}

export const familyConfig: EntityConfig<"family", familyTable> = makeEntity({
    table: family,
    tableName: "family",
    primaryKey: "familyid",
    formSchema: familyFormSchema,
    mainPath: "/admintest/dashboard/data/families",
    enrichFields: [],
    uniqueConstraints: familyUniqueConstraints,
    insertExtras: insertExtras,
    updateExtras: updateExtras,
    columns: familyColumns
})

export const familyOperations = familyConfig.ops;

export async function deleteFamilyRows(ids: number[]) {
  "use server";
  return familyOperations.deleteRows(ids);
}

export async function insertFamilyRow(formData: FormData) {
  "use server";
  return familyOperations.insertRow(formData);
}

export async function updateFamilyRow(id: number, formData: FormData) {
  "use server";
  return familyOperations.updateRow(id, formData);
}

// Server-only helpers – no action wrapper needed
export async function pageFamilyRows(opts: parsedParams) {
  "use server";
  return familyOperations.pageRows(opts);
}

export async function allFamilyRows() {
  "use server";
  return familyOperations.allRows();
}

export async function idFamilyRow(id: number) {
  "use server";
  return familyOperations.idRow(id);
} 