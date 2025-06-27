"use server";

import { auth, signIn, signOut } from "./auth";
import { db } from "../db";
import { family, registration_drafts, teacher, users } from "../db/schema";
import bcrypt from "bcrypt"
import { randomInt } from "crypto";
import { transporter } from "@/lib/nodemailer";
import { redirect } from "next/navigation";
import * as authSchemas from './auth-schema';
import { and, sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { pgadapter } from "./auth";
import { z } from "zod";

export type authMSG = 
    | { ok: false, msg: string}
    | { ok: true, data?: any }

const SITE_LINK = "localhost:3000"; // TODO: change to actual link

// -----------------------------------------------------------------------------------------------------------------------------------
// Login functions 
// -----------------------------------------------------------------------------------------------------------------------------------
// TODO: Learn wtf is going on with server side signIn
export async function login(formData: FormData, isAdminForm: boolean, isTeacherForm: boolean): Promise<authMSG> {
    const { emailUsername, password } = authSchemas.loginSchema.parse(Object.fromEntries(formData));
    const provider = isAdminForm ? "admin-credentials" : isTeacherForm ? "teacher-credentials" : "family-credentials";

    const isEmail = authSchemas.emailSchema.safeParse({ email: emailUsername }).success;
    const isUsername = authSchemas.usernameSchema.safeParse({ username: emailUsername }).success;

    if (!isEmail && !isUsername) {
        return { ok: false, msg: "Invalid email or username" };
    }

    const result = await signIn(provider, {
        username: isUsername ? emailUsername : null,
        email: isEmail ? emailUsername : null,
        password: password,
        redirect: false,
    });

    if (!result) {
        return { ok: false, msg: "Invalid credentials" };
    }

    return { ok: true };
}

// -----------------------------------------------------------------------------------------------------------------------------------
// Logout function 
// -----------------------------------------------------------------------------------------------------------------------------------
export async function logout() {
    await signOut();
    redirect("/");
}

// -----------------------------------------------------------------------------------------------------------------------------------
// Check auth function 
// -----------------------------------------------------------------------------------------------------------------------------------
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
// Registration functions 
// -----------------------------------------------------------------------------------------------------------------------------------


// STEP 1: Enter email. If valid, request a code using the auth.js PostgresAdapter
export async function emailToCode(data: FormData): Promise<authMSG> {
    const userData = authSchemas.emailSchema.safeParse(Object.fromEntries(data));

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


    const code = randomInt(100000, 1000000).toString();

    
    await pgadapter.createVerificationToken({
        token: code, 
        identifier: email,
        expires: new Date(Date.now() + 10 * 60 * 1000) 
    })

    await sendRegEmail(email, code);
    return { ok: true };
}

export async function resendCode(data: FormData): Promise<authMSG> {
    const userEmail = authSchemas.emailSchema.parse(Object.fromEntries(data)).email;
    const code = randomInt(100000, 1000000).toString();
    await pgadapter.createVerificationToken({
        token: code,
        identifier: userEmail,
        expires: new Date(Date.now() + 10 * 60 * 1000) 
    })
    await sendRegEmail(userEmail, code)

    return { ok: true }
}

// STEP 2: Send a verification email using NodeMailer
export async function sendRegEmail(emailTo: string, token: string) {
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
export async function checkCode(data: FormData, email: string): Promise<authMSG> {
    const codeData = authSchemas.codeSchema.safeParse(Object.fromEntries(data));

    if (!codeData.success || !codeData.data) {
        return { ok: false, msg: codeData.error.errors[0].message }
    }

    // Automatically deletes the token and validates it
    const vt = await pgadapter.useVerificationToken({ identifier: email, token: codeData.data.code })
    
    if (!vt) {
        return { ok: false, msg: "Invalid or expired code" };
    }

    // Check if token is expired
    if (new Date(vt.expires) < new Date(Date.now())) {
        return { ok: false, msg: "Expired Code" };
    }

    return { ok: true };
}




// Step 4: Register the username, email, and password into drafts 
export async function registerDraft(data: FormData): Promise<authMSG> {
    const registerData = authSchemas.registerSchema.safeParse(Object.fromEntries(data));

    if (!registerData.success || !registerData.data) {
        return { ok: false, msg: registerData.error.errors[0].message }
    }

    const { username, email, password } = registerData.data;

    // Check if username already exists
    const usernameUnique = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, username)
    })

    if (usernameUnique) {
        return { ok: false, msg: "Username already exists" }
    }

    // Insert into registration_drafts, if username and email combo already exists, update the password and expires
    const newDraft = await db
        .insert(registration_drafts)
        .values({
            email: email,
            username: username,
            password: await bcrypt.hash(password, 10),
        })
        .onConflictDoUpdate({
            target: [registration_drafts.email, registration_drafts.username],
            set: {
                password: await bcrypt.hash(password, 10),
                expires: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString()
            }
        })
        .returning();

    return { ok: true, data: {username: newDraft[0].username, email: newDraft[0].email}};

}

