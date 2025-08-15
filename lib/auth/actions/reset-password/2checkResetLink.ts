"use server";
import { db } from "@/lib/db";
import { z } from "zod/v4"
import { emailSchema, uuidSchema } from "../../validation";
import { safeAction } from "@/lib/safeAction";


const checkResetLinkSchema = z.object({
    ...emailSchema.shape,
    ...uuidSchema.shape
})
export const checkResetLink = safeAction(
    checkResetLinkSchema,
    async function (data: z.infer<typeof checkResetLinkSchema>): Promise<boolean> {
        // Data is already parsed
        const row = await db.query.verificationToken.findFirst({
            where: (vt, { and, eq }) => and(eq(vt.identifier, data.email), eq(vt.token, data.uuid))
        });

        if (!row) {
            return false;
        }
        return true;
    }
)

