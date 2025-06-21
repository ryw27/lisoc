import NextAuth, { type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "../db"
import { pool } from "../db"
import bcrypt from "bcrypt"
import { z } from "zod"
import PostgresAdapter from "@auth/pg-adapter"
import { type Adapter } from "@auth/core/adapters"

//Declare module for session user but it's not working idk why lol
declare module "next-auth" {
    interface User { 
        role: "ADMIN" | "TEACHER" | "FAMILY"
    } 

    interface Session {
        user: {
            role: User["role"]
        } & DefaultSession["user"]
    }
}

const pgadapter = PostgresAdapter(pool) as Required<Adapter>;


export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            id: "admin-credentials",
            name: "Admin Login",
            credentials: {
                username: { label: "Username", type: "text", required: true },
                password: { label: "Password", type: "password", required: true },
            },
            authorize: async (credentials) => {
                //Parse credentials with zod
                const parsedCredentials = await z.object({
                    username: z.string({ required_error: "Username is required" })
                        .min(1, "Username is required")
                        .max(24, "Username must be less than 24 characters"),
                    password: z.string({ required_error: "Password is required" })
                        .min(1, "Password is required")
                        .min(8, "Password must be more than 8 characters")
                        .max(32, "Password must be less than 32 characters"),
                }).safeParseAsync(credentials);

                if (parsedCredentials.success) {
                    const { username, password } = parsedCredentials.data;
                    
                    // const result = await db.select().from(adminuser).where(eq(adminuser.username, username));
                    const result = await db.query.users.findFirst({
                        where: (users, { eq }) => eq(users.username, username)
                    });

                    if (!result) {
                        return null;
                    }
                    if (!result.roles.includes("ADMIN")) { // Check if user is an admin
                        return null;
                    }
                    if (!result.emailVerified) {
                        return null;
                    }
                    const adminuser = result;
                    const valid = await bcrypt.compare(password, adminuser.password);
                    if (!valid) return null;
                    
                    return { id: adminuser.id.toString(), email: adminuser.email || "", username: adminuser.username || "", role: "ADMIN" };
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
                password: { label: "Password", type: "password", required: true },
            },
            authorize: async (credentials) => {
                //Parse credentials with zod
                const parsedCredentials = await z.object({
                email: z.string({ required_error: "Email is required" })
                    .min(1, "Email is required")
                    .email("Invalid email"),
                password: z.string({ required_error: "Password is required" })
                    .min(1, "Password is required")
                    .min(8, "Password must be more than 8 characters")
                    .max(32, "Password must be less than 32 characters"),
                }).safeParseAsync(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const result = await db.query.users.findFirst({
                        where: (users, { eq }) => eq(users.email, email)
                    });
                    if (!result) {
                        return null;
                    }
                    if (!result.roles.includes("ADMIN")) { // Check if user is an admin
                        return null;
                    }
                    if (!result.emailVerified) {
                        return null;
                    }

                    const teacheruser = result
                    const valid = await bcrypt.compare(password, teacheruser.password);
                    if (!valid) return null;
                    
                    return { id: teacheruser.id.toString(), email: teacheruser.email || "", username: teacheruser.username || "", role: "TEACHER" };
                } else {
                    return null;
                }
            },
        }),
        Credentials({
            id: "family-credentials",
            name: "Family Login",
            credentials: {
                email: { label: "Email", type: "email", required: true },
                password: { label: "Password", type: "password", required: true },
            },
            authorize: async (credentials) => {
                //Parse credentials with zod
                const parsedCredentials = await z.object({
                    email: z.string({ required_error: "Email is required" })
                        .min(1, "Email is required")
                        .email("Invalid email"),
                    password: z.string({ required_error: "Password is required" })
                        .min(1, "Password is required")
                        .min(8, "Password must be more than 8 characters")
                        .max(32, "Password must be less than 32 characters"),
                }).safeParseAsync(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const result = await db.query.users.findFirst({
                        where: (users, { eq }) => eq(users.email, email)
                    });
                    if (!result) {
                        return null;
                    }
                    if (!result.roles.includes("ADMIN")) { // Check if user is an admin
                        return null;
                    }
                    if (!result.emailVerified) {
                        return null;
                    }

                    const familyuser = result
                    const valid = await bcrypt.compare(password, familyuser.password);
                    if (!valid) return null;
                    
                    return { id: familyuser.id.toString(), email: familyuser.email || "", username: familyuser.username || "", role: "FAMILY" };
                } else {
                    return null;
                }
            },
        }), 
    ],
    adapter: pgadapter,
    callbacks: {
        async session({ session, token, user }) {
            if (user?.role) {
                session.user.role = user.role;
            }
            return session
        },
    },
    session: {
        strategy: "database",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: "/login",
        signOut: "/logout",
    }
})