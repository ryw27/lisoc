"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormRegister } from "react-hook-form";
import { z } from "zod/v4";
import { SubmitFeedback } from "@/server/familymanagement/actions";
import { feedbackSchema } from "@/server/familymanagement/validation";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

function FormField({
    name,
    label,
    register,
    type = "text",
    defaultValue,
    asTextarea,
    required,
    errors,
}: {
    name: keyof z.infer<typeof feedbackSchema>;
    label: string;
    register: UseFormRegister<z.infer<typeof feedbackSchema>>;
    type?: string;
    defaultValue?: string;
    asTextarea?: boolean;
    required?: boolean;
    errors?: string[];
}) {
    const inputClasses =
        "bg-card text-foreground border-input rounded-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:border-accent placeholder:text-muted-foreground";
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={name} className="font-medium">
                {label}
                {required && <span className="ml-0.5 text-red-600">*</span>}
            </label>
            {asTextarea ? (
                <Textarea
                    id={name}
                    required={required}
                    rows={6}
                    defaultValue={defaultValue}
                    {...register(name)}
                    className={inputClasses}
                />
            ) : (
                <Input
                    id={name}
                    type={type}
                    required={required}
                    defaultValue={defaultValue}
                    {...register(name)}
                    className={inputClasses}
                />
            )}
            {errors && (
                <ul className="text-sm text-red-600">
                    {errors.map((e) => (
                        <li key={e}>{e}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}

type familyFeedbackFormProps = {
    defaults: {
        name: string;
        phone: string;
        email: string;
        subject: string;
    };
    familyid: number;
};

export default function FamilyFeedbackForm({ defaults, familyid }: familyFeedbackFormProps) {
    const [formError, setFormError] = useState<string>("");
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [busy, setBusy] = useState<boolean>(false);

    const feedbackForm = useForm({
        resolver: zodResolver(feedbackSchema),
        defaultValues: {
            name: defaults.name,
            phone: defaults.phone,
            email: defaults.email,
            subject: defaults.subject,
            comment: "",
        },
        mode: "onBlur",
    });

    const onSubmit = async (data: z.infer<typeof feedbackSchema>) => {
        setBusy(true);
        try {
            await SubmitFeedback(data, familyid);
            setSubmitted(true);
            setBusy(false);
        } catch (error) {
            setBusy(false);
            if (error instanceof z.ZodError) {
                error.issues.forEach((e) => {
                    feedbackForm.setError(
                        e.path as unknown as keyof z.infer<typeof feedbackSchema>,
                        { message: e.message }
                    );
                });
            } else {
                setFormError("Unexpected error. Please try again later");
            }
        }
    };

    // console.log(feedbackForm.getValues());
    return (
        <div className="min-h-screen">
            {!submitted ? (
                <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-12">
                    {/* Header Section */}
                    <div className="border-border flex flex-col gap-1 border-b pb-4">
                        <h1 className="text-primary text-3xl font-bold">意见和求助</h1>
                        {/* Secondary (Brass) used for the sub-header to look like a ledger entry */}
                        <h1 className="text-secondary text-sm font-bold tracking-widest uppercase">
                            Comment and Questions
                        </h1>
                    </div>
                    {/* Info Text */}
                    <div className="text-foreground/90 flex flex-col gap-2 text-base leading-7">
                        <p className="whitespace-pre-line">
                            欢迎您使用长岛华夏中文学校的在线学生注册系统。目前本系统还在不断改进完善之中，希望能得到您的理解、支持并提出宝贵意见和建议。
                            如您觉得使用系统时有费用计算或其他问题，请与教务处或网站管理员联系，我们会帮您核对费用和更正错漏。
                            您在使用本系统时若碰到困难或问题，也可在这里请求协助，我们会尽快与您联系。
                            您也可在工作日的晚七时后或周末致电{" "}
                            <span className="text-accent font-bold">516-860-2583</span>{" "}
                            寻求帮助。谢谢您的支持！
                        </p>
                        <p className="whitespace-pre-line">
                            Thank you for using Long Island School of Chinese online registration
                            system. If you have any difficulties or questions using the system, or
                            any comments and feedback, please send your message here. We will reply
                            to you as soon as possible. You can also call us at{" "}
                            <span className="text-accent font-bold">516-860-2583</span> after 7 PM
                            on weekdays or anytime on the weekend. Thank you for your support.
                        </p>
                    </div>
                    {/* Form Section */}
                    <form
                        onSubmit={feedbackForm.handleSubmit(onSubmit)}
                        className="flex flex-col gap-4 pt-2"
                    >
                        <FormField
                            label="Your Name"
                            name="name"
                            defaultValue={defaults.name}
                            required
                            register={feedbackForm.register}
                            errors={
                                feedbackForm.formState.errors?.name
                                    ? [
                                          feedbackForm.formState.errors.name?.message ??
                                              "Invalid name",
                                      ]
                                    : undefined
                            }
                        />
                        <FormField
                            label="Phone"
                            name="phone"
                            defaultValue={defaults.phone}
                            register={feedbackForm.register}
                            errors={
                                feedbackForm.formState.errors?.phone
                                    ? [
                                          feedbackForm.formState.errors.phone?.message ??
                                              "Invalid phone",
                                      ]
                                    : undefined
                            }
                        />
                        <FormField
                            label="Email"
                            name="email"
                            type="email"
                            defaultValue={defaults.email}
                            register={feedbackForm.register}
                            required
                            errors={
                                feedbackForm.formState.errors?.email
                                    ? [
                                          feedbackForm.formState.errors.email?.message ??
                                              "Invalid email",
                                      ]
                                    : undefined
                            }
                        />
                        <FormField
                            label="Subject"
                            name="subject"
                            defaultValue="Comment and Feedback"
                            required
                            register={feedbackForm.register}
                            errors={
                                feedbackForm.formState.errors?.subject
                                    ? [
                                          feedbackForm.formState.errors.subject?.message ??
                                              "Invalid subject",
                                      ]
                                    : undefined
                            }
                        />
                        <FormField
                            label="Your Comment or Questions"
                            name="comment"
                            register={feedbackForm.register}
                            asTextarea
                            required
                            errors={
                                feedbackForm.formState.errors?.comment
                                    ? [
                                          feedbackForm.formState.errors.comment?.message ??
                                              "Invalid message",
                                      ]
                                    : undefined
                            }
                        />

                        {formError && (
                            <p className="text-destructive text-sm font-medium">{formError}</p>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={busy}
                                // Primary Navy Background -> Gold Accent Hover
                                className={`min-w-[120px] rounded-sm px-6 py-2.5 text-sm font-bold tracking-wide transition-all duration-200 ${
                                    busy
                                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                                        : "bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground shadow-sm"
                                }`}
                            >
                                {busy ? "SUBMITTING..." : "SUBMIT"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                /* Success State */
                <div className="bg-background flex min-h-[50vh] w-full items-center justify-center">
                    <div className="flex max-w-md flex-col items-center gap-6 text-center">
                        {/* Checkmark using Accent color */}
                        <div className="bg-accent/10 text-accent flex h-12 w-12 items-center justify-center rounded-full">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                                stroke="currentColor"
                                className="h-6 w-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.5 12.75l6 6 9-13.5"
                                />
                            </svg>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-primary text-xl font-bold">Feedback Received</h3>
                            <p className="text-muted-foreground">
                                Thank you for your feedback! We will get back to you as soon as
                                possible.
                                <br />
                                <span className="text-sm opacity-80">
                                    感谢您的反馈。我们会尽快回复您
                                </span>
                            </p>
                        </div>

                        <Link
                            href="/dashboard"
                            className="text-primary decoration-accent hover:bg-muted text-sm font-bold underline decoration-2 underline-offset-4"
                        >
                            Return Home
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
