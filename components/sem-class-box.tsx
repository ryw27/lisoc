"use client";

import { Edit, Trash, Info } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectValue, SelectTrigger, SelectItem } from "./ui/select";
import { type classExpanded } from '@/app/lib/semester/sem-schemas';


type classBoxProps = {
    c: classExpanded;
    setDraftClasses: React.Dispatch<React.SetStateAction<classExpanded[]>>;
    setEditing: (classname: string) => void;
    setExpanded: (classname: string) => void;
    deleteSemClass: (classname: string) => void;
}
export default function SemesterClassBox({
    c,
    setDraftClasses,
    setEditing,
    setExpanded,
    deleteSemClass
}: classBoxProps) {
    const summary = c.summary;
    return (
        <div className="flex flex-col">
            {summary.isEditing ? (
                <div>
                    <label className="block text-sm text-gray-400 font-bold mb-2">Class Name</label>
                    <Input
                        type="text" 
                        value={summary.classnamecn}
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
                        disabled
                    />

                    <label className="block text-sm text-gray-400 font-bold mb-2">Teacher</label>
                    <Select
                        value={summary.teacher}
                        onValueChange={(value: string) => {
                            setDraftClasses(prev =>
                                prev.map(cls =>
                                    cls.summary.classnamecn === c.summary.classnamecn
                                        ? { ...cls, summary: { ...cls.summary, teacher: value } }
                                        : cls
                                )
                            );
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a teacher" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                            {/* TODO: Replace with dynamic teacher options */}
                            <SelectItem value="Teacher A">Teacher A</SelectItem>
                            <SelectItem value="Teacher B">Teacher B</SelectItem>
                            <SelectItem value="Teacher C">Teacher C</SelectItem>
                        </SelectContent>
                    </Select>
                    <label className="block text-sm text-gray-400 font-bold mb-2">Classroom</label>
                    <Input
                        type="text" 
                        value={summary.classroom}
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
                    <label className="block text-sm text-gray-400 font-bold mb-2">Tuition</label>
                    <Input
                        type="text" 
                        value={c.tuition}
                        className="border rounded p-1"
                        onChange={(e) => {
                            setDraftClasses(prev => 
                                prev.map(cls => 
                                    cls.summary.classnamecn === c.summary.classnamecn 
                                        ? {...cls, summary: {...summary, totalPrice: e.target.value + c.book_fee }, tuition: e.target.value}
                                        : cls
                                )
                            );
                        }}
                    />

                    <label className="block text-sm text-gray-400 font-bold mb-2">Book Fee</label>
                    <Input
                        type="text" 
                        value={c.tuition}
                        className="border rounded p-1"
                        onChange={(e) => {
                            setDraftClasses(prev => 
                                prev.map(cls => 
                                    cls.summary.classnamecn === c.summary.classnamecn 
                                        ? {...cls, summary: {...summary, totalPrice: e.target.value + c.book_fee }, tuition: e.target.value}
                                        : cls
                                )
                            );
                        }}
                    />
                    <label className="block text-sm text-gray-400 font-bold mb-2">Seat Limit</label>
                    <Input
                        type="text" 
                        value={c.seat_limit}
                        className="border rounded p-1"
                        onChange={(e) => {
                            setDraftClasses(prev => 
                                prev.map(cls => 
                                    cls.summary.classnamecn === c.summary.classnamecn 
                                        ? {...cls, summary: {...summary, totalPrice: e.target.value + c.book_fee }, tuition: e.target.value}
                                        : cls
                                )
                            );
                        }}
                    />
                    <label className="block text-sm text-gray-400 font-bold mb-2">Age Limit</label>
                    <Input
                        type="text" 
                        value={c.agelimit}
                        className="border rounded p-1"
                        onChange={(e) => {
                            setDraftClasses(prev => 
                                prev.map(cls => 
                                    cls.summary.classnamecn === c.summary.classnamecn 
                                        ? {...cls, summary: {...summary, totalPrice: e.target.value + c.book_fee }, tuition: e.target.value}
                                        : cls
                                )
                            );
                        }}
                    />
                    <label className="block text-sm text-gray-400 font-bold mb-2">Class Time</label>
                    <Input
                        type="text" 
                        value={c.class_time}
                        className="border rounded p-1"
                        onChange={(e) => {
                            setDraftClasses(prev => 
                                prev.map(cls => 
                                    cls.summary.classnamecn === c.summary.classnamecn 
                                        ? {...cls, summary: {...summary, totalPrice: e.target.value + c.book_fee }, tuition: e.target.value}
                                        : cls
                                )
                            );
                        }}
                    />
                    <div className="flex gap-2 mt-2">
                        <button 
                            type="button" 
                            className="rounded-md text-sm flex items-center border-gray-300 border-1 font-semibold hover:bg-gray-50 cursor-pointer p-2"
                            onClick={() => setEditing(summary.classnamecn)}
                        >
                            Cancel
                        </button>
                        {summary.isEditing && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button 
                                        className="rounded-md bg-blue-600 text-white text-sm flex items-center gap-1 hover:bg-blue-800 font-semibold cursor-pointer p-2"
                                    >
                                        Edit 
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Class Edit</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to edit this class?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={async (e) => {
                                                // TODO: Implement semester start logic
                                                setEditing(summary.classnamecn)
                                            }}
                                            className="bg-green-600 hover:bg-green-700"
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
                <div>
                    <p className="font-bold">
                        {c.summary.classnamecn}
                    </p>
                    <p className="text-gray-800">
                        Classroom: Room {c.summary.classroom}
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
                </div>
            )}
            {!summary.isEditing && (

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
            )}

            
        </div>
    )
}