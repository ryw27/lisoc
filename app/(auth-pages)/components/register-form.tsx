"use client";
import { FcGoogle } from "react-icons/fc";
import { Button } from "../../../components/ui/button";
import { FormSubmit, FormInput, FormError } from "./form-components"
import Logo from "@/components/logo";
import React, { useState } from "react";
import ResendCodeButton from './resend-code-button'
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { codeSchema, emailSchema, familySchema, nameEmailSchema, teacherSchema, userPassSchema } from "@/app/lib/auth-lib/auth-schema";
import { z } from "zod";
import FamilyForm from "./family-form";
import TeacherForm from "./teacher-form";

type regParams = {
    requestCode: (data: z.infer<typeof emailSchema>) => Promise<void>; // Email to Code, get the code once email is inputted
    resendCode: (data: z.infer<typeof emailSchema>) => Promise<void>; // Resend code if needed
    checkCode: (data: z.infer<typeof codeSchema>, email: string) => Promise<void>; // Check the inputted code once submitted, go to credentials
    registerDraft: (data: z.infer<typeof userPassSchema>, email: string) => Promise<void>; // Get credentials, put in registration draft
    isTeacher: boolean;
    inCredentials?: userInfo;
    inStep?: Step;
    // Pass down to the additional and contact information form, official registration into the system
    fullRegister: (data: z.infer<typeof familySchema> | z.infer<typeof teacherSchema>, regData: z.infer<typeof nameEmailSchema>, isTeacher: boolean) => Promise<void>;
}

type Step = "EMAIL" | "CODE" | "CREDENTIALS" | "PROFILE" | "DONE";

type userInfo = {
    username: string;
    email: string;
}

export default function RegisterForm({
    requestCode,
    resendCode,
    checkCode,
    registerDraft,
    isTeacher,
    inCredentials,
    inStep,
    fullRegister
}: regParams) {
    const [credentials, setCredentials] = useState<userInfo | null>(() => {
        return inCredentials ? inCredentials : null
    });
    const [step, setStep] = useState<Step>(() => {
        return inStep ? inStep : "EMAIL"
    });

    const [busy, setBusy] = useState(false);

    // -----------------------------------------------------------
    // 1. Email step
    // -----------------------------------------------------------

    const emailForm = useForm({
        mode: "onChange",
        resolver: zodResolver(emailSchema)
    })

    const onEmail = async (data: z.infer<typeof emailSchema>) => {
        setBusy(true);

        try {
            await requestCode(data);
        } catch (error) {
            emailForm.setError("email", { message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again." });
        } finally {
            setBusy(false);
        }

        setCredentials({ email: data.email, username: "" });
        setStep("CODE");
        setBusy(false);
    }

    // -----------------------------------------------------------
    // 2. Code step
    // -----------------------------------------------------------

    const codeForm = useForm({
        resolver: zodResolver(codeSchema),
        mode: "onChange"
    })

    const onCode = async (data: z.infer<typeof codeSchema>) => {
        setBusy(true);
        try {
            await checkCode(data, credentials!.email as string);
        } catch (error) {
            codeForm.setError("code", { message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again." });
        } finally {
            setBusy(false);
        }

        setStep("CREDENTIALS");
    }

    
    // -----------------------------------------------------------
    // 3. Credentials step
    // -----------------------------------------------------------

    const credForm = useForm({
        resolver: zodResolver(userPassSchema),
        mode: "onChange"
    })

    const onCred = async (data: z.infer<typeof userPassSchema>) => {
        setBusy(true);
        try {
            await registerDraft(data, credentials!.email as string);
        } catch (error) {
            credForm.setError("root", { message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again." });
        } finally {
            setBusy(false);
        }

        setCredentials({ email: credentials!.email, username: data.username });
        setStep("PROFILE");
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
                <form onSubmit={emailForm.handleSubmit(onEmail)} className="flex flex-col bg-white p-2 w-1/5">
                    <h1 className="flex justify-center items-center font-bold mb-4">Step 1/4 - Email</h1>
                    <FormInput 
                        label="Email"
                        type="text"
                        register={emailForm.register("email")}
                    />
                    <FormError
                        error={emailForm.formState.errors.email?.message}
                    />
                    <FormSubmit disabled={busy}>Continue</FormSubmit>
                </form>
            )}

            {step === "CODE" && (
                <form onSubmit={codeForm.handleSubmit(onCode)} className="flex flex-col bg-white p-2 w-1/5">
                    <h1 className="flex justify-center items-center font-bold mb-4">Step 2/4 - Verification Code</h1>
                    <FormInput 
                        label="Code"
                        type="number"
                        register={codeForm.register("code")}
                    />
                    <FormError
                        error={codeForm.formState.errors.code?.message}
                    />
                    <FormSubmit disabled={busy}>Continue</FormSubmit>
                    
                    <ResendCodeButton 
                        resendCode={resendCode}
                        defaultCooldown={30}
                        email={credentials!.email!}
                    />
                </form>
            )}

            {step === "CREDENTIALS" && (
                <form onSubmit={credForm.handleSubmit(onCred)} className="flex flex-col bg-white p-2 w-1/5">
                    <h1 className="flex justify-center items-center font-bold mb-4">Step 3/4 - Account Details</h1>
                    <FormInput 
                        label="Username"
                        type="text"
                        register={credForm.register("username")}
                    />
                    <FormError
                        error={credForm.formState.errors.username?.message}
                    />
                    <FormInput 
                        label="Password"
                        type="password"
                        register={credForm.register("password")}
                    />
                    <FormError
                        error={credForm.formState.errors.password?.message}
                    />
                    <FormError
                        error={credForm.formState.errors.root?.message}
                    />
                    <FormSubmit disabled={busy}>Continue</FormSubmit>
                </form>
            )}

            {step === "PROFILE" && (
                <div className="flex flex-col bg-white p-2 w-1/3 space-y-4">
                    <h1 className="flex justify-center items-center font-bold mb-4">Step 4/4 - Profile Setup</h1>
                    {isTeacher ? <TeacherForm registerData={credentials!} fullRegister={fullRegister} /> : <FamilyForm registerData={credentials!} fullRegister={fullRegister} />}
                </div>
            )}
        </main>
    )
}