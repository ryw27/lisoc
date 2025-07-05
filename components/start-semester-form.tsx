"use client";
import { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type draftClasses, semClassesSchema, type classExpanded } from '@/app/lib/semester/sem-schemas';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from './ui/input';
import SemesterClassBox from './sem-class-box';
import { redirect } from 'next/navigation';
import { PlusIcon } from 'lucide-react';


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
    const [draftClasses, setDraftClasses] = useState<classExpanded[]>(() => {
        return drafts.map((draft) => {
            const priceH = parseFloat(draft.tuitionH || '0') + parseFloat(draft.bookfeeH || '0') + parseFloat(draft.specialfeeH || '0');
            const priceW = parseFloat(draft.tuitionW || '0') + parseFloat(draft.bookfeeW || '0') + parseFloat(draft.specialfeeW || '0');
            return {
                summary: {
                    classnamecn: draft.class.classnamecn,
                    teacher: draft.teacher.namecn,
                    classroom: draft.classroom.roomno,
                    totalPriceH: priceH,
                    totalPriceW: priceW,
                    isEditing: false,
                    isExpanded: false
                },
                classtime: draft.classtime.period,
                tuitionW: parseFloat(draft.tuitionW || '0'),
                specialfeeW: parseFloat(draft.specialfeeW || '0'),
                bookfeeW: parseFloat(draft.bookfeeW || '0'),
                tuitionH: parseFloat(draft.tuitionH || '0'),
                specialfeeH: parseFloat(draft.specialfeeH || '0'),
                bookfeeH: parseFloat(draft.bookfeeH || '0'),
                waiveregfee: draft.waiveregfee ?? false,
                closeregistration: draft.closeregistration ?? false,
                notes: draft.notes ?? "",
                seatlimit: draft.seatlimit ?? 0,
                agelimit: draft.agelimit ?? 0
            }
        })
    });


    const deleteSemClass = (className: string) => {
        setDraftClasses(prevClasses => 
            prevClasses.filter(c => c.summary.classnamecn !== className)
        )
    }

    const addSemClass = () => {
        setDraftClasses(prevClasses => 
            [...prevClasses, defaultExpClass]
        );
    }

    const semClassForm = useForm({
        resolver: zodResolver(semClassesSchema),
        defaultValues: {
            classes: draftClasses
        },
        shouldUnregister: false
    }) 

    const onSemSubmit = async (data: z.infer<typeof semClassesSchema>) => {
        try {
            await startSemester(data)
        } catch (err) {
            console.error("Semester Start Error: ", err)
            semClassForm.setError("root", {
                message: "Failed to start semester. Please try again or report this error."
            })
        }
    }

    return (
        <div className="flex flex-col justify-center">
            <h1 className="font-bold text-2xl mb-2">Start Semester Form</h1>
            {/* Form should submit semClassesSchema shape*/}
            <form onSubmit={semClassForm.handleSubmit(onSemSubmit)} className="flex flex-col gap-1 justify-center">
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
                <>
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

                {/* Individual Classes */}
                <h2 className="font-bold text-lg mt-3 mb-2">Classes</h2>
                {draftClasses.map((c: classExpanded, idx: number) => (
                    <div key={c.summary.classnamecn} className="flex flex-col rounded-md p-2 border-gray-500 border-1">
                        <SemesterClassBox 
                            c={c}
                            idx={idx}
                            formHandler={semClassForm}
                            selectOptions={selectOptions}
                            setDraftClasses={setDraftClasses}
                            deleteSemClass={deleteSemClass}
                        />
                    </div>
                ))} 

                {/* Add Class button */}
                <div className="flex justify-center mt-2">
                    <button 
                        className="flex gap-1 text-blue-700 text-sm cursor-pointer"
                        onClick={addSemClass}
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

                    <AlertSubmit semClassForm={semClassForm} onSemSubmit={onSemSubmit} />
                </div>
            </form>
        </div>
    )
}

function AlertSubmit({semClassForm, onSemSubmit}: {semClassForm: UseFormReturn<z.infer<typeof semClassesSchema>>, onSemSubmit: (data: z.infer<typeof semClassesSchema>) => Promise<void>}) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button 
                    className="rounded-md bg-blue-600 text-white text-sm flex items-center gap-1 hover:bg-blue-800 font-semibold cursor-pointer p-2"
                    disabled={semClassForm.formState.isSubmitting}
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
                        className="bg-green-600 hover:bg-green-700"
                    >
                        Start Semester
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}