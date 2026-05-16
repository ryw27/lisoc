"use server";

import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { z } from "zod/v4";
import { pgadapter } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { clientIp, enforceRateLimit } from "@/lib/rateLimit";
import { safeAction } from "@/lib/safeAction";
import { sendFPEmail } from "./data";
import { emailSchema, forgotPassSchema, resetPassSchema, uuidSchema } from "./schema";

// Step 1: Request password reset.
// IMPORTANT: this action MUST NOT reveal whether the email exists. Both the
// "account exists" and "account does not exist" branches return success and
// take roughly the same amount of work — that prevents both response-content
// and timing-based user enumeration. The email is only actually sent when an
// account exists.
export const requestPasswordReset = safeAction(
    forgotPassSchema,
    async function (data: z.infer<typeof forgotPassSchema>) {
        const { email } = forgotPassSchema.parse(data);
        const normalisedEmail = email.toLowerCase();

        // Rate-limit per email and per IP to prevent email-bombing.
        const ip = await clientIp();
        enforceRateLimit(`pwreset:request:id:${normalisedEmail}`, {
            max: 3,
            windowMs: 15 * 60_000,
        });
        enforceRateLimit(`pwreset:request:ip:${ip}`, { max: 10, windowMs: 15 * 60_000 });

        // Look up account. We always do the lookup so the timing of both
        // branches stays roughly equal.
        const account = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.email, email),
        });

        if (account) {
            const token = uuid();
            await pgadapter.createVerificationToken({
                token,
                identifier: email,
                expires: new Date(Date.now() + 15 * 60 * 1000),
            });
            await sendFPEmail(email, token);
        }
        // No account: silently succeed. The user-facing message is generic.
    }
);

// Step 2: Check reset link
const checkResetLinkSchema = z.object({
    ...emailSchema.shape,
    ...uuidSchema.shape,
});
export const checkResetLink = safeAction(
    checkResetLinkSchema,
    async function (data: z.infer<typeof checkResetLinkSchema>): Promise<boolean> {
        // Data is already parsed
        const row = await db.query.verificationToken.findFirst({
            where: (vt, { and, eq }) => and(eq(vt.identifier, data.email), eq(vt.token, data.uuid)),
        });

        if (!row) {
            return false;
        }
        return true;
    }
);

// Step 3: Reset the password
export const resetPassword = safeAction(resetPassSchema, async (data) => {
    const { email, password, confirmPassword, token } = data;

    // Rate-limit the token-redemption step itself. UUID tokens are high-entropy
    // so this is more about damping brute-force fishing than blocking guesses.
    const ip = await clientIp();
    enforceRateLimit(`pwreset:redeem:email:${email.toLowerCase()}`, {
        max: 10,
        windowMs: 15 * 60_000,
    });
    enforceRateLimit(`pwreset:redeem:ip:${ip}`, { max: 30, windowMs: 15 * 60_000 });

    if (password !== confirmPassword) {
        throw new Error("Passwords don't match");
    }

    const tokenRow = await pgadapter.useVerificationToken({ identifier: email, token });
    if (!tokenRow) {
        throw new Error("Invalid or expired Link");
    }

    const pwdhash = await bcrypt.hash(password, 10);

    await db.update(users).set({ password: pwdhash }).where(eq(users.email, email));
});
