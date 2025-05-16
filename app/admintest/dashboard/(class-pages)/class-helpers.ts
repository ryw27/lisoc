import { db } from "@/app/lib/db/index";
import { classes, classregistration, classrooms, classtype } from "@/app/lib/db/schema";
import { generateColumnDefs } from "@/app/lib/data-actions";
import { createInsertSchema} from "drizzle-zod";
import { z } from 'zod';
import { eq, inArray, getTableColumns } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { AnyPgTable } from "drizzle-orm/pg-core";

// export function generateFormSchema()
export const classFormSchema = z.object({
    classnamecn: z.string().min(1),
    classnameen: z.string().min(1),
    classupid: z.string().min(1),
    classno: z.number().nonnegative(),
    classindex: z.number().nonnegative(),
    sizelimits: z.number().nonnegative()

})

export type newClass = typeof classes.$inferSelect
export async function addClass(formData: FormData) {
    'use server';
    try {
        const form = classFormSchema.parse(Object.fromEntries(formData));
        const insertData = await db.transaction(async (tx) => {
            const upgrade = await tx.select().from(classes)
                .where(eq(classes.classid, parseInt(form.classupid)))
                .limit(1);
                
            if (!upgrade || upgrade.length === 0) throw new Error("Invalid upgrade class");
            
            // Create a properly structured object matching the schema
            return {
                classnamecn: form.classnamecn,
                classnameen: form.classnameen,
                classno: String(form.classno),
                classindex: String(form.classindex),
                sizelimits: form.sizelimits,
                classupid: upgrade[0].classid,
                // Add default values for required fields
                status: "Active",
                typeid: 1, // Default typeid, replace with appropriate value
            };
        })  

        //drizzle-zod to validate that this is a valid object that can be inserted into database
        const classInsertSchema = createInsertSchema(classes);
        const parsed = classInsertSchema.parse(insertData);
        await db.insert(classes).values(parsed);
    } catch (error) {
        redirect(`/add-class/?error=${encodeURIComponent((error as Error).message)}`);
    }
}

export async function updateClass(formData: FormData) {
    'use server';
    try {
        const form = classFormSchema.parse(Object.fromEntries(formData));
        const insertData = await db.transaction(async (tx) => {
            const upgrade = await tx.select().from(classes)
                .where(eq(classes.classid, parseInt(form.classupid)))
                .limit(1);
                
            if (!upgrade || upgrade.length === 0) throw new Error("Invalid upgrade class");
            
            // Create a properly structured object matching the schema
            return {
                classnamecn: form.classnamecn,
                classnameen: form.classnameen,
                classno: String(form.classno),
                classindex: String(form.classindex),
                sizelimits: form.sizelimits,
                classupid: upgrade[0].classid,
                // Add default values for required fields
                status: "Active",
                typeid: 1, // Default typeid, replace with appropriate value
            };
        })  

        //drizzle-zod to validate that this is a valid object that can be inserted into database
        const classInsertSchema = createInsertSchema(classes);
        const parsed = classInsertSchema.parse(insertData);
        await db.insert(classes).values(parsed);
    } catch (error) {
        redirect(`/add-class/?error=${encodeURIComponent((error as Error).message)}`);
    }
}


export async function deleteRows<T extends AnyPgTable, PrimaryKey extends keyof T['_']['columns'] & string>
(
    table: T, 
    pk: PrimaryKey,
    values: T['_']['columns'][PrimaryKey],
) {
    const col = getTableColumns(table)[pk]
    return await db.delete(table).where(inArray(col, values)).returning();
}

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
    lastmodify: {
        header: "Last Modified",
    },
    createby: {
        header: "Created By",
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
    console.log(start, end, size, pageSize, page)
    return {
        classrooms: paginatedResult,
        totalCount: size,
    };
}


//----------------------------------------------------------------------------------------
// CLASS TYPE
//----------------------------------------------------------------------------------------

export type ClassType = typeof classtype.$inferSelect;
export const classTypeColumns = generateColumnDefs<ClassType>(classtype, {
    typeid: {
        header: "Type ID",
    },
    typenameen: {
        header: "Type Name (EN)",
    },
    typenamecn: {
        header: "Type Name (CN)",
    },
    ageofstudent: {
        header: "Age of Student",
    },
    ageid: {
        header: "Age ID",
    },
    typedescription: {
        header: "Type Description",
    },
    status: {
        header: "Status",
    },
    ischineseclass: {
        header: "Is Chinese Class",
    },
    sortorder: {
        header: "Sort Order",
    },
    isnofee: {
        header: "Is No Fee",
    },
    isonline: {
        header: "Is Online",
    },
})

export async function getClassTypes(page: number, pageSize: number, query:string = "") {
    const result = await db.select().from(classtype);
    const size = result.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedResult = result.slice(start, end);
    return {
        classTypes: paginatedResult,
        totalCount: size,
    };
}

//----------------------------------------------------------------------------------------
// CLASS REGISTRATION
//----------------------------------------------------------------------------------------

export type ClassRegistration = typeof classregistration.$inferSelect;
export const classRegistrationColumns = generateColumnDefs<ClassRegistration>(classregistration, {
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
