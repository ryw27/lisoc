"use server";
import { db } from "@/lib/db";
import { emailSchema } from "../../validation";
import { randomInt } from "crypto";
import { pgadapter } from "../../auth";
import { sendRegEmail } from "../../helpers";
import { z } from "zod/v4";


// STEP 1: Enter email. If valid, request a code using the auth.js PostgresAdapter
export async function requestRegCode(data: z.infer<typeof emailSchema>) {
    // Parse incoming data
    const userData = emailSchema.parse(data);

    // unique check
    const unique = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, userData.email)
    })

    if (unique) { // Email exists
        throw new Error("Email already exists")
    }

    const email = userData.email
    const code = randomInt(100000, 1000000).toString();
    await pgadapter.createVerificationToken({
        token: code, 
        identifier: email,
        expires: new Date(Date.now() + 10 * 60 * 1000) 
    })

    await sendRegEmail(email, code);
}