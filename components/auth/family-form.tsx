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
        <form
            onSubmit={familyForm.handleSubmit(onSubmit)}
            className="flex w-full flex-col space-y-6"
        >
            {/* --- Family Information Section --- */}
            <div className="space-y-4">
                <div className="border-b border-gray-100 pb-2">
                    <h2 className="text-lg font-bold text-gray-900">
                        Family Information (家庭信息)
                    </h2>
                    <p className="text-muted-foreground text-xs">
                        Please fill in at least one guardian. (请填写父母双方至少一人)
                    </p>
                </div>

                {/* Mother */}
                <div className="space-y-4">
                    <div>
                        <FormInput
                            label="Mother's Chinese Name (母亲中文名)"
                            type="text"
                            register={familyForm.register("mothernamecn")}
                        />
                        <FormError error={familyForm.formState.errors.mothernamecn?.message} />
                    </div>

                    <div className="flex w-full gap-4">
                        <div className="w-1/2">
                            <FormInput
                                label="Mother's First Name (英文名)"
                                type="text"
                                register={familyForm.register("motherfirsten")}
                            />
                            <FormError error={familyForm.formState.errors.motherfirsten?.message} />
                        </div>
                        <div className="w-1/2">
                            <FormInput
                                label="Mother's Last Name (英文姓)"
                                type="text"
                                register={familyForm.register("motherlasten")}
                            />
                            <FormError error={familyForm.formState.errors.motherlasten?.message} />
                        </div>
                    </div>
                </div>

                {/* Father */}
                <div className="space-y-4">
                    <div>
                        <FormInput
                            label="Father's Chinese Name (父亲中文名)"
                            type="text"
                            register={familyForm.register("fathernamecn")}
                        />
                        <FormError error={familyForm.formState.errors.fathernamecn?.message} />
                    </div>

                    <div className="flex w-full gap-4">
                        <div className="w-1/2">
                            <FormInput
                                label="Father's First Name (英文名)"
                                type="text"
                                register={familyForm.register("fatherfirsten")}
                            />
                        </div>
                        <div className="w-1/2">
                            <FormInput
                                label="Father's Last Name (英文姓)"
                                type="text"
                                register={familyForm.register("fatherlasten")}
                            />
                            <FormError error={familyForm.formState.errors.fatherlasten?.message} />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Contact Information Section --- */}
            <div className="space-y-4 pt-2">
                <div className="border-b border-gray-100 pb-2">
                    <h2 className="text-lg font-bold text-gray-900">
                        Contact Information (联系方式)
                    </h2>
                </div>

                <div>
                    <FormInput
                        label="Address (地址)"
                        required={true}
                        type="text"
                        register={familyForm.register("address")}
                    />
                    <FormError error={familyForm.formState.errors.address?.message} />
                </div>

                <div>
                    <FormInput
                        label="Alternative Address (备用地址)"
                        type="text"
                        register={familyForm.register("address2")}
                    />
                    <FormError error={familyForm.formState.errors.address2?.message} />
                </div>

                <div className="flex w-full gap-4">
                    <div className="w-1/2">
                        <FormInput
                            label="Phone Number (联系电话)"
                            required={true}
                            type="tel"
                            register={familyForm.register("phone")}
                        />
                        <FormError error={familyForm.formState.errors.phone?.message} />
                    </div>
                    <div className="w-1/2">
                        <FormInput
                            label="Alternative Number (备用电话)"
                            type="tel"
                            register={familyForm.register("phonealt")}
                        />
                        <FormError error={familyForm.formState.errors.phonealt?.message} />
                    </div>
                </div>

                <div>
                    <FormInput
                        label="Alternative Email (备用邮箱)"
                        type="text"
                        register={familyForm.register("emailalt")}
                    />
                    <FormError error={familyForm.formState.errors.emailalt?.message} />
                </div>

                <div className="flex w-full items-start gap-4">
                    <div className="flex-1">
                        <FormInput
                            label="City (城市)"
                            required={true}
                            type="text"
                            register={familyForm.register("city")}
                        />
                        <FormError error={familyForm.formState.errors.city?.message} />
                    </div>

                    <div className="w-1/4 min-w-[100px]">
                        <label
                            htmlFor="state"
                            className="mb-2 block text-sm font-bold text-gray-900"
                        >
                            State (州) <span className="text-red-500">*</span>
                        </label>
                        <Select
                            defaultValue={familyForm.watch("state") || "NY"}
                            onValueChange={(value) =>
                                familyForm.setValue("state", value, { shouldValidate: true })
                            }
                            required={true}
                        >
                            <SelectTrigger id="state" className="h-10 w-full rounded-sm">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
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
                        <FormError error={familyForm.formState.errors.state?.message} />
                    </div>

                    <div className="w-1/3">
                        <FormInput
                            label="Zip Code (邮编)"
                            required={true}
                            type="text"
                            register={familyForm.register("zip")}
                        />
                        <FormError error={familyForm.formState.errors.zip?.message} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <FormError error={error} />
                <FormSubmit
                    disabled={familyForm.formState.isSubmitting || !familyForm.formState.isValid}
                    className="bg-primary text-white"
                >
                    {familyForm.formState.isSubmitting ? "Submitting..." : "Submit Registration"}
                </FormSubmit>
            </div>
        </form>
    );
}
