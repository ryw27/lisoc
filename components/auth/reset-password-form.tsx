"use client";
import { FormSubmit, FormInput, FormError } from "./form-components"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { resetPassSchema } from "@/lib/auth/validation"
import { z } from "zod"
import { useState } from "react";
import Logo from "@/components/logo";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/lib/auth";

type resetPasswordParams = {
    userEmail: string;
    userToken: string;
    // resetPassword: (data: z.infer<typeof resetPassSchema>) => Promise<void>;
}
export default function ResetPasswordForm({ userEmail, userToken }: resetPasswordParams) {
    const [busy, setBusy] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const router = useRouter();

    const rpForm = useForm({
        defaultValues: { email: userEmail, token: userToken },
        mode: "onChange",
        resolver: zodResolver(resetPassSchema)
    })

    const onReset = async (data: z.infer<typeof resetPassSchema>) => {
        setBusy(true);
        try {
            await resetPassword(data);
        } catch (error) {
            rpForm.setError("root", { message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again." });
        } finally {
            setBusy(false);
        }
        router.push("/login");
        setSuccess(true);
    }

    return (

        <main className="flex flex-col h-screen w-screen items-center justify-center bg-background">
            <Logo/>
            <h1 className="text-2xl font-bold mb-10 mt-10 text-left">Reset Password</h1>
            {!success && (
                <form onSubmit={rpForm.handleSubmit(onReset)} className="flex flex-col bg-white p-2 w-1/5">
                    <FormInput 
                        label="Email"
                        type="text"
                        register={rpForm.register("email")}
                        extras={{ defaultValue: userEmail }}
                    />
                    <FormInput 
                        label="Password"
                        type="password"
                        register={rpForm.register("password")}
                    />
                    <FormInput 
                        label="Confirm Password"
                        type="password"
                        register={rpForm.register("confirmPassword")}
                        // extras={{ placeholder: "Confirm Password" }}
                    />
                    <FormError
                        error={rpForm.formState.errors.email?.message}
                    />
                    <FormSubmit disabled={busy}>Continue</FormSubmit>
                </form>  
            )}
            {success && (
                <div className="flex flex-col bg-white p-2 w-1/5">
                    <p className="text-gray-600">Password successfully changed. Redirecting to login page.</p>
                </div>
            )}
        </main>
    )    
}