"use server";

import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { eq, gt } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { z } from "zod/v4";
import { pgadapter } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { clientIp, enforceRateLimit } from "@/lib/rateLimit";
import { safeAction } from "@/lib/safeAction";
import { sendFPEmail } from "./data";
import { forgotPassSchema, passwordSchema, uuidSchema } from "./schema";
import { hashToken } from "./tokenHash";

const RESET_SESSION_COOKIE = "lisoc_pw_reset";
const RESET_TOKEN_PREFIX = "pwreset:";
const RESET_SESSION_PREFIX = "pwreset-session:";
const RESET_SESSION_TTL_MS = 15 * 60 * 1000;

const resetSessionCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/reset-password",
    maxAge: RESET_SESSION_TTL_MS / 1000,
};

const resetPasswordWithSessionSchema = z
    .object({
        password: passwordSchema.shape.password,
        confirmPassword: passwordSchema.shape.password,
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

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
                token: hashToken(token),
                identifier: `${RESET_TOKEN_PREFIX}${email}`,
                expires: new Date(Date.now() + 15 * 60 * 1000),
            });
            await sendFPEmail(email, token);
        }
        // No account: silently succeed. The user-facing message is generic.
    }
);

// Step 2: Check reset link
const checkResetLinkSchema = z.object({
    ...uuidSchema.shape,
});
export const checkResetLink = safeAction(
    checkResetLinkSchema,
    async function (data: z.infer<typeof checkResetLinkSchema>): Promise<boolean> {
        const row = await db.query.verificationToken.findFirst({
            where: (vt, { and, eq, like }) =>
                and(
                    like(vt.identifier, `${RESET_TOKEN_PREFIX}%`),
                    eq(vt.token, hashToken(data.uuid)),
                    gt(vt.expires, new Date().toISOString())
                ),
        });

        if (!row) {
            return false;
        }
        return true;
    }
);

export const exchangePasswordResetToken = safeAction(
    z.object({ token: uuidSchema.shape.uuid }),
    async ({ token }) => {
        const ip = await clientIp();
        enforceRateLimit(`pwreset:exchange:ip:${ip}`, { max: 30, windowMs: 15 * 60_000 });

        const tokenHash = hashToken(token);
        const row = await db.query.verificationToken.findFirst({
            where: (vt, { and, eq, like }) =>
                and(
                    like(vt.identifier, `${RESET_TOKEN_PREFIX}%`),
                    eq(vt.token, tokenHash),
                    gt(vt.expires, new Date().toISOString())
                ),
        });
        if (!row) {
            throw new Error("Invalid or expired reset link.");
        }

        const consumed = await pgadapter.useVerificationToken({
            identifier: row.identifier,
            token: tokenHash,
        });
        if (!consumed || new Date(consumed.expires) < new Date()) {
            throw new Error("Invalid or expired reset link.");
        }

        const email = consumed.identifier.slice(RESET_TOKEN_PREFIX.length);
        const sessionToken = uuid();
        await pgadapter.createVerificationToken({
            identifier: `${RESET_SESSION_PREFIX}${email}`,
            token: hashToken(sessionToken),
            expires: new Date(Date.now() + RESET_SESSION_TTL_MS),
        });
        (await cookies()).set(RESET_SESSION_COOKIE, sessionToken, resetSessionCookieOptions);
    }
);

export async function isPasswordResetSessionValid() {
    const sessionToken = (await cookies()).get(RESET_SESSION_COOKIE)?.value;
    if (!sessionToken) return false;

    const row = await db.query.verificationToken.findFirst({
        where: (vt, { and, eq, like }) =>
            and(
                like(vt.identifier, `${RESET_SESSION_PREFIX}%`),
                eq(vt.token, hashToken(sessionToken)),
                gt(vt.expires, new Date().toISOString())
            ),
    });
    return Boolean(row);
}

// Step 3: Reset the password
export const resetPassword = safeAction(resetPasswordWithSessionSchema, async (data) => {
    const { password } = data;
    const sessionToken = (await cookies()).get(RESET_SESSION_COOKIE)?.value;
    if (!sessionToken) {
        throw new Error("Invalid or expired reset session.");
    }

    const tokenHash = hashToken(sessionToken);
    const sessionRow = await db.query.verificationToken.findFirst({
        where: (vt, { and, eq, like }) =>
            and(
                like(vt.identifier, `${RESET_SESSION_PREFIX}%`),
                eq(vt.token, tokenHash),
                gt(vt.expires, new Date().toISOString())
            ),
    });
    if (!sessionRow) {
        throw new Error("Invalid or expired reset session.");
    }

    const email = sessionRow.identifier.slice(RESET_SESSION_PREFIX.length);

    // Rate-limit the token-redemption step itself. UUID tokens are high-entropy
    // so this is more about damping brute-force fishing than blocking guesses.
    const ip = await clientIp();
    enforceRateLimit(`pwreset:redeem:email:${email.toLowerCase()}`, {
        max: 10,
        windowMs: 15 * 60_000,
    });
    enforceRateLimit(`pwreset:redeem:ip:${ip}`, { max: 30, windowMs: 15 * 60_000 });

    const consumed = await pgadapter.useVerificationToken({
        identifier: sessionRow.identifier,
        token: tokenHash,
    });
    if (!consumed || new Date(consumed.expires) < new Date()) {
        throw new Error("Invalid or expired reset session.");
    }

    const pwdhash = await bcrypt.hash(password, 10);

    await db.update(users).set({ password: pwdhash }).where(eq(users.email, email));
    (await cookies()).delete(RESET_SESSION_COOKIE);
});
