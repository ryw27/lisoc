"use client";
import Link from 'next/link';
import Logo from '@/components/logo';
// import { FcGoogle } from "react-icons/fc";
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FormInput, FormSubmit, FormError } from './form-components'
import { z } from 'zod';
import { emailSchema, loginSchema, usernameSchema } from '@/lib/auth/validation';
import { signIn } from "next-auth/react"
import { ErrorCode } from '@/lib/auth/validation';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { setPasswordAfterLogin } from '@/lib/auth/actions/teacher-admin-reg/setPasswordAfterLogin';


type LoginFormProps = {
    isAdminForm: boolean;
    isTeacherForm: boolean;
}

export default function LoginForm({ isAdminForm, isTeacherForm }: LoginFormProps) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>();

    // Only needed for teacher + admin
    const [passwordForm, setPasswordForm] = useState<"None" | "setPassword" | "NewPasswordSet" >("None");
    const [email, setEmail] = useState<string | null>();
    
    const router = useRouter();

    const loginForm = useForm({
        mode: "onChange",
        resolver: zodResolver(loginSchema),
    })

    const errorMessages: { [key: string ]: string} = {
        [ErrorCode.IncorrectEmailPassword]: "Incorrect Email or password",
        [ErrorCode.InternalServerError]: "Something unexpected went wrong. Please contact regadmin",
        [ErrorCode.UserMissingPassword]: "Please fill in your password"
    }

    const onSubmit = async (data: z.infer<typeof loginSchema>) => {
        // Set busy and reset the error message
        setBusy(true);
        setError(null);
        const provider = isAdminForm ? "admin-credentials" : isTeacherForm ? "teacher-credentials" : "family-credentials";

        const isEmail = emailSchema.safeParse({ email: data.emailUsername }).success;
        const isUsername = usernameSchema.safeParse({ username: data.emailUsername }).success;

        if (!isEmail && !isUsername) {
            throw new Error("Invalid email or username")
        }
        
        const redirectURL = isAdminForm 
                            ? "/admin" 
                            : isTeacherForm
                                ? "/teacher"
                                : "/dashboard"

        const credSubmitObj = isEmail ? 
        {
            email: data.emailUsername,
            password: data.password,
            redirect: false as const
        } : 
        {
            username: data.emailUsername,
            password: data.password,
            redirect: false as const
            // redirectTo: redirectURL
        }

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
        setBusy(true)
        const res = await setPasswordAfterLogin({
            email: String(email),
            password: String(data.get("password") ?? ""),
            confirmpassword: String(data.get("confirmpassword") ?? ""),
            role: isAdminForm
                ? "ADMINUSER"
                : isTeacherForm
                    ? "TEACHER"
                    : (() => { throw new Error("Invalid role"); })(),
        })
        if (!res.ok) {
            setError(res.errorMessage);
        } else {
            setPasswordForm("NewPasswordSet");
        }

        setBusy(false)
    }


    return (
        <main className="flex flex-col h-screen w-screen items-center justify-center bg-gray">
            <div className="flex flex-col justify-center w-[35vw] rounded-2xl shadow-lg border border-gray-200 p-10 bg-white">
                <div className="mx-auto w-[20vw]">
                    <div className="flex justify-center items-center gap-2">
                        <Logo height={60} width={60} />
                        <p className="font-semibold text-xl text-gray-800">华夏中文学校</p>
                    </div>
                    <div className="flex justify-center items-center">
                        <h1 className="text-3xl font-bold mb-10 mt-10 ">
                            {passwordForm === "None" 
                                ? `Sign In ${isAdminForm ? "(Admin)" : isTeacherForm ? "(Teacher)" : ""}`
                                : passwordForm === "setPassword" 
                                    ? "Set your password"
                                    : passwordForm === "NewPasswordSet"
                                        ? "Login with your new password"
                                        : passwordForm === "FormConfirmation"
                                            ? "Confirm your details"
                                            : ""
                            }
                        </h1>
                    </div>
                    
                    {passwordForm === "setPassword" ? (
                        <form action={setPassword} className="flex flex-col bg-white p-2">
                            <FormInput
                                type="password"
                                label="Password"
                                required
                            />
                            <FormInput
                                type="password"
                                label="confirmpassword"
                                required
                            />
                            <FormSubmit disabled={busy}>
                                {busy ? "Loading..." : "Continue"}
                            </FormSubmit>
                            {error && <FormError error={error} />}
                        </form>
                    ) : passwordForm === "NewPasswordSet" || passwordForm === "None" ? (
                        <>
                            <button
                                title="Not implemented yet"
                                className="flex justify-center items-center rounded-sm text-lg font-medium text-black border-2 border-gray-200 py-1 px-1 w-full"
                                type="button"
                                disabled
                            >
                                <FcGoogle className="w-5 h-5 mr-2" />
                                Continue with Google
                                <p className="text-[8px] ml-2">Not implemented yet</p>
                            </button>
                            <div className="flex  items-center gap-4 my-8">
                                <div className="bg-gray-200 w-1/2 h-px"></div>
                                <span className="text-sm text-gray-500 flex items-center">OR</span>
                                <div className="bg-gray-200 w-1/2 h-px"></div>
                            </div>
                            <form
                                onSubmit={loginForm.handleSubmit(onSubmit)}
                                className="flex flex-col bg-white p-2 "
                                autoComplete="on"
                            >
                                <FormInput
                                    type="text"
                                    label="Email or Username"
                                    register={loginForm.register("emailUsername")}
                                />
                                {loginForm.formState.errors.emailUsername?.message && (
                                    <FormError error={loginForm.formState.errors.emailUsername.message} />
                                )}
                                <FormInput
                                    type="password"
                                    label="Password"
                                    register={loginForm.register("password")}
                                />
                                {loginForm.formState.errors.password?.message && (
                                    <FormError error={loginForm.formState.errors.password.message} />
                                )}
                                <Link
                                    href="/forgot-password"
                                    className="self-start text-sm font-bold text-blue-500 mb-2 underline"
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
                            <p className="text-gray-500 text-center mt-5 text-sm">
                                Don&apos;t have an account?{" "}
                                <Link href="/register" className="font-bold text-blue-500 underline">
                                    Sign up
                                </Link>
                            </p>
                        </>
                    ) : (
                        <div className="flex justify-center items-center">
                            <span className="text-red-600">An error occurred</span>
                        </div>
                    )}

                </div>
            </div>
        </main>
    )
}