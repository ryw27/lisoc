"use client";
import { FcGoogle } from "react-icons/fc";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Logo from "./logo";
import React, { useState, useTransition } from "react";
import { authMSG } from "@/app/lib/auth-lib/auth-actions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { credSchema, codeSchema, emailSchema } from "@/app/lib/auth-lib/auth-schema";

type regParams = {
    register: (userUserName: string, userEmail: string, userPassword: string) => Promise<authMSG>;
    requestCode: (formData: FormData) => Promise<authMSG>;
    checkCode: (formData: FormData, email: string) => Promise<authMSG>;
    familyForm: React.ReactNode;
}

type userInfo = { // Don't store password in state
    username: string | undefined;
    email: string | undefined;
}

type Step = "EMAIL" | "CODE" | "CREDENTIALS" | "PROFILE" | "DONE";

function FormInput({ label, type, extras, register }: { label: string; type: string; extras?: any; register?: any }) {
    const fieldName = label.toLowerCase().replace(/\s+/g, '');
    return (
    <>
        <label className="block text-sm text-gray-400 font-bold mb-2">{label}</label>
        <Input
            type={type}
            name={fieldName}
            placeholder={`Enter your ${label.toLowerCase()}`}
            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
            required
            aria-required
            {...register?.(fieldName)}
            {...extras}
        /> 
    </>
    )
}

function FormError({error}: { error: any}) {
    return (
        <p className="text-sm text-red-600">{error}</p>
    )
}

function FormSubmit({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
    return (
        <button type="submit" disabled={disabled} className="text-white rounded-sm bg-blue-600 cursor-pointer text-lg font-bold py-2 px-4 disabled:opacity-50">
            {children}
        </button> 
    )
}

export default function RegisterForm({
    register,
    requestCode,
    checkCode,
    familyForm
}: regParams) {
    const [credentials, setCredentials] = useState<userInfo | null>(null);
    const [step, setStep] = useState<Step>("EMAIL");

    const [error, setError] = useState<string>("");
    const [pending, startTransition] = useTransition();

    const emailForm = useForm({
        mode: "onChange",
        resolver: zodResolver(emailSchema)
    })

    const onEmail = async (data: any) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('email', data.email);
            const res = await requestCode(formData);
            if (!res.ok) return emailForm.setError("email",{ message: res.msg });
            setCredentials({ email: data.email, username: undefined });
            setStep("CODE");
        })
    }

    const codeForm = useForm({
        resolver: zodResolver(codeSchema),
        mode: "onChange"
    })

    const onCode = async (data: any) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('code', data.code);
            const codeCheck = await checkCode(formData, credentials!.email as string);
            if (!codeCheck.ok) return codeForm.setError("code", { message: codeCheck.msg });
            setStep("CREDENTIALS");
        })
    }
    
    const credForm = useForm({
        resolver: zodResolver(credSchema),
        mode: "onChange"
    })

    const onCred = async (data: any) => {
        startTransition(async () => {
            const credCheck = await register(data.username, credentials!.email as string, data.password);
            if (!credCheck.ok) return credForm.setError("root", { message: credCheck.msg });
            setCredentials({ email: credentials!.email, username: data.username });
            setStep("PROFILE");
        })
    }

    return (
        <main className="flex flex-col h-screen w-screen items-center justify-center bg-background">
            <Logo/>

            <h1 className="text-2xl font-bold mb-10 mt-10 text-left">Create an account</h1>

            {step === "EMAIL" && (
                <>
                    <Button variant="outline" className="rounded-sm bg-white! text-lg font-medium text-black border-gray-300 w-1/5 py-5">
                        <FcGoogle className="w-5 h-5 mr-2" />
                        Continue with Google
                        <p className="text-[8px]">Not implemented yet</p>
                    </Button>
                    <div className="flex w-1/5 items-center gap-4 my-8">
                        <div className="bg-gray-200 w-1/2 h-px"></div>
                        <span className="text-sm text-gray-500 flex items-center">OR</span>
                        <div className="bg-gray-200 w-1/2 h-px"></div>
                    </div>
                </>
            )}

            {step === "EMAIL" && (
                <form onSubmit={emailForm.handleSubmit(onEmail)} className="flex flex-col bg-white p-2 w-1/5 space-y-4">
                    <h1 className="flex justify-center items-center font-bold mb-4">Step 1/4 - Email</h1>
                    <FormInput 
                        label="Email"
                        type="text"
                        register={emailForm.register}
                    />
                    <FormError
                        error={emailForm.formState.errors.email?.message}
                    />
                    <FormSubmit disabled={pending}>Continue</FormSubmit>
                </form>
            )}

            {step === "CODE" && (
                <form onSubmit={codeForm.handleSubmit(onCode)} className="flex flex-col bg-white p-2 w-1/5 space-y-4">
                    <h1 className="flex justify-center items-center font-bold mb-4">Step 2/4 - Verification Code</h1>
                    <FormInput 
                        label="Code"
                        type="number"
                        register={codeForm.register}
                    />
                    <FormError
                        error={codeForm.formState.errors.code?.message}
                    />
                    <FormSubmit disabled={pending}>Continue</FormSubmit>
                </form>
            )}

            {step === "CREDENTIALS" && (
                <form onSubmit={credForm.handleSubmit(onCred)} className="flex flex-col bg-white p-2 w-1/5 space-y-4">
                    <h1 className="flex justify-center items-center font-bold mb-4">Step 3/4 - Account Details</h1>
                    <FormInput 
                        label="Username"
                        type="text"
                        register={credForm.register}
                    />
                    <FormError
                        error={credForm.formState.errors.username?.message}
                    />
                    <FormInput 
                        label="Password"
                        type="password"
                        register={credForm.register}
                    />
                    <FormError
                        error={credForm.formState.errors.password?.message}
                    />
                    <FormError
                        error={credForm.formState.errors.root?.message}
                    />
                    <FormSubmit>Continue</FormSubmit>
                </form>
            )}

            {step === "PROFILE" && (
                <div className="flex flex-col bg-white p-2 w-1/5 space-y-4">
                    <h1 className="flex justify-center items-center font-bold mb-4">Step 4/4 - Profile Setup</h1>
                    {familyForm}
                </div>
            )}
        </main>
    )
}