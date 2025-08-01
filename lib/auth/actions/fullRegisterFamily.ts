"use server";
import { db } from "@/lib/db";
import { teacherSchema, familySchema, nameEmailSchema } from "../validation";
import { teacher, family, users, registration_drafts } from "@/lib/db/schema";
import { z } from "zod/v4";
import { and, eq } from "drizzle-orm";


// STEP 5: Register the user into the database
export async function fullRegisterFamily(
    data: z.infer<typeof teacherSchema> | z.infer<typeof familySchema>, 
    regData: z.infer<typeof nameEmailSchema>, 
    isTeacher: boolean
) {
    const info = isTeacher ? teacherSchema.parse(data) : familySchema.parse(data);
    const credData = nameEmailSchema.parse(regData);
    const insertion = isTeacher ? teacher : family
    const { address, city, state, zip, phone, ...parsedData } = info;

    const draft = await db.query.registration_drafts.findFirst({
        where: (rd, { and, eq }) => and(eq(rd.email, credData.email), eq(rd.name, credData.username))
    })    

    if (!draft || new Date(draft.expires) < new Date(Date.now())) {
        throw new Error("Your session has expired. Please register again.")
    }

    // Delete the draft
    await db.delete(registration_drafts).where(and(eq(registration_drafts.email, draft.email), eq(registration_drafts.name, draft.name)));

    const newUser = await db
        .insert(users)
        .values({
            roles: [isTeacher ? 'TEACHER' : 'FAMILY'],
            emailVerified: new Date(Date.now()).toISOString(),
            createon: new Date(Date.now()).toISOString(),
            address: address,
            city: city,
            state: state,
            zip: zip,
            phone: phone,
            email: draft.email,
            name: draft.name,
            password: draft.password,
        })
        .returning({ id: users.id })
    
    await db
        .insert(insertion)
        .values({
            userid: newUser[0].id,
            ...parsedData
        })

}