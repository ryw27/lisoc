"use client";
import { FormInput, FormError, FormSubmit } from './form-components';
import { familySchema, nameEmailSchema } from '@/app/lib/auth-lib/auth-schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from '@/components/ui/select';
import { authMSG } from '@/app/lib/auth-lib/auth-actions';

export default function FamilyForm({
    fullRegister,
    registerData
}: {
    fullRegister: (data: FormData, regData: z.infer<typeof nameEmailSchema>, isTeacher: boolean) => Promise<authMSG>;
    registerData?: z.infer<typeof nameEmailSchema>;
}) {
    const form = useForm<z.infer<typeof familySchema>>({
        resolver: zodResolver(familySchema),
        mode: 'onChange'
    });

    const onSubmit = async (data: z.infer<typeof familySchema>) => {
        try {
            const formData = new FormData();
            Object.entries(data).forEach(([k, v]) => formData.set(k, v as string));
            const info = await fullRegister(formData, registerData!, false);
            if (!info.ok) {
                form.setError("root", { message: info.msg });
                return;
            }
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-4">
            <h2 className="text-2xl font-bold">Family Information</h2>
            <FormInput
                label="Mother's Chinese Name"
                type="text"
                register={form.register('mothernamecn')}
            />
            <div className="flex gap-2 w-full">
                <FormInput
                    label="Mother's First Name"
                    type="text"
                    register={form.register('motherfirsten')}
                />
                <FormInput
                    label="Mother's Last Name"
                    type="text"
                    register={form.register('motherlasten')}
                />
            </div>
            <FormInput
                label="Father's Chinese Name"
                type="text"
                register={form.register('fathernamecn')}
            />
            <div className="flex gap-2 w-full">
                <FormInput
                    label="Father's First Name"
                    type="text"
                    register={form.register('fatherfirsten')}
                />
                <FormInput
                    label="Father's Last Name"
                    type="text"
                    register={form.register('fatherlasten')}
                />
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