"use client";
//import { FcGoogle } from "react-icons/fc";
//import { Button } from "@/components/ui/button";
import { FormSubmit, FormInput, FormError } from "./form-components"
import Logo from "@/components/logo";
import { useState } from "react";
import ResendCodeButton from './resend-code-button'
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { codeSchema, emailSchema, userPassSchema } from "@/lib/auth/validation";
import { z } from "zod/v4";
import FamilyForm from "./family-form";
// import TeacherForm from "./LEGACY_teacher-form";
import { requestRegCode } from "@/lib/auth";
import { resendCode } from "@/lib/auth";
import { checkRegCode } from "@/lib/auth";
import { registerDraftFamily } from "@/lib/auth";
//import { not } from "drizzle-orm";

type regParams = {
    // requestCode: (data: z.infer<typeof emailSchema>) => Promise<void>; // Email to Code, get the code once email is inputted
    // resendCode: (data: z.infer<typeof emailSchema>) => Promise<void>; // Resend code if needed
    // checkCode: (data: z.infer<typeof codeSchema>, email: string) => Promise<void>; // Check the inputted code once submitted, go to credentials
    // registerDraft: (data: z.infer<typeof userPassSchema>, email: string) => Promise<void>; // Get credentials, put in registration draft
    // isTeacher: boolean;
    inCredentials?: userInfo;
    inStep?: Step;
    // Pass down to the additional and contact information form, official registration into the system
    // fullRegister: (data: z.infer<typeof familySchema> | z.infer<typeof teacherSchema>, regData: z.infer<typeof nameEmailSchema>, isTeacher: boolean) => Promise<void>;
}

type Step = "EMAIL" | "CODE" | "CREDENTIALS" | "PROFILE" | "DONE";

type userInfo = {
    username: string;
    email: string;
}

export default function RegisterForm({
    // requestCode,
    // resendCode,
    // checkCode,
    // registerDraft,
    // isTeacher,
    inCredentials,
    inStep,
    // fullRegister
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
        mode: "onBlur",
        resolver: zodResolver(emailSchema)
    })

    const onEmail = async (data: z.infer<typeof emailSchema>) => {
        setBusy(true);

        try {
            await requestRegCode(data);
            setCredentials({ email: data.email, username: "" });
            setStep("CODE");
        } catch (error) {
            emailForm.setError("email", { message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again." });
        } finally {
            setBusy(false);
        }

    }

    // -----------------------------------------------------------
    // 2. Code step
    // -----------------------------------------------------------

    const codeForm = useForm({
        resolver: zodResolver(codeSchema),
        mode: "onBlur"
    })

    const onCode = async (data: z.infer<typeof codeSchema>) => {
        setBusy(true);
        try {
            await checkRegCode(data, credentials!.email as string);
            setStep("CREDENTIALS");
        } catch (error) {
            codeForm.setError("code", { message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again." });
        } finally {
            setBusy(false);
        }

    }

    
    // -----------------------------------------------------------
    // 3. Credentials step
    // -----------------------------------------------------------

    const credForm = useForm({
        resolver: zodResolver(userPassSchema),
//        mode: "onChange"
        mode: "onBlur"
    })

    const onCred = async (data: z.infer<typeof userPassSchema>) => {
        setBusy(true);
        try {
            const result = userPassSchema.safeParse(data);
            
            if (!result.success)  {
                throw new Error("Please Check input");
            }
            
            await registerDraftFamily(data, credentials!.email as string);
            setCredentials({ email: credentials!.email, username: data.username });
            setStep("PROFILE");
        } catch (error) {
            credForm.setError("root", { message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again." });
        } finally {
            setBusy(false);
        }

    }

    return (
        <main className="flex flex-col h-screen w-screen items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-300">
            <Logo/>

            <h1 className="text-2xl font-bold mb-10 mt-10 text-left">Create account(建立账号)</h1>

            {step === "EMAIL" && (
                <>
                   {/*} <Button variant="outline" className="rounded-sm bg-white! text-lg font-medium text-black border-gray-300 w-1/5 py-5">
                        <FcGoogle className="w-5 h-5 mr-2" />
                        Continue with Google
                        <p className="text-[8px]">Not implemented yet</p>
                    </Button>
                    <div className="flex w-1/5 items-center gap-4 my-8">
                        <div className="bg-gray-200 w-1/2 h-px"></div>
                        <span className="text-sm text-gray-500 flex items-center">OR</span>
                        <div className="bg-gray-200 w-1/2 h-px"></div>
                    </div>*/}
                </>
            )}

            {step === "EMAIL" && (
                <form onSubmit={emailForm.handleSubmit(onEmail)} className="flex flex-col bg-white p-2 w-1/5">
                    <h1 className="flex justify-center items-center font-bold mb-4">Step 1/4 - Email（邮箱）</h1>
                    <FormInput 
                        label="Email（邮箱）"
                        type="text"
                        register={emailForm.register("email")}
                    />
                    <FormError
                        error={emailForm.formState.errors.email?.message}
                    />
                    <FormSubmit disabled={busy}>Continue（下一步）</FormSubmit>
                </form>
            )}

            {step === "CODE" && (
                <form onSubmit={codeForm.handleSubmit(onCode)} className="flex flex-col bg-white p-2 w-1/5">
                    <h1 className="flex justify-center items-center font-bold mb-4">Step 2/4 - Verification Code(验证码)</h1>
                    <FormInput 
                        label="Code（验证码）"
                        type="number"
                        register={codeForm.register("code")}
                    />
                    <FormError
                        error={codeForm.formState.errors.code?.message}
                    />
                    <FormSubmit disabled={busy}>Continue（下一步）</FormSubmit>
                    
                    <ResendCodeButton 
                        resendCode={resendCode}
                        // defaultCooldown={30}
                        email={credentials!.email!}
                    />
                </form>
            )}

            {step === "CREDENTIALS" && (
                <form onSubmit={credForm.handleSubmit(onCred)} className="flex flex-col bg-white p-2 w-1/5">
                    <h1 className="flex justify-center items-center font-bold mb-4">Step 3/4 - Account Details（设置）</h1>
                    <FormInput 
                        label="Username（用户名）"
                        type="text"
                        extras= {{'value': credentials?.email }}
                        register={credForm.register("username")}
                    />
                    <FormError
                        error={credForm.formState.errors.username?.message}
                    />
                    <FormInput 
                        label="Password（密码）"
                        type="password"
                        register={credForm.register("password")}
                    />
                    <FormError
                        error={credForm.formState.errors.password?.message}
                    />
                    <FormInput 
                        label="Confirm Password（确认密码）"
                        type="password"
                        register={credForm.register("confirmPassword")}
                    />
                    <FormError
                        error={credForm.formState.errors.confirmPassword?.message}
                    />

                    <FormError
                        error={credForm.formState.errors.root?.message}
                    />
                    <FormSubmit disabled={busy}>Continue（下一步）</FormSubmit>
                </form>
            )}

            {step === "PROFILE" && (
                <div className="flex flex-col bg-white p-2 w-1/3 space-y-4">
                    <h1 className="flex justify-center items-center font-bold mb-4">Step 4/4 - Profile Setup(填写家庭信息)</h1>
                    <FamilyForm registerData={credentials!} />
                    {/* // {isTeacher ? <TeacherForm registerData={credentials!} /> : <FamilyForm registerData={credentials!} />} */}
                </div>
            )}
        </main>
    )
}