// STEP 5: Register the user into the database
export async function fullRegister(data: FormData, regData: z.infer<typeof authSchemas.nameEmailSchema>, isTeacher: boolean): Promise<authMSG> {
    const info = isTeacher ? authSchemas.teacherSchema.safeParse(Object.fromEntries(data)) : authSchemas.familySchema.safeParse(Object.fromEntries(data));
    if (!info.success) {
        return { ok: false, msg: info.error.errors[0].message }
    }

    const insertion = isTeacher ? teacher : family

    const { address, city, state, zip, phone, ...parsedData } = info.data;

    const draft = await db.query.registration_drafts.findFirst({
        where: (registration_drafts, { and, eq }) => and(eq(registration_drafts.email, regData.email), eq(registration_drafts.username, regData.username))
    })    

    if (!draft || new Date(draft.expires) < new Date(Date.now())) {
        return { ok: false, msg: "Your session has expired. Please register again." }
    }

    // Delete the draft
    await db.delete(registration_drafts).where(and(eq(registration_drafts.email, draft.email), eq(registration_drafts.username, draft.username)));

    const newUser = await db
        .insert(users)
        .values({
            roles: sql`'${isTeacher ? 'TEACHER' : 'FAMILY'}'::user_role`,
            emailverified: new Date(Date.now()).toISOString(),
            createon: new Date(Date.now()).toISOString(),
            ischangepwdnext: false,
            address: address,
            city: city,
            state: state,
            zip: zip,
            phone: phone,
            email: draft.email,
            username: draft.username,
            password: draft.password,
        })
        .returning()
    
    const second = await db
        .insert(insertion)
        .values({
            userid: newUser[0].id,
            ...parsedData
        })
        .returning()

    return { ok: true, data: second };
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

export async function sendFPEmail(emailTo: string, uuid: string) {
    await transporter.sendMail({
        from: "LISOC Registration <regadmin@lisoc.org>",
        to: emailTo,
        subject: "LISOC Forgot Password Link",
        html: `
            <p> Reset your password with the following <a href=${SITE_LINK}/reset-password?token=${uuid}&email=${emailTo}> link </a> </p>
            <p> If you are not trying to reset your password, please ignore this email </p>
        `
    });   
}

export async function requestReset(data: FormData): Promise<authMSG> {
    const fpData = authSchemas.forgotPassSchema.safeParse(Object.fromEntries(data));

    if (!fpData || !fpData.data) {
        return { ok: false, msg: "Invalid Email or Username"}
    }

    const input = fpData.data.emailUsername;
    
    // Check if input is an email or username
    const isEmail = authSchemas.emailSchema.safeParse({ email: input }).success;
    const isUsername = authSchemas.usernameSchema.safeParse({ username: input }).success;
    
    let userEmail: string | null = null;
    
    if (isEmail) {
        // Input is an email
        const emailExists = await checkExistence(input, "email");
        if (!emailExists) {
            return { ok: false, msg: "Account does not exist" };
        }
        userEmail = input;
    } else if (isUsername) {
        // Input is a username - need to find the associated email
        const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.username, input)
        });
        
        if (!user) {
            return { ok: false, msg: "Account does not exist" };
        }
        userEmail = user.email;
    } else {
        return { ok: false, msg: "Invalid Email or Username" };
    }

    await db
        .update(users)
        .set({ ischangepwdnext: true})
        .where(eq(users.email, userEmail))

    const uuidCode = uuid();

    await pgadapter.createVerificationToken({
        token: uuidCode,
        identifier: userEmail,
        expires: new Date(Date.now() + 1000 * 60 * 15) 
    });

    await sendFPEmail(userEmail, uuidCode);
    return { ok: true }
}

export async function resetPassword(data: FormData): Promise<authMSG> {
    const resetData = authSchemas.resetPassSchema.safeParse(Object.fromEntries(data));

    if (!resetData.success || !resetData.data) {
        return { ok: false, msg: resetData.error.errors[0].message }
    }

    const { email, password, confirmPassword, token } = resetData.data;

    if (password !== confirmPassword) {
        return { ok: false, msg: "Passwords don't match"}
    }

    const row = await pgadapter.useVerificationToken({ identifier: email, token: token })
    if (!row) {
        return { ok: false, msg: "Invalid or expired Link"};
    }
    const pwdhash = await bcrypt.hash(password, 10);
    await db
        .update(users)
        .set({
            ischangepwdnext: false,
            password: pwdhash
        })
        .where(eq(users.email, email));
    return { ok: true };
}

export async function checkLink(email: string, token: string): Promise<boolean> {
    const row = await db.query.verificationToken.findFirst({
        where: (verificationToken, {and, eq }) => and(eq(verificationToken.identifier, email), eq(verificationToken.token, token))
    })

    if (!row) {
        return false;
    }
    return true;
}