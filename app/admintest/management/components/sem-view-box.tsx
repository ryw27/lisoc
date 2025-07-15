"use client";
import { useContext, useState } from "react";
import { Info, Pen } from "lucide-react";
import { type studentView } from "@/app/lib/semester/sem-schemas";
import StudentTable from "./student-table";
import SemClassEditor from "./sem-class-editor";
import { type uiClassStudents, OptionContext } from "./sem-view";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { updateArrangement, deleteClass } from "@/app/lib/semester/sem-actions";

type semViewBoxProps = {
    idx: number;
    data: uiClassStudents;
    registrations: studentView[];
    setUIState: React.Dispatch<React.SetStateAction<uiClassStudents[]>>;
    setConfiguring: React.Dispatch<React.SetStateAction<{ editing: boolean, expanded: boolean}[]>>;
    configuring: { editing: boolean, expanded: boolean }[];
}

 

export default function SemesterViewBox({ idx, data, registrations, setUIState, setConfiguring, configuring }: semViewBoxProps) {
    const [moreInfo, setMoreInfo] = useState<boolean>(false);


    const handleDelete = async () => {
        try {
            await deleteClass(data);
            setUIState(prev => prev.filter((_, i) => i !== idx));
        } catch (error) {
            console.error("Failed to delete class:", error);
        }
    };

    return (
        <div
            className={`flex flex-col border-2 border-gray cursor-pointer p-4  transition-colors duration-200 ${configuring[idx].expanded || configuring[idx].editing ? "" : "rounded-md hover:bg-gray-100"}`}
        >
            <div 
                className="flex justify-between" 
                onClick={() => setConfiguring(prev => {
                    const newConfiguring = [...prev];
                    newConfiguring[idx] = {
                        ...newConfiguring[idx],
                        expanded: !newConfiguring[idx].expanded
                    };
                    return newConfiguring;
                })}
            >
                <div className="flex flex-col">
                    <h1 className="text-md text-gray-500">Teacher {data.teacher.namecn}</h1>
                    <h1 className="text-lg font-bold">{data.class.classnamecn}</h1>
                    <h1 className="text-md text-gray-500">Room {data.classroom.roomno}</h1>
                    <h1 className="text-md text-gray-500">Registered: {registrations.length} students</h1>
                    <div className="flex gap-1">
                        <button
                            className="text-md text-gray-500 cursor-pointer"
                            title="Show more class details"
                            onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                setMoreInfo(!moreInfo);
                            }}
                            type="button"
                            tabIndex={0}
                            aria-label="Show more class details"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                        {!moreInfo && <DeleteButton disabled={registrations.length > 0} onDelete={handleDelete} />}
                    </div>
                    {moreInfo && <MoreInfo data={data} />}
                </div>
                <div className="flex gap-2 justify-center items-center">
                    {configuring[idx].expanded && (
                        <button 
                            className="flex gap-2 p-2 bg-blue-800 text-white rounded-md cursor-pointer hover:bg-blue-700"
                        >
                            Disperse
                        </button>

                    )}
                    <button
                        className="flex gap-2 p-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700"
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMoreInfo(false);
                            setConfiguring(prev => {
                                const newConfiguring = [...prev];
                                newConfiguring[idx] = {
                                    ...newConfiguring[idx],
                                    expanded: false,
                                    editing: !newConfiguring[idx].editing
                                };
                                return newConfiguring;
                            });
                        }}
                    >
                        <Pen /> Edit
                    </button>
                </div>
            </div>
            {configuring[idx].expanded && (
                <StudentTable registrations={registrations}/>
             )}
             
             {configuring[idx].editing && (
                <SemClassEditor cancelEdit={() => setConfiguring(prev => {
                    const newConfiguring = [...prev];
                    newConfiguring[idx] = {
                        ...newConfiguring[idx],
                        editing: false
                    };
                    return newConfiguring;
                })} setUIState={setUIState} setConfiguring={setConfiguring} editClass={updateArrangement} idx={idx} data={data}/>
             )}

        </div>
    )
}

function MoreInfo({ data }: { data: uiClassStudents }) {
    return (
        <div className="flex flex-col">
            <h1 className="text-md text-gray-500">Age Limit: {data.agelimit || "N/A"}</h1>
            <h1 className="text-md text-gray-500">Suitable Term: {data.suitableterm.suitabletermcn || "N/A"}</h1>
            <h1 className="text-md text-gray-500">Waive Reg Fee: {data.waiveregfee ? "Yes" : "No"}</h1>
            <h1 className="text-md text-gray-500">Close Registration: {data.closeregistration ? "Yes" : "No"}</h1>
            <h1 className="text-md text-gray-500">Seat Limit: {data.seatlimit || "N/A"}</h1>
            <h1 className="text-md text-gray-500">Tuition: {data.tuitionW || "N/A"}</h1>
            <h1 className="text-md text-gray-500">Special Fee: {data.specialfeeW || "N/A"}</h1>
            <h1 className="text-md text-gray-500">Book Fee: {data.bookfeeW || "N/A"}</h1>
            <h1 className="text-md text-gray-500">Tuition: {data.tuitionH || "N/A"}</h1>
            <h1 className="text-md text-gray-500">Special Fee: {data.specialfeeH || "N/A"}</h1>
            <h1 className="text-md text-gray-500">Book Fee: {data.bookfeeH || "N/A"}</h1>
            <h1 className="text-md text-gray-500">Notes: {data.notes || "N/A"}</h1>
        </div>
    )
}


function DeleteButton({ disabled, onDelete }: { disabled: boolean, onDelete: () => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button
                    type="button"
                    className={`text-md text-gray-500 rounded-md hover:text-red-600 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                    onClick={e => e.stopPropagation()}
                    title={disabled ? "Registrations present, deletion not allowed" : "Delete this class"}
                    disabled={disabled}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you sure you want to delete this class?
                    </AlertDialogTitle>
                </AlertDialogHeader>
                <div className="text-sm text-gray-600 mb-4">
                    This action cannot be undone. This will permanently remove the class arrangement and all associated registrations from the system.
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel className="cursor-pointer" onClick={e => e.stopPropagation()}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                        onClick={e => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
