"use server";
import { db } from "@/lib/db";
import { z } from "zod/v4";
import { emailSchema } from "../../validation";
import { uuidSchema } from "../../validation";
import { safeAction } from "@/lib/safeAction";

const checkRegLinkSchema = z.object({
    email: emailSchema.shape.email,
    token: uuidSchema.shape.uuid,
});

export const checkRegLink = safeAction(
    checkRegLinkSchema,
    async ({ email, token }) => {
        const row = await db.query.verificationToken.findFirst({
            where: (vt, { and, eq }) => and(eq(vt.identifier, email), eq(vt.token, token)),
        });
        return !!row;
    }
);