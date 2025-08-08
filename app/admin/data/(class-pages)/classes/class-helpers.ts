import { classes } from "@/lib/db/schema";
// import { generateColumnDefs } from "@/lib/data-view";
import { z } from "zod/v4";
import { makeEntity } from "@/lib/data-view/actions/makeEntity/makeEntity";
import { EntityConfig, FilterableColumn } from "@/lib/data-view/types";
import { type Extras } from "@/lib/data-view/types";
import { ADMIN_DATAVIEW_LINK, classTypeMap, toESTString } from "@/lib/utils";
import { getSelectOptions } from "@/lib/registration/semester";
import { DefaultSession } from "next-auth";
import { InferSelectModel } from "drizzle-orm";

//----------------------------------------------------------------------------------------
// CLASSES
//----------------------------------------------------------------------------------------

export type classObject = InferSelectModel<typeof classes>

// This is the actual internal representation from drizzle, PgTable type
export type classTable = typeof classes

const { idMaps } = await getSelectOptions();

export const classColumns: FilterableColumn<classObject>[] = [
    {
        id: "classid",
        accessorKey: "classid",
        meta: {
            filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const }
        },
        header: "Class ID",
        enableHiding: false,
    },
    {
        id: "classindex",
        accessorKey: "classindex",
        meta: {
            filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const },
        },
        header: "Class Index",
    },
    {
        id: "ageid",
        accessorKey: "ageid",
        meta: {
            filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const }
        },
        header: "Age ID",
    },
    {
        id: "typeid",
        accessorKey: "typeid",
        meta: {
            filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const }
        },
        header: "Class Type",
        cell: ({ row }) => {
            const typeid = row.original.typeid;
            const type = classTypeMap[typeid as keyof typeof classTypeMap];
            return type?.typenamecn || "Unknown";
        }
    },
    {
        id: "gradeclassid",
        accessorKey: "gradeclassid",
        meta: {
            filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const }
        },
        header: "Grade Class ID",
        cell: ({ row }) => {
            const gradeclassid = row.original.gradeclassid;
            const gradeclass = idMaps.classMap[gradeclassid as keyof typeof idMaps.classMap];
            return gradeclass?.classnamecn || "Unknown";
        }
    },
    {
        id: "classno",
        accessorKey: "classno",
        meta: {
            filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const }
        },
        header: "Class Level",
    },
    {
        id: "classnamecn",
        accessorKey: "classnamecn",
        meta: {
            filter: { type: 'text', mode: ['='] as const }
        },
        header: "Class Name (CN)",
        enableHiding: false
    },
    {
        id: "classnameen",
        accessorKey: "classnameen",
        meta: {
            filter: { type: 'text', mode: ['='] as const }
        },
        header: "Class Name (EN)",
        enableHiding: false
    },
    {
        id: "sizelimits",
        accessorKey: "sizelimits",
        meta: {
            filter: { type: 'number', mode: ['=', '≠', '>', '<', '>=', '<=', 'between'] as const }
        },
        header: "Size Limits",
    },
    {
        id: "status",
        accessorKey: "status",
        meta: {
            filter: { type: 'enum', mode: ['=', '≠'] as const, options: ["Active", "Inactive"] as const }
        },
        header: "Status",
    },
    {
        id: "description",
        accessorKey: "description",
        meta: {
            filter: { type: 'text', mode: ['='] as const }
        },
        header: "Description",
    },
    {
        id: "lastmodify",   
        accessorKey: "lastmodify",
        meta: {
            filter: { type: 'date', mode: ['in the last', '=', 'between', '>=', '<='] as const, options: ['hours', 'days', 'months', 'years'] as const }
        },
        header: "Last Modified",
    },
    {
        id: "createby",
        accessorKey: "createby",
        meta: {
            filter: { type: 'text', mode: ['='] as const }
        },
        header: "Created By",
    },
    {
        id: "createon",
        accessorKey: "createon",
        meta: {
            filter: { type: 'date', mode: ['in the last', '=', 'between', '>=', '<='] as const, options: ['hours', 'days', 'months', 'years'] as const }
        },
        header: "Created On",
    },
    {
        id: "updateby",
        accessorKey: "updateby",
        meta: {
            filter: { type: 'text', mode: ['='] as const }
        },
        header: "Updated By",
    },
    {
        id: "updateon",
        accessorKey: "updateon",
        meta: {
            filter: { type: 'date', mode: ['in the last', '=', 'between', '>=', '<='] as const, options: ['hours', 'days', 'months', 'years'] as const }
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
    classno: z.coerce.number({ message: "Grade Level must be a number"})
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

export const classDeleteSchema = z.object({
    classid: z.array(
        z
        .number()
        .int()
        .min(0, { message: "Class ID must be positive"})
    )
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

export const classConfig: EntityConfig<classTable, typeof classFormSchema, typeof classDeleteSchema> = makeEntity(
    classes,
    classColumns,
    `${ADMIN_DATAVIEW_LINK}/${classes}`,
    "classid",
    classFormSchema,
    classDeleteSchema,
    makeUpdateExtras,
    makeInsertExtras,
)