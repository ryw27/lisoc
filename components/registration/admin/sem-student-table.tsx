"use client";

import React, { useState } from "react";
import {
    ColumnDef,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal, PencilIcon, TrashIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { type adminStudentView } from "@/types/registration.types";
import { type arrangeClasses, type uiClasses } from "@/types/shared.types";
import { adminDropRegistration } from "@/server/registration/regchanges/actions/adminDropRegistration";
import {
    adminTransferStudent,
    adminTransferStudent2,
} from "@/server/registration/regchanges/actions/adminTransferStudent";
import { ClientTable } from "@/components/client-table";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Action, fullRegID, fullSemDataID } from "./sem-view";

const columns: ColumnDef<adminStudentView>[] = [
    {
        accessorKey: "regid",
        header: "RegID",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "familyid",
        header: "Family ID",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "studentid",
        header: "Student ID",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "namecn",
        header: "中文姓名",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "namelasten",
        header: "Last Name",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "namefirsten",
        header: "First Name",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "gender",
        header: "Gender",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "dob",
        header: "Date of Birth",
        cell: ({ getValue }) => {
            const date = getValue() as string;
            return new Date(date).toLocaleDateString();
        },
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "registerDate",
        header: "Register Date",
        cell: ({ getValue }) => {
            const date = getValue() as string;
            return new Date(date).toLocaleDateString();
        },
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "status",
        header: "Status",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "notes",
        header: "Notes",
        sortingFn: "alphanumeric",
    },
];

type studentTableProps = {
    registrations: adminStudentView[];
    curClass: fullRegID;
    reducerState: fullSemDataID;
    dispatch: React.Dispatch<Action>;
    // uuid: string;
    allClasses: arrangeClasses[];
};

// Helper function to find a student in the current class or its classrooms
const findStudentInClass = (regid: number, curClass: fullRegID): adminStudentView | null => {
    // Check main class students first
    const studentInMain = curClass.students.find((s) => s.regid === regid);
    if (studentInMain) return studentInMain;

    // Check classroom students
    for (const classroom of curClass.classrooms) {
        const studentInClassroom = classroom.students.find((s) => s.regid === regid);
        if (studentInClassroom) return studentInClassroom;
    }

    return null;
};

// Helper function to find which classroom contains a student
const findStudentClassroom = (regid: number, curClass: fullRegID) => {
    for (const classroom of curClass.classrooms) {
        const student = classroom.students.find((s) => s.regid === regid);
        if (student) {
            return { classroom, student };
        }
    }
    return null;
};

// Helper function to remove a student from current class/classrooms
const removeStudentFromClass = (regid: number, curClass: fullRegID): fullRegID => {
    return {
        ...curClass,
        students: curClass.students.filter((s) => s.regid !== regid),
        classrooms: curClass.classrooms.map((c) => ({
            ...c,
            students: c.students.filter((s) => s.regid !== regid),
        })),
    };
};

// Helper function for intra-class transfer
const handleIntraClassTransfer = (
    regid: number,
    newArrangeObj: uiClasses & { classkey: number },
    curClass: fullRegID
): fullRegID => {
    const student = findStudentInClass(regid, curClass);
    if (!student) {
        throw new Error("Student not found in current class");
    }

    const studentClassroom = findStudentClassroom(regid, curClass);
    const currentArrangementId =
        studentClassroom?.classroom.arrinfo.arrangeid ?? curClass.arrinfo.arrangeid;

    // Early return if transferring to same arrangement
    if (newArrangeObj.arrangeid === currentArrangementId) {
        return curClass;
    }

    let finalStudents = curClass.students;
    let finalClassrooms = curClass.classrooms;

    if (studentClassroom) {
        // Student is in a classroom, need to remove from there
        if (newArrangeObj.arrangeid === curClass.arrinfo.arrangeid) {
            // Transfer to main class
            finalStudents = [...curClass.students, student];
            finalClassrooms = curClass.classrooms.map((c) =>
                c.arrinfo.arrangeid === currentArrangementId
                    ? { ...c, students: c.students.filter((s) => s.regid !== regid) }
                    : c
            );
        } else {
            // Transfer between classrooms
            finalClassrooms = curClass.classrooms.map((c) => {
                if (c.arrinfo.arrangeid === currentArrangementId) {
                    return { ...c, students: c.students.filter((s) => s.regid !== regid) };
                }
                if (c.arrinfo.arrangeid === newArrangeObj.arrangeid) {
                    student.classid = c.arrinfo.classid; // Update classid
                    return { ...c, students: [...c.students, student] };
                }
                return c;
            });
        }
    } else {
        // Student is in main class
        finalStudents = curClass.students.filter((s) => s.regid !== regid);
        finalClassrooms = curClass.classrooms.map((c) =>
            c.arrinfo.arrangeid === newArrangeObj.arrangeid
                ? { ...c, students: [...c.students, student] }
                : c
        );
    }

    return {
        ...curClass,
        students: finalStudents,
        classrooms: finalClassrooms,
    };
};

