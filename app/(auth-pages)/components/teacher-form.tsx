"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormInput, FormError, FormSubmit } from "./form-components";
import { nameEmailSchema, teacherSchema } from "@/app/lib/auth-lib/auth-schema";
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";
import { authMSG } from "@/app/lib/auth-lib/auth-actions";

export default function TeacherForm({
    fullRegister,
    registerData
}: {
    fullRegister: (data: FormData, regData: z.infer<typeof nameEmailSchema>, isTeacher: boolean) => Promise<authMSG>;
    registerData?: z.infer<typeof nameEmailSchema>;
}) {
    const form = useForm<z.infer<typeof teacherSchema>>({
        resolver: zodResolver(teacherSchema),
        mode: 'onChange'
    });

    const onSubmit = async (data: z.infer<typeof teacherSchema>) => {
        try {
            const formData = new FormData();
            Object.entries(data).forEach(([k, v]) => formData.set(k, v as string));
            const info = await fullRegister(formData, registerData!, true);
            if (!info.ok) {
                form.setError("root", { message: info.msg });
                return;
            }
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="text-2xl font-bold">Teacher Information</h2>
            <FormInput
                label="Teacher's Chinese Name"
                type="text"
                register={form.register('namecn')}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col w-full">
                    <FormInput
                        label="Teacher's First Name"
                        type="text"
                        register={form.register('firstnameen')}
                    />
                </div>
                <div className="flex flex-col w-full">
                    <FormInput
                        label="Teacher's Last Name"
                        type="text"
                        register={form.register('lastnameen')}
                    />
                </div>
            </div>
            <h2 className="text-2xl font-bold">Contact Information</h2>

            <FormInput
                label="Address"
                type="text"
                register={form.register('address')}
            />
            <FormInput
                label="Alternative Address"
                type="text"
                register={form.register('address2')}
            />
            <div className="flex gap-2 w-full">
                <FormInput
                    label="Phone Number"
                    type="tel"
                    register={form.register('phone')}
                />
                <FormInput
                    label="Alternative Phone Number"
                    type="tel"
                    register={form.register('phonealt')}
                />
            </div>


            <FormInput
                label="Alternative Email"
                type="text"
                register={form.register('emailalt')}
            />


            <div className="flex gap-2 w-full">
                <div className="flex-1/2 flex-[0_0_50%]">
                    <FormInput
                        label="City"
                        type="text"
                        register={form.register('city')}
                    />
                </div>
                <div className="flex-1/3 flex-[0_0_16.6667%] max-w-[33.3333%]">
                    <div className="flex flex-col w-full">
                        <label htmlFor="state" className="block text-sm text-gray-400 font-bold mb-2">
                            State
                        </label>
                        <Select
                            defaultValue={form.watch('state') || 'NY'}
                            onValueChange={value => form.setValue('state', value, { shouldValidate: true })}
                        >
                            <SelectTrigger id="state" className="rounded-sm mb-3 px-2 py-4 !text-base h-9 w-full">
                                <SelectValue placeholder="Select a state" />
                            </SelectTrigger>
                            <SelectContent>
                                {[
                                    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
                                    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                                    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                                    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                                    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
                                ].map(state => (
                                    <SelectItem key={state} value={state}>
                                        {state}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex-2/3 flex-[0_0_33.3333%] max-w-[66.6667%]">
                    <FormInput
                        label="Zip Code"
                        type="text"
                        register={form.register('zip')}
                    />
                </div>
            </div>


            <FormError error={form.formState.errors.root?.message} />

            <FormSubmit>
                Submit
            </FormSubmit>
        </form>
    )
}