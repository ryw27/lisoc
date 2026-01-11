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
        mode: "onChange",
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
        <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center font-sans">
            {/* Banner Image Container */}
            <div className="mb-8 flex w-full max-w-4xl justify-center px-4 md:px-0">
                <img
                    src="/ah1.gif"
                    alt="Admin Portal Banner"
                    className="border-border h-auto w-full rounded-lg border object-cover shadow-lg"
                    style={{ marginTop: "-2rem" }}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex w-full max-w-4xl flex-col gap-6 px-4 md:flex-row md:px-0">
                {/* Left column (Navigation Sidebar) */}
                <div className="bg-primary text-primary-foreground flex min-w-[200px] flex-col items-start justify-center gap-6 rounded-lg p-8 shadow-lg">
                    <Link
                        href="https://home.lisoc.org"
                        className="decoration-secondary/50 hover:text-secondary hover:decoration-secondary text-lg font-semibold underline underline-offset-4 transition-colors"
                    >
                        学校主页
                    </Link>
                    <Link
                        href="#"
                        className="decoration-secondary/50 hover:text-secondary hover:decoration-secondary text-lg font-semibold underline underline-offset-4 transition-colors"
                    >
                        管理员/教师登录
                    </Link>
                    <Link
                        href="/"
                        className="decoration-secondary/50 hover:text-secondary hover:decoration-secondary text-lg font-semibold underline underline-offset-4 transition-colors"
                    >
                        家长学生登录
                    </Link>
                    {/* Empty spacer div kept from original code */}
                    <div className="text-lg font-semibold"></div>
                </div>

                {/* Right column (Login Form) */}
                <div className="relative flex-1 pt-6 md:pt-0">
                    {/* Floating Badge */}
                    <div className="absolute -top-4 left-4 z-10 flex items-center">
                        <div className="bg-card border-border flex items-center rounded-md border px-3 py-1 shadow-md">
                            <img
                                src="/acctlogin.gif"
                                alt="Login Form Border Icon"
                                className="h-8 w-8"
                            />
                            <span className="text-primary ml-2 text-lg font-bold">
                                Account Login/用户登录
                            </span>
                        </div>
                    </div>

                    {/* Main Card */}
                    <Card className="border-border bg-card overflow-hidden border shadow-xl">
                        <CardHeader className="bg-muted/30 pt-8 pb-4">
                            <CardTitle className="text-primary text-center text-xl font-bold tracking-tight">
                                Admin Login/管理员登录
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-6">
                            <form
                                onSubmit={loginForm.handleSubmit(onSubmit)}
                                className="flex flex-col space-y-4"
                                autoComplete="on"
                            >
                                {/* Input Wrapper */}
                                <div className="space-y-1">
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
                                </div>

                                {/* Password Wrapper */}
                                <div className="space-y-1">
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
                                </div>

                                <div className="pt-2">
                                    <FormSubmit
                                        disabled={
                                            busy ||
                                            !loginForm.formState.isValid ||
                                            loginForm.formState.isSubmitting
                                        }
                                        className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                                    >
                                        {busy ? "Loading..." : "Continue"}
                                    </FormSubmit>
                                </div>

                                {error && <FormError error={error} />}
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <footer className="text-muted-foreground w-full py-8 text-center text-xs font-medium">
                &copy; 2025 Long Island School of Chinese. All rights reserved.
            </footer>
        </div>
    );
}
