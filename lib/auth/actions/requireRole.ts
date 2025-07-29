import { auth } from "../auth";
import { redirect } from "next/navigation";


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