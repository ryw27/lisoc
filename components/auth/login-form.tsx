"use client";
import Link from 'next/link';
import Logo from '@/components/logo';
import { FcGoogle } from "react-icons/fc";
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FormInput, FormSubmit, FormError } from './form-components'
import { z } from 'zod';
import { emailSchema, loginSchema, usernameSchema } from '@/lib/auth/validation';
import { signIn } from "next-auth/react"
import { CredentialsSignin } from 'next-auth';


type LoginFormProps = {
    isAdminForm: boolean;
    isTeacherForm: boolean;
}

export default function LoginForm({ isAdminForm, isTeacherForm }: LoginFormProps) {
    const [busy, setBusy] = useState(false);

    const loginForm = useForm({
        mode: "onChange",
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: z.infer<typeof loginSchema>) => {
        // Set busy and reset the error message
        setBusy(true);
        loginForm.setError("root", { message: undefined });
        try {
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
                redirectTo: redirectURL
            } : 
            {
                username: data.emailUsername,
                password: data.password,
                redirectTo: redirectURL
            }

            await signIn(provider, credSubmitObj);

        } catch (error) {
            const errorMSG = error instanceof CredentialsSignin 
                ? "Invalid credentials"
                : error instanceof Error
                    ? error.message
                    : "An unexpected error occured. Please try again"
            loginForm.setError("root", { message: errorMSG });
            setBusy(false);
        } 
    };


    return (
        <main className="flex flex-col h-screen w-screen items-center justify-center bg-background">
            <Logo/>

            <h1 className="text-2xl font-bold mb-10 mt-10 text-left">Log in to your account {isAdminForm ? "(Admin)" : isTeacherForm ? "(Teacher)" : ""} </h1>
            

            <button title="Not implemented yet" className="flex justify-center items-center rounded-sm text-lg font-medium text-black border-2 border-gray-200 w-1/5 py-2 px-1">
                <FcGoogle className="w-5 h-5 mr-2" />
                Continue with Google
                <p className="text-[8px]"> Not implemented yet</p>
            </button>
            <div className="flex w-1/5 items-center gap-4 my-8">
                <div className="bg-gray-200 w-1/2 h-px"></div>
                <span className="text-sm text-gray-500 flex items-center">OR</span>
                <div className="bg-gray-200 w-1/2 h-px"></div>
            </div>
            <form onSubmit={loginForm.handleSubmit(onSubmit)} className="flex flex-col bg-white p-2 w-1/5">
                <FormInput
                    type="text" 
                    label="Email or Username" 
                    register={loginForm.register("emailUsername")}
                />
                <FormInput
                    type="password" 
                    label="Password" 
                    register={loginForm.register("password")}
                />
                {/* Forgot Password button */}
                <Link href="/forgot-password" className="self-start text-sm font-bold text-blue-500 mb-2 underline">Forgot password?</Link>
                {/* Submit Button*/}
                <FormSubmit
                    disabled={busy}
                >
                    {busy ? "Loading..." : "Continue"}
                </FormSubmit>
                {loginForm.formState.errors.root && <FormError error={loginForm.formState.errors.root.message} />}
            </form>
            <p className="text-gray-500 text-center mt-5 text-sm">
                Don&apos;t have an account? <Link href="/register" className="font-bold text-blue-500 underline">Sign up</Link>
            </p>
            <p className="text-gray-500 text-center mt-5 text-sm">
                Login for admin <Link href="/login/admin" className="font-bold text-blue-500 underline">Link</Link>
            </p>
        </main>
    )
}