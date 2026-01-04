"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { resetPassword } from "@/server/auth/resetpw.actions";
import { resetPassSchema } from "@/server/auth/schema";
import Logo from "@/components/logo";
import { FormError, FormInput, FormSubmit } from "./form-components";

type resetPasswordParams = {
    userEmail: string;
    userToken: string;
    // resetPassword: (data: z.infer<typeof resetPassSchema>) => Promise<void>;
};
export default function ResetPasswordForm({ userEmail, userToken }: resetPasswordParams) {
    const [busy, setBusy] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const router = useRouter();

    const rpForm = useForm({
        defaultValues: { email: userEmail, token: userToken },
        mode: "onChange",
        resolver: zodResolver(resetPassSchema),
    });

    const onReset = async (data: z.infer<typeof resetPassSchema>) => {
        setBusy(true);
        try {
            await resetPassword(data);
        } catch (error) {
            rpForm.setError("root", {
                message:
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred. Please try again.",
            });
        } finally {
            setBusy(false);
        }
        router.push("/login");
        setSuccess(true);
    };

    return (
        <main className="bg-background flex h-screen w-screen flex-col items-center justify-center">
            <Logo />
            <h1 className="mt-10 mb-10 text-left text-2xl font-bold">Reset Password</h1>
            {!success && (
                <form
                    onSubmit={rpForm.handleSubmit(onReset)}
                    className="flex w-1/5 flex-col bg-white p-2"
                >
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
                    <FormError error={rpForm.formState.errors.email?.message} />
                    <FormSubmit disabled={busy}>Continue</FormSubmit>
                </form>
            )}
            {success && (
                <div className="flex w-1/5 flex-col bg-white p-2">
                    <p className="text-gray-600">
                        Password successfully changed. Redirecting to login page.
                    </p>
                </div>
            )}
        </main>
    );
}
