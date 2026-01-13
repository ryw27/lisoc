"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
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
        setBusy(false);
    };

    const tryFPAgain = () => {
        // TODO: Rate limit
        setSentLink(false);
        setBusy(false);
    };

    return (
        <main className="bg-background flex min-h-screen w-full flex-col items-center justify-center px-4">
            <div className="mb-8">
                <Logo />
            </div>

            <div className="w-full max-w-md bg-white p-8 shadow-md">
                <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
                    Forgot Password (找回密码)
                </h1>

                {!sentLink && (
                    <form
                        onSubmit={fpForm.handleSubmit(onEmail)}
                        className="flex w-full flex-col space-y-4"
                    >
                        <p className="text-center text-sm text-gray-500">
                            Enter your email or username to receive a reset link.
                            <br />
                            (请输入您的邮箱或用户名)
                        </p>

                        <div>
                            <FormInput
                                label="Email or Username (邮箱/用户名)"
                                type="text"
                                register={fpForm.register("emailUsername")}
                            />
                            <FormError error={fpForm.formState.errors.emailUsername?.message} />
                        </div>

                        <FormSubmit className="bg-primary text-white" disabled={busy}>
                            Send Reset Link (发送链接)
                        </FormSubmit>
                    </form>
                )}

                {sentLink && (
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <Check className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-gray-900">Link Sent!</h3>
                            <p className="text-sm text-gray-600">
                                {t("reset-success-msg")}
                                <button
                                    onClick={tryFPAgain}
                                    className="text-primary font-bold underline hover:text-blue-700"
                                >
                                    {t("try-again")}
                                </button>
                                &thinsp; or &thinsp;{" "}
                                <Link
                                    href="/register"
                                    className="text-primary font-bold hover:underline"
                                >
                                    Sign up (注册)
                                </Link>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
