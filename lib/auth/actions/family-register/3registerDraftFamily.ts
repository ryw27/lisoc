"use server";
import { db } from "@/lib/db";
import { userPassSchema, emailSchema } from "../../validation";
import { registration_drafts } from "@/lib/db/schema";
import { z } from "zod/v4";
import bcrypt from "bcrypt";


export async function registerDraftFamily(data: z.infer<typeof userPassSchema>, email: string) {
    const draftData = userPassSchema.parse(data);
    emailSchema.parse({ email: email });

    const { password, username } = draftData;

    // Check if username already exists
    const usernameUnique = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.name, username)
    })

    if (usernameUnique) {
        throw new Error("Username already exists")
    }

    // Insert into registration_drafts, if username and email combo already exists, update the password and expires
    await db
        .insert(registration_drafts)
        .values({
            email: email,
            name: username,
            password: await bcrypt.hash(password, 10),
        })
        .onConflictDoUpdate({
            target: [registration_drafts.email, registration_drafts.name],
            set: {
                password: await bcrypt.hash(password, 10),
                expires: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString()
            }
        })
}