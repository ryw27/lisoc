"use server";

import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { adminuser, teacher, users } from "@/lib/db/schema";
import { safeAction } from "@/lib/safeAction";
import { toESTString } from "@/lib/utils";
import { emailSchema, passwordSchema } from "./schema";

const setPasswordSchema = z
    .object({
        email: emailSchema.shape.email,
        password: passwordSchema.shape.password,
        confirmpassword: passwordSchema.shape.password,
        role: z.enum(["ADMINUSER", "TEACHER"]),
    })
    .refine(({ password, confirmpassword }) => password === confirmpassword, {
        message: "Passwords do not match",
        path: ["confirmpassword"],
    });

export const setPasswordAfterLogin = safeAction(
    setPasswordSchema,
    async ({ email, password, role }) => {
        // Already parsed
        await db.transaction(async (tx) => {
            const curUser = await tx.query.users.findFirst({
                where: (u, { eq }) => eq(u.email, email),
            });
            if (!curUser) {
                throw new Error("Cannot find user with given email");
            }

            await tx
                .update(users)
                .set({
                    emailVerified: toESTString(new Date()),
                    password: await bcrypt.hash(password, 10),
                })
                .where(eq(users.email, email));

            const table = role === "ADMINUSER" ? adminuser : teacher;
            await tx
                .update(table)
                .set({
                    ischangepwdnext: false,
                })
                .where(eq(table.userid, curUser.id));
        });
    }
);
