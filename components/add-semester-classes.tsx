"use client";
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import SemesterClassBox from './sem-class-box';
import { Input } from './ui/input';
import { type actionMSG } from '@/app/lib/semester/sem-actions';
import { semClassesSchema, type classExpanded } from '@/app/lib/semester/sem-schemas';


type semesterClassesProps = {
    drafts: classExpanded[]
    startSemester: (data: FormData) => Promise<actionMSG>
}



export default function SemesterClasses({drafts, startSemester} : semesterClassesProps) {
    const [draftClasses, setDraftClasses] = useState<classExpanded[]>(drafts);
    
    const setEditing = (className: string) => {
        setDraftClasses(prevClasses => 
            prevClasses.map(c => ({
                ...c,
                summary: {
                    ...c.summary,
                    isEditing: c.summary.classnamecn === className ? !c.summary.isEditing : false
                }
            }))
        );
    }

    const setExpanded = (className: string) => {
        setDraftClasses(prevClasses => 
            prevClasses.map(c => ({
                ...c,
                summary: {
                    ...c.summary,
                    isExpanded: c.summary.classnamecn === className ? !c.summary.isExpanded : false
                }
            }))
        );
    }

    const deleteSemClass = (className: string) => {
        setDraftClasses(prevClasses => 
            prevClasses.filter(c => c.summary.classnamecn !== className)
        )
    }

    const addSemClass = () => {
        setDraftClasses(prevClasses => 
            [...prevClasses, {
                summary: {
                    classnamecn: "",
                    teacher: "",
                    classroom: "",
                    totalPrice: "",
                    isEditing: true,
                    isExpanded: false
                },
                tuition: "",
                book_fee: "",
                seat_limit: "",
                agelimit: "",
                class_time: ""
            }]
        )
    }

    const semClassForm = useForm({
        resolver: zodResolver(semClassesSchema),
    }) 

    const onSemSubmit = async (data: z.infer<typeof semClassesSchema>) => {
        try {
            const fd = new FormData();
            Object.entries(data).forEach(([k, v]) => fd.set(k, v as string | Blob));
            const info = await startSemester(fd)
            if (!info.ok) {
                throw new Error(info.msg)
            }
        } catch (err) {
            console.error("Semester Start Error: ", err)
        }
    }

    return (
        <div className="flex flex-col justify-center">
            <h1 className="font-bold text-2xl mb-2">Start Semester Form</h1>
            <form onSubmit={semClassForm.handleSubmit(onSemSubmit)} className="flex flex-col gap-1 justify-center">
                <label className="block text-sm text-gray-400 font-bold mb-2">Season Name (CN)</label>
                <Input
                    type="text"
                    name="sznnamecn"
                    required
                    aria-required
                />
                <label className="block text-sm text-gray-400 font-bold mb-2">Season Name (EN)</label>
                <Input
                    type="text"
                    name="sznnameen"
                    required
                    aria-required
                />
                {/* dates */}
                <h2 className="font-bold text-lg">Dates</h2>
                <div className="flex mb-2 gap-2">
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Fall Start Date</label>
                        <Input
                            type="date"
                            name="fallstart"
                            required
                            aria-required
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Fall End Date</label>
                        <Input
                            type="date"
                            name="fallend"
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
                            name="springstart"
                            required
                            aria-required
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Spring End Date</label>
                        <Input
                            type="date"
                            name="springend"
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
                            name="earlyreg"
                            required
                            aria-required
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Normal Registration Start</label>
                        <Input
                            type="date"
                            name="normalreg"
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
                            name="latereg"
                            required
                            aria-required
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Registration End</label>
                        <Input
                            type="date"
                            name="regend"
                            required
                            aria-required
                        />
                    </div>
                </div>
                <div className="flex flex-col mb-2">
                    <label className="block text-sm text-gray-400 font-bold mb-2">Cancel Deadline</label>
                    <Input
                        type="date"
                        name="canceldate"
                        required
                        aria-required
                    />
                </div>

                <h2 className="font-bold text-lg mt-3 mb-2">Classes</h2>
                {/* individual classes */}
                {draftClasses.map((c: classExpanded) => (
                    <div key={c.summary.classnamecn} className="flex flex-col rounded-md p-2 border-gray-500 border-1">
                        <SemesterClassBox 
                            c={c}
                            setDraftClasses={setDraftClasses}
                            setEditing={setEditing}
                            setExpanded={setExpanded}
                            deleteSemClass={deleteSemClass}
                        />
                    </div>
                ))} 
                <div className="flex justify-center mt-2">
                    <button 
                        className="flex gap-1 text-blue-700 text-sm cursor-pointer"
                        onClick={addSemClass}
                    >
                        <PlusIcon /> Add Class
                    </button>
                </div>
                <div className="flex gap-4 mt-6 justify-end">
                    <button 
                        type="button" 
                        className="rounded-md text-sm flex items-center gap-1 border-gray-300 border-1 font-semibold hover:bg-gray-50 cursor-pointer p-2"
                    >
                        Cancel
                    </button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button 
                                className="rounded-md bg-blue-600 text-white text-sm flex items-center gap-1 hover:bg-blue-800 font-semibold cursor-pointer p-2"
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
                                    onClick={async () => {
                                        // TODO: Implement semester start logic
                                        console.log('Starting semester...');
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Start Semester
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </form>
        </div>
    )
}