"use server";

import { auth, signIn, signOut } from "./auth";
import { redirect } from "next/navigation";


//Login function
export async function login(formData: FormData) {
    await signIn("credentials", {
        email: formData.get("email")?.toString().trim(),
        password: formData.get("password")?.toString(),
        redirect: false,
    });
}

//Logout function   
export async function logout() {
    await signOut();
    redirect("/");
}


//Helper function to require a specific role to access a page or API route
export async function requireRole(allowed: ("ADMIN" | "TEACHER" | "STUDENT")[]) {
    const session = await auth();
    if (!session || !allowed.includes(session.user.role as "ADMIN" | "TEACHER" | "STUDENT")) {
        redirect("/");
    }
    return session;
}

