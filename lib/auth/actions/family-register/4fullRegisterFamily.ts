"use server";
import { db } from "@/lib/db";
import { teacherSchema, familySchema, nameEmailSchema } from "../../validation";
import { teacher, family, users, registration_drafts } from "@/lib/db/schema";
import { z } from "zod/v4";
import { and, eq } from "drizzle-orm";
import { safeAction } from "@/lib/safeAction";
import { toESTString } from "@/lib/utils";

const fullRegisterFamilySchema = z.object({
    fullData: z.union([teacherSchema, familySchema]),
    regData: nameEmailSchema,
    isTeacher: z.boolean()
})

// STEP 5: Register the user into the database
export const fullRegisterFamily = safeAction(
    fullRegisterFamilySchema,
    async (data) => {
        const { fullData, regData, isTeacher } = data;

        // Parse and validate input data
        const info = isTeacher ? teacherSchema.parse(fullData) : familySchema.parse(fullData);
        const credData = nameEmailSchema.parse(regData);
        const insertionTable = isTeacher ? teacher : family;
        const { address, city, state, zip, phone, ...profileData } = info;

        // Find the registration draft
        const draft = await db.query.registration_drafts.findFirst({
            where: (rd, { and, eq }) =>
                and(
                    eq(rd.email, credData.email),
                    eq(rd.name, credData.username)
                ),
        });

        if (!draft || new Date(draft.expires) < new Date(toESTString(new Date()))) {
            throw new Error("Your session has expired. Please register again.");
        }

        // Remove the draft to prevent reuse
        await db
            .delete(registration_drafts)
            .where(
                and(
                    eq(registration_drafts.email, draft.email),
                    eq(registration_drafts.name, draft.name)
                )
            );

        // Insert new user
        const [{ id: userId }] = await db
            .insert(users)
            .values({
                roles: [isTeacher ? "TEACHER" : "FAMILY"],
                emailVerified: toESTString(new Date()),
                createon: toESTString(new Date()),
                address,
                city,
                state,
                zip,
                phone,
                email: draft.email,
                name: draft.name,
                password: draft.password,
            })
            .returning({ id: users.id });

        // Insert into teacher or family table
        await db
            .insert(insertionTable)
            .values({
                userid: userId,
                ...profileData,
            });
    }
);