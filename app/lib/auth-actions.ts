"use server";

import { auth, signIn, signOut } from "./auth";
import { redirect } from "next/navigation";


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

