"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { fullRegisterFamily } from "@/server/auth/familyreg.actions";
import { familySchema, nameEmailSchema } from "@/server/auth/schema";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FormError, FormInput, FormSubmit } from "./form-components";

export default function FamilyForm({
    // fullRegister,
    registerData,
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
            state: "NY",
        },
    });

    const onSubmit = async (data: z.infer<typeof familySchema>) => {
        const result = await fullRegisterFamily({
            fullData: data,
            regData: registerData,
            isTeacher: false,
        });

        if (!result.ok) {
            Object.entries(result.fieldErrors ?? {}).forEach(([field, messages]) => {
                if (messages && messages.length > 0) {
                    // @ts-expect-error: field is dynamically typed and matches form field keys
                    fpForm.setError(field, { message: messages[0] });
                }
            });
            setError(
                result.errorMessage ?? "Unknown error occured. Please try again or contact regadmin"
            );
            return;
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-300">
            <form
                onSubmit={familyForm.handleSubmit(onSubmit)}
                className="flex w-full max-w-2xl flex-col space-y-4 rounded-xl bg-white p-8 shadow-md"
            >
                <h2 className="text-2xl font-bold">Family Information (家庭信息)</h2>
                <p className="text-sm text-gray-400">
                    Please fill in the following information for your family. At least one guardian
                    must be provided.(请填写父母双方至少一人)
                </p>
                <FormInput
                    label="Mother's Chinese Name（母亲中文名）"
                    type="text"
                    register={familyForm.register("mothernamecn")}
                />
                {familyForm.formState.errors.mothernamecn?.message && (
                    <FormError error={familyForm.formState.errors.mothernamecn.message} />
                )}
                <div className="flex w-full gap-2">
                    <FormInput
                        label="Mother's First Name（英文名）"
                        type="text"
                        register={familyForm.register("motherfirsten")}
                    />
                    {familyForm.formState.errors.motherfirsten?.message && (
                        <FormError error={familyForm.formState.errors.motherfirsten.message} />
                    )}
                    <FormInput
                        label="Mother's Last Name（英文姓）"
                        type="text"
                        register={familyForm.register("motherlasten")}
                    />
                    {familyForm.formState.errors.motherlasten?.message && (
                        <FormError error={familyForm.formState.errors.motherlasten.message} />
                    )}
                </div>
                <FormInput
                    label="Father's Chinese Name（父亲中文名）"
                    type="text"
                    register={familyForm.register("fathernamecn")}
                />
                {familyForm.formState.errors.fathernamecn?.message && (
                    <FormError error={familyForm.formState.errors.fathernamecn.message} />
                )}
                <div className="flex w-full gap-2">
                    <FormInput
                        label="Father's First Name（英文名）"
                        type="text"
                        register={familyForm.register("fatherfirsten")}
                    />
                    <FormInput
                        label="Father's Last Name（英文姓）"
                        type="text"
                        register={familyForm.register("fatherlasten")}
                    />
                    {familyForm.formState.errors.fatherlasten?.message && (
                        <FormError error={familyForm.formState.errors.fatherlasten.message} />
                    )}
                </div>

                <h2 className="text-2xl font-bold">Contact Information(联系方式）</h2>

                <FormInput
                    label="Address（地址）"
                    required={true}
                    type="text"
                    register={familyForm.register("address")}
                />
                {familyForm.formState.errors.address?.message && (
                    <FormError error={familyForm.formState.errors.address.message} />
                )}
                <FormInput
                    label="Alternative Address（备用地址）"
                    type="text"
                    register={familyForm.register("address2")}
                />
                {familyForm.formState.errors.address2?.message && (
                    <FormError error={familyForm.formState.errors.address2.message} />
                )}
                <div className="flex w-full gap-2">
                    <div className="flex w-1/2 flex-col">
                        <FormInput
                            label="Phone Number（联系电话）"
                            required={true}
                            type="tel"
                            register={familyForm.register("phone")}
                        />
                        {familyForm.formState.errors.phone?.message && (
                            <FormError error={familyForm.formState.errors.phone.message} />
                        )}
                    </div>
                    <div className="flex w-1/2 flex-col">
                        <FormInput
                            label="Alternative Number（备用电话）"
                            type="tel"
                            register={familyForm.register("phonealt")}
                        />
                        {familyForm.formState.errors.phonealt?.message && (
                            <FormError error={familyForm.formState.errors.phonealt.message} />
                        )}
                    </div>
                </div>
                <div className="flex w-full flex-col gap-1">
                    <FormInput
                        label="Alternative Email(备用邮箱)"
                        type="text"
                        register={familyForm.register("emailalt")}
                    />
                    {familyForm.formState.errors.emailalt?.message && (
                        <FormError error={familyForm.formState.errors.emailalt.message} />
                    )}
                </div>

                <div className="flex w-full gap-2">
                    <div className="flex-1/2 flex-[0_0_50%] flex-col">
                        <FormInput
                            label="City(城市）"
                            required={true}
                            type="text"
                            register={familyForm.register("city")}
                        />
                        {familyForm.formState.errors.city?.message && (
                            <FormError error={familyForm.formState.errors.city.message} />
                        )}
                    </div>
                    <div className="flex-1/3 flex-[0_0_16.6667%] flex-col">
                        <div className="flex w-full flex-col">
                            <label
                                htmlFor="state"
                                className="mb-2 block text-sm font-bold text-gray-400"
                            >
                                State(州)
                                <span className="ml-1 text-red-500">*</span>
                            </label>
                            <Select
                                defaultValue={familyForm.watch("state") || "NY"}
                                onValueChange={(value: string) =>
                                    familyForm.setValue("state", value, { shouldValidate: true })
                                }
                                required={true}
                            >
                                <SelectTrigger
                                    id="state"
                                    className="mb-3 h-9 w-full rounded-sm px-2 py-4 !text-base"
                                >
                                    <SelectValue placeholder="Select a state" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[
                                        "AL",
                                        "AK",
                                        "AZ",
                                        "AR",
                                        "CA",
                                        "CO",
                                        "CT",
                                        "DE",
                                        "FL",
                                        "GA",
                                        "HI",
                                        "ID",
                                        "IL",
                                        "IN",
                                        "IA",
                                        "KS",
                                        "KY",
                                        "LA",
                                        "ME",
                                        "MD",
                                        "MA",
                                        "MI",
                                        "MN",
                                        "MS",
                                        "MO",
                                        "MT",
                                        "NE",
                                        "NV",
                                        "NH",
                                        "NJ",
                                        "NM",
                                        "NY",
                                        "NC",
                                        "ND",
                                        "OH",
                                        "OK",
                                        "OR",
                                        "PA",
                                        "RI",
                                        "SC",
                                        "SD",
                                        "TN",
                                        "TX",
                                        "UT",
                                        "VT",
                                        "VA",
                                        "WA",
                                        "WV",
                                        "WI",
                                        "WY",
                                    ].map((state) => (
                                        <SelectItem key={state} value={state}>
                                            {state}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {familyForm.formState.errors.state?.message && (
                                <FormError error={familyForm.formState.errors.state.message} />
                            )}
                        </div>
                    </div>
                    <div className="flex-2/3 flex-[0_0_33.3333%] flex-col">
                        <FormInput
                            label="Zip Code(邮编）"
                            required={true}
                            type="text"
                            register={familyForm.register("zip")}
                        />
                        {familyForm.formState.errors.zip?.message && (
                            <FormError error={familyForm.formState.errors.zip.message} />
                        )}
                    </div>
                </div>

                <FormError error={error} />
                <FormSubmit
                    disabled={familyForm.formState.isSubmitting || !familyForm.formState.isValid}
                >
                    {familyForm.formState.isSubmitting ? "Submitting..." : "Submit"}
                </FormSubmit>
            </form>
        </div>
    );
}
