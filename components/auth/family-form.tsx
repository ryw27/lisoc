"use client";
import { FormInput, FormError, FormSubmit } from './form-components';
import { familySchema, nameEmailSchema } from '@/lib/auth/validation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { fullRegisterFamily } from '@/lib/auth/';

export default function FamilyForm({
    // fullRegister,
    registerData
}: {
    // fullRegister: (data: z.infer<typeof familySchema>, regData: z.infer<typeof nameEmailSchema>, isTeacher: boolean) => Promise<void>;
    registerData: z.infer<typeof nameEmailSchema>;
}) {
    const [error, setError] = useState<string | null>();
    const router = useRouter();
    
    const familyForm = useForm<z.infer<typeof familySchema>>({
        resolver: zodResolver(familySchema),
        mode: "all",
        defaultValues: {
            state: "NY"
        }
    });

    const onSubmit = async (data: z.infer<typeof familySchema>) => {
        const result = await fullRegisterFamily({
            fullData: data,
            regData: registerData,
            isTeacher: false
        });

        if (!result.ok) {
            Object.entries(result.fieldErrors ?? {}).forEach(([field, messages]) => {
                if (messages && messages.length > 0) {
                    // @ts-expect-error: field is dynamically typed and matches form field keys
                    fpForm.setError(field, { message: messages[0] });
                }
            });
            setError(result.errorMessage ?? "Unknown error occured. Please try again or contact regadmin");
            return;
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <form onSubmit={familyForm.handleSubmit(onSubmit)} className="flex flex-col space-y-4">
            <h2 className="text-2xl font-bold">Family Information</h2>
            <p className="text-sm text-gray-400">Please fill in the following information for your family. At least one guardian must be provided.</p>
            <FormInput
                label="Mother's Chinese Name"
                type="text"
                register={familyForm.register('mothernamecn')}
            />
            {familyForm.formState.errors.mothernamecn?.message && <FormError error={familyForm.formState.errors.mothernamecn.message} />}
            <div className="flex gap-2 w-full">
                <FormInput
                    label="Mother's First Name"
                    type="text"
                    register={familyForm.register('motherfirsten')}
                />
                {familyForm.formState.errors.motherfirsten?.message && <FormError error={familyForm.formState.errors.motherfirsten.message} />}
                <FormInput
                    label="Mother's Last Name"
                    type="text"
                    register={familyForm.register('motherlasten')}
                />
                {familyForm.formState.errors.motherlasten?.message && <FormError error={familyForm.formState.errors.motherlasten.message} />}
            </div>
            <FormInput
                label="Father's Chinese Name"
                type="text"
                register={familyForm.register('fathernamecn')}
            />
            {familyForm.formState.errors.fathernamecn?.message && <FormError error={familyForm.formState.errors.fathernamecn.message} />}
            <div className="flex gap-2 w-full">
                <FormInput
                    label="Father's First Name"
                    type="text"
                    register={familyForm.register('fatherfirsten')}
                />
                <FormInput
                    label="Father's Last Name"
                    type="text"
                    register={familyForm.register('fatherlasten')}
                />
                {familyForm.formState.errors.fatherlasten?.message && <FormError error={familyForm.formState.errors.fatherlasten.message} />}
            </div>

            <h2 className="text-2xl font-bold">Contact Information</h2>

            <FormInput
                label="Address"
                required={true}
                type="text"
                register={familyForm.register('address')}
            />
            {familyForm.formState.errors.address?.message && <FormError error={familyForm.formState.errors.address.message} />}
            <FormInput
                label="Alternative Address"
                type="text"
                register={familyForm.register('address2')}
            />
            {familyForm.formState.errors.address2?.message && <FormError error={familyForm.formState.errors.address2.message} />}
            <div className="flex gap-2 w-full">
                <div className="flex flex-col w-1/2">
                    <FormInput
                        label="Phone Number"
                        required={true}
                        type="tel"
                        register={familyForm.register('phone')}
                    />
                    {familyForm.formState.errors.phone?.message && <FormError error={familyForm.formState.errors.phone.message} />}
                </div>
                <div className="flex flex-col w-1/2">
                    <FormInput
                        label="Alternative Phone Number"
                        type="tel"
                        register={familyForm.register('phonealt')}
                    />
                    {familyForm.formState.errors.phonealt?.message && <FormError error={familyForm.formState.errors.phonealt.message} />}
                </div>
            </div>
            <div className="flex gap-1 w-full flex-col">
                <FormInput
                    label="Alternative Email"
                    type="text"
                    register={familyForm.register('emailalt')}
                />
                {familyForm.formState.errors.emailalt?.message && <FormError error={familyForm.formState.errors.emailalt.message} />}
            </div>

            <div className="flex gap-2 w-full">
                <div className="flex-1/2 flex-[0_0_50%] flex-col">
                    <FormInput
                        label="City"
                        required={true}
                        type="text"
                        register={familyForm.register('city')}
                    />
                    {familyForm.formState.errors.city?.message && <FormError error={familyForm.formState.errors.city.message} />}
                </div>
                <div className="flex-1/3 flex-[0_0_16.6667%] flex-col">
                    <div className="flex flex-col w-full">
                        <label htmlFor="state" className="block text-sm text-gray-400 font-bold mb-2">
                            State
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <Select
                            defaultValue={familyForm.watch('state') || 'NY'}
                            onValueChange={(value: string) => familyForm.setValue('state', value, { shouldValidate: true })}
                            required={true}
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
                        {familyForm.formState.errors.state?.message && <FormError error={familyForm.formState.errors.state.message} />}
                    </div>
                </div>
                <div className="flex-2/3 flex-[0_0_33.3333%] flex-col">
                    <FormInput
                        label="Zip Code"
                        required={true}
                        type="text"
                        register={familyForm.register('zip')}
                    />
                    {familyForm.formState.errors.zip?.message && <FormError error={familyForm.formState.errors.zip.message} />}
                </div>
            </div>

            <FormError error={error} />
            <FormSubmit disabled={familyForm.formState.isSubmitting || !familyForm.formState.isValid}>
                {familyForm.formState.isSubmitting ? 'Submitting...' : 'Submit'}
            </FormSubmit>
        </form>
    )
}