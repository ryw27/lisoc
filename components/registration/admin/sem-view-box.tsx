"use client";

import { useRegistrationContext } from "@/components/registration/registration-context";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { adminDistribute } from "@/server/registration/actions/adminDistribute";
import { adminRollback } from "@/server/registration/actions/adminRollback";
import { deleteArrangement } from "@/server/seasons/actions/deleteArrangement";
import { type arrangeClasses, type IdMaps } from "@/types/shared.types";
import { Edit, Info, Trash2 } from "lucide-react";
import React, { useState } from "react";
import SemClassEditor from "./sem-class-editor";
import StudentTable from "./sem-student-table";
import { type Action, type fullRegID, type fullSemDataID } from "./sem-view";

//import { useRouter } from 'next/navigation';

type semViewBoxProps = {
    uuid: string;
    dataWithStudents: fullRegID;
    dispatch: React.Dispatch<Action>;
    reducerState: fullSemDataID;
    allClasses: arrangeClasses[];
};

// TODO: Create new classes if out of capacity?
function distributeEvenly(data: fullRegID) {
    // Create deep copy to avoid mutating original
    const newData = structuredClone(data);
    const availableSeats = newData.classrooms
        .map((c) => ({
            available: (c.arrinfo.seatlimit || 0) - c.students.length,
        }))
        .filter((c) => c.available > 0);
    if (availableSeats.length === 0) {
        throw new Error("No available seats");
    }

    const moved = [];

    const totalAvailable = availableSeats.reduce((sum, c) => sum + c.available, 0);
    if (totalAvailable < newData.students.length) {
        throw new Error("Not enough available seats for all students");
    }

    let classIndex = 0;
    while (newData.students.length > 0) {
        const cur = newData.students.shift()!; // Remove first student
        while (availableSeats[classIndex].available === 0) {
            classIndex = (classIndex + 1) % availableSeats.length;
        }
        newData.classrooms[classIndex].students.push(cur);
        availableSeats[classIndex].available -= 1;

        moved.push({
            studentid: cur.studentid,
            toarrangeid: newData.classrooms[classIndex].arrinfo.arrangeid as number,
            toclassid: newData.classrooms[classIndex].arrinfo.classid,
        });
        classIndex = (classIndex + 1) % availableSeats.length;
    }

    return { moved, newData };
}

function rollbackReg(data: fullRegID) {
    const newData = structuredClone(data);
    const allStudents = data.classrooms.flatMap((c) => c.students);

    newData.students = [...newData.students, ...allStudents];
    newData.classrooms.map((c) => (c.students = []));
    return newData;
}

