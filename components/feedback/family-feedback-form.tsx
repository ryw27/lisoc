"use client";
import { z } from "zod/v4";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useState } from "react";
import { useForm, UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import SubmitFeedback from "@/lib/family/actions/submitFeedback";
import { feedbackSchema } from "@/lib/family/validation";
import Link from "next/link";

function FormField({
    name,
    label,
    register,
    type = 'text',
    defaultValue,
    asTextarea,
    required,
    errors,
}: {
    name: keyof z.infer<typeof feedbackSchema>;
    label: string;
    register: UseFormRegister<z.infer<typeof feedbackSchema>>
    type?: string;
    defaultValue?: string
    asTextarea?: boolean;
    required?: boolean;
    errors?: string[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="font-medium">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      {asTextarea ? (
        <Textarea id={name} required={required} rows={6} defaultValue={defaultValue} {...register(name)}/>
      ) : (
        <Input id={name} type={type} required={required} defaultValue={defaultValue} {...register(name)} />
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
    }
    familyid: number;
}

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
        mode: "onBlur"
    })


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
                    feedbackForm.setError(e.path as unknown as keyof z.infer<typeof feedbackSchema>, { message: e.message});
                })
            } else {
                setFormError("Unexpected error. Please try again later");
            }
        }
    }

    console.log(feedbackForm.getValues());
    return (
        <div>
            {!submitted ? (
                <div className="flex flex-col w-full max-w-5xl mx-auto px-4 py-8 gap-2">
                    <h1 className="font-bold text-2xl">意见和求助</h1>
                    <h1 className="font-bold text-2xl">Comment and Questions</h1>
                    <div className="flex flex-col text-base text-gray-700 mb-4 gap-2">
                        <p className="leading-relaxed whitespace-pre-line">
                            欢迎您使用长岛华夏中文学校的在线学生注册系统。目前本系统还在不断改进完善之中，希望能得到您的理解、支持并提出宝贵意见和建议。
                            如您觉得使用系统时有费用计算或其他问题，请与教务处或网站管理员联系，我们会帮您核对费用和更正错漏。
                            您在使用本系统时若碰到困难或问题，也可在这里请求协助，我们会尽快与您联系。
                            您也可在工作日的晚七时后或周末致电 <span className="font-semibold text-blue-700">516-860-2583</span> 寻求帮助。谢谢您的支持！
                        </p>
                        <p className="leading-relaxed whitespace-pre-line">
                            Thank you for using Long Island School of Chinese online registration system. If you have any difficulties or questions using the system, or any comments and feedback, please send your message here. We will reply to you as soon as possible.
                            You can also call us at <span className="font-semibold text-blue-700">516-860-2583</span> after 7 PM on weekdays or anytime on the weekend. Thank you for your support.
                        </p>
                    </div>
                    <form onSubmit={feedbackForm.handleSubmit(onSubmit)}>
                        <FormField
                            label="Your Name"
                            name="name"
                            defaultValue={defaults.name}
                            required
                            register={feedbackForm.register}
                            errors={
                                feedbackForm.formState.errors?.name
                                    ? [feedbackForm.formState.errors.name?.message ?? "Invalid name"]
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
                                    ? [feedbackForm.formState.errors.phone?.message ?? "Invalid phone"]
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
                                    ? [feedbackForm.formState.errors.email?.message ?? "Invalid email"]
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
                                    ? [feedbackForm.formState.errors.subject?.message ?? "Invalid subject"]
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
                                    ? [feedbackForm.formState.errors.comment?.message ?? "Invalid message"]
                                    : undefined
                            }
                        />
                        {formError && (
                            <p className="text-sm text-red-600">{formError}</p>
                        )}
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                type="submit"
                                disabled={busy}
                                className={`min-w-10 rounded-md font-bold p-2 border-2 ${
                                    busy
                                        ? "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed"
                                        : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 transition-colors cursor-pointer"
                                }`}
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="flex w-full min-h-[300px] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <span className="text-center">
                            Thank you for your feedback! We will get back to you as soon as possible.
                            <br />
                            感谢您的反馈。我们会尽快回复您
                        </span>
                        <Link
                            href="/dashboard"
                            className="text-blue-600 underline"
                        >
                            Go home
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}