"use server";

import { auth, signIn, signOut } from "./auth";
import { db } from "../db";
import { users } from "../db/schema";
import { randomInt } from "crypto";
import bcrypt from "bcrypt"
import { transporter } from "@/lib/nodemailer";
import { redirect } from "next/navigation";
import * as authSchemas from './auth-schema';
import { redis } from "@/lib/redis";
import { sql } from "drizzle-orm";

export type authMSG = 
    | { ok: false, msg: string}
    | { ok: true, data?: any }


// Login function
export async function login(formData: FormData) {
    const isAdminForm = !!formData.get("username");

    const provider = isAdminForm ? "admin-credentials" : "user-credentials";
    const result = await signIn(provider, {
        username: formData.get("username")?.toString().trim(),
        email: formData.get("email")?.toString().trim(),
        password: formData.get("password")?.toString(),
        redirect: false,
    });

    if (!result.ok) {
        isAdminForm ? redirect("/login/admin?error=Invalid credentials") : redirect("/login?error=Invalid credentials");
    }

    isAdminForm ? redirect("/admin/dashboard") : redirect("/dashboard");
}

// Logout function   
export async function logout() {
    await signOut();
    redirect("/");
}


// Helper function to require a specific role to access a page or API route
export async function requireRole(allowed: ("ADMIN" | "TEACHER" | "FAMILY")[]) {
    const session = await auth();
    if (!session && allowed.includes("ADMIN")) {
        redirect("/login/admin") // Not logged in and trying to access admin pages
    } else if (!session) {
        redirect("login") // Not logged in and trying to access any other pages
    } else if (allowed.includes("ADMIN") && session.user.role != "ADMIN") {
        redirect("/unauthorized") // Logged in as user and trying to access admin pages
    } else if (!allowed.includes(session.user.role as "ADMIN" | "TEACHER" | "FAMILY")) {
        redirect("/unauthorized") // Logged in and trying to access pages you can't
    }

    return session;
}

// -----------------------------------------------------------------------------------------------------------------------------------
// All registration functions 
// -----------------------------------------------------------------------------------------------------------------------------------


// STEP 1: Enter email. If valid, request a code using the auth.js PostgresAdapter
export async function emailToCode(formData: FormData): Promise<authMSG> {

    const userData = await authSchemas.emailSchema.safeParseAsync(Object.fromEntries(formData));

    if (userData.error) {
        return { ok: false, msg: userData.error.errors[0].message }
    }

    // unique check
    const unique = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, userData.data.email)
    })
    if (unique) { // Email exists
        return { ok: false, msg: "Email already exists" }
    }

    const { email } = userData.data

    const key = `req:${email}`;
    const hits = Number(await redis.incr(key) ?? 0);
    if (hits === 1) await redis.expire(key, 60);

    if (hits > 5) {
        return { ok: false, msg: "Too many requests - try again later"};
    }

    const code = randomInt(100000, 1000000).toString();

    await redis.set(`code:${email}`, code, { EX: 60 * 5, NX: false }) // 5 minutes
    
    // await pgadapter.createVerificationToken({
    //     token: codeHash, 
    //     identifier: email,
    //     expires: new Date(Date.now() + 10 * 60 * 1000) 
    // })

    await sendVerificationEmail(email, code);
    return { ok: true };
}

export async function resendCode(email: string): Promise<authMSG> {
    const code = randomInt(100000, 1000000).toString();
    await Promise.all([
        redis.set(`code:${email}`, code, { EX: 60 * 5, NX: false}),
        sendVerificationEmail(email, code)
    ])

    return { ok: true }
}

// STEP 2: Send a verification email using NodeMailer
export async function sendVerificationEmail(emailTo: string, token: string) {
    await transporter.sendMail({
        from: "LISOC Registration <regadmin@lisoc.org>",
        to: emailTo,
        subject: "LISOC Account Registration Verification",
        html: `
            <p> Your verification code is <em> ${token} </em>. This code will expire in 10 minutes </p>
            <p> If you are not trying to register, please ignore this email </p>
        `
    });
}
// Step 3: Check the inputted code. 
export async function checkCode(formData: FormData, email: string): Promise<authMSG> {
    const data = authSchemas.codeSchema.parse(Object.fromEntries(formData));

    // Retrieve the verification token for this email
    const vt = await redis.get(`code:${email}`);
    if (!vt) {
        return { ok: false, msg: "Invalid or expired code" };
    }

    // Compare the provided code with the hashed token
    const isValid = vt === data.code;
    if (!isValid) {
        return { ok: false, msg: "Invalid Code" };
    }

    await redis.del(`code:${email}`);
    return { ok: true };
}

// Step 4: Register the user into the database
export async function register(usernameIn: string, userEmail: string, userPassword: string): Promise<authMSG> {
    const usernameUnique = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, usernameIn)
    })

    if (usernameUnique) {
        return { ok: false, msg: "Username already exists" }
    }

    const newUser = await db
        .insert(users)
        .values({
            email: userEmail,
            username: usernameIn,
            password: await bcrypt.hash(userPassword, 10),
            emailVerified: new Date(Date.now()).toISOString(),
            roles: sql`'FAMILY'::user_role`
        })
        .returning();

    return { ok: true, data: newUser };

}

// Helper function
export async function checkExistence(input: string, column: "username" | "email"): Promise<boolean> {
    const result = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users[column], input)
    })

    return result !== null

}



// -----------------------------------------------------------------------------------------------------------------------------------
// Forgot password functions
// -----------------------------------------------------------------------------------------------------------------------------------

export async function forgotPassword(formData: FormData) {
    
}