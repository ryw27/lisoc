import { db } from "@/app/lib/db/index";
import { classes, classregistration, classrooms, classtype } from "@/app/lib/db/schema";
import { generateColumnDefs } from "@/app/lib/data-actions";
import { createInsertSchema} from "drizzle-zod";
import { z, ZodError, ZodIssue } from 'zod';
import { eq, inArray, getTableColumns, InferSelectModel, max, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { AnyPgTable } from "drizzle-orm/pg-core";
import { formatISO } from "date-fns";
import { randomUUID } from "crypto";
import { requireRole } from '@/app/lib/actions'

// export function generateFormSchema()
export const classFormSchema = z.object({
    classnamecn: z.string().min(1),
    classnameen: z.string().min(1),
    typeid: z.coerce.number().int().positive(), // Select strings from dropdowon, but values are numbers increasing from 1 correctly
    classno: z.coerce.number().int().nonnegative(), // Coerce string from form to number
    sizelimits: z.coerce.number().int().positive().optional(), // Coerce string from form to number, optional
    status: z.enum(["Active", "Inactive"]), 
    classupid: z.string().min(1), // Start as a string, selected class name. id found later
    description: z.string().optional() // optional
})

export type newClass = typeof classes.$inferSelect
export async function addClass(formData: FormData) {
    'use server';
    // make sure user is logged in and has correct roles
    // const session = await requireRole(["admin"])
    // if (!session?.user) {
    //     throw new Error("No user found");
    // }
    // const user = session.user.email;
    const user = "testuser";

    //drizzle-zod to validate that this is a valid object that can be inserted into database
    const classInsertSchema = createInsertSchema(classes);
    try {
        const form = classFormSchema.parse(Object.fromEntries(formData));
        await db.transaction(async (tx) => {
            // Check whether the class already exists
            const exists = await tx
                    .select()
                    .from(classes)
                    .where(and(
                        eq(classes.classnamecn, form.classnamecn),
                        eq(classes.status, "Active")
                    ))
                    .limit(1);
            if (exists.length) {
                throw new Error("Class already exists");
            }

            // Find the class that matches the selected class name (not id)
            const upgrade = await tx
                .select()
                .from(classes)
                .where(eq(classes.classnamecn, form.classupid))
                .limit(1);
                
            if (!upgrade || upgrade.length === 0) throw new Error("Invalid upgrade class");

            const newclassid = Number(randomUUID().slice(0, 8)); 
            const newclass = {
                ...form,
                classid: newclassid,
                classupid: upgrade[0].classid, // Use the found class ID
                lastmodify: formatISO(new Date()),
                createon: formatISO(new Date()),
                updateon: formatISO(new Date()),
                createby: user,
                updateby: user
            };

            const parsed = classInsertSchema.parse(newclass);
            await db.insert(classes).values(parsed);
        });  

        redirect(`/admintest/dashboard/classes`);
    } catch (error) {
        console.error(error);
        if (error instanceof ZodError) {
            redirect(`/admintest/dashboard/add-class/?error=${encodeURIComponent(error.errors[0].message)}`);
        } else if (error instanceof Error) {
            redirect(`/admintest/dashboard/add-class/?error=${encodeURIComponent(error.message)}`);
        } else {
            redirect(`/admintest/dashboard/add-class/?error=${encodeURIComponent('An unknown error occurred')}`);
        }
    }
}


export async function updateClass(formData: FormData) {
    'use server';
    // make sure user is logged in and has correct roles
    // const session = await requireRole(["admin"])
    // if (!session?.user) {
    //     throw new Error("No user found");
    // }
    // const user = session.user.email;
    const user = "testuser";

    //drizzle-zod to validate that this is a valid object that can be inserted into database
    const classInsertSchema = createInsertSchema(classes);
    try {
        const form = classFormSchema.parse(Object.fromEntries(formData));
        await db.transaction(async (tx) => {
            // Check whether the class already exists
            const exists = await tx
                    .select()
                    .from(classes)
                    .where(and(
                        eq(classes.classnamecn, form.classnamecn),
                        eq(classes.status, "Active")
                    ))
                    .limit(1);
            if (exists.length) {
                throw new Error("Class already exists");
            }

            // Find the class that matches the selected class name (not id)
            const upgrade = await tx
                .select()
                .from(classes)
                .where(eq(classes.classnamecn, form.classupid))
                .limit(1);
                
            if (!upgrade || upgrade.length === 0) throw new Error("Invalid upgrade class");

            const newclassid = Number(randomUUID().slice(0, 8)); 
            const newclass = {
                ...form,
                classid: newclassid,
                classupid: upgrade[0].classid, // Use the found class ID
                lastmodify: formatISO(new Date()),
                createon: formatISO(new Date()),
                updateon: formatISO(new Date()),
                createby: user,
                updateby: user
            };

            const parsed = classInsertSchema.parse(newclass);
            await db.insert(classes).values(parsed);
        });  

        redirect(`/admintest/dashboard/classes`);
    } catch (error) {
        console.error(error);
        if (error instanceof ZodError) {
            redirect(`/admintest/dashboard/add-class/?error=${encodeURIComponent(error.errors[0].message)}`);
        } else if (error instanceof Error) {
            redirect(`/admintest/dashboard/add-class/?error=${encodeURIComponent(error.message)}`);
        } else {
            redirect(`/admintest/dashboard/add-class/?error=${encodeURIComponent('An unknown error occurred')}`);
        }
    } 
}


export async function deleteRows<T extends AnyPgTable, PrimaryKey extends keyof T['_']['columns'] & string>
(
    table: T, 
    pk: PrimaryKey,
    values: InferSelectModel<T>[PrimaryKey] | InferSelectModel<T>[PrimaryKey][] //number, number[]
) {
    const valueslist = Array.isArray(values) ? values : [values]
    const column = getTableColumns(table)[pk]
    return await db.delete(table).where(inArray(column, valueslist)).returning();
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

export async function getAllClasses() {
    const result = await db.select().from(classes);
    return result;
}

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
