"use client";

import { useState } from "react";
import { updateTeacher } from "@/app/teacher/updateTeacher/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { teacherUpdateSchema } from "@/server/auth/schema";
import { FormError, FormInput, FormSubmit } from "../auth/form-components";

export default function UpdateTeacherForm({
    inteacher,
    userid,
}: {
    inteacher: z.infer<typeof teacherUpdateSchema>;
    userid: string;
}) {
    const [error, setError] = useState<string | null>(null);

    const initialData = {
        namelasten: inteacher.namelasten ?? "",
        namefirsten: inteacher.namefirsten ?? "",
        namecn: inteacher.namecn ?? "",
        address: inteacher.address ?? "",
        phone: inteacher.phone ?? "",
        email: inteacher.email ?? "",
    };

    //const initialDataRef = useRef(initialData);

    const teacherForm = useForm<z.infer<typeof teacherUpdateSchema>>({
        resolver: zodResolver(teacherUpdateSchema),
        mode: "all",
        defaultValues: initialData,
    });

    const onSubmit = async (data: z.infer<typeof teacherUpdateSchema>) => {
        try {
            const teacherData = teacherUpdateSchema.parse(data);
            const hasChanged = true;
            /*                teacherData.address != initialDataRef.current.address ||
                teacherData.namecn != initialDataRef.current.namecn ||
                teacherData.namefirsten != initialDataRef.current.namefirsten ||
                teacherData.namelasten != initialDataRef.current.namelasten ||
                teacherData.phone != initialDataRef.current.phone ||
                teacherData.email != initialDataRef.current.email; */
            //

            if (hasChanged) {
                console.log("Form Submitting with Changes");
                await updateTeacher(teacherData, userid);
                window.location.reload();
            } else {
                console.log("nothing changed");
            }
            // Redirect or show success message
        } catch (error) {
            if (error instanceof z.ZodError) {
                error.issues.map((e) => {
                    teacherForm.setError(
                        e.path as unknown as keyof z.infer<typeof teacherUpdateSchema>,
                        {
                            message: e.message,
                        }
                    );
                });
            } else if (typeof error === "string") {
                setError(error);
            } else {
                setError("Unknown error occured. Please try again or contact regadmin");
            }
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-300">
            <form
                onSubmit={teacherForm.handleSubmit(onSubmit)}
                className="flex w-full max-w-2xl flex-col space-y-4 rounded-xl bg-white p-8 shadow-md"
            >
                <FormInput
                    label="Email"
                    type="text"
                    required={true}
                    register={teacherForm.register("email")}
                />
                <div>Your email account is set as your login 你的电邮是你的登录账号</div>
                <div></div>
                {teacherForm.formState.errors.email?.message && (
                    <FormError error={teacherForm.formState.errors.email.message} />
                )}
                <div className="flex w-full gap-2">
                    <FormInput
                        label="First Name（英文名）"
                        type="text"
                        register={teacherForm.register("namefirsten")}
                    />
                    {teacherForm.formState.errors.namefirsten?.message && (
                        <FormError error={teacherForm.formState.errors.namefirsten.message} />
                    )}
                    <FormInput
                        label="Last Name（英文姓）"
                        type="text"
                        register={teacherForm.register("namelasten")}
                    />
                    {teacherForm.formState.errors.namelasten?.message && (
                        <FormError error={teacherForm.formState.errors.namelasten.message} />
                    )}

                    <FormInput
                        label="（中文名）"
                        type="text"
                        register={teacherForm.register("namecn")}
                    />
                    {teacherForm.formState.errors.namecn?.message && (
                        <FormError error={teacherForm.formState.errors.namecn.message} />
                    )}
                </div>

                <FormInput
                    label="Address（地址）"
                    required={false}
                    type="text"
                    register={teacherForm.register("address")}
                />
                {teacherForm.formState.errors.address?.message && (
                    <FormError error={teacherForm.formState.errors.address.message} />
                )}
                <div className="flex w-full gap-2">
                    <div className="flex w-1/2 flex-col">
                        <FormInput
                            label="Phone Number（联系电话）"
                            required={true}
                            type="tel"
                            register={teacherForm.register("phone")}
                        />
                        {teacherForm.formState.errors.phone?.message && (
                            <FormError error={teacherForm.formState.errors.phone.message} />
                        )}
                    </div>
                </div>
                <FormError error={error} />
                <FormSubmit
                    disabled={teacherForm.formState.isSubmitting || !teacherForm.formState.isValid}
                >
                    {teacherForm.formState.isSubmitting ? "Updating..." : "Update (更新)"}
                </FormSubmit>
            </form>
        </div>
    );
}
