"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { adminloginSchema, emailSchema, ErrorCode, usernameSchema } from "@/server/auth/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError, FormInput, FormSubmit } from "./form-components";

export default function AdminLoginForm() {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>();

    const loginForm = useForm({
        mode: "onBlur",
        resolver: zodResolver(adminloginSchema),
    });

    const errorMessages: { [key: string]: string } = {
        [ErrorCode.IncorrectEmailPassword]: "Incorrect Email or password",
        [ErrorCode.InternalServerError]: "Something unexpected went wrong. Please contact regadmin",
        [ErrorCode.UserMissingPassword]: "Please fill in your password",
    };

    const router = useRouter();

    const onSubmit = async (data: z.infer<typeof adminloginSchema>) => {
        // Set busy and reset the error message
        setBusy(true);
        setError(null);

        const isEmail = emailSchema.safeParse({ email: data.emailUsername }).success;
        // difference between admin and teacher are
        // teachers must use email to loing
        // admin only username  no email
        let isUsername = false;
        if (!isEmail) {
            isUsername = usernameSchema.safeParse({ username: data.emailUsername }).success;
            if (!isUsername) {
                throw new Error("Invalid email or username");
            }
        }

        // at this point isEmail or isUsername one of must be true and one of them must be false
        const provider = isUsername ? "admin-credentials" : "teacher-credentials";

        const redirectURL = isUsername ? "/admin" : "/teacher";
        console.log("redirectURL=", redirectURL);

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
        } /*else if (res.code === ErrorCode.UserMissingPassword) {
            setPasswordForm("setPassword");
            setEmail(data.emailUsername);
            setBusy(false);
        } */ else {
            setError(errorMessages[res.code] || "Something went wrong.");
            setBusy(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
            <div className="mb-8 flex w-full max-w-3xl justify-center">
                <img
                    src="/ah1.gif"
                    alt="Admin Portal Banner"
                    className="h-auto w-full rounded-t-lg object-cover shadow"
                    style={{ marginTop: "-2rem" }}
                />
            </div>
            <div className="flex w-full max-w-3xl">
                {/* Left column with 3 rows */}
                <div className="flex min-w-[180px] flex-col items-start justify-center gap-6 rounded-lg border border-blue-800 bg-blue-700 p-6 shadow">
                    <Link
                        href="https://home.lisoc.org"
                        className="text-lg font-semibold text-white underline underline-offset-4 hover:text-blue-200"
                    >
                        学校主页
                    </Link>
                    <Link
                        href="#"
                        className="text-lg font-semibold text-white underline underline-offset-4 hover:text-blue-200"
                    >
                        管理员/教师登录
                    </Link>
                    <Link
                        href="/"
                        className="text-lg font-semibold text-white underline underline-offset-4 hover:text-blue-200"
                    >
                        家长学生登录
                    </Link>
                    <div className="text-lg font-semibold text-white"></div>
                </div>
                {/* Login form card */}
                <div className="relative flex-1">
                    <div className="absolute -top-5 left-4 z-10 flex items-center">
                        <div className="flex items-center rounded bg-white px-2 shadow">
                            <img
                                src="/acctlogin.gif"
                                alt="Login Form Border Icon"
                                className="h-10 w-10"
                            />
                            <span className="ml-2 text-xl font-bold text-blue-700">
                                Account Login/用户登录
                            </span>
                        </div>
                    </div>
                    <Card className="border-4 border-blue-700 bg-blue-50 p-6 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-center text-xl font-bold text-blue-700">
                                Admin Login/管理员登录
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
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
                        </CardContent>
                    </Card>
                </div>
            </div>
            <footer className="w-full py-4 text-center text-xs font-bold text-gray-500">
                &copy; 2025 Long Island School of Chinese. All rights reserved.
            </footer>
        </div>
    );
}
