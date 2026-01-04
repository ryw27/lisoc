"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { requestPasswordReset } from "@/server/auth/resetpw.actions";
import { forgotPassSchema } from "@/server/auth/schema";
import Logo from "@/components/logo";
import { FormError, FormInput, FormSubmit } from "./form-components";

export default function ForgotPasswordForm() {
    const t = useTranslations("Auth.ForgotPassword");
    const [busy, setBusy] = useState<boolean>(false);
    const [sentLink, setSentLink] = useState<boolean>(false);

    const fpForm = useForm({
        mode: "onChange",
        resolver: zodResolver(forgotPassSchema),
    });

    const onEmail = async (data: z.infer<typeof forgotPassSchema>) => {
        setBusy(true);
        const result = await requestPasswordReset(data);
        if (!result.ok) {
            setSentLink(false);
            fpForm.setError("emailUsername", { message: result.errorMessage });
            // To map through field errors, you can use Object.entries(result.fieldErrors ?? {}) and set errors for each field:
            Object.entries(result.fieldErrors ?? {}).forEach(([field, messages]) => {
                if (messages && messages.length > 0) {
                    // @ts-expect-error: field is dynamically typed and matches form field keys
                    fpForm.setError(field, { message: messages[0] });
                }
            });
        } else {
            setSentLink(true);
        }
    };

    const tryFPAgain = () => {
        // TODO: Rate limit
        setSentLink(false);
        setBusy(false);
    };

    return (
        <main className="bg-background flex h-screen w-screen flex-col items-center justify-center">
            <Logo />

            <h1 className="mt-10 mb-10 text-left text-2xl font-bold">
                Forgot Password Form（找回密码）
            </h1>

            {!sentLink && (
                <form
                    onSubmit={fpForm.handleSubmit(onEmail)}
                    className="flex w-1/5 flex-col bg-white p-2"
                >
                    <FormInput
                        label="Email or Username（邮箱）"
                        type="text"
                        register={fpForm.register("emailUsername")}
                    />
                    <FormError error={fpForm.formState.errors.emailUsername?.message} />
                    <FormSubmit disabled={busy}>Continue（下一步）</FormSubmit>
                </form>
            )}

            {sentLink && (
                <div className="flex w-1/5 flex-col bg-white p-2">
                    <p className="font-bold text-gray-700">
                        {/* A link to reset your password has been sent to your email.
                        If you did not receive an email, please &thinsp; */}
                        {t("reset-success-msg")}
                        <button
                            onClick={tryFPAgain}
                            className="cursor-pointer text-blue-600 underline"
                        >
                            {t("try-again")}
                        </button>
                        &thinsp; or &thinsp;{" "}
                        <Link href="/register" className="font-bold text-blue-600 underline">
                            {" "}
                            Sign up.
                        </Link>
                    </p>
                </div>
            )}

            <p className="mt-5 text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-bold text-blue-500 underline">
                    Sign up（没有账号请按这里）
                </Link>
            </p>
        </main>
    );
}
