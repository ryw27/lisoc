"use server";
import { emailSchema } from "../../validation";
import { randomInt } from "crypto";
import { pgadapter } from "../../auth";
import { sendRegEmail } from "../../helpers";
import { z } from "zod/v4";

export async function resendCode(data: z.infer<typeof emailSchema>) {
    const userEmail = (emailSchema.parse(data)).email
    const code = randomInt(100000, 1000000).toString();
    await pgadapter.createVerificationToken({
        token: code,
        identifier: userEmail,
        expires: new Date(Date.now() + 10 * 60 * 1000) 
    })
    await sendRegEmail(userEmail, code)
}