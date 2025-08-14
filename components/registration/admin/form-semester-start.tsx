"use client";
import {
  FormProvider,
  useFieldArray,
  useForm,
  UseFormReturn,
  Controller,
} from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { startSemFormSchema } from "@/lib/registration/validation";
import { uiClasses, selectOptions, IdMaps } from "@/lib/registration/types";
import { cn } from '@/lib/utils';
import SemesterClassBox from './form-class-box';
import { useRouter } from 'next/navigation';
import { PlusIcon } from 'lucide-react';
import { seasons } from '@/lib/db/schema';
import { DrizzleError, InferSelectModel } from 'drizzle-orm';
import { toESTString } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { createContext } from "react";
import { createSemester } from "@/lib/registration/semester";


type semesterClassesProps = {
    drafts: uiClasses[]
    selectOptions: selectOptions;
    idMaps: IdMaps;
    lastSeason: InferSelectModel<typeof seasons>[];
    // startSemester: (data: z.infer<typeof startSemFormSchema>) => Promise<void>
}

const MapsAndOptionsProvider = createContext<{ selectOptions: selectOptions; idMaps: IdMaps;} | null>(null);

type FormType = UseFormReturn<z.infer<typeof startSemFormSchema>>;

export default function StartSemesterForm({drafts, selectOptions, idMaps, lastSeason } : semesterClassesProps) {
    const router = useRouter();
    const getInputDateForm = (date: string | undefined) => {
        // new Date(field.value).toISOString().slice(0, 10)
        if (!date) return undefined;
        const newDate = new Date(date);
        newDate.setFullYear(newDate.getFullYear() + 1);
        return toESTString(newDate).slice(0, 10);
    }

    const semClassForm = useForm({
        resolver: zodResolver(startSemFormSchema),
        mode: "onChange",
        defaultValues: {
            classes: drafts,
            fallstart: getInputDateForm(lastSeason[0]?.startdate),
            fallend: getInputDateForm(lastSeason[0]?.enddate),
            springstart: getInputDateForm(lastSeason[1]?.startdate),
            springend: getInputDateForm(lastSeason[1]?.enddate),
            fallearlyreg: getInputDateForm(lastSeason[0]?.earlyregdate),
            fallnormalreg: getInputDateForm(lastSeason[0]?.normalregdate),
            falllatereg: getInputDateForm(lastSeason[0]?.lateregdate1),
            fallclosereg: getInputDateForm(lastSeason[0]?.closeregdate),
            fallcanceldeadline: getInputDateForm(lastSeason[0]?.canceldeadline),
            springearlyreg: getInputDateForm(lastSeason[1]?.earlyregdate),
            springnormalreg: getInputDateForm(lastSeason[1]?.normalregdate),
            springlatereg: getInputDateForm(lastSeason[1]?.lateregdate1),
            springclosereg: getInputDateForm(lastSeason[1]?.closeregdate),
            springcanceldeadline: getInputDateForm(lastSeason[1]?.canceldeadline),
            // Registration settings defaults
            seasonnamecn: new Date(Date.now()).getFullYear() + "-" + (new Date(Date.now()).getFullYear() + 1) + " 学年",
            seasonnameen: new Date(Date.now()).getFullYear() + "-" + (new Date(Date.now()).getFullYear() + 1) + " Academic Year",
            haslateregfee: lastSeason[0]?.haslateregfee,
            haslateregfee4newfamily: lastSeason[0]?.haslateregfee4newfamily,
            hasdutyfee: lastSeason[0]?.hasdutyfee,
            showadmissionnotice: lastSeason[0]?.showadmissionnotice,
            showteachername: lastSeason[0]?.showteachername,
            days4showteachername: lastSeason[0]?.days4showteachername,
            allownewfamilytoregister: lastSeason[0]?.allownewfamilytoregister,
            date4newfamilytoregister: getInputDateForm(lastSeason[0]?.date4newfamilytoregister),
        }
    });


    const { fields, append, remove } = useFieldArray({
        control: semClassForm.control,
        name: "classes"
    })


    const deleteSemClass = (index: number) => {
        remove(index);
    }


    const onSemSubmit = async (data: z.infer<typeof startSemFormSchema>) => {
        try {
            console.log("Submitting semester data: ", data)
            await createSemester(data)
            
            // Add success feedback and navigation
            console.log("Semester started successfully!")
            // Navigate to success page or show success message
            router.push("/admin/semester")
        } catch (err) {
            if (err instanceof DrizzleError) {
                console.error("Drizzle semester start error.")
                semClassForm.setError("root", { message: err.message[0]})
            } else {
                console.error("Semester Start Error: ", err)
                semClassForm.setError("root", {
                    message: "Failed to start semester. Please try again or report this error."
                })
            }
        }
    }


    return (
        <MapsAndOptionsProvider.Provider value={{selectOptions, idMaps}}>
            <div className="flex flex-col">
                <h1 className="font-bold text-2xl mb-2">Start Semester Form</h1>
                {/* Form should submit semClassesSchema shape*/}
                <FormProvider {...semClassForm}>
                    <form onSubmit={semClassForm.handleSubmit(onSemSubmit)} className="flex flex-col gap-1">
                        { /* TODO: I have no idea how to resolve this without casting */} 
                        <NameAndDates semClassForm={semClassForm as FormType} /> 
                        <RegSettingsForm semClassForm={semClassForm as FormType} />

                        {/* Individual Classes */}
                        <h2 className="font-bold text-xl p-4">Classes</h2>
                        {fields.map((c, idx) => (
                            <div key={`${c.classid}-${idx}`} className="flex flex-col rounded-lg shadow-md p-2 border-gray-400 border-1">
                                <SemesterClassBox 
                                    idx={idx}
                                    field={c}
                                    deleteSemClass={deleteSemClass}
                                />
                            </div>
                        ))} 
                        {/* Add Class button */}
                        <button
                            type="button"
                            // Room and teacher are not chosen for R (registration) classes. These are IDs to TBD values. Rest are non-existent values as placeholders
                            onClick={() => append({
                                teacherid: 7, 
                                roomid: 59,
                                timeid: 3,
                                tuitionH: "0.00",
                                bookfeeH: "0.00",
                                bookfeeW: "0.00",
                                specialfeeH: "0.00",
                                specialfeeW: "0.00",
                                tuitionW: "0.00",
                            } as uiClasses)}
                            className="self-center flex items-center gap-2 text-blue-700 text-sm mt-2"
                        >
                            <PlusIcon className="h-4 w-4" /> Add Class
                        </button>

                        {/* Cancel and Submit buttons */}
                        <div className="flex gap-4 mt-6 justify-end">
                            <button 
                                type="button"
                                className="rounded-md text-sm flex items-center gap-1 border-gray-300 border-1 font-semibold hover:bg-gray-50 cursor-pointer p-2"
                                onClick={() => router.push("/admin/semester")}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={semClassForm.formState.isSubmitting}
                                className={cn("self-end px-4 py-2 rounded-md text-white bg-blue-600 font-semibold",
                                    semClassForm.formState.isSubmitting && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {semClassForm.formState.isSubmitting ? "Starting…" : "Start Semester"}
                            </button>
                        </div>
                    </form>
                </FormProvider>
            </div>
        </MapsAndOptionsProvider.Provider>
    )
}

function NameAndDates({ semClassForm }: {semClassForm: FormType}) {
    return (
        <>
            {/* Names */ }
            {/* <label className="block text-sm text-gray-400 font-bold mb-2">Season Name (CN)</label> */}
            <div className="rounded-lg shadow-md flex flex-col space-y-2 border-2 border-gray-200 p-4 mb-2">
                <h2 className="font-bold text-lg">Season Name</h2>
                <div className="flex-1">
                    <label htmlFor="seasonnamecn" className="block text-sm text-gray-400 font-bold mb-1">
                        Season Name (CN)
                    </label>
                    <Input
                        id="seasonnamecn"
                        type="text"
                        {...semClassForm.register("seasonnamecn")}
                        required
                        aria-required="true"
                        placeholder="请输入学年中文名. 如：2025-2026学年"
                        className="w-full"
                    />
                </div>
                
                {/* <label className="block text-sm text-gray-400 font-bold mb-2">Season Name (EN)</label> */}
                <div className="flex-1">
                    <label htmlFor="seasonnameen" className="block text-sm text-gray-400 font-bold mb-1">
                        Season Name (EN)
                    </label>
                    <Input
                        id="seasonnameen"
                        type="text"
                        {...semClassForm.register("seasonnameen")}
                        placeholder="Please enter the season name in English. e.g. 2025-2026 Academic Year"
                        required
                        aria-required
                    />
                </div>
            </div>

            {/* Dates */}
            <div className="rounded-lg shadow-md flex flex-col space-y-2 border-2 border-gray-200 p-4 mb-2">
                <h2 className="font-bold text-lg">Fall Dates</h2>
                <div className="flex mb-2 gap-2">
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Fall Start Date</label>
                        <Input
                            type="date"
                            {...semClassForm.register("fallstart")}
                            required
                            aria-required
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Fall End Date</label>
                        <Input
                            type="date"
                            {...semClassForm.register("fallend")}
                            required
                            aria-required
                        />
                    </div>
                </div>

                <div className="flex mb-2 gap-2">
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Fall Early Registration Start</label>
                        <Input
                            type="date"
                            {...semClassForm.register("fallearlyreg")}
                            required
                            aria-required
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Fall Normal Registration Start</label>
                        <Input
                            type="date"
                            {...semClassForm.register("fallnormalreg")}
                            required
                            aria-required
                        />
                    </div>
                </div>
                <div className="flex mb-2 gap-2">
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Fall Late Registration Start</label>
                        <Input
                            type="date"
                            {...semClassForm.register("falllatereg")}
                            required
                            aria-required
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Fall Registration End</label>
                        <Input
                            type="date"
                            {...semClassForm.register("fallclosereg")}
                            required
                            aria-required
                        />
                    </div>
                </div>
                <div className="flex flex-col mb-2">
                    <label className="block text-sm text-gray-400 font-bold mb-2">Fall Cancel Deadline</label>
                    <Input
                        type="date"
                        {...semClassForm.register("fallcanceldeadline")}
                        required
                        aria-required
                    />
                </div>
            </div>

            <div className="rounded-lg shadow-md flex flex-col space-y-2 border-2 border-gray-200 p-4 mb-2">
                <h2 className="font-bold text-lg">Spring Dates</h2>
                <div className="flex mb-2 gap-2">
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Spring Start Date</label>
                        <Input
                            type="date"
                            {...semClassForm.register("springstart")}
                            required
                            aria-required
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Spring End Date</label>
                        <Input
                            type="date"
                            {...semClassForm.register("springend")}
                            required
                            aria-required
                        />
                    </div>
                </div>
                <div className="flex mb-2 gap-2">
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Spring Early Registration Start</label>
                        <Input
                            type="date"
                        {...semClassForm.register("springearlyreg")}
                            required
                            aria-required
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Spring Normal Registration Start</label>
                        <Input
                            type="date"
                            {...semClassForm.register("springnormalreg")}
                            required
                            aria-required
                        />
                    </div>
                </div>
                <div className="flex mb-2 gap-2">
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Spring Late Registration Start</label>
                        <Input
                            type="date"
                        {...semClassForm.register("springlatereg")}
                            required
                            aria-required
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Spring Registration End</label>
                        <Input
                            type="date"
                        {...semClassForm.register("springclosereg")}
                            required
                            aria-required
                        />
                    </div>
                </div>
                <div className="flex flex-col mb-2 gap-2">
                    <label className="block text-sm text-gray-400 font-bold mb-2">Spring Cancel Deadline</label>
                    <Input
                        type="date"
                    {...semClassForm.register("springcanceldeadline")}
                    required
                        aria-required
                    />
                </div>

            </div>
        </>
    )
}

interface RegSettingsFormProps {
    semClassForm: FormType;
}

export function RegSettingsForm({ semClassForm }: RegSettingsFormProps) {
    const showTeacherName = semClassForm.watch("showteachername");
    const allowNewFamily = semClassForm.watch("allownewfamilytoregister");

    interface SettingField {
        id: string;
        label: string;
        type?: string;
        inputType?: string;
        min?: number;
        disabled?: boolean;
        className?: string;
        registerOptions?: Record<string, unknown>;
        errorKey?: keyof typeof semClassForm.formState.errors;
    }

    function SwitchField(field: SettingField) {
        return (
            <div className="flex items-center gap-4 justify-between" key={field.id}>
                <label
                    className="font-medium text-gray-700"
                    htmlFor={field.id}
                >
                    {field.label}
                </label>
                <Controller
                    name={field.id as keyof z.infer<typeof startSemFormSchema>}
                    control={semClassForm.control}
                    render={({ field: { onChange, value, ...fieldProps } }) => (
                        <Switch
                            checked={Boolean(value)}
                            onCheckedChange={onChange}
                            className="data-[state=checked]:bg-blue-600"
                            {...fieldProps}
                        />
                    )}
                />
            </div>
        )
    }

    function InputField(field: SettingField) {
        return (
            <div className="flex justify-between items-center w-full gap-3" key={field.id}>
                <label
                    className="font-medium text-gray-700"
                    htmlFor={field.id}
                >
                    {field.label}
                </label>
                <Controller
                    name={field.id as keyof z.infer<typeof startSemFormSchema>}
                    control={semClassForm.control}
                    render={() => (
                        <Input
                            id={field.id}
                            type={field.inputType}
                            min={field.min}
                            disabled={field.disabled}
                            className={field.className}
                            {...semClassForm.register(
                                field.id as keyof z.infer<typeof startSemFormSchema>,
                                field.registerOptions
                            )}
                        />
                    )}
                />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="rounded-lg shadow-md flex flex-col space-y-2 border-2 border-gray-200 p-4 mb-2">
                <h2 className="font-bold text-lg">Fee Settings</h2>
                <SwitchField id="haslateregfee" label="Late Registration Fee For All Classes" />
                <SwitchField id="haslateregfee4newfamily" label="Late Regstration Fee for New Families" />
                <SwitchField id="hasdutyfee" label="Duty Fee For All Classes" />
            </div>
            <div className="rounded-lg shadow-md flex flex-col space-y-2 border-2 border-gray-200 p-4 mb-2">
                <h2 className="font-bold text-lg">Visibility Settings</h2>
                <SwitchField id="showadmissionnotice" label="Show Admission Notice" />
                <SwitchField id="showteachername" label="Show Teacher Name" />
                <InputField 
                    id="days4showteachername" 
                    label="Days to Show Teacher Name" 
                    type="number" 
                    min={0} 
                    disabled={!showTeacherName} 
                    className="border rounded px-2 py-1 w-32" 
                    registerOptions={{ valueAsNumber: true }} 
                    errorKey="days4showteachername" 
                />
            </div>
            <div className="rounded-lg shadow-md flex flex-col space-y-2 border-2 border-gray-200 p-4 mb-2">
                <h2 className="font-bold text-lg">Registration Settings</h2>
                <SwitchField id="allownewfamilytoregister" label="Allow New Family Registration" />
                <div className="flex justify-between items-center w-full gap-3">
                    <label
                        className="font-medium text-gray-700"
                        htmlFor="date4newfamilytoregister"
                    >
                        New Family Registration Date
                    </label>
                    <Controller
                        name="date4newfamilytoregister"
                        control={semClassForm.control}
                        render={({ field }) => (
                            <Input
                                id="date4newfamilytoregister"
                                type="date"
                                disabled={!allowNewFamily}
                                className="border rounded px-2 py-1 w-48"
                                value={field.value ? new Date(field.value).toISOString().slice(0, 10) : ""}
                                {...semClassForm.register("date4newfamilytoregister")}
                            />
                        )}
                    />
                </div>
            </div>
        </div>
    );
}