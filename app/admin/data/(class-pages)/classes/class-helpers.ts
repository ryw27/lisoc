import { classes } from "@/lib/db/schema";
// import { generateColumnDefs } from "@/lib/data-view";
import { z } from 'zod';
import { makeEntity } from "@/lib/data-view/actions/makeEntity/makeEntity";
import { EntityConfig, FilterableColumn } from "@/lib/data-view/types";
import { type Extras } from "@/lib/data-view/types";
import { parsedParams } from "@/lib/data-view/types";
import { classTypeMap, toESTString } from "@/lib/utils";
import { getSelectOptions } from "@/lib/registration/semester";
import { DefaultSession } from "next-auth";

//----------------------------------------------------------------------------------------
// CLASSES
//----------------------------------------------------------------------------------------

export type classObject = typeof classes.$inferSelect

// This is the actual internal representation from drizzle, PgTable type
export type classTable = typeof classes

const { idMaps } = await getSelectOptions();

export const classColumns: FilterableColumn<classObject>[] = [
    {
        accessorKey: "classid",
        meta: {
            filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] }
        },
        header: "Class ID",
        enableHiding: false,
    },
    {
        accessorKey: "classindex",
        meta: {
            filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] },
        },
        header: "Class Index",
    },
    {
        accessorKey: "ageid",
        meta: {
            filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] }
        },
        header: "Age ID",
    },
    {
        accessorKey: "typeid",
        meta: {
            filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] }
        },
        header: "Class Type",
        cell: ({ row }) => {
            const typeid = row.original.typeid;
            const type = classTypeMap[typeid as keyof typeof classTypeMap];
            return type?.typenamecn || "Unknown";
        }
    },
    {
        accessorKey: "gradeclassid",
        meta: {
            filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] }
        },
        header: "Grade Class ID",
        cell: ({ row }) => {
            const gradeclassid = row.original.gradeclassid;
            const gradeclass = idMaps.classMap[gradeclassid as keyof typeof idMaps.classMap];
            return gradeclass?.classnamecn || "Unknown";
        }
    },
    {
        accessorKey: "classno",
        meta: {
            filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] }
        },
        header: "Class Level",
    },
    {
        accessorKey: "classnamecn",
        meta: {
            filter: { type: 'text', mode: ['='] }
        },
        header: "Class Name (CN)",
        enableHiding: false
    },
    {
        accessorKey: "classnameen",
        meta: {
            filter: { type: 'text', mode: ['='] }
        },
        header: "Class Name (EN)",
        enableHiding: false
    },
    {
        accessorKey: "sizelimits",
        meta: {
            filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] }
        },
        header: "Size Limits",
    },
    {
        accessorKey: "status",
        meta: {
            filter: { type: 'enum', mode: ['=', '≠'], options: ["Active", "Inactive"] }
        },
        header: "Status",
    },
    {
        accessorKey: "description",
        meta: {
            filter: { type: 'text', mode: ['='] }
        },
        header: "Description",
    },
    {
        accessorKey: "lastmodify",
        meta: {
            filter: { type: 'date', mode: ['in the last', '=', 'between', '>=', '<='], options: ['hours', 'days', 'months', 'years'] }
        },
        header: "Last Modified",
    },
    {
        accessorKey: "createby",
        meta: {
            filter: { type: 'text', mode: ['='] }
        },
        header: "Created By",
    },
    {
        accessorKey: "createon",
        meta: {
            filter: { type: 'date', mode: ['in the last', '=', 'between', '>=', '<='], options: ['hours', 'days', 'months', 'years'] }
        },
        header: "Created On",
    },
    {
        accessorKey: "updateby",
        meta: {
            filter: { type: 'text', mode: ['='] }
        },
        header: "Updated By",
    },
    {
        accessorKey: "updateon",
        meta: {
            filter: { type: 'date', mode: ['in the last', '=', 'between', '>=', '<='], options: ['hours', 'days', 'months', 'years'] }
        },
        header: "Last Updated On",
    }
]

