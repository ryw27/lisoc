"use client";
import { Edit, PlusIcon, Trash } from 'lucide-react';
import { NodeNextRequest } from 'next/dist/server/base-http/node';
import { useState } from 'react';

type classEditor = {
    classnamecn: string;
    teacher: string;
    classroom: string;
    price: string;
    isEditing: boolean;
}
type semesterClassesProps = {
    classes: classEditor[]
}
export default function SemesterClasses({classes} : semesterClassesProps) {
    const [draftClasses, setDraftClasses] = useState<classEditor[]>(classes);
    
    const setEditing = (className: string) => {
        setDraftClasses(prevClasses => 
            prevClasses.map(c => ({
                ...c,
                isEditing: c.classnamecn === className ? !c.isEditing : false
            }))
        );
    }

    const deleteSemClass = (className: string) => {
        setDraftClasses(prevClasses => 
            prevClasses.filter(c => c.classnamecn !== className)
        )
    }

    const addSemClass = () => {
        setDraftClasses(prevClasses => 
            [...prevClasses, {
                classnamecn: "",
                teacher: "",
                classroom: "",
                price: "",
                isEditing: true
            }]
        )
    }

    return (
        <div className="flex flex-col gap-1">
            {/* individual classes */}
            {draftClasses.map((c: classEditor) => (
                <div key={c.classnamecn} className="flex flex-col rounded-md p-2 border-gray-500 border-1">
                    <div className="flex flex-col">
                        {c.isEditing ? (
                            <div className="flex flex-col gap-2">
                                <input 
                                    type="text" 
                                    value={c.classnamecn}
                                    className="border rounded p-1"
                                    onChange={(e) => {
                                        setDraftClasses(prev => 
                                            prev.map(cls => 
                                                cls.classnamecn === c.classnamecn 
                                                    ? {...cls, classnamecn: e.target.value}
                                                    : cls
                                            )
                                        );
                                    }}
                                />
                                <input 
                                    type="text" 
                                    value={c.teacher}
                                    className="border rounded p-1"
                                    onChange={(e) => {
                                        setDraftClasses(prev => 
                                            prev.map(cls => 
                                                cls.classnamecn === c.classnamecn 
                                                    ? {...cls, teacher: e.target.value}
                                                    : cls
                                            )
                                        );
                                    }}
                                />
                                <input 
                                    type="text" 
                                    value={c.classroom}
                                    className="border rounded p-1"
                                    onChange={(e) => {
                                        setDraftClasses(prev => 
                                            prev.map(cls => 
                                                cls.classnamecn === c.classnamecn 
                                                    ? {...cls, classroom: e.target.value}
                                                    : cls
                                            )
                                        );
                                    }}
                                />
                                <input 
                                    type="text" 
                                    value={c.price}
                                    className="border rounded p-1"
                                    onChange={(e) => {
                                        setDraftClasses(prev => 
                                            prev.map(cls => 
                                                cls.classnamecn === c.classnamecn 
                                                    ? {...cls, price: e.target.value}
                                                    : cls
                                            )
                                        );
                                    }}
                                />
                            </div>
                        ) : (
                            <>
                                <p className="font-bold">
                                    {c.classnamecn}
                                </p>
                                <p className="text-gray-800">
                                    Classroom: {c.classroom}
                                </p>
                                <p className="font-bold">
                                    Teacher: {c.teacher}
                                </p>
                                <p className="text-gray-800">
                                    Price: {c.price}
                                </p>
                            </>
                        )}
                        <div className="flex gap-2 mt-2">
                            <button 
                                className="cursor-pointer text-gray-700 hover:text-gray-500"
                                onClick={() => setEditing(c.classnamecn)}
                            >
                                <Edit className="w-4 h-4"/>
                            </button>
                            <button 
                                className="cursor-pointer text-gray-700 hover:text-gray-500"
                                onClick={() => deleteSemClass(c.classnamecn)}
                            >
                                <Trash className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                </div>
            ))} 
            <div className="flex justify-center mt-2">
                <button 
                    className="flex gap-1 text-blue-700 text-sm cursor-pointer"
                    onDoubleClick={() => {addSemClass}}
                >
                    <PlusIcon /> Add Class
                </button>
            </div>
        </div>
    )
}