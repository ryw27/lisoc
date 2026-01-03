"use server";

import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { z } from "zod/v4";
import { pgadapter } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { safeAction } from "@/lib/safeAction";
import { checkExistence, sendFPEmail } from "./data";
import {
    emailSchema,
    forgotPassSchema,
    resetPassSchema,
    usernameSchema,
    uuidSchema,
} from "./schema";

// Step 1: Request password reset
export const requestPasswordReset = safeAction(
    forgotPassSchema,
    async function (data: z.infer<typeof forgotPassSchema>) {
        // Validate input using schema
        const { emailUsername } = forgotPassSchema.parse(data);

        // Determine if input is an email or username
        const isEmail = emailSchema.safeParse({ email: emailUsername }).success;
        const isUsername = usernameSchema.safeParse({ username: emailUsername }).success;

        let userEmail: string | null = null;

        if (isEmail) {
            // Input is an email, check existence
            const check = await checkExistence(emailUsername, "email");
            if (!check.exists) {
                throw new Error("Account does not exist");
            }
            userEmail = emailUsername;
        } else if (isUsername) {
            // Input is a username, check existence and resolve to email
            const check = await checkExistence(emailUsername, "name");
            if (!check.exists || !check.data) {
                throw new Error("Account does not exist");
            }
            userEmail = check.data.email;
        } else {
            throw new Error("Invalid Email or Username");
        }

        // Generate a unique verification token
        const token = uuid();

        const result = await pgadapter.createVerificationToken({
            token,
            identifier: userEmail,
            expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        });

        if (!result) {
            throw new Error("Database error");
        }

        await sendFPEmail(userEmail, token);
    }
);

// Step 2: Check reset link
const checkResetLinkSchema = z.object({
    ...emailSchema.shape,
    ...uuidSchema.shape,
});
export const checkResetLink = safeAction(
    checkResetLinkSchema,
    async function (data: z.infer<typeof checkResetLinkSchema>): Promise<boolean> {
        // Data is already parsed
        const row = await db.query.verificationToken.findFirst({
            where: (vt, { and, eq }) => and(eq(vt.identifier, data.email), eq(vt.token, data.uuid)),
        });

        if (!row) {
            return false;
        }
        return true;
    }
);

// Step 3: Reset the password
export const resetPassword = safeAction(resetPassSchema, async (data) => {
    const { email, password, confirmPassword, token } = data;

    if (password !== confirmPassword) {
        throw new Error("Passwords don't match");
    }

    const tokenRow = await pgadapter.useVerificationToken({ identifier: email, token });
    if (!tokenRow) {
        throw new Error("Invalid or expired Link");
    }

    const pwdhash = await bcrypt.hash(password, 10);

    await db.update(users).set({ password: pwdhash }).where(eq(users.email, email));
});
