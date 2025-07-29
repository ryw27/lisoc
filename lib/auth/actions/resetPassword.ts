import { resetPassSchema } from "../validation";
import { pgadapter } from "../auth";
import { z } from "zod/v4";
import bcrypt from "bcrypt";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function resetPassword(data: z.infer<typeof resetPassSchema>) {
    const resetData = resetPassSchema.parse(data);

    const { email, password, confirmPassword, token } = resetData;

    if (password !== confirmPassword) {
        throw new Error("Passwords don't match")
    }

    const row = await pgadapter.useVerificationToken({ identifier: email, token: token })
    if (!row) {
        throw new Error("Invalid or expired Link")
    }
    const pwdhash = await bcrypt.hash(password, 10);
    await db
        .update(users)
        .set({
            password: pwdhash
        })
        .where(eq(users.email, email));
}