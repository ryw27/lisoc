import { db } from "@/app/lib/db/index";
import { adminuser } from "@/app/lib/db/schema";
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
// ADMINISTRATORS
//----------------------------------------------------------------------------------------


// Form Schema: Form schema for administrator user
export const adminFormSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
    namecn: z.string().optional(),
    firstname: z.string().min(1),
    lastname: z.string().min(1),
    address: z.string().min(1),
    address1: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    familyid: z.coerce.number().int().optional(),
    status: z.enum(["Active", "Inactive"]),
    ischangepwdnext: z.boolean().default(true),
    notes: z.string().optional()
})

// Type of any admin insertions: for compile-time type checking
export type Admin = typeof adminuser.$inferSelect
// Add an admin from form data and insert into database
export async function addAdmin(formData: FormData) {
    'use server';
    const user = "testuser";

    //drizzle-zod to validate that this is a valid object that can be inserted into database
    const adminInsertSchema = createInsertSchema(adminuser);
    try {
        const form = adminFormSchema.parse(Object.fromEntries(formData));
        await db.transaction(async (tx) => {
            // Check whether the admin already exists
            const exists = await tx
                    .select()
                    .from(adminuser)
                    .where(and(
                        eq(adminuser.username, form.username),
                        eq(adminuser.status, "Active")
                    ))
                    .limit(1);
            if (exists.length) {
                throw new Error("Administrator already exists");
            }

            // Generate a new admin ID
            const newAdminId = parseInt(randomUUID().slice(0, 4), 16);
            
            const newAdmin = {
                ...form,
                userid: newAdminId,
                createon: formatISO(new Date()),
                updateon: formatISO(new Date()),
                lastlogin: formatISO(new Date()),
                createby: user,
                updateby: user
            } as Admin;

            const parsed = adminInsertSchema.parse(newAdmin);
            await db.insert(adminuser).values(parsed);
        });  
        
        redirect('/admintest/dashboard/administrator-view');
    } catch (error) {
        console.error(error);
        if (error instanceof ZodError) {
            redirect(`/admintest/dashboard/add-administrator/?error=${encodeURIComponent(error.errors[0].message)}`);
        } else if (error instanceof Error) {
            redirect(`/admintest/dashboard/add-administrator/?error=${encodeURIComponent(error.message)}`);
        } else {
            redirect(`/admintest/dashboard/add-administrator/?error=${encodeURIComponent('An unknown error occurred')}`);
        }
    }
}


// Update an existing admin in the database. 
export async function updateAdmin(formData: FormData, input_id:string) {
    'use server';
    const user = "testuser";

    //drizzle-zod to validate that this is a valid object that can be inserted into database
    const adminUpdateSchema = createUpdateSchema(adminuser);
    try {
        const form = adminFormSchema.parse(Object.fromEntries(formData));
        
        const updatedAdmin = {
            ...form,
            updateon: formatISO(new Date()),
            updateby: user
        };

        const parsed = adminUpdateSchema.parse(updatedAdmin);
        await db.update(adminuser).set(parsed).where(eq(adminuser.userid, parseInt(input_id)));

        redirect(`/admintest/dashboard/administrator-view`);
    } catch (error) {
        console.error(error);
        if (error instanceof ZodError) {
            redirect(`/admintest/dashboard/administrator-view/${input_id}/edit-administrator/?error=${encodeURIComponent(error.errors[0].message)}`);
        } else if (error instanceof Error) {
            redirect(`/admintest/dashboard/administrator-view/${input_id}/edit-administrator/?error=${encodeURIComponent(error.message)}`);
        } else {
            redirect(`/admintest/dashboard/administrator-view/${input_id}/edit-administrator/?error=${encodeURIComponent('An unknown error occured')}`);
        }
    } 
}


// Delete admin. Use delete rows helper function
export async function deleteAdmins(ids: number[]) {
    'use server';
    await deleteRows(adminuser, 'userid', ids);
    revalidatePath('/admintest/dashboard/administrator-view');
}


export const adminColumns = generateColumnDefs<Admin>(adminuser, {
    userid: {
        header: "Admin ID",
    },
    username: {
        header: "Username",
        enableHiding: false
    },
    password: {
        header: "Password",
    },
    namecn: {
        header: "Name (CN)",
    },
    firstname: {
        header: "First Name",
        enableHiding: false
    },
    lastname: {
        header: "Last Name",
        enableHiding: false
    },
    address: {
        header: "Address",
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
    email: {
        header: "Email",
        enableHiding: false
    },
    phone: {
        header: "Phone",
    },
    familyid: {
        header: "Family ID",
    },
    status: {
        header: "Status",
        enableHiding: false
    },
    ischangepwdnext: {
        header: "Change Password Next Login",
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
}, ["password"])

// Get all admins
export async function getAllAdmins() {
    try {
        const result = await db.select().from(adminuser);
        return result;
    } catch (error) {
        console.error("Error fetching administrators:", error);
        return [];
    }
}

// Get admins with pagination
export async function getAdmins(page: number, pageSize: number, query:string = "") {
    try {
        const result = await db.select().from(adminuser);
        const size = result.length;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedResult = result.slice(start, end);
        return {
            administrators: paginatedResult,
            totalCount: size,
        };
    } catch (error) {
        console.error("Error fetching administrators:", error);
        return {
            administrators: [],
            totalCount: 0
        };
    }
} 