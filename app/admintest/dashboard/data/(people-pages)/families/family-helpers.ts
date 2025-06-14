import { db } from "@/app/lib/db/index";
import { family } from "@/app/lib/db/schema";
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
// FAMILIES
//----------------------------------------------------------------------------------------


// Form Schema: Form schema for family
export const familyFormSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
    fatherfirsten: z.string().optional(),
    fatherlasten: z.string().optional(),
    fathernamecn: z.string().optional(),
    motherfirsten: z.string().optional(),
    motherlasten: z.string().optional(),
    mothernamecn: z.string().optional(),
    contact: z.string().optional(),
    address: z.string().min(1),
    address1: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    phone: z.string().min(1),
    officephone: z.string().optional(),
    cellphone: z.string().optional(),
    email: z.string().email(),
    email2: z.string().email().optional(),
    status: z.boolean().default(true),
    remark: z.string().optional(),
    schoolmember: z.string().optional()
})

// Type of any family insertions: for compile-time type checking
export type Family = typeof family.$inferSelect
// Add a family from form data and insert into database
export async function addFamily(formData: FormData) {
    'use server';
    const user = "testuser";

    //drizzle-zod to validate that this is a valid object that can be inserted into database
    const familyInsertSchema = createInsertSchema(family);
    try {
        const form = familyFormSchema.parse(Object.fromEntries(formData));
        await db.transaction(async (tx) => {
            // Check whether the family already exists
            const exists = await tx
                    .select()
                    .from(family)
                    .where(and(
                        eq(family.username, form.username),
                        eq(family.status, true)
                    ))
                    .limit(1);
            if (exists.length) {
                throw new Error("Family already exists");
            }

            // Generate a new family ID
            const newFamilyId = parseInt(randomUUID().slice(0, 4), 16);
            
            const newFamily = {
                ...form,
                familyid: newFamilyId,
                createddate: formatISO(new Date()),
                lastmodify: formatISO(new Date()),
                lastlogin: formatISO(new Date())
            } as Family;

            const parsed = familyInsertSchema.parse(newFamily);
            await db.insert(family).values(parsed);
        });  
        
        redirect('/admintest/dashboard/family-view');
    } catch (error) {
        console.error(error);
        if (error instanceof ZodError) {
            redirect(`/admintest/dashboard/add-family/?error=${encodeURIComponent(error.errors[0].message)}`);
        } else if (error instanceof Error) {
            redirect(`/admintest/dashboard/add-family/?error=${encodeURIComponent(error.message)}`);
        } else {
            redirect(`/admintest/dashboard/add-family/?error=${encodeURIComponent('An unknown error occurred')}`);
        }
    }
}


// Update an existing family in the database. 
export async function updateFamily(formData: FormData, input_id:string) {
    'use server';

    //drizzle-zod to validate that this is a valid object that can be inserted into database
    const familyUpdateSchema = createUpdateSchema(family);
    try {
        const form = familyFormSchema.parse(Object.fromEntries(formData));
        
        const updatedFamily = {
            ...form,
            lastmodify: formatISO(new Date())
        };

        const parsed = familyUpdateSchema.parse(updatedFamily);
        await db.update(family).set(parsed).where(eq(family.familyid, parseInt(input_id)));

        redirect(`/admintest/dashboard/family-view`);
    } catch (error) {
        console.error(error);
        if (error instanceof ZodError) {
            redirect(`/admintest/dashboard/family-view/${input_id}/edit-family/?error=${encodeURIComponent(error.errors[0].message)}`);
        } else if (error instanceof Error) {
            redirect(`/admintest/dashboard/family-view/${input_id}/edit-family/?error=${encodeURIComponent(error.message)}`);
        } else {
            redirect(`/admintest/dashboard/family-view/${input_id}/edit-family/?error=${encodeURIComponent('An unknown error occured')}`);
        }
    } 
}


// Delete families. Use delete rows helper function
export async function deleteFamilies(ids: number[]) {
    'use server';
    await deleteRows(family, 'familyid', ids);
    revalidatePath('/admintest/dashboard/family-view');
}


export const familyColumns = generateColumnDefs<Family>(family, {
    familyid: {
        header: "Family ID",
    },
    username: {
        header: "Username",
        enableHiding: false
    },
    password: {
        header: "Password",
    },
    fatherfirsten: {
        header: "Father First Name",
    },
    fatherlasten: {
        header: "Father Last Name",
    },
    fathernamecn: {
        header: "Father Name (CN)",
    },
    motherfirsten: {
        header: "Mother First Name",
    },
    motherlasten: {
        header: "Mother Last Name",
    },
    mothernamecn: {
        header: "Mother Name (CN)",
    },
    contact: {
        header: "Contact",
    },
    address: {
        header: "Address",
        enableHiding: false
    },
    address1: {
        header: "Address Line 2",
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
        enableHiding: false
    },
    officephone: {
        header: "Office Phone",
    },
    cellphone: {
        header: "Cell Phone",
    },
    email: {
        header: "Email",
        enableHiding: false
    },
    email2: {
        header: "Alternative Email",
    },
    createddate: {
        header: "Created Date",
    },
    lastmodify: {
        header: "Last Modified",
    },
    lastlogin: {
        header: "Last Login",
    },
    status: {
        header: "Status",
    },
    remark: {
        header: "Remarks",
    },
    schoolmember: {
        header: "School Member",
    }
}, ["password"])

// Get all families
export async function getAllFamilies() {
    try {
        const result = await db.select().from(family);
        return result;
    } catch (error) {
        console.error("Error fetching families:", error);
        return [];
    }
}

// Get families with pagination
export async function getFamilies(page: number, pageSize: number, query:string = "") {
    try {
        const result = await db.select().from(family);
        const size = result.length;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedResult = result.slice(start, end);
        return {
            families: paginatedResult,
            totalCount: size,
        };
    } catch (error) {
        console.error("Error fetching families:", error);
        return {
            families: [],
            totalCount: 0
        };
    }
} 