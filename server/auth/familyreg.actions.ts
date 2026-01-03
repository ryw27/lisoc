"use server";

import { randomInt } from "crypto";
import bcrypt from "bcrypt";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { pgadapter } from "@/lib/auth";
import { db } from "@/lib/db";
import { family, registration_drafts, teacher, users } from "@/lib/db/schema";
import { safeAction } from "@/lib/safeAction";
import { toESTString } from "@/lib/utils";
import { sendRegEmail } from "./data";
import {
    codeSchema,
    emailSchema,
    familySchema,
    nameEmailSchema,
    teacherSchema,
    userPassSchema,
} from "./schema";

// Helper to resend code
export async function resendCode(data: z.infer<typeof emailSchema>) {
    const userEmail = emailSchema.parse(data).email;
    const code = randomInt(100000, 1000000).toString();
    await pgadapter.createVerificationToken({
        token: code,
        identifier: userEmail,
        expires: new Date(Date.now() + 10 * 60 * 1000),
    });
    await sendRegEmail(userEmail, code);
}

// STEP 1: Enter email. If valid, request a code using the auth.js PostgresAdapter
export async function requestRegCode(data: z.infer<typeof emailSchema>) {
    // Parse incoming data
    const userData = emailSchema.parse(data);

    // unique check
    const unique = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, userData.email),
    });

    if (unique) {
        // Email exists
        throw new Error("Email already exists");
    }

    const email = userData.email;
    const code = randomInt(100000, 1000000).toString();
    await pgadapter.createVerificationToken({
        token: code,
        identifier: email,
        expires: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendRegEmail(email, code);
}

// Step 2: Check registration code
export async function checkRegCode(data: z.infer<typeof codeSchema>, email: string) {
    emailSchema.parse({ email: email });
    const codeData = codeSchema.parse(data);

    // Automatically deletes the token and validates it
    const vt = await pgadapter.useVerificationToken({ identifier: email, token: codeData.code });

    if (!vt) {
        throw new Error("Invalid or expired code");
    }

    // Check if token is expired
    if (new Date(vt.expires) < new Date(Date.now())) {
        throw new Error("Expired Code");
    }
}

export async function registerDraftFamily(data: z.infer<typeof userPassSchema>, email: string) {
    const draftData = userPassSchema.parse(data);
    emailSchema.parse({ email: email });

    const { password, username } = draftData;

    // Check if username already exists
    const usernameUnique = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.name, username),
    });

    if (usernameUnique) {
        throw new Error("Username already exists");
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
                expires: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
            },
        });
}

const fullRegisterFamilySchema = z.object({
    fullData: z.union([teacherSchema, familySchema]),
    regData: nameEmailSchema,
    isTeacher: z.boolean(),
});

// STEP 5: Register the user into the database
export const fullRegisterFamily = safeAction(fullRegisterFamilySchema, async (data) => {
    const { fullData, regData, isTeacher } = data;

    // Parse and validate input data
    const info = isTeacher ? teacherSchema.parse(fullData) : familySchema.parse(fullData);
    const credData = nameEmailSchema.parse(regData);
    const insertionTable = isTeacher ? teacher : family;
    const { address, city, state, zip, phone, ...profileData } = info;

    // Find the registration draft
    const draft = await db.query.registration_drafts.findFirst({
        where: (rd, { and, eq }) =>
            and(eq(rd.email, credData.email), eq(rd.name, credData.username)),
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
    await db.insert(insertionTable).values({
        userid: userId,
        ...profileData,
    });
});
