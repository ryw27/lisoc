import { signOut } from "../auth";
import { redirect } from "next/navigation";

// Only for server page logouts. Client side logouts are handled by auth.js
export async function logout() {
    await signOut();
    redirect("/");
}