import authConfig from "@/auth.config";
import PostgresAdapter from "@auth/pg-adapter";
import bcrypt from "bcrypt";
import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import { type Adapter } from "next-auth/adapters";
// @ts-expect-error JWT needs to be used to edit the module
import { type JWT } from "next-auth/jwt"; // eslint-disable-line @typescript-eslint/no-unused-vars -- imported only for module augmentation
import Credentials from "next-auth/providers/credentials";
import { adminloginSchema, credSchema, loginSchema } from "@/server/auth/schema";
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
                    (!result.emailVerified && !result.adminusers?.ischangepwdnext) ||
                    !result.adminusers
                ) {
                    // Don't reveal that their account does not exist
                    throw new IncorrectEmailPasswordError();
                }

                const adminRow = result;

                const valid = await bcrypt.compare(password, adminRow.password);
                if (!valid) {
                    throw new IncorrectEmailPasswordError();
                }

                if (result.adminusers.ischangepwdnext) {
                    // Make client show input password
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
                    (!result.emailVerified && !result.teachers?.ischangepwdnext)
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
});
