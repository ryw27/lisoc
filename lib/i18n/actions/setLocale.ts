"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function setLocale(locale: "en" | "zh", redirectTo: string) {
    (await cookies()).set('NEXT_LOCALE', locale, { maxAge: 60 * 60 * 24 * 365 });
    redirect(redirectTo);
}