import { db } from "@/app/lib/db";
import { arrangement } from "@/app/lib/db/schema";
import { generateColumnDefs } from "@/app/lib/column-actions";
import { z } from "zod";
import { makeEntity, EntityConfig } from "@/app/lib/entity-config";
import { type Extras, type enrichFields, type uniqueCheckFields } from "@/app/lib/data-actions";
import { parsedParams } from "@/app/lib/handle-params";

//----------------------------------------------------------------------------------------
// ARRANGEMENTS
//----------------------------------------------------------------------------------------


// Form Schema: Form schema is not necessarily the same as database schema
export const arrangementFormSchema = z.object({
    arrangeid: z.coerce.number().int().positive().optional(),
    appliedid: z.coerce.number().int().positive().optional(),
    studentid: z.coerce.number().int().positive().optional(),
    classid: z.coerce.number().int().positive().optional(),
    seasonid: z.coerce.number().int().positive().optional(),
    isyearclass: z.boolean().optional(),
    registerdate: z.string().optional(),
    statusid: z.coerce.number().int().positive().optional(),
    previousstatusid: z.coerce.number().int().positive(),
    familybalanceid: z.coerce.number().int().positive(),
    familyid: z.coerce.number().int().positive(),
    newbalanceid: z.coerce.number().int().positive(),
    isdropspring: z.boolean(),
    byadmin: z.coerce.number().int().positive(),
    userid: z.coerce.number().int().positive(),
    lastmodify: z.string(),
    notes: z.string().optional(),
})



export type Arrangement = typeof arrangement.$inferSelect;
export const arrangementColumns = generateColumnDefs<Arrangement>(arrangement, {
    regid: {
        header: "Registration ID",
    },
    appliedid: {
        header: "Applied ID",
    },
    studentid: {
        header: "Student ID",
    },
    arrangeid: {
        header: "Arrangement ID",
    },
    seasonid: {
        header: "Season ID",
    },
    isyearclass: {
        header: "Is Year Class",
    },
    classid: {
        header: "Class ID",
    },
    registerdate: {
        header: "Register Date",
    },
    statusid: {
        header: "Status ID",
    },
    previousstatusid: {
        header: "Previous Status ID",
    },
    familybalanceid: {
        header: "Family Balance ID",
    },
    familyid: {
        header: "Family ID",
    },
    newbalanceid: {
        header: "New Balance ID",
    },
    isdropspring: {
        header: "Is Drop Spring",
    },
    byadmin: {
        header: "By Admin",
    },
    userid: {
        header: "User ID",
    },
    lastmodify: {
        header: "Last Modify",
    },
    notes: {
        header: "Notes",
    },
});

export async function getClassRegistrations(page: number, pageSize: number, query:string = "") {
    const result = await db.select().from(classregistration);
    const size = result.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedResult = result.slice(start, end);
    return {
        classRegistrations: paginatedResult,
        totalCount: size,
    };
}
