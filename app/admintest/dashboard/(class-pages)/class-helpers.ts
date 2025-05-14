import { db } from "@/app/lib/db/index";
import { classes, classrooms } from "@/app/lib/db/schema";
import { generateColumnDefs } from "@/app/lib/data-actions";
//----------------------------------------------------------------------------------------
// CLASSES
//----------------------------------------------------------------------------------------

//inferSelect is used to get the type of the table, classes is just the drizzle schema table
export type Class = typeof classes.$inferSelect;
export const classColumns = generateColumnDefs<Class>(classes, {
    classid: {
        header: "Class ID",
    },
    classindex: {
        header: "Class Index",
    },
    ageid: {
        header: "Age ID",
    },
    typeid: {
        header: "Type ID",
    },
    classno: {
        header: "Class Number",
    },
    classnamecn: {
        header: "Class Name (CN)",
        enableHiding: false
    },
    classupid: {
        header: "Upgrade Class ID",
    },
    classnameen: {
        header: "Class Name (EN)",
        enableHiding: false
    },
    sizelimits: {
        header: "Size Limits",
    },
    status: {
        header: "Status",
    },
    description: {
        header: "Description",
    },
    createon: {
        header: "Created On",
    },
    updateby: {
        header: "Updated By",
    },
    updateon: {
        header: "Updated On",
    },
})


export async function getClasses(page: number, pageSize: number, query:string = "") {
    const result = await db.select().from(classes);
    const size = result.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedResult = result.slice(start, end);
    return {
        classes: paginatedResult,
        totalCount: size,
    };
}




//Type definition for classroom columns. Check Tanstack docs for info on ColumnDef
//ColumnMetaFilter added for type safety. technically not necessary, but good practice
//----------------------------------------------------------------------------------------
// CLASSROOMS
//----------------------------------------------------------------------------------------
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
