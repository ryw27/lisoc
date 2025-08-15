"use server";
import { db } from "@/lib/db";
import { safeAction } from "@/lib/safeAction";
import { z } from "zod/v4"
import { emailSchema } from "../../validation";
import { adminuser, teacher, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { toESTString } from "@/lib/utils";
import bcrypt from "bcrypt";



const setPasswordSchema = z.object({
    email: emailSchema.shape.email,
    password: z
        .string()
        .min(1, { message: "Password must be filled" })
        .min(6, { message: "Password must be at least 6 characters long" })
        .max(72, { message: "Password is too long" }),
    confirmpassword: z
        .string()
        .min(1, { message: "Password must be filled" })
        .min(6, { message: "Password must be at least 6 characters long" })
        .max(72, { message: "Password is too long" }),
    role: z.enum(["ADMINUSER", "TEACHER"])
})
.refine(
    ({ password, confirmpassword }) => password === confirmpassword,
    { message: "Passwords do not match", path: ["confirmpassword"] }
);

export const setPasswordAfterLogin = safeAction(
    setPasswordSchema,
    async ({ email, password, role }) => {
        // Already parsed
        await db.transaction(async (tx) => {
            const curUser = await tx.query.users.findFirst({
                where: (u, { eq }) => eq(u.email, email)
            });
            if (!curUser)  {
                throw new Error("Cannot find user with given email");
            }

            await tx
                .update(users)
                .set({
                    emailVerified: toESTString(new Date()),
                    password: await bcrypt.hash(password, 10)
                })
                .where(eq(users.email, email))

            const table = role === "ADMINUSER" ? adminuser : teacher
            await tx
                .update(table)
                .set({
                    ischangepwdnext: false
                })
                .where(eq(table.userid, curUser.id))
        })
    }
)