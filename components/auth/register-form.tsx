"use client";

//import { FcGoogle } from "react-icons/fc";
//import { Button } from "@/components/ui/button";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { cn } from "@/lib/utils";
import {
    checkRegCode,
    registerDraftFamily,
    requestRegCode,
    resendCode,
} from "@/server/auth/familyreg.actions";
import { codeSchema, emailSchema, userPassSchema } from "@/server/auth/schema";
// import TeacherForm from "./LEGACY_teacher-form";
import Logo from "@/components/logo";
import FamilyForm from "./family-form";
import { FormError, FormInput, FormSubmit } from "./form-components";
import ResendCodeButton from "./resend-code-button";

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
};

type Step = "EMAIL" | "CODE" | "CREDENTIALS" | "PROFILE" | "DONE";

type userInfo = {
    username: string;
    email: string;
};

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
        return inCredentials ? inCredentials : null;
    });
    const [step, setStep] = useState<Step>(() => {
        return inStep ? inStep : "EMAIL";
    });

    const [busy, setBusy] = useState(false);

    // -----------------------------------------------------------
    // 1. Email step
    // -----------------------------------------------------------

    const emailForm = useForm({
        mode: "onBlur",
        resolver: zodResolver(emailSchema),
    });

    const onEmail = async (data: z.infer<typeof emailSchema>) => {
        setBusy(true);

        try {
            await requestRegCode(data);
            setCredentials({ email: data.email, username: "" });
            setStep("CODE");
        } catch (error) {
            emailForm.setError("email", {
                message:
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred. Please try again.",
            });
        } finally {
            setBusy(false);
        }
    };

    // -----------------------------------------------------------
    // 2. Code step
    // -----------------------------------------------------------

    const codeForm = useForm({
        resolver: zodResolver(codeSchema),
        mode: "onBlur",
    });

    const onCode = async (data: z.infer<typeof codeSchema>) => {
        setBusy(true);
        try {
            await checkRegCode(data, credentials!.email as string);
            setStep("CREDENTIALS");
        } catch (error) {
            codeForm.setError("code", {
                message:
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred. Please try again.",
            });
        } finally {
            setBusy(false);
        }
    };

    // -----------------------------------------------------------
    // 3. Credentials step
    // -----------------------------------------------------------

    const credForm = useForm({
        resolver: zodResolver(userPassSchema),
        //        mode: "onChange"
        mode: "onBlur",
    });

    const onCred = async (data: z.infer<typeof userPassSchema>) => {
        setBusy(true);
        try {
            const result = userPassSchema.safeParse(data);

            if (!result.success) {
                throw new Error("Please Check input");
            }

            await registerDraftFamily(data, credentials!.email as string);
            setCredentials({ email: credentials!.email, username: data.username });
            setStep("PROFILE");
        } catch (error) {
            credForm.setError("root", {
                message:
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred. Please try again.",
            });
        } finally {
            setBusy(false);
        }
    };

    const steps = [
        { id: "EMAIL", number: 1, label: "Email" },
        { id: "CODE", number: 2, label: "Verify" },
        { id: "CREDENTIALS", number: 3, label: "Setup" },
        { id: "PROFILE", number: 4, label: "Profile" },
    ];

    // Calculate progress for the stepper
    const currentStepIndex = steps.findIndex((s) => s.id === step);

    return (
        <main className="bg-background flex min-h-screen w-full flex-col items-center justify-center p-4">
            <div className="mb-8 ml-12">
                <Logo />
            </div>

            {/* Container */}
            <div
                className={cn(
                    "relative flex flex-col bg-white shadow-lg transition-all duration-300",
                    "border-primary border-t-4", // The "Ledger" Navy Top Border
                    step === "PROFILE" ? "w-full max-w-2xl" : "w-full max-w-md" // Dynamic width based on step content
                )}
            >
                <div className="border-b border-gray-100 p-8 pb-6">
                    <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
                        Create Account (建立账号)
                    </h1>

                    <div className="relative flex items-center justify-between">
                        {/* Background Connecting Line */}
                        <div className="absolute top-4 left-0 -z-10 h-[2px] w-full -translate-y-1/2 bg-gray-200"></div>

                        {/* Active Progress Line */}
                        <div
                            className="bg-primary absolute top-4 left-0 -z-10 h-[2px] -translate-y-1/2 transition-all duration-300"
                            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                        ></div>

                        {steps.map((s, i) => {
                            const isActive = i === currentStepIndex;
                            const isCompleted = i < currentStepIndex;

                            return (
                                <div key={s.id} className="flex flex-col items-center">
                                    <div
                                        className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                                            isActive
                                                ? "border-primary bg-primary text-white"
                                                : isCompleted
                                                  ? "border-primary bg-primary text-white"
                                                  : "border-gray-300 bg-white text-gray-400"
                                        )}
                                    >
                                        {isCompleted ? <Check size={14} /> : s.number}
                                    </div>
                                    {/* Step Labels */}
                                    <span
                                        className={cn(
                                            "mt-1 text-xs font-medium tracking-wide uppercase",
                                            isActive ? "text-primary font-bold" : "text-gray-500"
                                        )}
                                    >
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Content Section */}
                <div className="p-8 pt-6">
                    {step === "EMAIL" && (
                        <form
                            onSubmit={emailForm.handleSubmit(onEmail)}
                            className="flex flex-col space-y-5"
                        >
                            <div className="space-y-1 text-center">
                                <h2 className="font-bold text-gray-900">
                                    Step 1: Email Verification
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <FormInput
                                    label="Email (邮箱)"
                                    type="text"
                                    register={emailForm.register("email")}
                                />
                                <FormError error={emailForm.formState.errors.email?.message} />
                            </div>

                            <FormSubmit
                                disabled={busy}
                                className="bg-primary hover:bg-primary/90 w-full rounded-sm py-3 font-bold tracking-wider text-white uppercase"
                            >
                                Continue (下一步)
                            </FormSubmit>
                        </form>
                    )}

                    {step === "CODE" && (
                        <form
                            onSubmit={codeForm.handleSubmit(onCode)}
                            className="flex flex-col space-y-5"
                        >
                            <div className="space-y-1 text-center">
                                <h2 className="font-bold text-gray-900">Step 2: Enter Code</h2>
                                <p className="text-sm text-gray-500">
                                    Sent to {credentials?.email}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <FormInput
                                    label="Verification Code (验证码)"
                                    type="number"
                                    register={codeForm.register("code")}
                                />
                                <FormError error={codeForm.formState.errors.code?.message} />
                            </div>

                            <FormSubmit
                                disabled={busy}
                                className="bg-primary hover:bg-primary/90 w-full rounded-sm py-3 font-bold tracking-wider text-white uppercase"
                            >
                                Continue (下一步)
                            </FormSubmit>

                            <div className="text-center">
                                <ResendCodeButton
                                    resendCode={resendCode}
                                    email={credentials!.email!}
                                />
                            </div>
                        </form>
                    )}

                    {step === "CREDENTIALS" && (
                        <form
                            onSubmit={credForm.handleSubmit(onCred)}
                            className="flex flex-col space-y-5"
                        >
                            <div className="space-y-1 text-center">
                                <h2 className="font-bold text-gray-900">Step 3: Account Details</h2>
                            </div>

                            <div className="space-y-4">
                                <FormInput
                                    label="Username (用户名)"
                                    type="text"
                                    extras={{ value: credentials?.email }}
                                    register={credForm.register("username")}
                                />
                                <FormError error={credForm.formState.errors.username?.message} />

                                <FormInput
                                    label="Password (密码)"
                                    type="password"
                                    register={credForm.register("password")}
                                />
                                <FormError error={credForm.formState.errors.password?.message} />

                                <FormInput
                                    label="Confirm Password (确认密码)"
                                    type="password"
                                    register={credForm.register("confirmPassword")}
                                />
                                <FormError
                                    error={credForm.formState.errors.confirmPassword?.message}
                                />
                            </div>

                            <FormError error={credForm.formState.errors.root?.message} />

                            <FormSubmit
                                disabled={busy}
                                className="bg-primary hover:bg-primary/90 w-full rounded-sm py-3 font-bold tracking-wider text-white uppercase"
                            >
                                Continue (下一步)
                            </FormSubmit>
                        </form>
                    )}

                    {step === "PROFILE" && (
                        <div className="flex flex-col space-y-5">
                            <div className="space-y-1 text-center">
                                <h2 className="font-bold text-gray-900">Step 4: Profile Setup</h2>
                            </div>

                            <FamilyForm registerData={credentials!} />
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
