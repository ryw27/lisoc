"use server";
import { forgotPassSchema, emailSchema, usernameSchema } from "../../validation";
import { z } from "zod/v4";
import { pgadapter } from "../../auth";
import { checkExistence, sendFPEmail } from "../../helpers";
import { v4 as uuid } from "uuid";
import { safeAction } from "@/lib/safeAction";

export const requestPasswordReset = safeAction(
    forgotPassSchema,
    async function(data: z.infer<typeof forgotPassSchema>) {
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
            throw new Error("Database error")
        }

        await sendFPEmail(userEmail, token);
    }
)