"use server";
import { resetPassSchema } from "../../validation";
import { pgadapter } from "../../auth";
import bcrypt from "bcrypt";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { safeAction } from "@/lib/safeAction";


export const resetPassword = safeAction(
    resetPassSchema,
    async (data) => {
        const { email, password, confirmPassword, token } = data;

        if (password !== confirmPassword) {
            throw new Error("Passwords don't match");
        }

        const tokenRow = await pgadapter.useVerificationToken({ identifier: email, token });
        if (!tokenRow) {
            throw new Error("Invalid or expired Link");
        }

        const pwdhash = await bcrypt.hash(password, 10);

        await db
            .update(users)
            .set({ password: pwdhash })
            .where(eq(users.email, email));
    }
);