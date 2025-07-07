"use client";
import { useState } from 'react';
import { FormProvider, useFieldArray, useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type draftClasses, semClassesSchema } from '@/app/lib/semester/sem-schemas';
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from './ui/input';
import SemesterClassBox from './sem-class-box';
import { redirect } from 'next/navigation';
import { PlusIcon } from 'lucide-react';
import { DrizzleError } from 'drizzle-orm';


type semesterClassesProps = {
    drafts: draftClasses[]
    startSemester: (data: z.infer<typeof semClassesSchema>) => Promise<void | string>
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
    // const [draftClasses, setDraftClasses] = useState<classExpanded[]>(() => {
    //     return drafts.map((draft) => {
    //         const priceH = parseFloat(draft.tuitionH || '0') + parseFloat(draft.bookfeeH || '0') + parseFloat(draft.specialfeeH || '0');
    //         const priceW = parseFloat(draft.tuitionW || '0') + parseFloat(draft.bookfeeW || '0') + parseFloat(draft.specialfeeW || '0');
    //         return {
    //             summary: {
    //                 classnamecn: draft.class.classnamecn,
    //                 teacher: draft.teacher.namecn,
    //                 classroom: draft.classroom.roomno,
    //                 totalPriceH: priceH,
    //                 totalPriceW: priceW,
    //                 isEditing: false,
    //                 isExpanded: false
    //             },
    //             classtime: draft.classtime.period,
    //             tuitionW: parseFloat(draft.tuitionW || '0'),
    //             specialfeeW: parseFloat(draft.specialfeeW || '0'),
    //             bookfeeW: parseFloat(draft.bookfeeW || '0'),
    //             tuitionH: parseFloat(draft.tuitionH || '0'),
    //             specialfeeH: parseFloat(draft.specialfeeH || '0'),
    //             bookfeeH: parseFloat(draft.bookfeeH || '0'),
    //             waiveregfee: draft.waiveregfee ?? false,
    //             closeregistration: draft.closeregistration ?? false,
    //             notes: draft.notes ?? "",
    //             seatlimit: draft.seatlimit ?? 0,
    //             agelimit: draft.agelimit ?? 0
    //         }
    //     })
    // });

    const [draftClasses, setDraftClasses] = useState<draftClasses[]>(drafts);
    const [configuring, setConfiguring] = useState<{isEditing: boolean, isExpanded: boolean}[]>(() => Array(drafts.length).fill({isEditing: false, isExpanded: false}));

    const semClassForm = useForm({
        resolver: zodResolver(semClassesSchema),
        defaultValues: {
            classes: draftClasses.map(draft => ({
                classid: draft.class.classid,
                teacherid: draft.teacher.teacherid,
                roomid: draft.classroom.roomid,
                timeid: draft.classtime.timeid,
                tuitionH: draft.tuitionH,
                bookfeeH: draft.bookfeeH,
                specialfeeH: draft.specialfeeH,
                tuitionW: draft.tuitionW,
                bookfeeW: draft.bookfeeW,
                specialfeeW: draft.specialfeeW,
                seatlimit: draft.seatlimit,
                agelimit: draft.agelimit,
            }))
        },
        shouldUnregister: false
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
            // await startSemester(data)
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
    const curOptions = {
        classes: selectOptions.classes.filter((c: { classid: number, classnamecn: string }) => draftClasses.some(d => d.class.classid === c.classid)),
        teachers: selectOptions.teachers.filter((t: { teacherid: number, namecn: string }) => draftClasses.some(d => d.teacher.teacherid === t.teacherid)),
        rooms: selectOptions.rooms.filter((r: { roomid: number, roomno: string }) => draftClasses.some(d => d.classroom.roomid === r.roomid)),
        times: selectOptions.times.filter((t: { timeid: number, period: string }) => draftClasses.some(d => d.classtime.timeid === t.timeid))
    }

    return (
        <div className="flex flex-col justify-center">
            <h1 className="font-bold text-2xl mb-2">Start Semester Form</h1>
            {/* Form should submit semClassesSchema shape*/}
            <FormProvider {...semClassForm}>
                <form onSubmit={semClassForm.handleSubmit(onSemSubmit)} className="flex flex-col gap-1 justify-center">
                    <NameAndDates semClassForm={semClassForm} />

                    {/* Individual Classes */}
                    <h2 className="font-bold text-lg mt-3 mb-2">Classes</h2>
                    {draftClasses.map((c, idx) => (
                        <div key={c.class.classid} className="flex flex-col rounded-md p-2 border-gray-500 border-1">
                            <SemesterClassBox 
                                field={c}
                                idx={idx}
                                formHandler={semClassForm}
                                selectOptions={curOptions}
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
                                    tuitionH: 0,
                                    bookfeeH: 0,
                                    specialfeeH: 0,
                                    tuitionW: 0,
                                    bookfeeW: 0,
                                    specialfeeW: 0,
                                    seatlimit: 0,
                                    agelimit: 0,
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
                            onClick={() => redirect("/admintest/semester")}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="rounded-md bg-blue-600 text-white text-sm flex items-center gap-1 hover:bg-blue-800 font-semibold cursor-pointer p-2"
                            disabled={submitDisabled}
                        >
                            Start Semester
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
