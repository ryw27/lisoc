"use server";

import { auth, signIn, signOut } from "./auth";
import { db } from "../db";
import { family, teacher, users } from "../db/schema";
import bcrypt from "bcrypt"
import { randomInt } from "crypto";
import { transporter } from "@/lib/nodemailer";
import { redirect } from "next/navigation";
import { 
    loginSchema, 
    emailSchema, 
    usernameSchema, 
    teacherSchema, 
    familySchema, 
    nameEmailSchema, 
    forgotPassSchema, 
    resetPassSchema, 
    codeSchema,
    userPassSchema,
    uuidSchema
} from "./auth-schema";
import { and } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { pgadapter } from "./auth";
import { z } from "zod";
import { registration_drafts } from "../db/schema";

// export type authMSG = 
//     | { ok: false, msg: string}
//     | { ok: true, data?: any }

const SITE_LINK = "localhost:3000"; // TODO: change to actual link

// -----------------------------------------------------------------------------------------------------------------------------------
// Login functions 
// -----------------------------------------------------------------------------------------------------------------------------------
// Only for server page logins. Client side logins are handled by auth.js
export async function login(formData: FormData, isAdminForm: boolean, isTeacherForm: boolean) {
    const { emailUsername, password } = loginSchema.parse(Object.fromEntries(formData));
    const provider = isAdminForm ? "admin-credentials" : isTeacherForm ? "teacher-credentials" : "family-credentials";

    const isEmail = emailSchema.safeParse({ email: emailUsername }).success;
    const isUsername = usernameSchema.safeParse({ username: emailUsername }).success;

    if (!isEmail && !isUsername) {
        throw new Error("Invalid email or username")
    }

    const result = await signIn(provider, {
        username: isUsername ? emailUsername : null,
        email: isEmail ? emailUsername : null,
        password: password,
        redirect: false,
    });

    if (!result) {
        throw new Error("Invalid credentials")
    }
}

// -----------------------------------------------------------------------------------------------------------------------------------
// Logout function 
// -----------------------------------------------------------------------------------------------------------------------------------
// Only for server page logouts. Client side logouts are handled by auth.js
export async function logout() {
    await signOut();
    redirect("/");
}

// -----------------------------------------------------------------------------------------------------------------------------------
// Check auth function 
// -----------------------------------------------------------------------------------------------------------------------------------
export async function requireRole(allowed: ("ADMIN" | "TEACHER" | "FAMILY")[], options: { redirect?: boolean } = { redirect: true }) {
    const session = await auth();
    if (!session) {
        if (options.redirect) {
            const redirectLink = allowed.includes("ADMIN") ? "/login/admin" : "/login";
            redirect(redirectLink);
        } else {
            throw new Error("Authentication required");
        }
    } else if (!allowed.includes(session.user.role)) {
        if (options.redirect) {
            redirect("/unauthorized") // Logged in as user and trying to access admin pages
        } else {
            throw new Error("Access denied. Required role not found");
        }
    } 

    return session;
}

// -----------------------------------------------------------------------------------------------------------------------------------
// Registration functions 
// -----------------------------------------------------------------------------------------------------------------------------------


// STEP 1: Enter email. If valid, request a code using the auth.js PostgresAdapter
export async function emailToCode(data: z.infer<typeof emailSchema>) {
    // Parse incoming data
    const userData = emailSchema.parse(data);
    console.log(userData)

    // unique check
    const unique = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, userData.email)
    })
    console.log(unique)

    if (unique) { // Email exists
        throw new Error("Email already exists")
    }

    const email = userData.email
    const code = randomInt(100000, 1000000).toString();
    await pgadapter.createVerificationToken({
        token: code, 
        identifier: email,
        expires: new Date(Date.now() + 10 * 60 * 1000) 
    })

    await sendRegEmail(email, code);
}

export async function resendCode(data: z.infer<typeof emailSchema>) {
    const userEmail = (emailSchema.parse(data)).email
    const code = randomInt(100000, 1000000).toString();
    await pgadapter.createVerificationToken({
        token: code,
        identifier: userEmail,
        expires: new Date(Date.now() + 10 * 60 * 1000) 
    })
    await sendRegEmail(userEmail, code)
}

// STEP 2: Send a verification email using NodeMailer
export async function sendRegEmail(emailTo: string, token: string) {
    const mail = await transporter.sendMail({
        from: "LISOC Registration <regadmin@lisoc.org>",
        to: emailTo,
        subject: "LISOC Account Registration Verification",
        html: `
            <p> Your verification code is <strong> ${token} </strong>. This code will expire in 10 minutes </p>
            <p> If you are not trying to register, please ignore this email </p>
        `
    });

}
// Step 3: Check the inputted code. 
export async function checkCode(data: z.infer<typeof codeSchema>, email: string) {
    emailSchema.parse({ email: email });
    const codeData = codeSchema.parse(data);

    // Automatically deletes the token and validates it
    const vt = await pgadapter.useVerificationToken({ identifier: email, token: codeData.code })
    
    if (!vt) {
        throw new Error("Invalid or expired code")
    }

    // Check if token is expired
    if (new Date(vt.expires) < new Date(Date.now())) {
        throw new Error("Expired Code")
    }
}




