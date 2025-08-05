import { notFound } from "next/navigation"
import { checkResetLink, resetPassword } from "@/lib/auth";
import ResetPasswordForm from "@/components/auth/reset-password-form";

export default async function ResetPassword({
    searchParams
}: {
    searchParams: Promise<{ token?: string, email?: string}>
}) {
    console.log("ResetPassword page");
    const params = await searchParams
    if (!params.token || !params.email) {
        return notFound();
    }

    const res = await checkResetLink(params.email, params.token);

    if (res) {
        return <ResetPasswordForm userEmail={params.email} userToken={params.token} resetPassword={resetPassword}/>;
    }
    
    return notFound();

}