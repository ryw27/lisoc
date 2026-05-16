"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { completeAccountSetup } from "@/server/auth/accountSetup.actions";
import { passwordSchema } from "@/server/auth/schema";
import Logo from "@/components/logo";
import { FormError, FormInput, FormSubmit } from "./form-components";

const formSchema = z
    .object({
        password: passwordSchema.shape.password,
        confirmPassword: passwordSchema.shape.password,
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type Props = {
    userEmail: string;
    userToken: string;
};

export default function SetupAccountForm({ userEmail, userToken }: Props) {
    const [busy, setBusy] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const form = useForm({
        mode: "onChange",
        resolver: zodResolver(formSchema),
    });

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setBusy(true);
        try {
            const res = await completeAccountSetup({
                email: userEmail,
                token: userToken,
                password: data.password,
                confirmPassword: data.confirmPassword,
            });
            if (!res.ok) {
                form.setError("root", {
                    message: res.errorMessage ?? "Could not set up account.",
                });
                Object.entries(res.fieldErrors ?? {}).forEach(([field, msg]) => {
                    if (msg) {
                        // @ts-expect-error dynamic field key
                        form.setError(field, { message: msg });
                    }
                });
                setBusy(false);
                return;
            }
            setSuccess(true);
            setTimeout(() => router.push("/login/admin"), 1500);
        } catch (err) {
            form.setError("root", {
                message:
                    err instanceof Error
                        ? err.message
                        : "An unexpected error occurred. Please try again.",
            });
            setBusy(false);
        }
    };

    return (
        <main className="bg-background flex min-h-screen w-full flex-col items-center justify-center px-4">
            <div className="mb-8">
                <Logo />
            </div>
            <div className="w-full max-w-md bg-white p-8 shadow-md">
                <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
                    Set Up Your Account
                </h1>
                <p className="mb-6 text-center text-sm text-gray-500">
                    Choose a password for <strong>{userEmail}</strong>
                </p>

                {!success && (
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="flex flex-col space-y-4"
                    >
                        <div>
                            <FormInput
                                label="Password (密码)"
                                type="password"
                                register={form.register("password")}
                            />
                            <FormError error={form.formState.errors.password?.message} />
                        </div>
                        <div>
                            <FormInput
                                label="Confirm Password (确认密码)"
                                type="password"
                                register={form.register("confirmPassword")}
                            />
                            <FormError error={form.formState.errors.confirmPassword?.message} />
                        </div>

                        <FormSubmit className="bg-primary text-white" disabled={busy}>
                            Continue
                        </FormSubmit>
                        <FormError error={form.formState.errors.root?.message} />
                    </form>
                )}

                {success && (
                    <p className="text-center text-sm text-gray-600">
                        Account ready. Redirecting to the admin/teacher login page&hellip;
                    </p>
                )}
            </div>
        </main>
    );
}