// Step 4: Register the username, email, and password into drafts 
export async function registerDraft(data: z.infer<typeof userPassSchema>, email: string) {
    const draftData = userPassSchema.parse(data);
    emailSchema.parse({ email: email });

    const { password, username } = draftData;

    // Check if username already exists
    const usernameUnique = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.name, username)
    })

    if (usernameUnique) {
        throw new Error("Username already exists")
    }

    // Insert into registration_drafts, if username and email combo already exists, update the password and expires
    await db
        .insert(registration_drafts)
        .values({
            email: email,
            name: username,
            password: await bcrypt.hash(password, 10),
        })
        .onConflictDoUpdate({
            target: [registration_drafts.email, registration_drafts.name],
            set: {
                password: await bcrypt.hash(password, 10),
                expires: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString()
            }
        })
}

// STEP 5: Register the user into the database
export async function fullRegister(
    data: z.infer<typeof teacherSchema> | z.infer<typeof familySchema>, 
    regData: z.infer<typeof nameEmailSchema>, 
    isTeacher: boolean
) {
    const info = isTeacher ? teacherSchema.parse(data) : familySchema.parse(data);
    nameEmailSchema.parse(regData);
    const insertion = isTeacher ? teacher : family
    const { address, city, state, zip, phone, ...parsedData } = info;

    const draft = await db.query.registration_drafts.findFirst({
        where: (registration_drafts, { and, eq }) => and(eq(registration_drafts.email, regData.email), eq(registration_drafts.name, regData.username))
    })    

    if (!draft || new Date(draft.expires) < new Date(Date.now())) {
        throw new Error("Your session has expired. Please register again.")
    }

    // Delete the draft
    await db.delete(registration_drafts).where(and(eq(registration_drafts.email, draft.email), eq(registration_drafts.name, draft.name)));

    const newUser = await db
        .insert(users)
        .values({
            roles: [isTeacher ? 'TEACHER' : 'FAMILY'],
            emailVerified: new Date(Date.now()).toISOString(),
            createon: new Date(Date.now()).toISOString(),
            address: address,
            city: city,
            state: state,
            zip: zip,
            phone: phone,
            email: draft.email,
            name: draft.name,
            password: draft.password,
        })
        .returning({ id: users.id })
    
    await db
        .insert(insertion)
        .values({
            userid: newUser[0].id,
            ...parsedData
        })

}

// Helper function
export async function checkExistence(input: string, column: "name" | "email"): Promise<boolean> {
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

export async function requestReset(data: z.infer<typeof forgotPassSchema>) {
    const fpCheck = forgotPassSchema.parse(data);
    const input = fpCheck.emailUsername;

    // Check if input is an email or username
    const isEmail = emailSchema.safeParse({ email: input }).success;
    const isUsername = usernameSchema.safeParse({ username: input }).success;
    
    let userEmail: string | null = null;
    
    if (isEmail) {
        // Input is an email
        const emailExists = await checkExistence(input, "email");
        if (!emailExists) {
            throw new Error("Account does not exist")
        }
        userEmail = input;
    } else if (isUsername) {
        // Input is a username - need to find the associated email
        const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.name, input)
        });
        
        if (!user) {
            throw new Error("Account does not exist")
        }
        userEmail = user.email;
    } else {
        throw new Error("Invalid Email or Username")
    }

    // await db
    //     .update(users)
    //     .set({ ischangepwdnext: true})
    //     .where(eq(users.email, userEmail!))

    const uuidCode = uuid();

    await pgadapter.createVerificationToken({
        token: uuidCode,
        identifier: userEmail!,
        expires: new Date(Date.now() + 1000 * 60 * 15) 
    });

    await sendFPEmail(userEmail!, uuidCode);
}

export async function resetPassword(data: z.infer<typeof resetPassSchema>) {
    const resetData = resetPassSchema.parse(data);

    const { email, password, confirmPassword, token } = resetData;

    if (password !== confirmPassword) {
        throw new Error("Passwords don't match")
    }

    const row = await pgadapter.useVerificationToken({ identifier: email, token: token })
    if (!row) {
        throw new Error("Invalid or expired Link")
    }
    const pwdhash = await bcrypt.hash(password, 10);
    await db
        .update(users)
        .set({
            password: pwdhash
        })
        .where(eq(users.email, email));
}

export async function checkLink(email: string, token: string): Promise<boolean> {
    emailSchema.parse({ email: email });
    uuidSchema.parse({ uuid: token });

    const row = await db.query.verificationToken.findFirst({
        where: (verificationToken, { and, eq }) => and(eq(verificationToken.identifier, email), eq(verificationToken.token, token))
    });

    if (!row) {
        return false;
    }

    return true;
}