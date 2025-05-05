"use server";

import { auth, signIn, signOut } from "./auth";
import { redirect } from "next/navigation";


//Login function
export async function login(formData: FormData) {
    const result = await signIn("credentials", {
        email: formData.get("email")?.toString().trim(),
        password: formData.get("password")?.toString(),
        redirect: false,
    });

    if (!result.ok) {
        redirect("/login?error=Invalid credentials");
    }
    redirect("/dashboard")
}

//Logout function   
export async function logout() {
    await signOut();
    redirect("/");
}


//Helper function to require a specific role to access a page or API route
export async function requireRole(allowed: ("ADMIN" | "TEACHER" | "PARENT")[]) {
    const session = await auth();
    if (!session || !allowed.includes(session.user.role as "ADMIN" | "TEACHER" | "PARENT")) {
        redirect("/login");
    }
    return session;
}

