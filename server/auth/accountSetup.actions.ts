"use server";

import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { pgadapter } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminuser, teacher, users } from "@/lib/db/schema";
import { clientIp, enforceRateLimit } from "@/lib/rateLimit";
import { safeAction } from "@/lib/safeAction";
import { toESTString } from "@/lib/utils";
import { emailSchema, passwordSchema, uuidSchema } from "./schema";

const setupAccountSchema = z
    .object({
        email: emailSchema.shape.email,
        token: uuidSchema.shape.uuid,
        password: passwordSchema.shape.password,
        confirmPassword: passwordSchema.shape.password,
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

// Server-side validation of an account-setup link before the user is asked
// to choose a password. Returns true only if there's an unverified user with
// a still-valid pgadapter verification token for this email. Note: we do NOT
// consume the token here — that happens in `completeAccountSetup`. We only
// peek at it so the setup page can render the form vs an "expired link"
// error.
export const isAccountSetupLinkValid = safeAction(
    z.object({ email: emailSchema.shape.email, token: uuidSchema.shape.uuid }),
    async ({ email, token }): Promise<boolean> => {
        const row = await db.query.verificationToken.findFirst({
            where: (v, { and, eq }) => and(eq(v.identifier, email), eq(v.token, token)),
        });
        if (!row) return false;
        if (new Date(row.expires) < new Date()) return false;
        const u = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.email, email),
        });
        if (!u) return false;
        // If the user has already verified, the setup link is no longer the
        // appropriate path — they should use forgot-password instead.
        if (u.emailVerified) return false;
        return true;
    }
);

export const completeAccountSetup = safeAction(setupAccountSchema, async (data) => {
    const { email, token, password } = data;

    const ip = await clientIp();
    enforceRateLimit(`setup:email:${email.toLowerCase()}`, { max: 5, windowMs: 15 * 60_000 });
    enforceRateLimit(`setup:ip:${ip}`, { max: 20, windowMs: 15 * 60_000 });

    // Use-and-consume the token. If invalid or expired, the auth.js adapter
    // returns null and we bail without touching the user row.
    const consumed = await pgadapter.useVerificationToken({ identifier: email, token });
    if (!consumed || new Date(consumed.expires) < new Date()) {
        throw new Error("This setup link is invalid or has expired.");
    }

    const u = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, email),
    });
    if (!u) {
        throw new Error("Account not found");
    }
    // Don't allow setup once the account is already verified — that path is
    // a password-reset, not a setup.
    if (u.emailVerified) {
        throw new Error("This account has already been set up.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = toESTString(new Date());

    await db.transaction(async (tx) => {
        await tx
            .update(users)
            .set({ password: passwordHash, emailVerified: now, updateon: now })
            .where(eq(users.id, u.id));
        // Clear the "must change on next login" flag for whichever role table
        // applies. The user is choosing their own password right now, so the
        // first login should be normal.
        if (u.roles.includes("ADMINUSER")) {
            await tx
                .update(adminuser)
                .set({ ischangepwdnext: false })
                .where(eq(adminuser.userid, u.id));
        }
        if (u.roles.includes("TEACHER")) {
            await tx
                .update(teacher)
                .set({ ischangepwdnext: false })
                .where(eq(teacher.userid, u.id));
        }
    });
});
