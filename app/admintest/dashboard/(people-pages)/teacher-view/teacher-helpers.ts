import { db } from "@/app/lib/db/index";
import { teacher } from "@/app/lib/db/schema";
import { deleteRows, generateColumnDefs } from "@/app/lib/data-actions";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z, ZodError } from 'zod';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { formatISO } from "date-fns";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
// import { requireRole } from '@/app/lib/actions'




//----------------------------------------------------------------------------------------
// Teachers 
//----------------------------------------------------------------------------------------


// Form Schema: Form schema aligns with the teacher table
export const teacherFormSchema = z.object({
    namecn: z.string().optional(),
    username: z.string().min(1),
    password: z.string().min(1),
    namelasten: z.string().min(1),
    namefirsten: z.string().min(1),
    teacherindex: z.number().optional(),
    classtypeid: z.number().optional(),
    status: z.enum(["Active", "Inactive"]),
    ischangepwdnext: z.boolean().optional(),
    address: z.string().min(1),
    address1: z.string().min(1).optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email(),
    subject: z.string().min(1),
    profile: z.string().min(1),
    familyid: z.number().optional(),
})

// Type of any teacher insertions: for compile-time type checking
//inferSelect is used to get the type of the table
export type Teacher = typeof teacher.$inferSelect
// Add a teacher from form data and insert into database
export async function addTeacher(formData: FormData) {
    'use server';
    // make sure user is logged in and has correct roles
    // const session = await requireRole(["admin"])
    // if (!session?.user) {
    //     throw new Error("No user found");
    // }
    // const user = session.user.email;
    const user = "testuser";

    //drizzle-zod to validate that this is a valid object that can be inserted into database
    const teacherInsertSchema = createInsertSchema(teacher);
    try {
        const form = teacherFormSchema.parse(Object.fromEntries(formData));
        await db.transaction(async (tx) => {
            // Check whether the teacher already exists
            const exists = await tx
                    .select()
                    .from(teacher)
                    .where(and(
                        eq(teacher.username, form.username),
                        eq(teacher.status, "Active")
                    ))
                    .limit(1);
            if (exists.length) {
                throw new Error("Teacher already exists");
            }

            // Generate a new teacher ID
            const newTeacherId = parseInt(randomUUID().slice(0, 4), 16); // Convert hex string to integer, using only 4 chars to ensure it fits
            
            const newTeacher = {
                ...form,
                teacherid: newTeacherId,
                familyid: null,
                createon: formatISO(new Date()),
                updateon: formatISO(new Date()),
                lastmodify: formatISO(new Date()),
                lastlogin: formatISO(new Date()),
                createby: user,
                updateby: user
            } as Teacher;

            const parsed = teacherInsertSchema.parse(newTeacher);
            await db.insert(teacher).values(parsed);
        });  
        
        redirect('/admintest/dashboard/teacher-view');
    } catch (error) {
        console.error(error);
        if (error instanceof ZodError) {
            redirect(`/admintest/dashboard/add-teacher/?error=${encodeURIComponent(error.errors[0].message)}`);
        } else if (error instanceof Error) {
            redirect(`/admintest/dashboard/add-teacher/?error=${encodeURIComponent(error.message)}`);
        } else {
            redirect(`/admintest/dashboard/add-teacher/?error=${encodeURIComponent('An unknown error occurred')}`);
        }
    }
}


// Update an existing teacher in the database. 
// Uses same form schema as insertion. Existing values will fill in for non-updated values as default values

// TODO: This is probably not super efficient right now.
export async function updateTeacher(formData: FormData, input_id:string) {
    'use server';
    // make sure user is logged in and has correct roles
    // const session = await requireRole(["admin"])
    // if (!session?.user) {
    //     throw new Error("No user found");
    // }
    // const user = session.user.email;
    const user = "testuser";

    //drizzle-zod to validate that this is a valid object that can be inserted into database
    const teacherUpdateSchema = createUpdateSchema(teacher);
    try {
        const form = teacherFormSchema.parse(Object.fromEntries(formData));
        
        const updatedTeacher = {
            ...form,
            lastmodify: formatISO(new Date()),
            updateon: formatISO(new Date()),
            updateby: user
        };

        const parsed = teacherUpdateSchema.parse(updatedTeacher);
        await db.update(teacher).set(parsed).where(eq(teacher.teacherid, parseInt(input_id)));

        // TODO: these redirects don't work for some reason
        redirect(`/admintest/dashboard/teacher-view`);
    } catch (error) {
        console.error(error);
        // TODO: Better error handling
        if (error instanceof ZodError) {
            redirect(`/admintest/dashboard/teacher-view/${input_id}/edit-teacher/?error=${encodeURIComponent(error.errors[0].message)}`);
        } else if (error instanceof Error) {
            redirect(`/admintest/dashboard/teacher-view/${input_id}/edit-teacher/?error=${encodeURIComponent(error.message)}`);
        } else {
            redirect(`/admintest/dashboard/teacher-view/${input_id}/edit-teacher/?error=${encodeURIComponent('An unknown error occured')}`);
        }
    } 
}


// Delete classes. Use delete rows helper function
export async function deleteTeachers(ids: number[]) {
    'use server';
    await deleteRows(teacher, 'teacherid', ids);
    revalidatePath('/admintest/dashboard/teacher-view');
}



export const teacherColumns = generateColumnDefs<Teacher>(teacher, {
    teacherid: {
        header: "Teacher ID",
    },
    namecn: {
        header: "Name (CN)",
        enableHiding: false,
    },
    username: {
        header: "Username",
    }, 
    namelasten: {
        header: "Last Name (EN)",
        enableHiding: false,
    },
    namefirsten: {
        header: "First Name (EN)",
        enableHiding: false,
    },
    teacherindex: {
        header: "Teacher Index",
    },
    classtypeid: {
        header: "Class Type ID",
    },
    status: {
        header: "Status",
        enableHiding: false,
    }, 
    address: {
        header: "Address",
    },
    address1: {
        header: "Address 1",
    },
    city: {
        header: "City",
    },
    state: {
        header: "State",
    },
    zip: {
        header: "Zip",
    },
    phone: {
        header: "Phone",
    },
    email: {
        header: "Email",
    },
    subject: {
        header: "Subject",
    },
    profile: {
        header: "Profile",
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
    lastlogin: {
        header: "Last Login",
    },
}, ["password", "ischangepwdnext"]) // Make sure the exclusions list matches the schema column keys exactly

// Get all classes
export async function getAllTeachers() {
    const result = await db.select().from(teacher);
    return result;
}

// Get teachers with filter and pagination restrictions
export async function getTeachers(page: number, pageSize: number, query:string = "") {
    try {
        const result = await db.select().from(teacher);
        const size = result.length;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedResult = result.slice(start, end);
        return {
            teachers: paginatedResult,
            totalCount: size,
        };
    } catch (error) {
        console.error("Error fetching teachers:", error);
        return {
            teachers: [],
            totalCount: 0
        };
    }
}