"use server";
import { emailSchema } from "../validation";
import { uuidSchema } from "../validation";
import { db } from "@/lib/db";


export async function checkResetLink(email: string, token: string): Promise<boolean> {
    emailSchema.parse({ email: email });
    uuidSchema.parse({ uuid: token });

    const row = await db.query.verificationToken.findFirst({
        where: (vt, { and, eq }) => and(eq(vt.identifier, email), eq(vt.token, token))
    });

    if (!row) {
        return false;
    }

    return true;
}