import { db } from "@/app/lib/db/index";
import { classes, classregistration, classrooms, classtype } from "@/app/lib/db/schema";
import { deleteRows, generateColumnDefs, getRows, getAllRows } from "@/app/lib/data-actions";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z, ZodError } from 'zod';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { formatISO } from "date-fns";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { ParsedFilter } from "@/app/lib/data-actions";
// import { requireRole } from '@/app/lib/actions'




//----------------------------------------------------------------------------------------
// CLASSES
//----------------------------------------------------------------------------------------


// Form Schema: Form schema is not necessarily the same as database schema
export const classFormSchema = z.object({
    classnamecn: z.string().min(1),
    classnameen: z.string().min(1),
    typeid: z.coerce.number().int().positive(), // Select strings from dropdowon, but values are numbers increasing from 1 correctly
    classno: z.coerce.number().int().nonnegative(), // Coerce string from form to number
    sizelimits: z.coerce.number().int().nonnegative().optional(), // Coerce string from form to number, optional
    status: z.enum(["Active", "Inactive"]), 
    classupid: z.string().min(1), // Start as a string, selected class name. id found later
    description: z.string().optional() // optional
})

// Type of any class insertions: for compile-time type checking
//inferSelect is used to get the type of the table, classes is just the drizzle schema table
export type Class = typeof classes.$inferSelect
// Add a class from form data and insert into database
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


            // TODO: Change to increase maximum. It's just nicer.
            const newclassid = parseInt(randomUUID().slice(0, 4), 16); // Convert hex string to integer, using only 4 chars to ensure it fits
            const newclass = {
                ...form,
                classid: newclassid,
                classupid: upgrade[0].classid, // Use the found class ID
                classno: String(form.classno), // Numeric requires string for some reason
                lastmodify: formatISO(new Date()),
                createon: formatISO(new Date()),
                updateon: formatISO(new Date()),
                createby: user,
                updateby: user
            } as Class;

            const parsed = classInsertSchema.parse(newclass);
            await db.insert(classes).values(parsed);
        });  
        
        redirect('/admintest/dashboard/class-view');
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


// Update an existing class in the database. 
// Uses same form schema as insertion. Existing values will fill in for non-updated values as default values

// TODO: This is probably not super efficient right now.
export async function updateClass(formData: FormData, input_id:string) {
    'use server';
    // make sure user is logged in and has correct roles
    // const session = await requireRole(["admin"])
    // if (!session?.user) {
    //     throw new Error("No user found");
    // }
    // const user = session.user.email;
    const user = "testuser";

    //drizzle-zod to validate that this is a valid object that can be inserted into database
    const classUpdateSchema = createUpdateSchema(classes);
    try {
        const form = classFormSchema.parse(Object.fromEntries(formData));
        await db.transaction(async (tx) => {

            // Find the class that matches the selected class name (not id)
            const upgrade = await tx
                .select()
                .from(classes)
                .where(eq(classes.classnamecn, form.classupid))
                .limit(1);
                
            if (!upgrade || upgrade.length === 0) throw new Error("Invalid upgrade class");

            const newclass = {
                ...form,
                classupid: upgrade[0].classid, // Use the found class ID
                classindex: null,
                ageid: null,
                classno: String(form.classno),
                lastmodify: formatISO(new Date()),
                // createon: formatISO(new Date()), // no change for this on update
                updateon: formatISO(new Date()),
                // createby: user, // no change for this on update
                updateby: user
            } as Class;

            const parsed = classUpdateSchema.parse(newclass);
            await db.update(classes).set(parsed).where(eq(classes.classid, parseInt(input_id)));
        });  

        // TODO: these redirects don't work for some reason
        redirect(`/admintest/dashboard/classes`);
    } catch (error) {
        console.error(error);
        // TODO: Better error handling
        if (error instanceof ZodError) {
            redirect(`/admintest/dashboard/class-view/${input_id}/edit-class/?error=${encodeURIComponent(error.errors[0].message)}`);
        } else if (error instanceof Error) {
            redirect(`/admintest/dashboard/class-view/${input_id}/edit-class/?error=${encodeURIComponent(error.message)}`);
        } else {
            redirect(`/admintest/dashboard/class-view/${input_id}/edit-class/?error=${encodeURIComponent('An unknown error occured')}`);
        }
    } 
}


