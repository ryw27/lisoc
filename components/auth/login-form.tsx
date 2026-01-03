"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { z } from "zod/v4";
// import { FcGoogle } from "react-icons/fc";
import { emailSchema, ErrorCode, loginSchema, usernameSchema } from "@/server/auth/schema";
import { setPasswordAfterLogin } from "@/server/auth/teachadminreg.actions";
import Logo from "@/components/logo";
import { FormError, FormInput, FormSubmit } from "./form-components";

type LoginFormProps = {
    isAdminForm: boolean;
    isTeacherForm: boolean;
};

export default function LoginForm({ isAdminForm, isTeacherForm }: LoginFormProps) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>();

    // Only needed for teacher + admin
    const [passwordForm, setPasswordForm] = useState<"None" | "setPassword" | "NewPasswordSet">(
        "None"
    );
    const [email, setEmail] = useState<string | null>();

    const router = useRouter();

    const loginForm = useForm({
        mode: "onChange",
        resolver: zodResolver(loginSchema),
    });

    const errorMessages: { [key: string]: string } = {
        [ErrorCode.IncorrectEmailPassword]: "Incorrect Email or password",
        [ErrorCode.InternalServerError]: "Something unexpected went wrong. Please contact regadmin",
        [ErrorCode.UserMissingPassword]: "Please fill in your password",
    };

    const onSubmit = async (data: z.infer<typeof loginSchema>) => {
        // Set busy and reset the error message
        setBusy(true);
        setError(null);
        const provider = isAdminForm
            ? "admin-credentials"
            : isTeacherForm
              ? "teacher-credentials"
              : "family-credentials";

        const isEmail = emailSchema.safeParse({ email: data.emailUsername }).success;
        const isUsername = usernameSchema.safeParse({ username: data.emailUsername }).success;

        if (!isEmail && !isUsername) {
            throw new Error("Invalid email or username");
        }

        const redirectURL = isAdminForm ? "/admin" : isTeacherForm ? "/teacher" : "/dashboard";

        const credSubmitObj = isEmail
            ? {
                  email: data.emailUsername,
                  password: data.password,
                  redirect: false as const,
              }
            : {
                  username: data.emailUsername,
                  password: data.password,
                  redirect: false as const,
                  // redirectTo: redirectURL
              };

        const res = await signIn(provider, credSubmitObj);
        if (!res) {
            setError(errorMessages[ErrorCode.InternalServerError]);
            setBusy(false);
        } else if (!res.code) {
            router.push(redirectURL);
        } else if (res.code === ErrorCode.IncorrectEmailPassword) {
            setError(errorMessages[ErrorCode.IncorrectEmailPassword]);
            setBusy(false);
        } else if (res.code === ErrorCode.UserMissingPassword) {
            setPasswordForm("setPassword");
            setEmail(data.emailUsername);
            setBusy(false);
        } else {
            setError(errorMessages[res.code] || "Something went wrong.");
            setBusy(false);
        }
    };

    const setPassword = async (data: FormData) => {
        setBusy(true);
        const res = await setPasswordAfterLogin({
            email: String(email),
            password: String(data.get("password") ?? ""),
            confirmpassword: String(data.get("confirmpassword") ?? ""),
            role: isAdminForm
                ? "ADMINUSER"
                : isTeacherForm
                  ? "TEACHER"
                  : (() => {
                        throw new Error("Invalid role");
                    })(),
        });
        if (!res.ok) {
            setError(res.errorMessage);
        } else {
            setPasswordForm("NewPasswordSet");
        }

        setBusy(false);
    };

    return (
        <main className="bg-gray flex h-screen w-screen flex-col items-center justify-center">
            <div className="flex w-[35vw] flex-col justify-center rounded-2xl border border-gray-200 bg-white p-10 shadow-lg">
                <div className="mx-auto w-[20vw]">
                    <div className="flex items-center justify-center gap-2">
                        <Logo height={60} width={60} />
                        <p className="text-xl font-semibold text-gray-800">华夏中文学校</p>
                    </div>
                    <div className="flex items-center justify-center">
                        <h1 className="mt-10 mb-10 text-3xl font-bold">
                            {passwordForm === "None"
                                ? `Sign In ${isAdminForm ? "(Admin)" : isTeacherForm ? "(Teacher)" : ""}`
                                : passwordForm === "setPassword"
                                  ? "Set your password"
                                  : passwordForm === "NewPasswordSet"
                                    ? "Login with your new password"
                                    : passwordForm === "FormConfirmation"
                                      ? "Confirm your details"
                                      : ""}
                        </h1>
                    </div>

                    {passwordForm === "setPassword" ? (
                        <form action={setPassword} className="flex flex-col bg-white p-2">
                            <FormInput type="password" label="Password" required />
                            <FormInput type="password" label="confirmpassword" required />
                            <FormSubmit disabled={busy}>
                                {busy ? "Loading..." : "Continue"}
                            </FormSubmit>
                            {error && <FormError error={error} />}
                        </form>
                    ) : passwordForm === "NewPasswordSet" || passwordForm === "None" ? (
                        <>
                            <button
                                title="Not implemented yet"
                                className="flex w-full items-center justify-center rounded-sm border-2 border-gray-200 px-1 py-1 text-lg font-medium text-black"
                                type="button"
                                disabled
                            >
                                <FcGoogle className="mr-2 h-5 w-5" />
                                Continue with Google
                                <p className="ml-2 text-[8px]">Not implemented yet</p>
                            </button>
                            <div className="my-8 flex items-center gap-4">
                                <div className="h-px w-1/2 bg-gray-200"></div>
                                <span className="flex items-center text-sm text-gray-500">OR</span>
                                <div className="h-px w-1/2 bg-gray-200"></div>
                            </div>
                            <form
                                onSubmit={loginForm.handleSubmit(onSubmit)}
                                className="flex flex-col bg-white p-2"
                                autoComplete="on"
                            >
                                <FormInput
                                    type="text"
                                    label="Email or Username"
                                    register={loginForm.register("emailUsername")}
                                />
                                {loginForm.formState.errors.emailUsername?.message && (
                                    <FormError
                                        error={loginForm.formState.errors.emailUsername.message}
                                    />
                                )}
                                <FormInput
                                    type="password"
                                    label="Password"
                                    register={loginForm.register("password")}
                                />
                                {loginForm.formState.errors.password?.message && (
                                    <FormError
                                        error={loginForm.formState.errors.password.message}
                                    />
                                )}
                                <Link
                                    href="/forgot-password"
                                    className="mb-2 self-start text-sm font-bold text-blue-500 underline"
                                >
                                    Forgot password?
                                </Link>
                                <FormSubmit
                                    disabled={
                                        busy ||
                                        !loginForm.formState.isValid ||
                                        loginForm.formState.isSubmitting
                                    }
                                >
                                    {busy ? "Loading..." : "Continue"}
                                </FormSubmit>
                                {error && <FormError error={error} />}
                            </form>
                            <p className="mt-5 text-center text-sm text-gray-500">
                                Don&apos;t have an account?{" "}
                                <Link
                                    href="/register"
                                    className="font-bold text-blue-500 underline"
                                >
                                    Sign up
                                </Link>
                            </p>
                        </>
                    ) : (
                        <div className="flex items-center justify-center">
                            <span className="text-red-600">An error occurred</span>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
