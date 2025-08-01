"use server";
import { forgotPassSchema } from "../validation";
import { emailSchema, usernameSchema } from "../validation";
import { db } from "@/lib/db";
import { z } from "zod/v4";
import { pgadapter } from "../auth";
import { checkExistence, sendFPEmail } from "../helpers";
import { v4 as uuid } from "uuid";

export async function requestPasswordReset(data: z.infer<typeof forgotPassSchema>) {
    const fpCheck = forgotPassSchema.parse(data);
    const input = fpCheck.emailUsername;

    // Check if input is an email or username
    const isEmail = emailSchema.safeParse({ email: input }).success;
    const isUsername = usernameSchema.safeParse({ username: input }).success;
    
    let userEmail: string | null = null;
    
    if (isEmail) {
        // Input is an email
        const emailExists = await checkExistence(input, "email");
        if (!emailExists) {
            throw new Error("Account does not exist")
        }
        userEmail = input;
    } else if (isUsername) {
        // Input is a username - need to find the associated email
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.name, input)
        });
        
        if (!user) {
            throw new Error("Account does not exist")
        }
        userEmail = user.email;
    } else {
        throw new Error("Invalid Email or Username")
    }

    // await db
    //     .update(users)
    //     .set({ ischangepwdnext: true})
    //     .where(eq(users.email, userEmail!))

    const uuidCode = uuid();

    await pgadapter.createVerificationToken({
        token: uuidCode,
        identifier: userEmail!,
        expires: new Date(Date.now() + 1000 * 60 * 15) 
    });

    await sendFPEmail(userEmail!, uuidCode);
}