export default function SemesterViewBox({
    uuid,
    dataWithStudents,
    dispatch,
    reducerState,
    allClasses,
}: semViewBoxProps) {
    const { seasons, selectOptions, idMaps } = useRegistrationContext();
    const [editing, setEditing] = useState<boolean>(false);
    const [expanded, setExpanded] = useState<boolean>(false);
    const [moreInfo, setMoreInfo] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [classShown, setClassShown] = useState<number>(-1); // Index, -1 is the reg class
    //  const router = useRouter();

    const handleDelete = async () => {
        const snapshot = dataWithStudents;

        console.log("current classrom classshown", classShown);
        //        return ;
        try {
            if (classShown === -1) {
                dispatch({ type: "reg/remove", id: uuid });
            } else {
                dispatch({
                    type: "class/remove",
                    id: uuid,
                    arrangeid:
                        classShown == -1
                            ? (dataWithStudents.arrinfo.arrangeid ?? 0)
                            : (allClassrooms[classShown].arrinfo.arrangeid ?? 0),
                    selection: selectOptions,
                });
            }

            const adminOverride = false;
            const classTobeDeleted =
                classShown == -1 ? regClassInfo : allClassrooms[classShown].arrinfo;

            await deleteArrangement(classTobeDeleted, adminOverride); // Server mutation
            //router.refresh();
            setClassShown(-1);
        } catch (error) {
            console.error("Failed to delete class:", error);
            dispatch({ type: "reg/add", regDraft: snapshot });
        }
    };

    const distribute = async () => {
        const snapshot = dataWithStudents;
        try {
            const { moved, newData } = distributeEvenly(dataWithStudents);
            dispatch({ type: "reg/distribute", id: uuid, newDistr: newData });
            // Remove the id property before passing to distributeStudents
            const { id: _id, ...distributedDataWithoutId } = newData;
            void _id; // Suppress unused variable warning
            await adminDistribute(distributedDataWithoutId, moved);
            setError(null);
        } catch (err) {
            dispatch({ type: "reg/distribute", id: uuid, newDistr: snapshot });
            setError("Failed to distribute students, please check the seat limit");
            console.error(err);
        }
    };

    const rollback = async () => {
        const snapshot = dataWithStudents;
        try {
            const newData = rollbackReg(dataWithStudents);
            dispatch({ type: "reg/distribute", id: uuid, newDistr: newData });
            const { id: _id, ...dataWithoutID } = dataWithStudents;
            void _id; // Suppress unused variable warning
            await adminRollback(dataWithoutID);
            setError(null);
        } catch (err) {
            dispatch({ type: "reg/distribute", id: uuid, newDistr: snapshot });
            setError("Failed to rollback distribution");
            console.error(err);
        }
    };

    const regClassInfo = dataWithStudents.arrinfo;
    const allClassrooms = dataWithStudents.classrooms;
    //  const availablerooms = dataWithStudents.availablerooms;
    const regStudents = dataWithStudents.students;
    const droppedStudents = dataWithStudents.dropped;

    const totalPrice =
        regClassInfo.suitableterm === 2
            ? Number(dataWithStudents.arrinfo.tuitionH ?? 0) +
              Number(dataWithStudents.arrinfo.bookfeeH ?? 0) +
              Number(dataWithStudents.arrinfo.specialfeeH ?? 0)
            : Number(dataWithStudents.arrinfo.tuitionW ?? 0) +
              Number(dataWithStudents.arrinfo.bookfeeW ?? 0) +
              Number(dataWithStudents.arrinfo.specialfeeW ?? 0);

    const totalRegistrations =
        regStudents.length +
        allClassrooms.reduce(
            (acc, c) => acc + (Array.isArray(c.students) ? c.students.length : 0),
            0
        );

    const classTerm =
        regClassInfo.suitableterm === 2
            ? regClassInfo.seasonid === seasons.spring.seasonid
                ? "Spring"
                : "Fall"
            : "Full Year";
    return (
        <div
            className={`border-gray flex cursor-pointer flex-col border-2 p-4 transition-colors duration-200 ${expanded || editing ? "" : "rounded-md hover:bg-gray-100"}`}
            onClick={() => setExpanded(!expanded)}
        >
            {/* Name and Price */}
            <div className="flex justify-between">
                <h1 className="text-md font-bold">
                    {idMaps.classMap[regClassInfo.classid].classnamecn}
                </h1>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="cursor-pointer rounded-md bg-red-50 px-3 py-1 font-semibold text-red-700 transition-colors hover:bg-red-100 focus:ring-2 focus:ring-red-400 focus:outline-none"
                        title="Rollback distribution"
                        tabIndex={0}
                        aria-label="Disperse students"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            rollback();
                        }}
                    >
                        Rollback
                    </button>
                    <button
                        type="button"
                        className="cursor-pointer rounded-md bg-blue-50 px-3 py-1 font-semibold text-blue-700 transition-colors hover:bg-blue-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        title="Disperse students into classrooms"
                        tabIndex={0}
                        aria-label="Disperse students"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            distribute();
                        }}
                    >
                        Distribute
                    </button>
                    <h1 className="text-md font-bold">${totalPrice}</h1>
                </div>
            </div>
            <div className="flex self-end">
                {error && <p className="text-md text-red-500">{error}</p>}
            </div>

            <div className="flex">
                <p className="text-md text-gray-600">Registrations: {totalRegistrations}</p>
            </div>
            {/* Term and Edit + Trash buttons */}
            <div className="flex justify-between">
                <h1 className="text-md">{classTerm}</h1>
                <div className="flex gap-1">
                    {/* Edit */}
                    <button
                        className="cursor-pointer p-2 text-gray-600 hover:text-blue-700"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setExpanded(false);
                            setMoreInfo(false);
                            setEditing(true);
                        }}
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    {/* Delete */}
                    <DeleteButton
                        disabled={
                            classShown == -1
                                ? allClassrooms.length == 0 && regStudents.length == 0
                                    ? false
                                    : true
                                : allClassrooms
                                  ? allClassrooms[classShown]?.students.length > 0
                                  : true
                        }
                        onDelete={handleDelete}
                    />
                </div>
            </div>
            {/* More Info button */}
            <div className="flex justify-between">
                <button
                    className="text-md cursor-pointer text-gray-500"
                    title="Show more class details"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMoreInfo(!moreInfo);
                        setExpanded(false);
                    }}
                    type="button"
                    tabIndex={0}
                    aria-label="Show more class details"
                >
                    <Info className="h-4 w-4" />
                </button>
                {/* <div className="bg-green-500 rounded-md text-xs font-bold p-2">
                    Automatic Distribution: Off
                </div> */}
            </div>
            {/* More Info Box */}
            {moreInfo && <MoreInfo data={dataWithStudents} idMaps={idMaps} />}
            {/* Student Registrations View */}
            {expanded && (
                <div className="flex flex-col space-y-2">
                    <nav className="flex space-x-6 border-b">
                        {/* Registrations */}
                        <div
                            className={cn(
                                "cursor-pointer border-b-2 border-transparent px-1 py-3 transition-colors",
                                classShown === -1 && "border-blue-500 text-blue-600"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                setClassShown(-1);
                            }}
                        >
                             { idMaps.classMap[regClassInfo.classid].classnamecn || "Registrations"}
                        </div>
                        {/* Classrooms */}
                        {allClassrooms.map((c, idx) => (
                            <div
                                key={`${idx}-${c.arrinfo.arrangeid}`}
                                className={cn(
                                    "cursor-pointer border-b-2 border-transparent px-1 py-3 transition-colors",
                                    classShown === idx && "border-blue-500 text-blue-600"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setClassShown(idx);
                                }}
                            >
                                {/*`Class ${idx + 1}`*/}
                                {idMaps.classMap[c.arrinfo.classid].classnamecn}
                            </div>
                        ))}
                        {/* Dropped */}
                        <div
                            className={cn(
                                "cursor-pointer border-b-2 border-transparent px-1 py-3 transition-colors",
                                classShown === allClassrooms.length &&
                                    "border-blue-500 text-blue-600"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                setClassShown(allClassrooms.length);
                            }}
                        >
                            Dropped {/* idMaps.classMap[regClassInfo.classid].classnamecn */}
                        </div>
                    </nav>
                    {classShown !== -1 && classShown !== allClassrooms.length && (
                        <div className="grid grid-cols-3">
                            <p>
                                Teacher:{" "}
                                {idMaps.teacherMap[
                                    dataWithStudents.classrooms[classShown].arrinfo.teacherid
                                ].namecn || "N/A"}
                            </p>
                            <p>
                                Room:{" "}
                                {idMaps.roomMap[
                                    dataWithStudents.classrooms[classShown].arrinfo.roomid
                                ].roomno || "N/A"}
                            </p>
                            <p>
                                Seat Limit:{" "}
                                {dataWithStudents.classrooms[classShown].arrinfo.seatlimit || "N/A"}
                            </p>
                        </div>
                    )}
                    <StudentTable
                        // uuid={uuid}
                        dispatch={dispatch}
                        reducerState={reducerState}
                        curClass={dataWithStudents}
                        registrations={
                            classShown === -1
                                ? regStudents
                                : classShown === allClassrooms.length
                                  ? droppedStudents
                                  : allClassrooms[classShown].students
                        }
                        allClasses={allClasses}
                    />
                </div>
            )}
            {/* Class Editor */}
            {editing && (
                <SemClassEditor
                    uuid={uuid}
                    initialData={dataWithStudents}
                    dispatch={dispatch}
                    endEdit={() => setEditing(false)}
                />
            )}
        </div>
    );
}

