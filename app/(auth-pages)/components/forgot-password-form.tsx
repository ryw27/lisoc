"use client";
import Logo from "@/components/logo";
import { FormInput, FormSubmit, FormError } from "./form-components";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPassSchema } from "@/app/lib/auth-lib/auth-schema";
import { authMSG } from "@/app/lib/auth-lib/auth-actions";

type FPFormParams = {
    requestReset: (formData: FormData) => Promise<authMSG>;
}

export default function ForgotPasswordForm({ requestReset }: FPFormParams) {
    const [busy, setBusy] = useState<boolean>(false);
    const [sentLink, setSentLink] = useState<boolean>(false);

    const fpForm = useForm({
        mode: "onChange",
        resolver: zodResolver(forgotPassSchema)
    })

    const onEmail = async (data: z.infer<typeof forgotPassSchema>) => {
        console.log(data);
        setBusy(true);
        const fd = new FormData();
        Object.entries(data).forEach(([k, v]) => fd.set(k, v as string));
        const status = await requestReset(fd);
        if (!status.ok && status.msg !== "Account does not exist") {
            return fpForm.setError("emailUsername", { message: status.msg })
        }
        setSentLink(true);
        setBusy(false);
    }

    const tryFPAgain = () => {
        // Todo: Rate limit
        setSentLink(false);
        setBusy(false);
    }


    return (
        <main className="flex flex-col h-screen w-screen items-center justify-center bg-background">
            <Logo/>

            <h1 className="text-2xl font-bold mb-10 mt-10 text-left">Forgot Password Form</h1>

            {!sentLink && (
                <form onSubmit={fpForm.handleSubmit(onEmail)} className="flex flex-col bg-white p-2 w-1/5">
                    <FormInput 
                        label="Email or Username"
                        type="text"
                        register={fpForm.register("emailUsername")}
                    />
                    <FormError
                        error={fpForm.formState.errors.emailUsername?.message}
                    />
                    <FormSubmit disabled={busy}>Continue</FormSubmit>
                </form>
            )}
            
            {sentLink && (
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