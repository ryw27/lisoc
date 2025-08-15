"use server";
import { pgadapter } from "../../auth";
import { emailSchema } from "../../validation";
import { z } from "zod/v4"
import { safeAction } from "@/lib/safeAction";
import { sendRegLinkEmail } from "../../helpers";

const createRegLinkSchema = z.object({
    email: emailSchema.shape.email,
    type: z.enum(["Teacher", "Admin"])
});

export const createRegLink = safeAction(
    createRegLinkSchema,
    async ({ email, type }) => {
        const token = crypto.randomUUID();

        await pgadapter.createVerificationToken({
            identifier: email,
            token,
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        });

        await sendRegLinkEmail(email, token, type);
    }
);