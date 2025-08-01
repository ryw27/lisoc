import NextAuth, { type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "../db"
import { pool } from "../db"
import bcrypt from "bcrypt"
import PostgresAdapter from "@auth/pg-adapter"
import { type Adapter } from "next-auth/adapters"
import { credSchema, loginSchema } from "@/lib/auth/validation"
import authConfig from "@/auth.config"


//Declare module for session user but it's not working idk why lol
declare module "next-auth" {
    interface User { 
        role: "ADMIN" | "TEACHER" | "FAMILY"
        userid: string;
    } 

    interface Session {
        user: {
            role: User["role"]
            userid: User["userid"]
        } & DefaultSession["user"]
    }
}

declare module "next-auth" {
    interface JWT { 
        role: "ADMIN" | "TEACHER" | "FAMILY"
        userid: string; 
    }
}

export const pgadapter = PostgresAdapter(pool) as Required<Adapter>;


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
                //Parse credentials with zod. Make sure it's safe.
                const creds = credSchema.safeParse(credentials);

                if (creds.error) {
                    return null;
                }

                const credData = creds.data;

                const isEmail = Boolean(credData.email?.trim());
                const identifier = isEmail ? (credData.email!.trim()) : (credData.username ?? "");

                const parsedCredentials = loginSchema.safeParse({
                    emailUsername: identifier,
                    password: credData.password,
                });

                if (parsedCredentials.success) {
                    const { emailUsername, password } = parsedCredentials.data;
                    const result = await db.query.users.findFirst({
                        where: (users, { eq }) =>
                            isEmail
                                ? eq(users.email, emailUsername)
                                : eq(users.name, emailUsername),
                    });
                    if (!result || !result.emailVerified || !result.roles.includes("ADMINUSER")) {
                        return null;
                    }

                    const adminuser = result;
                    const valid = await bcrypt.compare(password, adminuser.password);
                    if (!valid) return null;
                    
                    return { userid: adminuser.id.toString(), email: adminuser.email || "", username: adminuser.name || "", role: "ADMIN" };
                } else {
                    return null;
                }
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
                //Parse credentials with zod. Make sure it's safe.
                const creds = credSchema.safeParse(credentials);

                if (creds.error) {
                    return null;
                }

                const credData = creds.data;

                const isEmail = Boolean(credData.email?.trim());
                const identifier = isEmail ? (credData.email!.trim()) : (credData.username ?? "");

                const parsedCredentials = loginSchema.safeParse({
                    emailUsername: identifier,
                    password: credData.password,
                });

                if (parsedCredentials.success) {
                    const { emailUsername, password } = parsedCredentials.data;
                    const result = await db.query.users.findFirst({
                        where: (users, { eq }) =>
                            isEmail
                                ? eq(users.email, emailUsername)
                                : eq(users.name, emailUsername),
                    });
                    if (!result || !result.emailVerified || !result.roles.includes("TEACHER")) {
                        return null;
                    }

                    const teacheruser = result;
                    const valid = await bcrypt.compare(password, teacheruser.password);
                    if (!valid) return null;
                    
                    return { userid: teacheruser.id.toString(), email: teacheruser.email || "", username: teacheruser.name || "", role: "TEACHER" };
                } else {
                    return null;
                }
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
                //Parse credentials with zod. Make sure it's safe.
                const creds = credSchema.safeParse(credentials);

                if (creds.error) {
                    return null;
                }

                const credData = creds.data;

                const isEmail = Boolean(credData.email?.trim());
                const identifier = isEmail ? (credData.email!.trim()) : (credData.username ?? "");

                const parsedCredentials = loginSchema.safeParse({
                    emailUsername: identifier,
                    password: credData.password,
                });

                if (parsedCredentials.success) {
                    const { emailUsername, password } = parsedCredentials.data;
                    const result = await db.query.users.findFirst({
                        where: (users, { eq }) =>
                            isEmail
                                ? eq(users.email, emailUsername)
                                : eq(users.name, emailUsername),
                    });
                    if (!result || !result.emailVerified || !result.roles.includes("FAMILY")) {
                        return null;
                    }

                    const familyuser = result;
                    const valid = await bcrypt.compare(password, familyuser.password);
                    if (!valid) return null;
                    
                    return { userid: familyuser.id.toString(), email: familyuser.email || "", username: familyuser.name || "", role: "FAMILY" };
                } else {
                    return null;
                }
            },
        }), 
    ],
    adapter: pgadapter,
})