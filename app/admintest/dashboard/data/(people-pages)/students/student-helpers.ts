import { db } from "@/app/lib/db/index";
import { student } from "@/app/lib/db/schema";
import { deleteRows } from "@/app/lib/data-actions";
import { generateColumnDefs } from "@/app/lib/column-actions";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z, ZodError } from 'zod';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { formatISO } from "date-fns";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
// import { requireRole } from '@/app/lib/actions'


//----------------------------------------------------------------------------------------
// STUDENTS
//----------------------------------------------------------------------------------------


// Form Schema: Form schema for student
export const studentFormSchema = z.object({
    familyid: z.coerce.number().int().positive(),
    studentno: z.string().optional(),
    namecn: z.string().optional(),
    namelasten: z.string().min(1),
    namefirsten: z.string().min(1),
    gender: z.string().optional(),
    ageof: z.string().optional(),
    age: z.coerce.number().int().nonnegative().optional(),
    dob: z.string().min(1),
    active: z.boolean().default(true),
    notes: z.string().optional(),
    upgradable: z.coerce.number().int().nonnegative().default(0)
})

// Type of any student insertions: for compile-time type checking
export type Student = typeof student.$inferSelect
// Add a student from form data and insert into database
export async function addStudent(formData: FormData) {
    'use server';

    //drizzle-zod to validate that this is a valid object that can be inserted into database
    const studentInsertSchema = createInsertSchema(student);
    try {
        const form = studentFormSchema.parse(Object.fromEntries(formData));
        await db.transaction(async (tx) => {
            // Check whether the student already exists with same name and DOB
            const exists = await tx
                    .select()
                    .from(student)
                    .where(and(
                        eq(student.familyid, form.familyid),
                        eq(student.namelasten, form.namelasten),
                        eq(student.namefirsten, form.namefirsten)
                    ))
                    .limit(1);
            if (exists.length) {
                throw new Error("Student already exists");
            }

            // Generate a new student ID
            const newStudentId = parseInt(randomUUID().slice(0, 4), 16);
            
            const newStudent = {
                ...form,
                studentid: newStudentId,
                createddate: formatISO(new Date()),
                lastmodify: formatISO(new Date())
            } as Student;

            const parsed = studentInsertSchema.parse(newStudent);
            await db.insert(student).values(parsed);
        });  
        
        redirect('/admintest/dashboard/student-view');
    } catch (error) {
        console.error(error);
        if (error instanceof ZodError) {
            redirect(`/admintest/dashboard/add-student/?error=${encodeURIComponent(error.errors[0].message)}`);
        } else if (error instanceof Error) {
            redirect(`/admintest/dashboard/add-student/?error=${encodeURIComponent(error.message)}`);
        } else {
            redirect(`/admintest/dashboard/add-student/?error=${encodeURIComponent('An unknown error occurred')}`);
        }
    }
}


// Update an existing student in the database. 
export async function updateStudent(formData: FormData, input_id:string) {
    'use server';

    //drizzle-zod to validate that this is a valid object that can be inserted into database
    const studentUpdateSchema = createUpdateSchema(student);
    try {
        const form = studentFormSchema.parse(Object.fromEntries(formData));
        
        const updatedStudent = {
            ...form,
            lastmodify: formatISO(new Date())
        };

        const parsed = studentUpdateSchema.parse(updatedStudent);
        await db.update(student).set(parsed).where(eq(student.studentid, parseInt(input_id)));

        redirect(`/admintest/dashboard/student-view`);
    } catch (error) {
        console.error(error);
        if (error instanceof ZodError) {
            redirect(`/admintest/dashboard/student-view/${input_id}/edit-student/?error=${encodeURIComponent(error.errors[0].message)}`);
        } else if (error instanceof Error) {
            redirect(`/admintest/dashboard/student-view/${input_id}/edit-student/?error=${encodeURIComponent(error.message)}`);
        } else {
            redirect(`/admintest/dashboard/student-view/${input_id}/edit-student/?error=${encodeURIComponent('An unknown error occured')}`);
        }
    } 
}


// Delete students. Use delete rows helper function
export async function deleteStudents(ids: number[]) {
    'use server';
    await deleteRows(student, 'studentid', ids);
    revalidatePath('/admintest/dashboard/student-view');
}


export const studentColumns = generateColumnDefs<Student>(student, {
    studentid: {
        header: "Student ID",
    },
    familyid: {
        header: "Family ID",
    },
    studentno: {
        header: "Student Number",
    },
    namecn: {
        header: "Name (CN)",
    },
    namelasten: {
        header: "Last Name",
        enableHiding: false
    },
    namefirsten: {
        header: "First Name",
        enableHiding: false
    },
    gender: {
        header: "Gender",
    },
    ageof: {
        header: "Age Group",
    },
    age: {
        header: "Age",
    },
    dob: {
        header: "Date of Birth",
        enableHiding: false
    },
    active: {
        header: "Active",
        enableHiding: false
    },
    createddate: {
        header: "Created Date",
    },
    lastmodify: {
        header: "Last Modified",
    },
    notes: {
        header: "Notes",
    },
    upgradable: {
        header: "Upgradable",
    }
})

// Get all students
export async function getAllStudents() {
    try {
        const result = await db.select().from(student);
        return result;
    } catch (error) {
        console.error("Error fetching students:", error);
        return [];
    }
}

// Get students with pagination
export async function getStudents(page: number, pageSize: number, query:string = "") {
    try {
        const result = await db.select().from(student);
        const size = result.length;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedResult = result.slice(start, end);
        return {
            students: paginatedResult,
            totalCount: size,
        };
    } catch (error) {
        console.error("Error fetching students:", error);
        return {
            students: [],
            totalCount: 0
        };
    }
} 