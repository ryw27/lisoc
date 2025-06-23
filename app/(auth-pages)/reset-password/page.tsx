import { notFound } from "next/navigation"
import { checkLink, resetPassword } from "@/app/lib/auth-lib/auth-actions";
import ResetPasswordForm from "../components/reset-password-form";

export default async function ResetPassword({
    searchParams
}: {
    searchParams: Promise<{ token?: string, email?: string}>
}) {
    const params = await searchParams
    if (!params.token || !params.email) {
        return notFound();
    }

    const res = await checkLink(params.email, params.token);

    if (res) {
        return <ResetPasswordForm userEmail={params.email} userToken={params.token} resetPassword={resetPassword}/>;
    }
    
    return notFound();

}