// Helper function to update regids after transfer
const updateRegIdInClass = (
    oldRegId: number,
    newRegId: number,
    classData: fullRegID
): fullRegID => {
    return {
        ...classData,
        students: classData.students.map((student) =>
            student.regid === oldRegId ? { ...student, regid: newRegId } : student
        ),
        classrooms: classData.classrooms.map((classroom) => ({
            ...classroom,
            students: classroom.students.map((student) =>
                student.regid === oldRegId ? { ...student, regid: newRegId } : student
            ),
        })),
    };
};

// Helper function to add student to target class with new regid
const addStudentToTargetClass = (
    studentData: adminStudentView,
    newArrangeId: number,
    targetClass: fullRegID
): fullRegID => {
    return {
        ...targetClass,
        students:
            targetClass.arrinfo.arrangeid === newArrangeId
                ? [...targetClass.students, studentData]
                : targetClass.students,
        classrooms: targetClass.classrooms.map((classroom) => ({
            ...classroom,
            students:
                classroom.arrinfo.arrangeid === newArrangeId
                    ? [...classroom.students, studentData]
                    : classroom.students,
        })),
    };
};

function TransferButton({
    student,
    dispatch,
    curClass,
    allClasses,
    reducerState,
}: {
    student: adminStudentView;
    dispatch: React.Dispatch<Action>;
    curClass: fullRegID;
    allClasses: arrangeClasses[];
    reducerState: fullSemDataID;
}) {
    const sname = student.namecn;
    const currCid = student.classid;
    const regid = student.regid;
    const familyid = student.familyid;
    const studentid = student.studentid;
    const curClasskey = curClass.arrinfo.classkey;
    //const currArrangeid = curClass.arrinfo.arrangeid;

    const [selection, setSelection] = useState<string>("");

    const handleTransfer = async () => {
        try {
            // Call the server action
            const newarrangeid = parseInt(selection.toString());
            //const adminOverride = true;
            const newCls: arrangeClasses | undefined = allClasses.find(
                (c) => c.arrangeid === newarrangeid
            );

            const newArrangeObj: uiClasses & { classkey: number } = {
                arrangeid: newarrangeid,
                seasonid: newCls ? newCls.seasonid : 0,
                classid: newCls ? newCls.classid : 0,
                classkey: newCls ? (newCls.classno + 100) * 1000 + newCls.typeid : 0,
                teacherid: 0,
                roomid: 0,
                seatlimit: 0,
                isregclass: false,
                tuitionW: null,
                specialfeeW: null,
                bookfeeW: null,
                tuitionH: null,
                specialfeeH: null,
                bookfeeH: null,
                waiveregfee: false,
                timeid: 0,
                agelimit: null,
                suitableterm: 0,
                closeregistration: false,
                notes: "",
            };
            // make sure phase matches adminTransferStudents
            //const newRegObj =
            const newRegObj = await adminTransferStudent2(
                regid,
                studentid,
                familyid,
                newArrangeObj
            );

            const newClsKey = newCls ? (newCls.classno + 100) * 1000 + newCls.typeid : -1;

            if (newClsKey === curClasskey) {
                // intra-class transfer
                const updatedCurClass = handleIntraClassTransfer(regid, newArrangeObj, curClass);

                const updatedClass = updateRegIdInClass(regid, newRegObj.regid, updatedCurClass);

                //  dispatch({ type: "reg/distribute", id: curClass.id, newDistr: updatedCurClass });
                dispatch({ type: "reg/distribute", id: curClass.id, newDistr: updatedClass });
            } else {
                // Inter-class transfer setup
                //    isInterClassTransfer = true;

                // Class transfer - find target class in reducer state
                const targetClass = reducerState.find(
                    // c => c.arrinfo.arrangeid === newarrangeid
                    (c) => c.id == String(newClsKey)
                );
                if (!targetClass) {
                    throw new Error("Target class not found");
                }

                // Snapshot both classes for rollback
                const sourceSnapshot = { ...curClass };
                const targetSnapshot = { ...targetClass };

                //const newArrangeObj = targetClass.arrinfo;
                const student = findStudentInClass(regid, curClass);

                if (!student) {
                    throw new Error("Student not found in current class");
                }

                // Remove student from current class
                const updatedCurClass = removeStudentFromClass(regid, curClass);
                dispatch({ type: "reg/distribute", id: curClass.id, newDistr: updatedCurClass });

                // Add student to target class
                /*const updatedTargetClass: fullRegID = {
                    ...targetClass,
                    students: [...targetClass.students, student]
                };*/
                //dispatch({ type: "reg/distribute", id: targetClass.id, newDistr: updatedTargetClass });

                // Inter-class transfer: add student to target class with new regid
                /*  if (!sourceSnapshot || !targetSnapshot) {
                      throw new Error("Missing snapshots for inter-class transfer");
                  }*/
                const studentData = findStudentInClass(regid, sourceSnapshot)!;
                studentData.classid = newRegObj.classid; // Update classid to target class
                studentData.regid = newRegObj.regid; // Update regid to new regid
                const updatedTargetClass = addStudentToTargetClass(
                    studentData,
                    newRegObj.arrangeid,
                    targetSnapshot
                );
                dispatch({
                    type: "reg/distribute",
                    id: targetSnapshot.id,
                    newDistr: updatedTargetClass,
                });
            }
        } catch (error) {
            console.error("Transfer failed:", error);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "flex items-center self-start text-left text-sm whitespace-nowrap hover:bg-gray-100",
                        "w-full cursor-pointer rounded-sm p-1 transition-colors duration-200",
                        "gap-1 text-red-500 hover:text-blue-600",
                        "bg-blue-100",
                        "focus:bg-gray-100 focus:outline-none"
                    )}
                    onClick={(e) => e.stopPropagation()}
                    title={"transfer student to another class"}
                    disabled={false}
                >
                    transfer
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Transfer Student {sname} ?</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="mb-4 text-sm text-gray-600">
                    <Select onValueChange={setSelection}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Please Choose Class" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            {allClasses
                                .filter((c) => c.classid !== currCid)
                                .map((cls) => {
                                    return (
                                        <SelectItem
                                            key={cls.classid}
                                            value={cls.arrangeid.toString()}
                                        >
                                            {cls.classnamecn}
                                        </SelectItem>
                                    );
                                })}
                        </SelectContent>
                    </Select>
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
                        disabled={selection === ""}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleTransfer();
                        }}
                    >
                        Transfer
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default function StudentTable({
    registrations,
    reducerState,
    curClass,
    dispatch,
    allClasses,
}: studentTableProps) {
    const { idMaps } = useRegistrationContext();
    const [sorting, setSorting] = useState<SortingState>([
        {
            id: "registerDate",
            desc: true,
        },
    ]);

    const [phase, setPhase] = useState<
        "transfer" | "selectType" | "classTransfer" | "intraTransfer"
    >("transfer");
    const [selectedIds, setSelectedIds] = useState<string>("");
    const [busy, setBusy] = useState<boolean>(false);

    const editColumn: ColumnDef<adminStudentView> = {
        id: "edit",
        header: "",
        cell: ({ row }) => {
            const resetState = () => {
                setBusy(false);
                setPhase("transfer");
                setSelectedIds("");
            };

            const handleTransfer = async () => {
                if (busy) return;
                setBusy(true);

                // Snapshots for rollback
                let sourceSnapshot: fullRegID | null = null;
                let targetSnapshot: fullRegID | null = null;
                let isInterClassTransfer = false;

                try {
                    const regid = row.original.regid;
                    const studentid = row.original.studentid;
                    const familyid = row.original.familyid;
                    const [arrangeIdStr, classIdStr] = selectedIds.split(", ");

                    // Validation
                    if (!arrangeIdStr || !classIdStr) {
                        throw new Error("Please select a valid class");
                    }

                    const newArrangeId = Number(arrangeIdStr);
                    const newClassId = Number(classIdStr);

                    if (isNaN(newArrangeId) || isNaN(newClassId)) {
                        throw new Error("Invalid class selection");
                    }

                    let newArrangeObj: uiClasses & { classkey: number };
                    let updatedCurClass: fullRegID;

                    if (phase === "intraTransfer") {
                        // Snapshot current class for rollback
                        sourceSnapshot = { ...curClass };

                        // Find target arrangement within current class. Either one of the constituents or the reg class
                        newArrangeObj =
                            curClass.classrooms.find((c) => c.arrinfo.arrangeid === newArrangeId)
                                ?.arrinfo ?? curClass.arrinfo;

                        if (!newArrangeObj) {
                            throw new Error("Target arrangement not found");
                        }

                        updatedCurClass = handleIntraClassTransfer(regid, newArrangeObj, curClass);
                        dispatch({
                            type: "reg/distribute",
                            id: curClass.id,
                            newDistr: updatedCurClass,
                        });
                    } else {
                        // Inter-class transfer setup
                        isInterClassTransfer = true;

                        // Class transfer - find target class in reducer state
                        const targetClass = reducerState.find(
                            (c) => c.arrinfo.arrangeid === newArrangeId
                        );

                        if (!targetClass) {
                            throw new Error("Target class not found");
                        }

                        // Snapshot both classes for rollback
                        sourceSnapshot = { ...curClass };
                        targetSnapshot = { ...targetClass };

                        newArrangeObj = targetClass.arrinfo;
                        const student = findStudentInClass(regid, curClass);

                        if (!student) {
                            throw new Error("Student not found in current class");
                        }

                        // Remove student from current class
                        updatedCurClass = removeStudentFromClass(regid, curClass);
                        dispatch({
                            type: "reg/distribute",
                            id: curClass.id,
                            newDistr: updatedCurClass,
                        });

                        // Add student to target class
                        const updatedTargetClass: fullRegID = {
                            ...targetClass,
                            students: [...targetClass.students, student],
                        };
                        dispatch({
                            type: "reg/distribute",
                            id: targetClass.id,
                            newDistr: updatedTargetClass,
                        });
                    }

                    // Call the server action
                    const adminOverride = true;
                    // make sure phase matches adminTransferStudents
                    const newRegObj = await adminTransferStudent(
                        regid,
                        studentid,
                        familyid,
                        newArrangeObj,
                        adminOverride,
                        phase as "intraTransfer" | "classTransfer"
                    );

                    if (phase === "intraTransfer") {
                        // Update the current class with new regid
                        const updatedClass = updateRegIdInClass(
                            regid,
                            newRegObj.regid,
                            updatedCurClass
                        );
                        dispatch({
                            type: "reg/distribute",
                            id: curClass.id,
                            newDistr: updatedClass,
                        });
                    } else {
                        // Inter-class transfer: add student to target class with new regid
                        if (!sourceSnapshot || !targetSnapshot) {
                            throw new Error("Missing snapshots for inter-class transfer");
                        }
                        const studentData = findStudentInClass(regid, sourceSnapshot)!;
                        const updatedTargetClass = addStudentToTargetClass(
                            studentData,
                            newRegObj.regid,
                            targetSnapshot
                        );
                        dispatch({
                            type: "reg/distribute",
                            id: targetSnapshot.id,
                            newDistr: updatedTargetClass,
                        });
                    }

                    resetState();
                } catch (error) {
                    console.error("Transfer failed:", error);
                    // Rollback optimistic updates
                    if (sourceSnapshot) {
                        dispatch({
                            type: "reg/distribute",
                            id: curClass.id,
                            newDistr: sourceSnapshot,
                        });
                    }
                    if (isInterClassTransfer && targetSnapshot) {
                        dispatch({
                            type: "reg/distribute",
                            id: targetSnapshot.id,
                            newDistr: targetSnapshot,
                        });
                    }

                    setBusy(false);
                }
            };

            const handleDeleteReg = async () => {
                if (busy) return;

                // Snapshot current class for rollback
                const snapshot = { ...curClass };

                setBusy(true);
                try {
                    const regid = row.original.regid;
                    const studentid = row.original.studentid;

                    // Remove student from local state immediately for better UX
                    const updatedCurClass = removeStudentFromClass(regid, curClass);
                    dispatch({
                        type: "reg/distribute",
                        id: curClass.id,
                        newDistr: updatedCurClass,
                    });

                    // Call server action
                    const adminOverride = true;
                    await adminDropRegistration(regid, studentid, adminOverride);
                    resetState();
                } catch (error) {
                    console.error("Delete failed:", error);

                    // Rollback optimistic update
                    dispatch({ type: "reg/distribute", id: curClass.id, newDistr: snapshot });
                    setBusy(false);
                }
            };
            return (
                <div>
                    {" "}
                    <TransferButton
                        student={row.original}
                        curClass={curClass}
                        dispatch={dispatch}
                        allClasses={allClasses}
                        reducerState={reducerState}
                    />{" "}
                </div>
            );
            return (
                <Popover>
                    <PopoverTrigger
                        className={cn(
                            "cursor-pointer items-center rounded-md p-1",
                            "border-1 border-gray-300 hover:border-gray-700",
                            "focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        )}
                        aria-label="Row actions"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </PopoverTrigger>
                    <PopoverContent
                        className={cn(
                            "justify-begin flex w-48 flex-col items-center gap-1",
                            "rounded-md border border-gray-300 bg-white",
                            "p-1"
                        )}
                        align="end"
                        side="bottom"
                        sideOffset={5}
                    >
                        {phase === "transfer" && (
                            <>
                                <button
                                    className={cn(
                                        "flex items-center self-start text-left text-sm whitespace-nowrap hover:bg-gray-100",
                                        "w-full cursor-pointer rounded-sm p-1 transition-colors duration-200",
                                        "gap-1 text-blue-500 hover:text-blue-600",
                                        "focus:bg-gray-100 focus:outline-none"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPhase("selectType");
                                    }}
                                >
                                    <PencilIcon className="h-4 w-4" /> Transfer
                                </button>
                                <button
                                    className={cn(
                                        "flex items-center self-start text-left text-sm whitespace-nowrap hover:bg-gray-100",
                                        "w-full cursor-pointer rounded-sm p-1 transition-colors duration-200",
                                        "gap-1 text-red-500 hover:text-red-600",
                                        "focus:bg-gray-100 focus:outline-none",
                                        busy && "cursor-not-allowed opacity-50"
                                    )}
                                    title="Be careful with this functionality"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteReg();
                                    }}
                                >
                                    <TrashIcon className="h-4 w-4" /> Delete
                                </button>
                            </>
                        )}

                        {phase === "selectType" && (
                            <>
                                <button
                                    className={cn(
                                        "flex items-center self-start text-left text-sm whitespace-nowrap hover:bg-gray-100",
                                        "w-full cursor-pointer rounded-sm p-1 transition-colors duration-200",
                                        "text-blue-500 hover:text-blue-600",
                                        "focus:bg-gray-100 focus:outline-none"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPhase("intraTransfer");
                                    }}
                                >
                                    Intra-Class Transfer
                                </button>
                                <button
                                    className={cn(
                                        "flex items-center self-start text-left text-sm whitespace-nowrap hover:bg-gray-100",
                                        "w-full cursor-pointer rounded-sm p-1 transition-colors duration-200",
                                        "text-blue-500 hover:text-blue-600",
                                        "focus:bg-gray-100 focus:outline-none"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPhase("classTransfer");
                                    }}
                                >
                                    Class Transfer
                                </button>
                            </>
                        )}

                        {phase !== "transfer" && phase !== "selectType" && (
                            <div className="flex flex-col gap-1">
                                <Select onValueChange={(v) => setSelectedIds(v)}>
                                    <SelectTrigger
                                        id="view-select"
                                        className="flex w-full flex-row items-center"
                                    >
                                        <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <>
                                            {phase === "intraTransfer"
                                                ? [...curClass.classrooms, curClass].map(
                                                      (item, idx) => (
                                                          <SelectItem
                                                              key={idx}
                                                              value={`${item.arrinfo.arrangeid}, ${item.arrinfo.classid}`}
                                                          >
                                                              {
                                                                  idMaps.classMap[
                                                                      item.arrinfo.classid
                                                                  ].classnamecn
                                                              }
                                                          </SelectItem>
                                                      )
                                                  )
                                                : reducerState.map((item) => {
                                                      return (
                                                          <SelectItem
                                                              key={item.id}
                                                              value={`${item.arrinfo.arrangeid}, ${item.arrinfo.classid}`}
                                                          >
                                                              {
                                                                  idMaps.classMap[
                                                                      item.arrinfo.classid
                                                                  ].classnamecn
                                                              }
                                                          </SelectItem>
                                                      );
                                                  })}
                                        </>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="flex cursor-pointer items-center gap-1 rounded-md border-1 border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPhase("transfer");
                                        }}
                                        disabled={busy}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className={cn(
                                            "rounded-md px-4 py-2 text-sm font-bold",
                                            busy
                                                ? "cursor-not-allowed bg-gray-300 text-gray-500"
                                                : "cursor-pointer bg-blue-600 text-white"
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleTransfer();
                                        }}
                                        disabled={busy}
                                    >
                                        Transfer
                                    </button>
                                </div>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>
            );
        },
    };

    const table = useReactTable<adminStudentView>({
        data: registrations,
        columns: [...columns, editColumn],
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSorting: true,
        onSortingChange: setSorting,
        state: {
            sorting,
            columnPinning: {
                right: ["edit"],
            },
        },
    });

    return <ClientTable table={table} />;
}
