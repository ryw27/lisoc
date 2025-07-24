import { adminuser } from "@/app/lib/db/schema";
import { generateColumnDefs } from "@/app/lib/column-actions";
import { z } from 'zod';
import { formatISO } from "date-fns";
import { makeEntity, EntityConfig } from "@/app/lib/entity-config";
import { type Extras, type uniqueCheckFields } from "@/app/lib/data-actions";
import { parsedParams } from "@/app/lib/handle-params";

//----------------------------------------------------------------------------------------
// ADMINISTRATORS
//----------------------------------------------------------------------------------------


// Form Schema: Form schema for administrator user
export const administratorFormSchema = z.object({
    namecn: z.string().min(1),
    namelasten: z.string().min(1),
    namefirsten: z.string().min(1),
    roleid: z.coerce.number().int().positive(),
    address2: z.string().optional(),
    familyid: z.coerce.number().int().optional(),
    ischangepwdnext: z.boolean().default(false),
    status: z.boolean().default(true),
    notes: z.string().optional()
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
    roleid: {
        header: "Role ID",
    },
    namecn: {
        header: "Name (CN)",
        enableHiding: false
    },
    namelasten: {
        header: "Last Name",
        enableHiding: false
    },
    namefirsten: {
        header: "First Name",
        enableHiding: false
    },
    address2: {
        header: "Address Line 2",
    },
    familyid: {
        header: "Family ID",
    },
    createby: {
        header: "Created By",
    },
    updateby: {
        header: "Updated By",
    },
    updateon: {
        header: "Updated On",
    },
    ischangepwdnext: {
        header: "Change Password Next Login",
    },
    status: {
        header: "Status",
        enableHiding: false
    },
    notes: {
        header: "Notes",
    },
});

const administratorUniqueConstraints: uniqueCheckFields<"adminuser", administratorTable, typeof administratorFormSchema>[] = [
    {tableCol: "namecn", formCol: "namecn"},
]

const insertExtras: Extras<"adminuser", administratorTable>= {
    "userid": "", // This will be set elsewhere
    "createby": "admin",
    "updateby": "admin",
    "updateon": formatISO(new Date())
}

const updateExtras: Extras<"adminuser", administratorTable>= {
    "updateby": "admin",
    "updateon": formatISO(new Date())
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