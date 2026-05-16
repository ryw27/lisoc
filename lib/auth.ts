import authConfig from "@/auth.config";
import PostgresAdapter from "@auth/pg-adapter";
import bcrypt from "bcrypt";
import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import { type Adapter } from "next-auth/adapters";
// @ts-expect-error JWT needs to be used to edit the module
import { type JWT } from "next-auth/jwt"; // eslint-disable-line @typescript-eslint/no-unused-vars -- imported only for module augmentation
import Credentials from "next-auth/providers/credentials";
import { adminloginSchema, credSchema, loginSchema } from "@/server/auth/schema";
import { clientIp, rateLimit } from "./rateLimit";
import { db, pool } from "./db";

//Declare module for session user but it's not working idk why lol
declare module "next-auth" {
    interface User {
        id: string;
        role: "ADMIN" | "TEACHER" | "FAMILY";
    }

    interface Session {
        user: User & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        sub: string; // user id
        role: "ADMIN" | "TEACHER" | "FAMILY";
    }
}

export const pgadapter = PostgresAdapter(pool) as Required<Adapter>;

class IncorrectEmailPasswordError extends CredentialsSignin {
    code = "incorrect-email-password";
}

class NewAccountError extends CredentialsSignin {
    code = "missing-password";
}

class InternalServerError extends CredentialsSignin {
    code = "internal-server-error";
}

class RateLimitExceededError extends CredentialsSignin {
    code = "rate-limit-exceeded";
}

