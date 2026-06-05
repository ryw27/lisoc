"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import {
    exchangePasswordResetToken,
    isPasswordResetSessionValid,
    resetPassword,
} from "@/server/auth/resetpw.actions";
import { passwordSchema } from "@/server/auth/schema";
import Logo from "@/components/logo";
import { FormError, FormInput, FormSubmit } from "./form-components";

const resetPasswordFormSchema = z
    .object({
        password: passwordSchema.shape.password,
        confirmPassword: passwordSchema.shape.password,
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export default function ResetPasswordForm() {
    const [busy, setBusy] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [ready, setReady] = useState<boolean>(false);
    const [linkError, setLinkError] = useState<string | null>(null);
    const router = useRouter();

    const rpForm = useForm({
        mode: "onChange",
        resolver: zodResolver(resetPasswordFormSchema),
    });

    useEffect(() => {
        let cancelled = false;

        async function exchangeToken() {
            const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
            const token = hashParams.get("token");

            try {
                if (token) {
                    const res = await exchangePasswordResetToken({ token });
                    window.history.replaceState(null, "", window.location.pathname);
                    if (!res.ok) {
                        throw new Error(res.errorMessage ?? "Invalid or expired reset link.");
                    }
                } else {
                    const valid = await isPasswordResetSessionValid();
                    if (!valid) {
                        throw new Error("Invalid or expired reset link.");
                    }
                }

                if (!cancelled) setReady(true);
            } catch (err) {
                window.history.replaceState(null, "", window.location.pathname);
                if (!cancelled) {
                    setLinkError(
                        err instanceof Error ? err.message : "Invalid or expired reset link."
                    );
                }
            }
        }

        void exchangeToken();
        return () => {
            cancelled = true;
        };
    }, []);

    const onReset = async (data: z.infer<typeof resetPasswordFormSchema>) => {
        setBusy(true);
        try {
            const res = await resetPassword(data);
            if (!res.ok) {
                rpForm.setError("root", {
                    message: res.errorMessage ?? "Could not reset password.",
                });
                setBusy(false);
                return;
            }
        } catch (error) {
            rpForm.setError("root", {
                message:
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred. Please try again.",
            });
            setBusy(false);
            return;
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
            {linkError && (
                <div className="flex w-1/5 flex-col bg-white p-2">
                    <p className="text-red-600">{linkError}</p>
                </div>
            )}
            {!linkError && !ready && (
                <div className="flex w-1/5 flex-col bg-white p-2">
                    <p className="text-gray-600">Checking reset link...</p>
                </div>
            )}
            {!success && ready && (
                <form
                    onSubmit={rpForm.handleSubmit(onReset)}
                    className="flex w-1/5 flex-col bg-white p-2"
                >
                    <FormInput
                        label="Password"
                        type="password"
                        register={rpForm.register("password")}
                        error={rpForm.formState.errors.password?.message}
                    />
                    <FormInput
                        label="Confirm Password"
                        type="password"
                        register={rpForm.register("confirmPassword")}
                        error={rpForm.formState.errors.confirmPassword?.message}
                        // extras={{ placeholder: "Confirm Password" }}
                    />
                    <FormError error={rpForm.formState.errors.password?.message} />
                    <FormError error={rpForm.formState.errors.confirmPassword?.message} />
                    <FormError error={rpForm.formState.errors.root?.message} />
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