function MoreInfo({ data, idMaps }: { data: fullRegID; idMaps: IdMaps }) {
    const teachers =
        data.classrooms.map((c) => idMaps.teacherMap[c.arrinfo.teacherid].namecn).join(", ") ||
        "No Teachers assigned";
    const rooms =
        data.classrooms.map((c) => idMaps.roomMap[c.arrinfo.roomid].roomno).join(", ") ||
        "No Rooms assigned";
    const seatlimit =
        data.classrooms.reduce((sum, c) => sum + (c.arrinfo.seatlimit || 0), 0) || "0";
    return (
        <div className="mt-4 rounded-lg border bg-gray-50 p-3">
            <h4 className="mb-2 font-semibold text-gray-700">Additional Details</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="col-span-3">
                    <span className="text-gray-600">Teachers:</span>
                    <span className="ml-2 font-medium">{teachers}</span>
                </div>
                <div className="col-span-3">
                    <span className="text-gray-600">Rooms:</span>
                    <span className="ml-2 font-medium">{rooms}</span>
                </div>
                {data.arrinfo.suitableterm !== 2 && (
                    <>
                        <div>
                            <span className="text-gray-600">Tuition (Whole Year):</span>
                            <span className="ml-2 font-medium">${data.arrinfo.tuitionW || 0}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Book Fee (Whole Year):</span>
                            <span className="ml-2 font-medium">${data.arrinfo.bookfeeW || 0}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Special Fee (Whole Year):</span>
                            <span className="ml-2 font-medium">
                                ${data.arrinfo.specialfeeW || 0}
                            </span>
                        </div>
                    </>
                )}

                <div>
                    <span className="text-gray-600">Tuition (Half Year):</span>
                    <span className="ml-2 font-medium">${data.arrinfo.tuitionH || 0}</span>
                </div>
                <div>
                    <span className="text-gray-600">Book Fee (Half Year):</span>
                    <span className="ml-2 font-medium">${data.arrinfo.bookfeeH || 0}</span>
                </div>

                <div>
                    <span className="text-gray-600">Special Fee (Half Year):</span>
                    <span className="ml-2 font-medium">${data.arrinfo.specialfeeH || 0}</span>
                </div>
                <div>
                    <span className="text-gray-600">Seat Limit:</span>
                    <span className="ml-2 font-medium">{seatlimit}</span>
                </div>
                <div>
                    <span className="text-gray-600">Age Limit:</span>
                    <span className="ml-2 font-medium">{data.arrinfo.agelimit || 0}</span>
                </div>
                <div>
                    <span className="text-gray-600">Class Time:</span>
                    <span className="ml-2 font-medium">
                        {idMaps.timeMap[data.arrinfo.timeid]?.period || "No Time"}
                    </span>
                </div>
                <div>
                    <span className="text-gray-600">Waive Registration Fee:</span>
                    <span className="ml-2 font-medium">
                        {data.arrinfo.waiveregfee ? "Yes" : "No"}
                    </span>
                </div>
                <div>
                    <span className="text-gray-600">Close Registration:</span>
                    <span className="ml-2 font-medium">
                        {data.arrinfo.closeregistration ? "Yes" : "No"}
                    </span>
                </div>
                <div>
                    <span className="text-gray-600">Notes:</span>
                    <span className="ml-2 font-medium">{data.arrinfo.notes || "No Notes"}</span>
                </div>
            </div>
        </div>
    );
}

function DeleteButton({ disabled, onDelete }: { disabled: boolean; onDelete: () => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button
                    type="button"
                    className={`text-md rounded-md text-gray-500 hover:text-red-600 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                    onClick={(e) => e.stopPropagation()}
                    title={
                        disabled
                            ? "Registrations present, deletion not allowed"
                            : "Delete this class"
                    }
                    disabled={disabled}
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this class?</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="mb-4 text-sm text-gray-600">
                    This action cannot be undone. This will permanently remove the class arrangement
                    and all associated registrations from the system.
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        className="cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="cursor-pointer bg-red-600 text-white hover:bg-red-700"
                        onClick={(e) => {
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
