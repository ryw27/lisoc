"use client";

//import React from "react"
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
//import { Input } from "@/components/ui/input"
//import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils";
import { emailSchema, ErrorCode, loginSchema, usernameSchema } from "@/server/auth/schema";
//import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    //  CardDescription,
    CardHeader,
} from "@/components/ui/card";
import { FormError, FormInput, FormSubmit } from "./form-components";

export function FamilyLoginForm({ className, ...props }: React.ComponentProps<"div">) {
    const labels = {
        loginTitle: "Login to your account",
        loginDescription: "Enter your email below to login to your account",
        email: "Email/用户名",
        emailPlaceholder: "me@example.com",
        password: "Password/密码",
        forgotPassword: "Forgot your password/忘记密码?",
        login: "Login/登录",
        loginWithGoogle: "Login with Google",
        dontHaveAccount: "Don't have an account/没有账号?",
        signUp: "Sign up/点击这里",
    };

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>();

    //const [email, setEmail] = useState("");
    //const [password, setPassword] = useState("");

    const loginForm = useForm({
        //mode: "onChange",
        mode: "onChange",
        resolver: zodResolver(loginSchema),
    });

    const errorMessages: { [key: string]: string } = {
        [ErrorCode.IncorrectEmailPassword]: "Incorrect Email or password",
        [ErrorCode.InternalServerError]: "Something unexpected went wrong. Please contact regadmin",
        [ErrorCode.UserMissingPassword]: "Please fill in your password",
    };

    const router = useRouter();

    const onSubmit = async (data: z.infer<typeof loginSchema>) => {
        // Set busy and reset the error message
        setBusy(true);
        setError(null);
        const provider = "family-credentials";

        const isEmail = emailSchema.safeParse({ email: data.emailUsername }).success;
        const isUsername = usernameSchema.safeParse({ username: data.emailUsername }).success;

        if (!isEmail && !isUsername) {
            throw new Error("Invalid email or username");
        }

        const redirectURL = "/dashboard";

        const credSubmitObj = {
            email: data.emailUsername,
            password: data.password,
            redirect: false as const,
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
        }*/ else {
            setError(errorMessages[res.code] || "Something went wrong.");
            setBusy(false);
        }
    };

    return (
        <div className={cn("flex w-full flex-col gap-8 lg:flex-row", className)} {...props}>
            {/* ------------------- */}
            {/* LEFT SIDEBAR (NAVY) */}
            {/* ------------------- */}
            <div className="bg-primary text-primary-foreground flex w-full flex-col justify-center gap-8 rounded-xl p-8 shadow-xl lg:w-auto lg:min-w-[320px]">
                {/* Home Row */}
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white shadow-sm">
                        <img src="/home.png" alt="Home Icon" className="h-8 w-8 object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <Link
                            href="https://home.lisoc.org"
                            className="hover:text-secondary font-semibold underline-offset-4 transition-colors hover:underline"
                        >
                            Home
                        </Link>
                        <Link
                            href="https://home.lisoc.org"
                            className="hover:text-secondary font-semibold underline-offset-4 transition-colors hover:underline"
                        >
                            学校首页
                        </Link>
                    </div>
                </div>

                {/* Login Row */}
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white shadow-sm">
                        <img src="/login.gif" alt="Login" className="h-8 w-8 object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <Link
                            href="#"
                            className="hover:text-secondary font-semibold underline-offset-4 transition-colors hover:underline"
                        >
                            Login
                        </Link>
                        <Link
                            href="#"
                            className="hover:text-secondary font-semibold underline-offset-4 transition-colors hover:underline"
                        >
                            点击登录
                        </Link>
                    </div>
                </div>

                {/* Help Row */}
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white shadow-sm">
                        <img src="/help2.gif" alt="Help" className="h-8 w-8 object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <Link
                            href="#"
                            className="hover:text-secondary font-semibold underline-offset-4 transition-colors hover:underline"
                        >
                            Help / 求助电话
                        </Link>
                        <a
                            href="tel:516-860-2583"
                            className="text-secondary underline-offset-4 transition-colors hover:text-white hover:underline"
                        >
                            516-860-2583
                        </a>
                    </div>
                </div>

                {/* Contact Row */}
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white shadow-sm">
                        <img src="/EmailWrite.gif" alt="Email" className="h-8 w-8 object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <Link
                            href="#"
                            className="hover:text-secondary font-semibold underline-offset-4 transition-colors hover:underline"
                        >
                            Contact
                        </Link>
                        <Link
                            href="#"
                            className="hover:text-secondary font-semibold underline-offset-4 transition-colors hover:underline"
                        >
                            求助与建议
                        </Link>
                    </div>
                </div>

                {/* Admin Login Row */}
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white shadow-sm">
                        <img
                            src="/loginad.gif"
                            alt="Admin Login"
                            className="h-8 w-8 object-contain"
                        />
                    </div>
                    <div className="flex flex-col">
                        <Link
                            href="./login/admin"
                            className="hover:text-secondary font-semibold underline-offset-4 transition-colors hover:underline"
                        >
                            Admin Login
                        </Link>
                        <Link
                            href="./login/admin"
                            className="hover:text-secondary font-semibold underline-offset-4 transition-colors hover:underline"
                        >
                            教师/管理员登录
                        </Link>
                    </div>
                </div>
            </div>

            {/* -------------------- */}
            {/* RIGHT LOGIN FORM     */}
            {/* -------------------- */}
            <div className="flex-1">
                {/* Title Area */}
                <div className="mb-6 space-y-2 text-center md:pl-6 md:text-left">
                    <h1 className="text-primary text-xl font-bold tracking-tight">
                        Long Island School of Chinese Online Registration
                    </h1>
                    <h1 className="text-primary text-xl font-bold tracking-tight">
                        长岛华夏中文学校网上注册系统
                    </h1>
                </div>

                <div className="relative pt-6 md:pt-8">
                    {/* Floating Badge */}
                    <div className="absolute top-0 left-6 z-10 flex items-center shadow-md">
                        <div className="bg-card border-border flex items-center rounded-lg border px-4 py-2">
                            <img
                                src="/acctlogin.gif"
                                alt="Icon"
                                className="h-8 w-8 mix-blend-multiply"
                            />
                            <span className="text-primary ml-3 text-lg font-bold">
                                Account Login / 用户登录
                            </span>
                        </div>
                    </div>

                    {/* Main Card */}
                    <Card className="border-border bg-card mt-4 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-end pt-12 pr-8 pb-2">
                            <div className="flex items-center space-x-2">
                                <label className="text-muted-foreground hover:text-primary flex cursor-pointer items-center gap-2 text-sm leading-none font-medium transition-colors peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    <input
                                        type="checkbox"
                                        className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                                    />
                                    English Version
                                </label>
                            </div>
                        </CardHeader>

                        <CardContent className="p-8">
                            <form
                                onSubmit={loginForm.handleSubmit(onSubmit)}
                                className="flex flex-col gap-6"
                            >
                                {/* Email Field */}
                                <div className="space-y-2">
                                    <FormInput
                                        type="text"
                                        label={labels.email}
                                        register={loginForm.register("emailUsername")}
                                    />
                                    {loginForm.formState.errors.emailUsername?.message && (
                                        <FormError
                                            error={loginForm.formState.errors.emailUsername.message}
                                        />
                                    )}
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <FormInput
                                        type="password"
                                        label={labels.password}
                                        register={loginForm.register("password")}
                                    />

                                    <div className="flex items-center justify-end pt-1">
                                        <Link
                                            href="/forgot-password"
                                            className="text-primary text-xs font-medium underline-offset-4 hover:underline"
                                        >
                                            {labels.forgotPassword}
                                        </Link>
                                    </div>

                                    {loginForm.formState.errors.password?.message && (
                                        <FormError
                                            error={loginForm.formState.errors.password.message}
                                        />
                                    )}
                                </div>

                                {/* Submit Button */}
                                <FormSubmit
                                    disabled={
                                        busy ||
                                        !loginForm.formState.isValid ||
                                        loginForm.formState.isSubmitting
                                    }
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full shadow-sm"
                                >
                                    {busy ? "Loading..." : "Continue"}
                                </FormSubmit>

                                {/* Global Error */}
                                {error && <FormError error={error} />}

                                {/* Register Link */}
                                <div className="text-center text-sm">
                                    {labels.dontHaveAccount}{" "}
                                    <Link
                                        href="/register"
                                        className="text-primary hover:text-secondary font-bold underline-offset-4 hover:underline"
                                    >
                                        {labels.signUp}
                                    </Link>
                                </div>

                                {/* Disclaimer */}
                                <div className="bg-muted/50 text-muted-foreground mt-4 rounded-lg p-4 text-xs leading-relaxed">
                                    <p>
                                        <strong>Disclaimer:</strong> This is a beta version. Please
                                        use a desktop for the best experience. Report issues to{" "}
                                        <a
                                            href="mailto:tech.lisoc@gmail.com"
                                            className="text-primary underline"
                                        >
                                            tech.lisoc@gmail.com
                                        </a>
                                        . Due to system migration, old passwords may not work—please
                                        use the forgot password feature to reset.
                                    </p>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
