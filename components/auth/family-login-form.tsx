"use client";

//import React from "react"
import { useState } from "react";
//import { Input } from "@/components/ui/input"
//import { Label } from "@/components/ui/label"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
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
        mode: "onBlur",
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
        <div
            className={cn(
                "flex gap-8 rounded-xl bg-gradient-to-r from-blue-50 via-white to-blue-100 p-8 shadow-lg",
                className
            )}
            {...props}
        >
            {/* First column: 5 icon rows */}
            <div className="flex w-136 min-w-42 flex-col items-start justify-center gap-8">
                <div className="flex h-16 items-center gap-2">
                    <img src="/home.png" alt="Home Icon" className="h-10 w-10" />
                    <div className="flex flex-col">
                        <Link
                            href="https://home.lisoc.org"
                            className="text-blue-700 underline hover:text-blue-900"
                        >
                            Home
                        </Link>
                        <Link
                            href="https://home.lisoc.org"
                            className="text-blue-700 underline hover:text-blue-900"
                        >
                            学校首页
                        </Link>
                    </div>
                </div>
                <div className="flex h-16 items-center gap-2">
                    <img src="/login.gif" alt="Login" className="h-10 w-10" />
                    <div className="flex flex-col">
                        <Link href="#" className="text-blue-700 underline hover:text-blue-900">
                            Login
                        </Link>
                        <Link href="#" className="text-blue-700 underline hover:text-blue-900">
                            点击登录
                        </Link>
                    </div>
                </div>
                <div className="flex h-16 items-center gap-2">
                    <img src="/help2.gif" alt="Help" className="h-10 w-10" />
                    <div className="flex flex-col">
                        <Link href="#" className="text-blue-700 underline hover:text-blue-900">
                            Help
                        </Link>
                        <Link href="#" className="text-blue-700 underline hover:text-blue-900">
                            求助电话
                        </Link>
                        <Link href="#" className="text-blue-700 underline hover:text-blue-900">
                            516-860-2583
                        </Link>
                    </div>
                </div>
                <div className="flex h-16 items-center gap-2">
                    <img src="/EmailWrite.gif" alt="Email" className="h-10 w-10" />
                    <div className="flex flex-col">
                        <Link href="#" className="text-blue-700 underline hover:text-blue-900">
                            Contact
                        </Link>
                        <Link href="#" className="text-blue-700 underline hover:text-blue-900">
                            求助与建议
                        </Link>
                    </div>
                </div>
                <div className="flex h-16 items-center gap-2">
                    <img src="/loginad.gif" alt="Admin Login" className="h-10 w-10" />
                    <div className="flex flex-col">
                        <Link
                            href="./login/admin"
                            className="text-blue-700 underline hover:text-blue-900"
                        >
                            Admin Login
                        </Link>
                        <Link
                            href="./login/admin"
                            className="text-blue-700 underline hover:text-blue-900"
                        >
                            教师/管理员登录
                        </Link>
                    </div>
                </div>
            </div>
            {/* Second column: login form */}
            <div className="max-w-[900px] min-w-[750px] flex-1">
                <div className="mb-6">
                    <h1 className="text-center text-lg font-bold text-blue-800">
                        Long Island School of Chinese Online Registration
                    </h1>
                    <h1 className="text-center text-lg font-bold text-blue-800">
                        长岛华夏中文学校网上注册系统
                    </h1>
                </div>
                <div className="relative">
                    <div className="absolute -top-5 left-8 z-10 flex items-center">
                        <div className="flex items-center rounded bg-white px-2 shadow">
                            <img
                                src="/acctlogin.gif"
                                alt="Card Border Icon"
                                className="h-10 w-10"
                            />
                            <span className="ml-2 text-xl font-bold text-blue-700">
                                Account Login/用户登录
                            </span>
                        </div>
                    </div>
                    <Card className="border-4 border-blue-700 bg-white/90">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <label className="ml-4 flex items-center text-sm font-medium text-blue-700">
                                    <input type="checkbox" className="form-checkbox mr-2" />
                                    English Version
                                </label>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={loginForm.handleSubmit(onSubmit)}>
                                <div className="flex flex-col gap-6">
                                    <div className="grid gap-3">
                                        <FormInput
                                            type="text"
                                            label={labels.email}
                                            //disabled={busy}
                                            //placeholder={labels.emailPlaceholder}
                                            register={loginForm.register("emailUsername")}
                                        />
                                        {loginForm.formState.errors.emailUsername?.message && (
                                            <FormError
                                                error={
                                                    loginForm.formState.errors.emailUsername.message
                                                }
                                            />
                                        )}

                                        {/*errors.email && <span className="text-xs text-red-600">{errors.email}</span>*/}
                                    </div>
                                    <div className="grid gap-3">
                                        <FormInput
                                            type="password"
                                            label={labels.password}
                                            /*onChange={e => setPassword(e.target.value)}*/
                                            register={loginForm.register("password")}
                                            //placeholder="********"
                                            //disabled={busy}
                                        />
                                        <div className="flex items-center">
                                            <Link
                                                href="/forgot-password"
                                                className="ml-auto inline-block text-sm text-blue-500 underline-offset-4 hover:underline"
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
                                </div>
                                <div className="mt-4 text-center text-sm">
                                    {labels.dontHaveAccount}{" "}
                                    <Link
                                        href="/register"
                                        className="text-blue-700 underline underline-offset-4"
                                    >
                                        {labels.signUp}
                                    </Link>
                                </div>
                            </form>
                            <div className="mt-8 text-center text-xs text-gray-500">
                                Disclaimer: This is a beta version of the new website. Please use
                                the desktop version for best experience. Please report any issues to{" "}
                                <Link
                                    href="mailto:tech.lisoc@gmail.com"
                                    className="text-blue-700 underline"
                                >
                                    tech.lisoc@gmail.com
                                </Link>
                                . Additionally, due to the migration to the new system, any old
                                passwords will not work. Please use the forgot password feature to
                                reset your password.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