// Rate-limit login attempts. Both per-IP (catches credential-stuffing tools)
// and per-identifier (catches targeted attacks against one account). We
// throw RateLimitExceededError instead of IncorrectEmailPasswordError so
// legitimate users get useful feedback once they're rate-limited; the
// thresholds are loose enough that real users will rarely trip them.
async function enforceLoginRateLimit(provider: string, identifier: string) {
    const ip = await clientIp();
    const ipRes = rateLimit(`login:${provider}:ip:${ip}`, { max: 20, windowMs: 15 * 60_000 });
    if (!ipRes.ok) throw new RateLimitExceededError();
    const idRes = rateLimit(`login:${provider}:id:${identifier.toLowerCase()}`, {
        max: 10,
        windowMs: 15 * 60_000,
    });
    if (!idRes.ok) throw new RateLimitExceededError();
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            id: "admin-credentials",
            name: "Admin Login",
            credentials: {
                email: { label: "Email", type: "email", required: true },
                username: { label: "Username", type: "text", required: true },
                password: { label: "Password", type: "password", required: true },
            },
            authorize: async (credentials) => {
                // Parse credentials with zod. Make sure it's safe.
                const creds = credSchema.safeParse(credentials);

                if (creds.error) {
                    console.error("For some reason, invalid or missing admin-credentials");
                    throw new InternalServerError();
                }

                const credData = creds.data;

                const isEmail = Boolean(credData.email?.trim());
                const identifier = isEmail ? credData.email!.trim() : (credData.username ?? "");

                const parsedCredentials = adminloginSchema.safeParse({
                    emailUsername: identifier,
                    password: credData.password,
                });

                if (!parsedCredentials.success) {
                    throw new IncorrectEmailPasswordError();
                }

                const { emailUsername, password } = parsedCredentials.data;
                await enforceLoginRateLimit("admin", emailUsername);
                const result = await db.query.users.findFirst({
                    where: (users, { eq }) =>
                        isEmail ? eq(users.email, emailUsername) : eq(users.name, emailUsername),
                    with: {
                        adminusers: {},
                    },
                });

                if (
                    !result ||
                    !result.roles.includes("ADMINUSER") ||
                    !result.emailVerified ||
                    !result.adminusers
                ) {
                    // Don't reveal that their account does not exist or that
                    // their email isn't verified yet — same response either way.
                    throw new IncorrectEmailPasswordError();
                }

                const adminRow = result;

                const valid = await bcrypt.compare(password, adminRow.password);
                if (!valid) {
                    throw new IncorrectEmailPasswordError();
                }

                if (result.adminusers.ischangepwdnext) {
                    // Admin reset this user's password from the data-view tool.
                    // Force them through the "set new password" flow on first
                    // sign-in. emailVerified is already required above, so this
                    // can no longer bootstrap a brand-new unverified account.
                    throw new NewAccountError();
                }

                return {
                    id: adminRow.id.toString(),
                    email: adminRow.email || "",
                    name: adminRow.name || "",
                    role: "ADMIN",
                };
            },
        }),
        Credentials({
            id: "teacher-credentials",
            name: "Teacher Login",
            credentials: {
                email: { label: "Email", type: "email", required: true },
                username: { label: "Username", type: "string", required: true },
                password: { label: "Password", type: "password", required: true },
            },
            authorize: async (credentials) => {
                // Parse credentials with zod. Make sure it's safe.
                const creds = credSchema.safeParse(credentials);

                if (creds.error) {
                    console.error("For some reason, invalid or missing teacher-credentials");
                    throw new InternalServerError();
                }

                const credData = creds.data;

                const isEmail = Boolean(credData.email?.trim());
                const identifier = isEmail ? credData.email!.trim() : (credData.username ?? "");

                const parsedCredentials = loginSchema.safeParse({
                    emailUsername: identifier,
                    password: credData.password,
                });

                if (!parsedCredentials.success) {
                    throw new IncorrectEmailPasswordError();
                }

                const { emailUsername, password } = parsedCredentials.data;
                await enforceLoginRateLimit("teacher", emailUsername);
                const result = await db.query.users.findFirst({
                    where: (users, { eq }) =>
                        isEmail ? eq(users.email, emailUsername) : eq(users.name, emailUsername),
                    with: {
                        teachers: {},
                    },
                });

                if (
                    !result ||
                    !result.roles.includes("TEACHER") ||
                    !result.emailVerified
                ) {
                    throw new IncorrectEmailPasswordError();
                }

                const teacheruser = result;
                const valid = await bcrypt.compare(password, teacheruser.password);
                if (!valid) {
                    throw new IncorrectEmailPasswordError();
                }

                if (result.teachers?.ischangepwdnext) {
                    // Make client show input password
                    throw new NewAccountError();
                }

                return {
                    id: teacheruser.id.toString(),
                    email: teacheruser.email || "",
                    name: teacheruser.name || "",
                    role: "TEACHER",
                };
            },
        }),
        Credentials({
            id: "family-credentials",
            name: "Family Login",
            credentials: {
                username: { label: "Username", type: "string", required: true },
                email: { label: "Email", type: "email", required: true },
                password: { label: "Password", type: "password", required: true },
            },
            authorize: async (credentials) => {
                // Parse credentials with zod. Make sure it's safe.
                const creds = credSchema.safeParse(credentials);

                if (creds.error) {
                    console.error("For some reason, invalid or missing family-credentials");
                    throw new InternalServerError();
                }

                const credData = creds.data;

                const isEmail = Boolean(credData.email?.trim());
                const identifier = isEmail ? credData.email!.trim() : (credData.username ?? "");

                const parsedCredentials = loginSchema.safeParse({
                    emailUsername: identifier,
                    password: credData.password,
                });

                if (!parsedCredentials.success) {
                    throw new IncorrectEmailPasswordError();
                }

                const { emailUsername, password } = parsedCredentials.data;
                await enforceLoginRateLimit("family", emailUsername);
                const result = await db.query.users.findFirst({
                    where: (users, { eq }) =>
                        isEmail ? eq(users.email, emailUsername) : eq(users.name, emailUsername),
                });

                if (!result || !result.emailVerified || !result.roles.includes("FAMILY")) {
                    throw new IncorrectEmailPasswordError();
                }

                const familyuser = result;
                const valid = await bcrypt.compare(password, familyuser.password);
                if (!valid) {
                    throw new IncorrectEmailPasswordError();
                }

                return {
                    id: familyuser.id.toString(),
                    email: familyuser.email || "",
                    name: familyuser.name || "",
                    role: "FAMILY",
                };
            },
        }),
    ],
    adapter: pgadapter,
    // Periodically re-check the user's role against the DB. The base jwt
    // callback in `auth.config.ts` is edge-safe (used by middleware) and only
    // copies fields off `user` on initial sign-in, so a demoted admin would
    // otherwise keep ADMIN powers until JWT expiry. This callback runs in the
    // Node runtime (route handlers, server actions, server components) where
    // we can hit the DB.
    callbacks: {
        ...authConfig.callbacks,
        async jwt(params) {
            // Run the base callback first so initial-sign-in token bootstrap
            // still happens.
            const baseToken = (await authConfig.callbacks?.jwt?.(params)) ?? params.token;
            const { user } = params;
            const token = baseToken as typeof params.token & {
                lastRoleCheckAt?: number;
            };

            // Only refresh after the cache window. We check on every call but
            // skip the DB hit until at least REFRESH_AFTER_SEC has elapsed.
            const REFRESH_AFTER_SEC = 5 * 60;
            const nowSec = Math.floor(Date.now() / 1000);
            const issuedAt = token.iat ?? nowSec;
            const lastCheck = token.lastRoleCheckAt ?? issuedAt;
            const skip = user || nowSec - lastCheck < REFRESH_AFTER_SEC || !token.sub;
            if (skip) return token;

            try {
                const fresh = await db.query.users.findFirst({
                    where: (u, { eq }) => eq(u.id, token.sub as string),
                });
                if (!fresh) {
                    // User was deleted — invalidating the JWT signs them out.
                    return null;
                }
                // Defence-in-depth demotion: if the role baked into the JWT is
                // no longer present in the DB, force re-auth. We never PROMOTE
                // here — the role is whichever provider the user signed in
                // with — but we hard-revoke if their grant has been removed.
                const roleStillValid =
                    (token.role === "ADMIN" && fresh.roles.includes("ADMINUSER")) ||
                    (token.role === "TEACHER" && fresh.roles.includes("TEACHER")) ||
                    (token.role === "FAMILY" && fresh.roles.includes("FAMILY"));
                if (!roleStillValid) {
                    return null;
                }
                token.email = fresh.email ?? token.email;
                token.name = fresh.name ?? token.name;
                token.lastRoleCheckAt = nowSec;
            } catch (err) {
                console.error("jwt role refresh failed:", err);
                // Fall through with the cached token rather than locking
                // everyone out on a transient DB blip.
            }
            return token;
        },
    },
});