// Form Schema: Form schema is not necessarily the same as database schema
export const classFormSchema = z.object({
	ageid: z.coerce.number({ message: "Age ID must be a number"}).int().min(1, { message: "Age ID must be positive"}),
    typeid: z.coerce.number({ message: "Type ID must be a number"})
        .int()
        .min(1, { message: "Type ID must be positive"})
        .max(
            Math.max(...Object.keys(classTypeMap).map(Number)),
            { message: "Type ID is too large. This is an invalid classtype" }
        ),
    gradeclassid: z.coerce.number({ message: "Grade Class ID must be a number"})
        .int()
        .min(1, { message: "Grade Class ID must be positive"}),
    classno: z.coerce.number({ message: "Class Level must be a number"})
        .int()
        .min(0, { message: "Grade level must be positive"}),
    classnamecn: z
        .string()
        .min(1, { message: "Class Name (CN) is required" })
        .max(100, { message: "Class Name (CN) is too long" }),
    classnameen: z
        .string()
        .min(1, { message: "Class Name (EN) is required" })
        .max(100, { message: "Class Name (EN) is too long" }),
    classupid: z.coerce.number({ message: "Upgrade Class ID must be a number"})
        .int()
        .min(1, { message: "Upgrade Class ID must be positive"}),
    sizelimits: z.coerce.number({ message: "Size Limits must be a number"})
        .int()
        .min(0, { message: "Size Limits must be positive or 0. If you don't want to set a size limit, leave it blank"})
        .default(0),
    status: z.enum(["Active", "Inactive"], { message: "Status must be Active or Inactive"}),
    description: z.string().optional(),
})

const makeInsertExtras = (user: DefaultSession["user"]) => {
    const insertExtras: Extras<classTable>= {
        "createon": toESTString(new Date()),
        "lastmodify": toESTString(new Date()),
        "updateon": toESTString(new Date()),
        "createby": user?.name || "",
        "updateby": user?.name || ""
    }
    return insertExtras;
}

const makeUpdateExtras = (user: DefaultSession["user"]) => {
    const updateExtras: Extras<classTable>= {
        "lastmodify": toESTString(new Date()),
        "updateon": toESTString(new Date()),
        "updateby": user?.name || ""
    }
    return updateExtras;
}

export const classConfig: EntityConfig<classTable> = makeEntity({
    table: classes,
    formSchema: classFormSchema,
    columns: classColumns,
    ops: {
        allRows: () => allClassRows(),
        idRow: (id: number) => idClassRow(id),
        pageRows: (opts: parsedParams) => pageClassRows(opts),
        insertRow: (formData: FormData) => insertClassRow(formData),
        updateRow: (id: number, formData: FormData) => updateClassRow(id, formData),
        deleteRows: (ids: number[]) => deleteClassRows(ids)
    }
    // tableName: "classes",
    // primaryKey: "classid",
    // mainPath: "/admintest/dashboard/data/classes",
    // enrichFields: classEnrichFields,
    // uniqueConstraints: classUniqueConstraints,
    // insertExtras: insertExtras,
    // updateExtras: updateExtras,
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







//----------------------------------------------------------------------------------------
// REtrying
//----------------------------------------------------------------------------------------







// export const classColumns = generateColumnDefs<classObject>(classes, {
//     classid: {
//         header: "Class ID",
//     },
//     classindex: {
//         header: "Class Index",
//     },
//     ageid: {
//         header: "Age ID",
//     },
//     typeid: {
//         header: "Type ID",
//     },
//     classno: {
//         header: "Class Number",
//     },
//     classnamecn: {
//         header: "Class Name (CN)",
//         enableHiding: false
//     },
//     classupid: {
//         header: "Upgrade Class ID",
//     },
//     classnameen: {
//         header: "Class Name (EN)",
//         enableHiding: false
//     },
//     sizelimits: {
//         header: "Size Limits",
//     },
//     status: {
//         header: "Status",
//     },
//     description: {
//         header: "Description",
//     },
//     lastmodify: {
//         header: "Last Modified",
//     },
//     createby: {
//         header: "Created By",
//     },
//     createon: {
//         header: "Created On",
//     },
//     updateby: {
//         header: "Updated By",
//     },
//     updateon: {
//         header: "Updated On",
//     },
// });
// const classEnrichFields: enrichField<"classes",typeof classFormSchema>[] = [
//     {formField: "upgradeclass", lookupTable: "classes", lookupField: "classnamecn", returnField: "classid"}
// ]

// const classEnrichFields: enrichFields<typeof classFormSchema>[] =  [
//     { formField: "classupid", lookupTable: "classes", lookupField: "classnamecn", returnField: "classid" }
// ]

// const classUniqueConstraints: uniqueCheckFields<"classes", classTable, typeof classFormSchema>[] = [
//     {tableCol: "classnamecn", formCol: "classnamecn"},
// ]

