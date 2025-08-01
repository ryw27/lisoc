import { adminuser } from "@/lib/db/schema";
import { generateColumnDefs } from "@/lib/data-view";
import { z } from 'zod';
import { makeEntity } from "@/lib/data-view/actions/makeEntity/makeEntity";
import { type Extras, type uniqueCheckFields, type parsedParams, type EntityConfig } from "@/lib/data-view/types";

//----------------------------------------------------------------------------------------
// ADMINISTRATORS
//----------------------------------------------------------------------------------------


// Form Schema: Form schema for administrator user
export const administratorFormSchema = z.object({
    namecn: z.string().min(1),
    address1: z.string().optional(),
    ischangepwdnext: z.boolean().default(false),
    status: z.boolean().default(true),
})

// Type of any admin insertions: for compile-time type checking
export type administratorObject = typeof adminuser.$inferSelect
export type administratorTable = typeof adminuser
export const administratorColumns = generateColumnDefs<administratorObject>(adminuser, {
    adminid: {
        header: "Admin ID",
    },
    userid: {
        header: "User ID",
    },
    namecn: {
        header: "Name (CN)",
        enableHiding: false
    },
    createby: {
        header: "Created By",
    },
    updateby: {
        header: "Updated By",
    },
    ischangepwdnext: {
        header: "Change Password Next Login",
    },
    status: {
        header: "Status",
        enableHiding: false
    },
});

const administratorUniqueConstraints: uniqueCheckFields<"adminuser", administratorTable, typeof administratorFormSchema>[] = [
    {tableCol: "namecn", formCol: "namecn"},
]

const insertExtras: Extras<"adminuser", administratorTable>= {
    "userid": "", // This will be set elsewhere
    "createby": "admin",
    "updateby": "admin",
}

const updateExtras: Extras<"adminuser", administratorTable>= {
    "updateby": "admin",
}

export const administratorConfig: EntityConfig<"adminuser", administratorTable> = makeEntity({
    table: adminuser,
    tableName: "adminuser",
    primaryKey: "adminid",
    formSchema: administratorFormSchema,
    mainPath: "/admintest/dashboard/data/administrators",
    enrichFields: [],
    uniqueConstraints: administratorUniqueConstraints,
    insertExtras: insertExtras,
    updateExtras: updateExtras,
    columns: administratorColumns
})

export const administratorOperations = administratorConfig.ops;

export async function deleteAdministratorRows(ids: number[]) {
  "use server";
  return administratorOperations.deleteRows(ids);
}

export async function insertAdministratorRow(formData: FormData) {
  "use server";
  return administratorOperations.insertRow(formData);
}

export async function updateAdministratorRow(id: number, formData: FormData) {
  "use server";
  return administratorOperations.updateRow(id, formData);
}

// Server-only helpers – no action wrapper needed
export async function pageAdministratorRows(opts: parsedParams) {
  "use server";
  return administratorOperations.pageRows(opts);
}

export async function allAdministratorRows() {
  "use server";
  return administratorOperations.allRows();
}

export async function idAdministratorRow(id: number) {
  "use server";
  return administratorOperations.idRow(id);
} 