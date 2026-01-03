"use server";

import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/lib/auth";
import { emailSchema, loginSchema, usernameSchema } from "@/server/auth/schema";

export async function requireRole(
    allowed: ("ADMIN" | "TEACHER" | "FAMILY")[],
    options: { redirect?: boolean } = { redirect: true }
) {
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
            redirect("/unauthorized"); // Logged in as user and trying to access admin pages
        } else {
            throw new Error("Access denied. Required role not found");
        }
    }

    return session;
}

// Only for server page logins. Client side logins are handled by auth.js
export async function serverLogin(
    formData: FormData,
    isAdminForm: boolean,
    isTeacherForm: boolean
) {
    const { emailUsername, password } = loginSchema.parse(Object.fromEntries(formData));
    const provider = isAdminForm
        ? "admin-credentials"
        : isTeacherForm
          ? "teacher-credentials"
          : "family-credentials";

    const isEmail = emailSchema.safeParse({ email: emailUsername }).success;
    const isUsername = usernameSchema.safeParse({ username: emailUsername }).success;

    if (!isEmail && !isUsername) {
        throw new Error("Invalid email or username");
    }

    const result = await signIn(provider, {
        username: isUsername ? emailUsername : null,
        email: isEmail ? emailUsername : null,
        password: password,
        redirect: false,
    });

    if (!result) {
        throw new Error("Invalid credentials");
    }
}

// Only for server page logouts. Client side logouts are handled by auth.js
export async function serverLogout() {
    await signOut();
    redirect("/");
}
