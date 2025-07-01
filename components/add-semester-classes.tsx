"use client";
import { Edit, PlusIcon, Trash, Info } from 'lucide-react';
import { useState } from 'react';
import { type classExpanded, type classEditor } from '@/app/admintest/dashboard/management/semester/start-semester/page';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


type semesterClassesProps = {
    drafts: classExpanded[]
}

export default function SemesterClasses({drafts} : semesterClassesProps) {
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

    return (
        <div className="flex flex-col gap-1">
            {/* individual classes */}
            {draftClasses.map((c: classExpanded) => (
                <div key={c.summary.classnamecn} className="flex flex-col rounded-md p-2 border-gray-500 border-1">
                    <div className="flex flex-col">
                        {c.summary.isEditing ? (
                            <div className="flex flex-col gap-2">
                                <input 
                                    type="text" 
                                    value={c.summary.classnamecn}
                                    className="border rounded p-1"
                                    onChange={(e) => {
                                        setDraftClasses(prev => 
                                            prev.map(cls => 
                                                cls.summary.classnamecn === c.summary.classnamecn 
                                                    ? {...cls, summary: {...cls.summary, classnamecn: e.target.value}}
                                                    : cls
                                            )
                                        );
                                    }}
                                />
                                <input 
                                    type="text" 
                                    value={c.summary.teacher}
                                    className="border rounded p-1"
                                    onChange={(e) => {
                                        setDraftClasses(prev => 
                                            prev.map(cls => 
                                                cls.summary.classnamecn === c.summary.classnamecn 
                                                    ? {...cls, summary: {...cls.summary, teacher: e.target.value}}
                                                    : cls
                                            )
                                        );
                                    }}
                                />
                                <input 
                                    type="text" 
                                    value={c.summary.classroom}
                                    className="border rounded p-1"
                                    onChange={(e) => {
                                        setDraftClasses(prev => 
                                            prev.map(cls => 
                                                cls.summary.classnamecn === c.summary.classnamecn 
                                                    ? {...cls, summary: {...cls.summary, classroom: e.target.value}}
                                                    : cls
                                            )
                                        );
                                    }}
                                />
                                <input 
                                    type="text" 
                                    value={c.summary.totalPrice}
                                    className="border rounded p-1"
                                    onChange={(e) => {
                                        setDraftClasses(prev => 
                                            prev.map(cls => 
                                                cls.summary.classnamecn === c.summary.classnamecn 
                                                    ? {...cls, summary: {...cls.summary, totalPrice: e.target.value}}
                                                    : cls
                                            )
                                        );
                                    }}
                                />
                            </div>
                        ) : (
                            <>
                                <p className="font-bold">
                                    {c.summary.classnamecn}
                                </p>
                                <p className="text-gray-800">
                                    Classroom: {c.summary.classroom}
                                </p>
                                <p className="font-bold">
                                    Teacher: {c.summary.teacher}
                                </p>
                                <p className="text-gray-800">
                                    Price: ${c.summary.totalPrice}
                                </p>
                                {c.summary.isExpanded && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                                        <h4 className="font-semibold text-gray-700 mb-2">Additional Details</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-gray-600">Tuition:</span>
                                                <span className="ml-2 font-medium">${c.tuition || 0}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Book Fee:</span>
                                                <span className="ml-2 font-medium">${c.book_fee || 0}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Seat Limit:</span>
                                                <span className="ml-2 font-medium">{c.seat_limit || 0}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Age Limit:</span>
                                                <span className="ml-2 font-medium">{c.agelimit || 'N/A'}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-gray-600">Class Time:</span>
                                                <span className="ml-2 font-medium">{c.class_time || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        <div className="flex gap-2 mt-2">
                            <button 
                                className="cursor-pointer text-gray-700 hover:text-gray-500"
                                onClick={() => setEditing(c.summary.classnamecn)}
                            >
                                <Edit className="w-4 h-4"/>
                            </button>
                            <button 
                                className="cursor-pointer text-gray-700 hover:text-gray-500"
                                onClick={() => deleteSemClass(c.summary.classnamecn)}
                            >
                                <Trash className="w-4 h-4"/>
                            </button>
                            <button 
                                className="cursor-pointer text-gray-700 hover:text-gray-500"
                                onClick={() => setExpanded(c.summary.classnamecn)}
                            >
                                <Info className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
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
        </div>
    )
}