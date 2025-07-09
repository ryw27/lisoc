"use client";

import { Edit, Trash, Info } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectValue, SelectTrigger, SelectItem } from "./ui/select";
import { type draftClasses, semClassesSchema } from '@/app/lib/semester/sem-schemas';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import React, { useMemo } from 'react';


type classBoxProps = {
    field: draftClasses;
    idx: number;
    selectOptions: any; // TODO: Check same place in form parent 
    setDraftClasses: React.Dispatch<React.SetStateAction<draftClasses[]>>;
    configuring: {isEditing: boolean, isExpanded: boolean};
    setConfiguring: React.Dispatch<React.SetStateAction<{isEditing: boolean, isExpanded: boolean}[]>>;
    deleteSemClass: (index: number) => void;
}



export default function SemesterClassBox({
    field,
    idx,
    selectOptions,
    setDraftClasses,
    configuring,
    setConfiguring,
    deleteSemClass
}: classBoxProps) {
    const { setValue } = useFormContext<z.infer<typeof semClassesSchema>>();
    
    const onEdit = (edit: boolean) => {
        setConfiguring(prev => {
            const newConfiguring = [...prev];
            newConfiguring[idx] = {
                ...newConfiguring[idx],
                isEditing: edit 
            };
            return newConfiguring;
        })
    }

    const onExpand = (expand: boolean) => {
        setConfiguring(prev => {
            const newConfiguring = [...prev];
            newConfiguring[idx] = {
                ...newConfiguring[idx],
                isExpanded: expand 
            };
            return newConfiguring;
        });
    }

    const onDelete = () => {
        deleteSemClass(idx);
    }

    const idToClass = useMemo(() => {
        const m = new Map<number, string>();
        selectOptions.classes.forEach((c: { classid: number, classnamecn: string }) => m.set(c.classid, c.classnamecn))
        return m;
    }, [selectOptions.classes]);

    const idToTeacher = useMemo(() => {
        const m = new Map<number, string>();
        selectOptions.teachers.forEach((t: { teacherid: number, namecn: string }) => m.set(t.teacherid, t.namecn))
        return m;
    }, [selectOptions.teachers]);

    const idToRoom = useMemo(() => {
        const m = new Map<number, string>();
        selectOptions.rooms.forEach((r: { roomid: number, roomno: string }) => m.set(r.roomid, r.roomno))
        return m;
    }, [selectOptions.rooms]);

    const idToTime = useMemo(() => {
        const m = new Map<number, string>();
        selectOptions.times.forEach((t: { timeid: number, period: string }) => m.set(t.timeid, t.period))
        return m;
    }, [selectOptions.times]);

    const editing = configuring.isEditing;
    const expanded = configuring.isExpanded;


    return (
        <div className="flex flex-col">
            {/* Editing */}
            {editing ? (
                <div>
                    <label className="block text-sm text-gray-400 font-bold mb-2">Class Name</label>
                    <Select
                        onValueChange={(value: string) => {
                            setValue(`classes.${idx}.classid`, Number(value));
                            setDraftClasses(prev => {
                                const newClasses = [...prev];
                                newClasses[idx] = {
                                    ...newClasses[idx],
                                    class: {
                                        classid: Number(value),
                                        classnamecn: idToClass.get(Number(value)) || "Class not found"
                                    }
                                };
                                // console.log(newClasses[idx]);
                                return newClasses;
                            })
                        }}
                        defaultValue={field.class.classid.toString()}
                    >
                        <SelectTrigger className="w-full border rounded p-1">
                            <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                            {selectOptions.classes.map((obj: { classid: number; classnamecn: string }) => (
                                <SelectItem key={obj.classid} value={obj.classid.toString()}>
                                    {obj.classnamecn}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <label className="block text-sm text-gray-400 font-bold mb-2">Teacher</label>
                    <Select
                        defaultValue={field.teacher.teacherid.toString()}
                        onValueChange={(value: string) => {
                            setValue(`classes.${idx}.teacherid`, Number(value));
                            setDraftClasses(prev => {
                                const newClasses = [...prev];
                                newClasses[idx] = {
                                    ...newClasses[idx],
                                    teacher: {
                                        teacherid: Number(value),
                                        namecn: idToTeacher.get(Number(value)) || "Teacher not found"
                                    }
                                };
                                // console.log(newClasses[idx]);
                                return newClasses;
                            })
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a teacher" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                            {selectOptions.teachers.map((obj: { teacherid: number; namecn: string }) => (
                                <SelectItem key={obj.teacherid} value={obj.teacherid.toString()}>{obj.namecn}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <label className="block text-sm text-gray-400 font-bold mb-2">Classroom</label>
                    <Select
                        defaultValue={field.classroom.roomid.toString()}
                        onValueChange={(value: string) => {
                                setValue(`classes.${idx}.roomid`, Number(value));
                                setDraftClasses(prev => {
                                    const newClasses = [...prev];
                                    newClasses[idx] = {
                                        ...newClasses[idx],
                                        classroom: {
                                            roomid: Number(value),
                                            roomno: idToRoom.get(Number(value)) || "Room not found"
                                        }
                                    };
                                    // console.log(newClasses[idx]);
                                    return newClasses;
                                })
                            }
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a classroom" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                            {selectOptions.rooms.map((obj: { roomid: number; roomno: string }) => (
                                <SelectItem key={obj.roomid} value={obj.roomid.toString()}>{obj.roomno}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <label className="block text-sm text-gray-400 font-bold mb-2">Tuition (Whole Year)</label>
                    <Input
                        type="number" 
                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setValue(`classes.${idx}.tuitionW`, Number(e.target.value));
                            setDraftClasses(prev => {
                                const newClasses = [...prev];
                                newClasses[idx] = {
                                    ...newClasses[idx],
                                    tuitionW: (e.target.value)
                                };
                                // console.log(newClasses[idx]);
                                return newClasses;
                            })
                        }}
                        defaultValue={field.tuitionW.toString()}
                        className="border rounded p-1"
                    />

                    <label className="block text-sm text-gray-400 font-bold mb-2">Book Fee (Whole Year)</label>
                    <Input
                        type="number" 
                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setValue(`classes.${idx}.bookfeeW`, Number(e.target.value));
                            setDraftClasses(prev => {
                                const newClasses = [...prev];
                                newClasses[idx] = {
                                    ...newClasses[idx],
                                    bookfeeW: (e.target.value)
                                };
                                // console.log(newClasses[idx]);
                                return newClasses;
                            })
                        }}
                        defaultValue={field.bookfeeW.toString()}
                        className="border rounded p-1"
                    />
                    <label className="block text-sm text-gray-400 font-bold mb-2">Special Fee Year (Whole Year) </label>
                    <Input
                        type="number" 
                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setValue(`classes.${idx}.specialfeeW`, Number(e.target.value));
                            setDraftClasses(prev => {
                                const newClasses = [...prev];
                                newClasses[idx] = {
                                    ...newClasses[idx],
                                    specialfeeW: (e.target.value)
                                };
                                return newClasses;
                            })
                        }}
                        defaultValue={field.specialfeeW.toString()}
                        className="border rounded p-1"
                    />
                    <label className="block text-sm text-gray-400 font-bold mb-2">Tuition (Half Year)</label>
                    <Input
                        type="number" 
                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setValue(`classes.${idx}.tuitionH`, Number(e.target.value));
                            setDraftClasses(prev => {
                                const newClasses = [...prev];
                                newClasses[idx] = {
                                    ...newClasses[idx],
                                    tuitionH: (e.target.value)
                                };
                                return newClasses;
                            })
                        }}
                        defaultValue={field.tuitionH.toString()}
                        className="border rounded p-1"
                    />

                    <label className="block text-sm text-gray-400 font-bold mb-2">Book Fee (Half Year)</label>
                    <Input
                        type="number" 
                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setValue(`classes.${idx}.bookfeeH`, Number(e.target.value));
                            setDraftClasses(prev => {
                                const newClasses = [...prev];
                                newClasses[idx] = {
                                    ...newClasses[idx],
                                    bookfeeH: (e.target.value)
                                };
                                return newClasses;
                            })
                        }}
                        defaultValue={field.bookfeeH.toString()}
                        className="border rounded p-1"
                    />
                    <label className="block text-sm text-gray-400 font-bold mb-2">Special Fee (Half Year) </label>
                    <Input
                        type="number" 
                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setValue(`classes.${idx}.specialfeeH`, Number(e.target.value));
                            setDraftClasses(prev => {
                                const newClasses = [...prev];
                                newClasses[idx] = {
                                    ...newClasses[idx],
                                    specialfeeH: (e.target.value)
                                };
                                return newClasses;
                            })
                        }}
                        defaultValue={field.specialfeeH.toString()}
                        className="border rounded p-1"
                    />

                    <label className="block text-sm text-gray-400 font-bold mb-2">Seat Limit</label>
                    <Input
                        type="number" 
                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setValue(`classes.${idx}.seatlimit`, Number(e.target.value));
                            setDraftClasses(prev => {
                                const newClasses = [...prev];
                                newClasses[idx] = {
                                    ...newClasses[idx],
                                    seatlimit: Number(e.target.value)
                                };
                                return newClasses;
                            })
                        }}
                        defaultValue={field.seatlimit?.toString() || 0}
                        className="border rounded p-1"
                    />
                    <label className="block text-sm text-gray-400 font-bold mb-2">Age Limit</label>
                    <Input
                        type="number" 
                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setValue(`classes.${idx}.agelimit`, Number(e.target.value));
                            setDraftClasses(prev => {
                                const newClasses = [...prev];
                                newClasses[idx] = {
                                    ...newClasses[idx],
                                    agelimit: Number(e.target.value)
                                };
                                return newClasses;
                            })
                        }}
                        defaultValue={field.agelimit?.toString() || 0}
                        className="border rounded p-1"
                    />
                    <label className="block text-sm text-gray-400 font-bold mb-2">Class Time</label>
                    <Select
                        defaultValue={field.classtime.timeid.toString()}
                        onValueChange={(value: string) => {
                            setValue(`classes.${idx}.timeid`, Number(value));
                            setDraftClasses(prev => {
                                const newClasses = [...prev];
                                newClasses[idx] = {
                                    ...newClasses[idx],
                                    classtime: {
                                        timeid: Number(value),
                                        period: idToTime.get(Number(value)) || "Time not found"
                                    }
                                };
                                return newClasses;
                            })
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a time" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                            {selectOptions.times.map((time: { timeid: number; period: string }) => (
                                <SelectItem key={time.timeid} value={time.timeid.toString()}>
                                    {time.period}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {/* Edit buttons TODO: Change onClick*/} 
                    <div className="flex gap-2 mt-2">
                        <button 
                            type="button" 
                            className="rounded-md text-sm flex items-center border-gray-300 border-1 font-semibold hover:bg-gray-50 cursor-pointer p-2"
                            onClick={() => onEdit(false)}
                        >
                            Cancel
                        </button>
                        {editing && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button 
                                        type="button"
                                        className="rounded-md bg-blue-600 text-white text-sm flex items-center gap-1 hover:bg-blue-800 font-semibold cursor-pointer p-2"
                                    >
                                        Edit 
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Your Changes</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to change this class?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={async (e) => {
                                                onEdit(false)
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                                        >
                                            Confirm Edit 
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col">
                    {/* Not Editing */}
                    <p className="font-bold">
                        {field.class.classnamecn || "No Class Name"}
                    </p>


                    <p className="text-gray-800">
                        Classroom: Room {field.classroom.roomno || "No Classroom"}
                    </p>


                    <p className="font-bold">
                        Teacher: {field.teacher.namecn || "No Teacher"}
                    </p>


                    <p className="text-gray-800">
                        Price: ${Number(field.tuitionW) + Number(field.bookfeeW) + Number(field.specialfeeW) || 0}
                    </p>
                    {/* Hidden inputs for form */}
                    {/* <input type="hidden" {...register(`classes.${idx}.tuitionW`)}/>
                    <input type="hidden" {...register(`classes.${idx}.bookfeeW`)}/>
                    <input type="hidden" {...register(`classes.${idx}.specialfeeW`)}/>
                    <input type="hidden" {...register(`classes.${idx}.tuitionH`)}/>
                    <input type="hidden" {...register(`classes.${idx}.bookfeeH`)}/>
                    <input type="hidden" {...register(`classes.${idx}.specialfeeH`)}/>
                    <input type="hidden" {...register(`classes.${idx}.classtime`)}/> */}
                 

                    {expanded && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                            <h4 className="font-semibold text-gray-700 mb-2">Additional Details</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-gray-600">Tuition:</span>
                                    <span className="ml-2 font-medium">${field.tuitionW || 0}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Book Fee:</span>
                                    <span className="ml-2 font-medium">${field.bookfeeW || 0}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Special Fee:</span>
                                    <span className="ml-2 font-medium">${field.specialfeeW || 0}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Seat Limit:</span>
                                    <span className="ml-2 font-medium">{field.seatlimit || 0}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Age Limit:</span>
                                    <span className="ml-2 font-medium">{field.agelimit || 0}</span>
                                </div>

                                <div>
                                    <span className="text-gray-600">Class Time:</span>
                                    <span className="ml-2 font-medium">{field.classtime.period || "No Time"}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* buttons */ }
                    <div className="flex gap-2 mt-2">
                        <button 
                            type="button"
                            className="cursor-pointer text-gray-700 hover:text-gray-500"
                            onClick={() => onEdit(!editing)}
                        >
                            <Edit className="w-4 h-4"/>
                    </button>
                        <button 
                            type="button"
                            className="cursor-pointer text-gray-700 hover:text-gray-500"
                            onClick={onDelete}
                        >
                            <Trash className="w-4 h-4"/>
                        </button>
                        <button 
                            type="button"
                            className="cursor-pointer text-gray-700 hover:text-gray-500"
                            onClick={() => onExpand(!expanded)}
                        >
                            <Info className="w-4 h-4"/>
                        </button>
                    </div>
                </div>
            )}

            
        </div>
    )
}


