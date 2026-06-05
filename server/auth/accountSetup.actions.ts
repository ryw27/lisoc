"use server";

import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { z } from "zod/v4";
import { pgadapter } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminuser, teacher, users } from "@/lib/db/schema";
import { clientIp, enforceRateLimit } from "@/lib/rateLimit";
import { safeAction } from "@/lib/safeAction";
import { toESTString } from "@/lib/utils";
import { passwordSchema, uuidSchema } from "./schema";
import { hashToken } from "./tokenHash";

const SETUP_SESSION_COOKIE = "lisoc_account_setup";
const SETUP_TOKEN_PREFIX = "account-setup:";
const SETUP_SESSION_PREFIX = "account-setup-session:";
const SETUP_SESSION_TTL_MS = 30 * 60 * 1000;

const setupSessionCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/setup-account",
    maxAge: SETUP_SESSION_TTL_MS / 1000,
};

const setupAccountSchema = z
    .object({
        password: passwordSchema.shape.password,
        confirmPassword: passwordSchema.shape.password,
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const isAccountSetupLinkValid = safeAction(
    z.object({ token: uuidSchema.shape.uuid }),
    async ({ token }): Promise<boolean> => {
        return Boolean(await exchangeSetupTokenForSession(token));
    }
);

async function exchangeSetupTokenForSession(token: string) {
    const tokenHash = hashToken(token);
    const row = await db.query.verificationToken.findFirst({
        where: (v, { and, eq, like }) =>
            and(like(v.identifier, `${SETUP_TOKEN_PREFIX}%`), eq(v.token, tokenHash)),
    });
    if (!row || new Date(row.expires) < new Date()) return null;

    const email = row.identifier.slice(SETUP_TOKEN_PREFIX.length);
    const u = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, email),
    });
    if (!u || u.emailVerified) return null;

    const consumed = await pgadapter.useVerificationToken({
        identifier: row.identifier,
        token: tokenHash,
    });
    if (!consumed || new Date(consumed.expires) < new Date()) return null;

    const sessionToken = uuid();
    await pgadapter.createVerificationToken({
        identifier: `${SETUP_SESSION_PREFIX}${email}`,
        token: hashToken(sessionToken),
        expires: new Date(Date.now() + SETUP_SESSION_TTL_MS),
    });
    (await cookies()).set(SETUP_SESSION_COOKIE, sessionToken, setupSessionCookieOptions);
    return email;
}

export const exchangeAccountSetupToken = safeAction(
    z.object({ token: uuidSchema.shape.uuid }),
    async ({ token }) => {
        const ip = await clientIp();
        enforceRateLimit(`setup:exchange:ip:${ip}`, { max: 30, windowMs: 15 * 60_000 });

        const email = await exchangeSetupTokenForSession(token);
        if (!email) {
            throw new Error("This setup link is invalid or has expired.");
        }
        return { email };
    }
);

export async function isAccountSetupSessionValid() {
    const sessionToken = (await cookies()).get(SETUP_SESSION_COOKIE)?.value;
    if (!sessionToken) return null;

    const row = await db.query.verificationToken.findFirst({
        where: (v, { and, eq, like }) =>
            and(
                like(v.identifier, `${SETUP_SESSION_PREFIX}%`),
                eq(v.token, hashToken(sessionToken))
            ),
    });
    if (!row || new Date(row.expires) < new Date()) return null;
    return { email: row.identifier.slice(SETUP_SESSION_PREFIX.length) };
}

export const completeAccountSetup = safeAction(setupAccountSchema, async (data) => {
    const { password } = data;
    const sessionToken = (await cookies()).get(SETUP_SESSION_COOKIE)?.value;
    if (!sessionToken) {
        throw new Error("This setup session is invalid or has expired.");
    }

    const tokenHash = hashToken(sessionToken);
    const sessionRow = await db.query.verificationToken.findFirst({
        where: (v, { and, eq, like }) =>
            and(like(v.identifier, `${SETUP_SESSION_PREFIX}%`), eq(v.token, tokenHash)),
    });
    if (!sessionRow || new Date(sessionRow.expires) < new Date()) {
        throw new Error("This setup session is invalid or has expired.");
    }

    const email = sessionRow.identifier.slice(SETUP_SESSION_PREFIX.length);

    const ip = await clientIp();
    enforceRateLimit(`setup:email:${email.toLowerCase()}`, { max: 5, windowMs: 15 * 60_000 });
    enforceRateLimit(`setup:ip:${ip}`, { max: 20, windowMs: 15 * 60_000 });

    const consumed = await pgadapter.useVerificationToken({
        identifier: sessionRow.identifier,
        token: tokenHash,
    });
    if (!consumed || new Date(consumed.expires) < new Date()) {
        throw new Error("This setup session is invalid or has expired.");
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
    (await cookies()).delete(SETUP_SESSION_COOKIE);
});
