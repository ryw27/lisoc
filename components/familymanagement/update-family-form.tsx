"use client";
import { family } from "@/lib/db/schema";
import { familySchema } from "@/server/auth/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from 'zod/v4';
import { FormError, FormInput, FormSubmit } from '../auth/form-components';

import { updateFamily } from "@/server/familymanagement/actions";
import { InferSelectModel } from "drizzle-orm";

export default function UpdateFamilyForm({ infamily }: { infamily: InferSelectModel<typeof family> }) {
    const [error, setError] = useState<string|null>(null);

    const familyForm = useForm<z.infer<typeof familySchema>>({
        resolver: zodResolver(familySchema),
        mode: "all",
        defaultValues: {
            state: "NY",
            mothernamecn: infamily.mothernamecn?? "",
            motherfirsten: infamily.motherfirsten?? "",
            motherlasten: infamily.motherlasten?? "",
            fathernamecn: infamily.fathernamecn?? "",
            fatherfirsten: infamily.fatherfirsten?? "",
            fatherlasten: infamily.fatherlasten?? "",
            address: infamily.address1?? "",
            //'address2': infamily?.address2?? "",
            phone: infamily.officephone?? "",
            phonealt: infamily.cellphone?? "",
            emailalt: infamily.email2?? "",
        }
    });


    const onSubmit = async (data: z.infer<typeof familySchema>) => {
        try {
            const familyData = familySchema.parse(data);
            await updateFamily(familyData, infamily.familyid);
            // Redirect or show success message
            window.location.reload();            

        } catch (error) {
            if (error instanceof z.ZodError) {
                    error.issues.map((e) => {
                        familyForm.setError(e.path as unknown as keyof z.infer<typeof familySchema>, { message: e.message });
                    })
            } else if (typeof error === "string") {
                setError(error);
            } else {
                setError("Unknown error occured. Please try again or contact regadmin");
            }
            
            ;
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-300">
            <form onSubmit={familyForm.handleSubmit(onSubmit)} className="flex flex-col space-y-4 bg-white p-8 rounded-xl shadow-md w-full max-w-2xl">
            <h2 className="text-2xl font-bold">Update Family Information (更新家庭信息)</h2>
            <h1 className="text-1xl">Family ID: {infamily.familyid}</h1>
            <p className="text-sm text-black-400">请在下表填上准确资料，然后按“更新” Please fill out the appropriate information below, then press the "Update" button.</p>
            <FormInput
                label="Mother's Chinese Name（母亲中文名）"
                type="text"
                register={familyForm.register('mothernamecn')}
            />
            {familyForm.formState.errors.mothernamecn?.message && <FormError error={familyForm.formState.errors.mothernamecn.message} />}
            <div className="flex gap-2 w-full">
                <FormInput
                    label="Mother's First Name（英文名）"
                    type="text"
                    register={familyForm.register('motherfirsten')}
                />
                {familyForm.formState.errors.motherfirsten?.message && <FormError error={familyForm.formState.errors.motherfirsten.message} />}
                <FormInput
                    label="Mother's Last Name（英文姓）"
                    type="text"
                    register={familyForm.register('motherlasten')}
                />
                {familyForm.formState.errors.motherlasten?.message && <FormError error={familyForm.formState.errors.motherlasten.message} />}
            </div>
            <FormInput
                label="Father's Chinese Name（父亲中文名）"
                type="text"
                register={familyForm.register('fathernamecn')}
            />
            {familyForm.formState.errors.fathernamecn?.message && <FormError error={familyForm.formState.errors.fathernamecn.message} />}
            <div className="flex gap-2 w-full">
                <FormInput
                    label="Father's First Name（英文名）"
                    type="text"
                    register={familyForm.register('fatherfirsten')}
                />
                <FormInput
                    label="Father's Last Name（英文姓）"
                    type="text"
                    register={familyForm.register('fatherlasten')}
                />
                {familyForm.formState.errors.fatherlasten?.message && <FormError error={familyForm.formState.errors.fatherlasten.message} />}
            </div>

            {/*<h2 className="text-2xl font-bold">Contact Information(联系方式）</h2>*/}

            <FormInput
                label="Address（地址）"
                required={true}
                type="text"
                register={familyForm.register('address')}
            />
            {familyForm.formState.errors.address?.message && <FormError error={familyForm.formState.errors.address.message} />}
            {/*<FormInput
                label="Alternative Address（备用地址）"
                type="text"
                register={familyForm.register('address2')}
            />*/}
            {familyForm.formState.errors.address2?.message && <FormError error={familyForm.formState.errors.address2.message} />}
            <div className="flex gap-2 w-full">
                <div className="flex flex-col w-1/2">
                    <FormInput
                        label="Phone Number（联系电话）"
                        required={true}
                        type="tel"
                        register={familyForm.register('phone')}
                    />
                    {familyForm.formState.errors.phone?.message && <FormError error={familyForm.formState.errors.phone.message} />}
                </div>
                <div className="flex flex-col w-1/2">
                    <FormInput
                        label="Alternative Number（备用电话）"
                        type="tel"
                        register={familyForm.register('phonealt')}
                    />
                    {familyForm.formState.errors.phonealt?.message && <FormError error={familyForm.formState.errors.phonealt.message} />}
                </div>
            </div>
            <div className="flex gap-1 w-full flex-col">
                <FormInput
                    label="Alternative Email(备用邮箱)"
                    type="text"
                    register={familyForm.register('emailalt')}
                />
                {familyForm.formState.errors.emailalt?.message && <FormError error={familyForm.formState.errors.emailalt.message} />}
            </div>
            {/*}    
            <div className="flex gap-2 w-full">
                <div className="flex-1/2 flex-[0_0_50%] flex-col">
                    <FormInput
                        label="City(城市）"
                        required={true}
                        type="text"
                        register={familyForm.register('city')}
                    />
                    {familyForm.formState.errors.city?.message && <FormError error={familyForm.formState.errors.city.message} />}
                </div>
                <div className="flex-1/3 flex-[0_0_16.6667%] flex-col">
                    <div className="flex flex-col w-full">
                        <label htmlFor="state" className="block text-sm text-gray-400 font-bold mb-2">
                            State(州)
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
                        label="Zip Code(邮编）"
                        required={true}
                        type="text"
                        register={familyForm.register('zip')}
                    />
                    {familyForm.formState.errors.zip?.message && <FormError error={familyForm.formState.errors.zip.message} />}
                </div>
            </div>
               */} 
            <FormError error={error} />
            <FormSubmit disabled={familyForm.formState.isSubmitting || !familyForm.formState.isValid }>
                {familyForm.formState.isSubmitting ? 'Updating...' : 'Update (更新)'}
            </FormSubmit>
        </form>
        </div>
    )

}