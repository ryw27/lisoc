import { db } from "@/app/lib/db/index";
import { classrooms } from "@/app/lib/db/schema";
import { generateColumnDefs } from "@/app/lib/column-actions";
import { z } from "zod";
import { makeEntity, EntityConfig } from "@/app/lib/entity-config";
import { type Extras, type enrichFields, type uniqueCheckFields } from "@/app/lib/data-actions";
import { parsedParams } from "@/app/lib/handle-params";









export const classroomFormSchema = z.object({
    roomid: z.coerce.number().int().positive().optional(),
    roomno: z.string().optional(),
    roomcapacity: z.coerce.number().int().positive().optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
})







export type Classroom = typeof classrooms.$inferSelect;
export const classroomColumns = generateColumnDefs<Classroom>(classrooms, {
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
})

export async function getClassrooms(page: number, pageSize: number, query:string = "") {
    const result = await db.select().from(classrooms);
    const size = result.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedResult = result.slice(start, end);
    return {
        classrooms: paginatedResult,
        totalCount: size,
    };
}

