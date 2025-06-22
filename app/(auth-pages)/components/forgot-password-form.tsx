"use client";
import Logo from "@/components/logo";
import { FormInput, FormSubmit, FormError } from "./form-components";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPassSchema } from "@/app/lib/auth-lib/auth-schema";
import { authMSG } from "@/app/lib/auth-lib/auth-actions";

type FPFormParams = {
    requestReset: (formData: FormData) => Promise<authMSG>;
}
export default function ForgotPasswordForm({ requestReset }: FPFormParams) {
    const [busy, setBusy] = useState<boolean>(false);
    const [sentCode, setSentCode] = useState<boolean>(false);

    const fpForm = useForm({
        mode: "onChange",
        resolver: zodResolver(forgotPassSchema)
    })

    const onEmail = async ( data: { email: string }) => {
        setBusy(true);
        const fd = new FormData();
        fd.append("email", data.email)
        const status = await requestReset(fd);
        if (!status.ok && status.msg !== "Account does not exist") {
            return fpForm.setError("email", { message: status.msg })
        }
        setSentCode(true);
    }

    const tryFPAgain = () => {
        // Todo: Rate limit
        setSentCode(false);
    }


    return (
        <main className="flex flex-col h-screen w-screen items-center justify-center bg-background">
            <Logo/>

            <h1 className="text-2xl font-bold mb-10 mt-10 text-left">Forgot Password Form</h1>

            {!sentCode && (
                <form onSubmit={fpForm.handleSubmit(onEmail)} className="flex flex-col bg-white p-2 w-1/5">
                    <FormInput 
                        label="Email"
                        type="text"
                        register={fpForm.register("email")}
                    />
                    <FormError
                        error={fpForm.formState.errors.email?.message}
                    />
                    <FormSubmit disabled={busy}>Continue</FormSubmit>
                </form>
            )}
            
            {sentCode && (
                <div className="flex flex-col bg-white p-2 w-1/5">
                    <p className="text-gray-700 font-bold">A link to reset your password has been sent to your email.
                        If you did not receive an email, please &thinsp;
                        <button onClick={tryFPAgain} className="text-blue-600 underline cursor-pointer">try again</button>
                        &thinsp; or &thinsp; <Link href="/signup" className="font-bold text-blue-600 underline"> Sign up.</Link>
                    </p>
                </div>
            )}


            <p className="text-gray-500 text-center mt-5 text-sm">Don't have an account? <Link href="/signup" className="font-bold text-blue-500 underline">Sign up</Link></p>
        </main>
    )
}