// Delete classes. Use delete rows helper function
export async function deleteClasses(ids: number[]) {
    'use server';
    await deleteRows(classes, 'classid', ids);
    revalidatePath('/admintest/dashboard/class-view');
}



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

// export const classFilterSchema = z.object({
//     classid: z.coerce.number().optional(),
//     classindex: z.coerce.number().optional(),
//     ageid: z.coerce.number().optional(),
//     typeid: z.coerce.number().optional(),
//     classno: z.coerce.number().optional(),
//     classnamecn: z.string().optional(),
//     upgradeclassid: z.coerce.number().optional(),
//     classnameen: z.string().optional(),
//     sizelimits: z.coerce.number().optional(),
//     status: z.string().optional(),
//     description: z.string().optional(),
//     lastmodify: z.string().optional(),
//     createby: z.string().optional(),
//     createon: z.string().optional(),
//     updateby: z.string().optional(),
//     updateon: z.string().optional(),
// })

// export type ClassFilter = z.infer<typeof classFilterSchema>;


// export function buildClassSQL(filters: ParsedFilter[], match: string) {
//     const columns = getTableColumns(classes); // For compile-time type checking
//     const conds = filters.map(filter => {
//         if (!(filter.field in columns) && filter.field != "match") throw new Error(`Unknown filter field ${filter.field}`);
//         const col = columns[filter.field as keyof typeof columns]
//         const value = filter.value instanceof Date ? formatISO(filter.value) : filter.value;
//         switch(filter.op) {
//             case 'eq': return eq(col, value)
//             case 'lt': return lt(col, value)
//             case 'gt': return gt(col, value)
//             case 'lte': return lte(col, value)
//             case 'gte': return gte(col, value)
//         }
//     }).filter(Boolean); // Filter out any undefined conditions

//     if (conds.length === 0) return undefined;
//     return match === "all" ? and(...conds) : or(...conds);
// }

// Get all classes
export async function getAllClasses() {
    const result = await getAllRows(classes);
    return result;
}

export async function getClasses(
    page: number, pageSize: number, match: string, 
    sortBy: string | undefined, sortOrder: string | undefined, query:ParsedFilter[]
) {
    const result = await getRows(classes, page, pageSize, match, sortBy, sortOrder, query);
    return {
        classes: result.rows,
        totalCount: result.totalCount,
    };
}
// export async function getAllClasses() {
//     const result = await db.select().from(classes);
//     return result;
// }

// // Get classes with filter and pagination restrictions
// export async function getClasses(page: number, pageSize: number, match: string, sortBy: string | undefined, sortOrder: string | undefined, query:ParsedFilter[]) {
//     // const where = buildClassSQL(query, match);
//     const where = buildSQL(classes, query, match);
//     const columns = getTableColumns(classes);
//     const sortbycolumn = sortBy ? columns[sortBy as keyof typeof columns] : undefined;
//     const orderByClause = sortbycolumn
//       ? (sortOrder === 'asc' ? asc(sortbycolumn) : desc(sortbycolumn))
//       : undefined;

//     const baseQuery = db
//         .select()
//         .from(classes)
//         .where(where);

//     const result = await (
//         orderByClause
//             ? baseQuery.orderBy(orderByClause)
//             : baseQuery
//         )
//         .limit(pageSize)
//         .offset((page - 1) * pageSize);

//     const [{ count }] = await db
//         .select({ count: sql<number>`count(*)`})
//         .from(classes)
//         .where(where);

//     return {
//         classes: result,
//         totalCount: count,
//     };
// }




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
