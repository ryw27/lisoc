"use client";
import { useState } from 'react';
import { FormProvider, useFieldArray, useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type draftClasses, semClassesSchema } from '@/app/lib/semester/sem-schemas';
import { Input } from './ui/input';
import SemesterClassBox from './sem-class-box';
import { useRouter } from 'next/navigation';
import { PlusIcon } from 'lucide-react';
import { DrizzleError } from 'drizzle-orm';
import { cn } from '@/lib/utils';


type semesterClassesProps = {
    drafts: draftClasses[]
    startSemester: (data: z.infer<typeof semClassesSchema>) => Promise<any>
    selectOptions: any; // TODO: Fix typing or find a better solution
}

const defaultExpClass = {
    summary: {
        classnamecn: "",
        teacher: "",
        classroom: "",
        totalPriceH: 0,
        totalPriceW: 0,
        isEditing: true,
        isExpanded: false
    },
    classtime: "",
    tuitionW: 0,
    specialfeeW: 0,
    bookfeeW: 0,
    tuitionH: 0,
    specialfeeH: 0,
    bookfeeH: 0,
    waiveregfee: false,
    closeregistration: false,
    notes: "",
    seatlimit: 0,
    agelimit: 0
}
            


export default function StartSemesterForm({drafts, startSemester, selectOptions } : semesterClassesProps) {
    // Navigation
    const router = useRouter();
    
    // UI State
    const [draftClasses, setDraftClasses] = useState<draftClasses[]>(drafts);
    const [configuring, setConfiguring] = useState<{isEditing: boolean, isExpanded: boolean}[]>(() => Array(drafts.length).fill({isEditing: false, isExpanded: false}));


    // Form State
    const semClassForm = useForm({
        resolver: zodResolver(semClassesSchema),
        mode: "onChange",
        defaultValues: {
            classes: draftClasses.map(draft => ({
                classid: draft.class.classid,
                teacherid: draft.teacher.teacherid,
                roomid: draft.classroom.roomid,
                timeid: draft.classtime.timeid,
                tuitionH: Number(draft.tuitionH),
                bookfeeH: Number(draft.bookfeeH),
                specialfeeH: Number(draft.specialfeeH),
                tuitionW: Number(draft.tuitionW),
                bookfeeW: Number(draft.bookfeeW),
                specialfeeW: Number(draft.specialfeeW),
                seatlimit: Number(draft.seatlimit),
                agelimit: Number(draft.agelimit),
            }))
        },
    }) 

    const { fields, append, remove } = useFieldArray({
        control: semClassForm.control,
        name: "classes"
    })


    const deleteSemClass = (index: number) => {
        remove(index);
        setDraftClasses(prevClasses => 
            prevClasses.filter((c, i) => i !== index)
        );
        setConfiguring(prevConfiguring => 
            prevConfiguring.filter((c, i) => i !== index)
        );
    }


    const onSemSubmit = async (data: z.infer<typeof semClassesSchema>) => {
        try {
            console.log("Submitting semester data: ", data)
            const result = await startSemester(data)
            
            // Add success feedback and navigation
            if (!result) {
                console.error("Start semester returned error", )
                semClassForm.setError("root", { message: result })
            } else {
                console.log("Semester started successfully!")
                // Navigate to success page or show success message
                router.push("/admintest/semester")
            }
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

    const submitDisabled = semClassForm.formState.isSubmitting || configuring.some(config => config.isEditing); 

    return (
        <div className="flex flex-col justify-center">
            <h1 className="font-bold text-2xl mb-2">Start Semester Form</h1>
            {/* Form should submit semClassesSchema shape*/}
            <FormProvider {...semClassForm}>
                <form onSubmit={semClassForm.handleSubmit(onSemSubmit)} className="flex flex-col gap-1 justify-center">
                    {/* Display form errors */}
                    {semClassForm.formState.errors.root && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {semClassForm.formState.errors.root.message}
                        </div>
                    )}
                    
                    <NameAndDates semClassForm={semClassForm} />

                    {/* Individual Classes */}
                    <h2 className="font-bold text-lg mt-3 mb-2">Classes</h2>
                    {draftClasses.map((c, idx) => (
                        <div key={c.class.classid} className="flex flex-col rounded-md p-2 border-gray-500 border-1">
                            <SemesterClassBox 
                                field={c}
                                idx={idx}
                                selectOptions={selectOptions}
                                configuring={configuring[idx]}
                                setConfiguring={setConfiguring}
                                setDraftClasses={setDraftClasses}
                                deleteSemClass={deleteSemClass}
                            />
                        </div>
                    ))} 

                    {/* Add Class button */}
                    <div className="flex justify-center mt-2">
                        <button 
                            type="button"
                            className="flex gap-1 text-blue-700 text-sm cursor-pointer"
                            onClick={() => {
                                // Add to form array
                                append({
                                    classid: 0,
                                    teacherid: 0,
                                    roomid: 0,
                                    timeid: 0,
                                    tuitionH: 0,
                                    bookfeeH: 0,
                                    specialfeeH: 0,
                                    tuitionW: 0,
                                    bookfeeW: 0,
                                    specialfeeW: 0,
                                    seatlimit: 0,
                                    agelimit: 0,
                                });
                                // Add to draft classes state
                                setDraftClasses(prevClasses => [...prevClasses, {
                                    class: {
                                        classid: 0,
                                        classnamecn: "",
                                    },
                                    teacher: { teacherid: 0, namecn: "" },
                                    classroom: { roomid: 0, roomno: "" },
                                    classtime: { timeid: 0, period: "" },
                                    tuitionH: "0",
                                    bookfeeH: "0",
                                    specialfeeH: "0",
                                    tuitionW: "0",
                                    bookfeeW: "0",
                                    specialfeeW: "0",
                                    seatlimit: null,
                                    agelimit: null,
                                    waiveregfee: false,
                                    closeregistration: false,
                                    notes: "",
                                    arrangeid: 0,
                                    season: { seasonid: 0, seasonnamecn: "" },
                                    suitableterm: { termno: 0, suitabletermcn: "" },
                                }]);
                                setConfiguring(prevConfiguring => [...prevConfiguring, {isEditing: false, isExpanded: false}]);
                            }}
                        >
                            <PlusIcon /> Add Class
                        </button>
                    </div>

                    {/* Cancel and Submit buttons */}
                    <div className="flex gap-4 mt-6 justify-end">
                        <button 
                            type="button"
                            className="rounded-md text-sm flex items-center gap-1 border-gray-300 border-1 font-semibold hover:bg-gray-50 cursor-pointer p-2"
                            onClick={() => router.push("/admintest/semester")}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className={cn(
                                "rounded-md text-sm flex items-center gap-1 border-gray-300 border-1 font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer p-2", 
                                submitDisabled && "opacity-50 cursor-not-allowed hover:bg-blue-600"
                            )}
                            disabled={submitDisabled}
                        >
                            {semClassForm.formState.isSubmitting ? "Starting..." : "Start Semester"}
                        </button>

                        {/* <AlertDialog>
                            TODO: This doesn't submit the form
                            <AlertDialogTrigger asChild>
                                <button 
                                    type="button"
                                    className="rounded-md bg-blue-600 text-white text-sm flex items-center gap-1 hover:bg-blue-800 font-semibold cursor-pointer p-2"
                                    disabled={submitDisabled}
                                >
                                    Start Semester
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Semester Start</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to start the semester? This action will activate all the classes and cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        type="submit"
                                        onClick={() => {
                                            semClassForm.handleSubmit(onSemSubmit)
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                                    >
                                        Start Semester
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog> */}
                    </div>
                </form>
            </FormProvider>
        </div>
    )
}

function NameAndDates({semClassForm}: {semClassForm: UseFormReturn<z.infer<typeof semClassesSchema>>}) {
    return (
        <>
            {/* Names */ }
            <label className="block text-sm text-gray-400 font-bold mb-2">Season Name (CN)</label>
            <Input
                type="text"
                {...semClassForm.register("seasonnamecn")}
                required
                aria-required
            />
            <label className="block text-sm text-gray-400 font-bold mb-2">Season Name (EN)</label>
            <Input
                type="text"
                {...semClassForm.register("seasonnameen")}
                required
                aria-required
            />

            {/* Dates */}
            <h2 className="font-bold text-lg">Dates</h2>
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
                    <label className="block text-sm text-gray-400 font-bold mb-2">Early Registration Start</label>
                    <Input
                        type="date"
                        {...semClassForm.register("earlyreg")}
                        required
                        aria-required
                    />
                </div>
                <div className="w-1/2">
                    <label className="block text-sm text-gray-400 font-bold mb-2">Normal Registration Start</label>
                    <Input
                        type="date"
                        {...semClassForm.register("normalreg")}
                        required
                        aria-required
                    />
                </div>
            </div>
            <div className="flex mb-2 gap-2">
                <div className="w-1/2">
                    <label className="block text-sm text-gray-400 font-bold mb-2">Late Registration Start</label>
                    <Input
                        type="date"
                        {...semClassForm.register("latereg")}
                        required
                        aria-required
                    />
                </div>
                <div className="w-1/2">
                    <label className="block text-sm text-gray-400 font-bold mb-2">Registration End</label>
                    <Input
                        type="date"
                        {...semClassForm.register("closereg")}
                        required
                        aria-required
                    />
                </div>
            </div>
            <div className="flex flex-col mb-2">
                <label className="block text-sm text-gray-400 font-bold mb-2">Cancel Deadline</label>
                <Input
                    type="date"
                    {...semClassForm.register("canceldeadline")}
                    required
                    aria-required
                />
            </div>
        </>
    )
}
