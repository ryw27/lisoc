"use client";
import { 
    ColumnDef, 
    useReactTable, 
    getCoreRowModel, 
    SortingState, 
    getSortedRowModel,
} from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from "@/components/ui/popover";

import { 
    AlertDialog, 
    AlertDialogTrigger, 
    AlertDialogContent, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogFooter, 
    AlertDialogCancel, 
    AlertDialogAction 
} from "@/components/ui/alert-dialog";




import { adminStudentView, uiClasses,arrangeClasses } from "@/lib/registration/types";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { MoreHorizontal, PencilIcon, TrashIcon } from "lucide-react";
import { Action, fullRegID, fullSemDataID } from "./sem-view";
import { adminTransferStudent, adminDropRegistration,adminTransferStudent2 } from "@/lib/registration/regchanges";
import { useRegistrationContext } from "@/lib/registration/registration-context";
import { ClientTable } from "@/components/client-table";


const columns: ColumnDef<adminStudentView>[] = [
    {
        accessorKey: "regid",
        header: "RegID",
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "familyid",
        header: "Family ID",
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "studentid",
        header: "Student ID",       
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "namecn",
        header: "中文姓名",
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "namelasten",
        header: "Last Name",
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "namefirsten", 
        header: "First Name",
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "gender",
        header: "Gender",
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "dob",
        header: "Date of Birth",
        cell: ({ getValue }) => {
            const date = getValue() as string;
            return new Date(date).toLocaleDateString();
        },
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "registerDate",
        header: "Register Date",
        cell: ({ getValue }) => {
            const date = getValue() as string;
            return new Date(date).toLocaleDateString();
        },
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "status",
        header: "Status",
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "notes",
        header: "Notes",
        sortingFn: "alphanumeric"
    },
]


type studentTableProps = {
    registrations: adminStudentView[];
    curClass: fullRegID;
    reducerState: fullSemDataID;
    dispatch: React.Dispatch<Action>;
    // uuid: string;
    allClasses: arrangeClasses[];
}

// Helper function to find a student in the current class or its classrooms
const findStudentInClass = (regid: number, curClass: fullRegID): adminStudentView | null => {
    // Check main class students first
    const studentInMain = curClass.students.find(s => s.regid === regid);
    if (studentInMain) return studentInMain;

    // Check classroom students
    for (const classroom of curClass.classrooms) {
        const studentInClassroom = classroom.students.find(s => s.regid === regid);
        if (studentInClassroom) return studentInClassroom;
    }
    
    return null;
};

// Helper function to find which classroom contains a student
const findStudentClassroom = (regid: number, curClass: fullRegID) => {
    for (const classroom of curClass.classrooms) {
        const student = classroom.students.find(s => s.regid === regid);
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
        students: curClass.students.filter(s => s.regid !== regid),
        classrooms: curClass.classrooms.map(c => ({
            ...c,
            students: c.students.filter(s => s.regid !== regid)
        }))
    };
};

// Helper function for intra-class transfer
const handleIntraClassTransfer = (
    regid: number,
    newArrangeObj: uiClasses,
    curClass: fullRegID
): fullRegID => {
    const student = findStudentInClass(regid, curClass);
    if (!student) {
        throw new Error("Student not found in current class");
    }

    const studentClassroom = findStudentClassroom(regid, curClass);
    const currentArrangementId = studentClassroom?.classroom.arrinfo.arrangeid ?? curClass.arrinfo.arrangeid;

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
            finalClassrooms = curClass.classrooms.map(c => 
                c.arrinfo.arrangeid === currentArrangementId
                    ? { ...c, students: c.students.filter(s => s.regid !== regid) }
                    : c
            );
        } else {
            // Transfer between classrooms
            finalClassrooms = curClass.classrooms.map(c => {
                if (c.arrinfo.arrangeid === currentArrangementId) {
                    return { ...c, students: c.students.filter(s => s.regid !== regid) };
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
        finalStudents = curClass.students.filter(s => s.regid !== regid);
        finalClassrooms = curClass.classrooms.map(c => 
            c.arrinfo.arrangeid === newArrangeObj.arrangeid
                ? { ...c, students: [...c.students, student] }
                : c
        );
    }

    return {
        ...curClass,
        students: finalStudents,
        classrooms: finalClassrooms
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
        students: classData.students.map(student =>
            student.regid === oldRegId
                ? { ...student, regid: newRegId }
                : student
        ),
        classrooms: classData.classrooms.map(classroom => ({
            ...classroom,
            students: classroom.students.map(student =>
                student.regid === oldRegId
                    ? { ...student, regid: newRegId }
                    : student
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
    classrooms: targetClass.classrooms.map(classroom => ({
        ...classroom,
        students:
            classroom.arrinfo.arrangeid === newArrangeId
                ? [...classroom.students, studentData]
                : classroom.students,
    })),
};


};

function TransferButton({student, dispatch , curClass,allClasses,reducerState}:
 {student: adminStudentView, dispatch: React.Dispatch<Action>,
  curClass: fullRegID,allClasses:arrangeClasses[],
  reducerState: fullSemDataID}) 
{    

    const sname = student.namecn;
    const currCid = student.classid;
    const regid = student.regid;
    const familyid = student.familyid;  
    const studentid = student.studentid;
    const curClasskey = curClass.arrinfo.classkey;
    //const currArrangeid = curClass.arrinfo.arrangeid;

    const [selection, setSelection] = useState<string>("")

    const handleTransfer = async () => {
        
        try {
                // Call the server action
                const newarrangeid = parseInt(selection.toString());
                //const adminOverride = true;
                const newCls :  arrangeClasses|undefined = allClasses.find(c=>c.arrangeid===newarrangeid);

                const newArrangeObj:uiClasses= {
                    arrangeid: newarrangeid,
                    seasonid: newCls? newCls.seasonid : 0,
                    classid: newCls? newCls.classid : 0,
                    classkey: newCls? (newCls.classno+100)*1000+newCls.typeid : 0,
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
                    suitableterm:0,
                    closeregistration:false,
                    notes:""
                }
                // make sure phase matches adminTransferStudents
                //const newRegObj = 
                const newRegObj = await adminTransferStudent2(regid, studentid, familyid, newArrangeObj);

                const newClsKey = newCls? (newCls.classno+100)*1000 + newCls.typeid : -1;
                
                if( newClsKey === curClasskey ) {
                    // intra-class transfer
                    const updatedCurClass = handleIntraClassTransfer(regid, newArrangeObj, curClass);

                    const updatedClass = updateRegIdInClass(regid, newRegObj.regid, updatedCurClass);

                  //  dispatch({ type: "reg/distribute", id: curClass.id, newDistr: updatedCurClass });
                    dispatch({ type: "reg/distribute", id: curClass.id, newDistr: updatedClass });
 
                }
                else {
                    // Inter-class transfer setup
                    //    isInterClassTransfer = true;
                        
                        // Class transfer - find target class in reducer state
                    const targetClass = reducerState.find(
                           // c => c.arrinfo.arrangeid === newarrangeid
                            c=> c.id == String(newClsKey)  
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

        } 
        catch (error) {
            console.error("Transfer failed:", error);
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button
                    type="button"
                    className={cn(
                                        "flex items-center self-start text-left text-sm hover:bg-gray-100 whitespace-nowrap",
                                        "rounded-sm w-full p-1 cursor-pointer transition-colors duration-200",
                                        "text-red-500 hover:text-blue-600 gap-1","bg-blue-100",
                                        "focus:outline-none focus:bg-gray-100"
                                    )}                    
                    onClick={e => e.stopPropagation()}
                    title={"transfer student to another class"}
                    disabled={false}
                >
                    transfer
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Transfer  Student {sname}  ?
                    </AlertDialogTitle>
                </AlertDialogHeader>
                <div className="text-sm text-gray-600 mb-4">
                    <Select onValueChange={setSelection}>
                      <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Please Choose Class" />
                       </SelectTrigger>
                       <SelectContent>
                        {
                            allClasses.filter(c=>c.classid!==currCid).map((cls)=>{
                                return <SelectItem key={cls.classid} value={cls.arrangeid.toString()}>{cls.classnamecn}</SelectItem>  

                            })
                        }
                        </SelectContent>
                    </Select>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel className="cursor-pointer" onClick={e => e.stopPropagation()}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                        disabled = {selection === "" }
                        onClick={e => {
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


export default function StudentTable({ registrations, reducerState, curClass, dispatch,allClasses }: studentTableProps) {
    const { idMaps } = useRegistrationContext();
    const [sorting, setSorting] = useState<SortingState>([
        {
            id: "registerDate",
            desc: true
        }
    ]);

    const [phase, setPhase] = useState<"transfer" | "selectType" | "classTransfer" | "intraTransfer">("transfer");
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

                    let newArrangeObj: uiClasses;
                    let updatedCurClass: fullRegID;

                    if (phase === "intraTransfer") {
                        // Snapshot current class for rollback
                        sourceSnapshot = { ...curClass };
                        
                        // Find target arrangement within current class. Either one of the constituents or the reg class
                        newArrangeObj = curClass.classrooms.find(
                            c => c.arrinfo.arrangeid === newArrangeId
                        )?.arrinfo ?? curClass.arrinfo;

                        if (!newArrangeObj) {
                            throw new Error("Target arrangement not found");
                        }

                        updatedCurClass = handleIntraClassTransfer(regid, newArrangeObj, curClass);
                        dispatch({ type: "reg/distribute", id: curClass.id, newDistr: updatedCurClass });

                    } else {
                        // Inter-class transfer setup
                        isInterClassTransfer = true;
                        
                        // Class transfer - find target class in reducer state
                        const targetClass = reducerState.find(
                            c => c.arrinfo.arrangeid === newArrangeId
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
                        dispatch({ type: "reg/distribute", id: curClass.id, newDistr: updatedCurClass });

                        // Add student to target class
                        const updatedTargetClass: fullRegID = {
                            ...targetClass,
                            students: [...targetClass.students, student]
                        };
                        dispatch({ type: "reg/distribute", id: targetClass.id, newDistr: updatedTargetClass });
                    }

                    // Call the server action
                    const adminOverride = true;
                    // make sure phase matches adminTransferStudents
                    const newRegObj = await adminTransferStudent(regid, studentid, familyid, newArrangeObj, adminOverride, phase as "intraTransfer" | "classTransfer");
                    
                    if (phase === "intraTransfer") {
                        // Update the current class with new regid
                        const updatedClass = updateRegIdInClass(regid, newRegObj.regid, updatedCurClass);
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
                        dispatch({ type: "reg/distribute", id: curClass.id, newDistr: sourceSnapshot });
                    }
                    if (isInterClassTransfer && targetSnapshot) {
                        dispatch({ type: "reg/distribute", id: targetSnapshot.id, newDistr: targetSnapshot });
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
                    dispatch({ type: "reg/distribute", id: curClass.id, newDistr: updatedCurClass });
                    
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
            return (<div> <TransferButton student = {row.original}  curClass={curClass} dispatch={dispatch} 
                                           allClasses={allClasses} reducerState={reducerState} /> </div>);  
            return (
                
                <Popover>
                    <PopoverTrigger 
                        className={cn(
                            "items-center rounded-md p-1 cursor-pointer",
                            "border-1 border-gray-300 hover:border-gray-700",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500"
                        )}
                        aria-label="Row actions"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </PopoverTrigger>
                    <PopoverContent 
                        className={cn(
                            "flex flex-col gap-1 justify-begin items-center w-48",
                            "bg-white border border-gray-300 rounded-md",
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
                                        "flex items-center self-start text-left text-sm hover:bg-gray-100 whitespace-nowrap",
                                        "rounded-sm w-full p-1 cursor-pointer transition-colors duration-200",
                                        "text-blue-500 hover:text-blue-600 gap-1",
                                        "focus:outline-none focus:bg-gray-100"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPhase("selectType")
                                    }}
                                >
                                    <PencilIcon className="w-4 h-4" /> Transfer
                                </button>
                                <button 
                                    className={cn(
                                        "flex items-center self-start text-left text-sm hover:bg-gray-100 whitespace-nowrap",
                                        "rounded-sm w-full p-1 cursor-pointer transition-colors duration-200",
                                        "text-red-500 hover:text-red-600 gap-1",
                                        "focus:outline-none focus:bg-gray-100",
                                        busy && "opacity-50 cursor-not-allowed"
                                    )}
                                    title="Be careful with this functionality"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteReg();
                                    }}
                                >
                                    <TrashIcon className="w-4 h-4" /> Delete
                                </button>
                            </>
                        )}

                        {phase === "selectType" && (
                            <>
                                <button
                                    className={cn(
                                        "flex items-center self-start text-left text-sm hover:bg-gray-100 whitespace-nowrap",
                                        "rounded-sm w-full p-1 cursor-pointer transition-colors duration-200",
                                        "text-blue-500 hover:text-blue-600",
                                        "focus:outline-none focus:bg-gray-100"
                                    )}  
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPhase("intraTransfer")
                                    }}
                                >
                                    Intra-Class Transfer
                                </button>
                                <button 
                                    className={cn(
                                        "flex items-center self-start text-left text-sm hover:bg-gray-100 whitespace-nowrap",
                                        "rounded-sm w-full p-1 cursor-pointer transition-colors duration-200",
                                        "text-blue-500 hover:text-blue-600",
                                        "focus:outline-none focus:bg-gray-100"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPhase("classTransfer")
                                    }}
                                >
                                    Class Transfer 
                                </button>
                            </>
                        )}

                        {phase !== "transfer" && phase !== "selectType" && (
                            <div className="flex flex-col gap-1">
                                <Select onValueChange={v => setSelectedIds(v)}>
                                    <SelectTrigger id="view-select" className="flex flex-row items-center w-full">
                                        <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <>
                                            {phase === "intraTransfer"
                                                ? [...curClass.classrooms, curClass].map((item, idx) => (
                                                    <SelectItem key={idx} value={`${item.arrinfo.arrangeid}, ${item.arrinfo.classid}`}>
                                                        {idMaps.classMap[item.arrinfo.classid].classnamecn}
                                                    </SelectItem>
                                                ))
                                                : reducerState.map((item) => {
                                                    return (
                                                        <SelectItem key={item.id} value={`${item.arrinfo.arrangeid}, ${item.arrinfo.classid}`}>
                                                            {idMaps.classMap[item.arrinfo.classid].classnamecn}
                                                        </SelectItem>
                                                    )
                                                })}
                                            </>
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2 items-center">
                                    <button
                                        className="rounded-md text-sm flex items-center gap-1 border-gray-300 border-1 font-semibold hover:bg-gray-50 cursor-pointer px-4 py-2"
                                        onClick={e => {
                                            e.stopPropagation();
                                            setPhase("transfer");
                                        }}
                                        disabled={busy}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className={cn(
                                            "text-sm font-bold px-4 py-2 rounded-md",
                                            busy
                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                : "bg-blue-600 text-white cursor-pointer"
                                        )}
                                        onClick={e => {
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
                
            )
        }
    }

    const table = useReactTable<adminStudentView>({
        data: registrations,
        columns: [...columns, editColumn], 
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSorting: true,
        onSortingChange: setSorting,
        state: { sorting, columnPinning: {
            right: ['edit']
        }}
    });

    return (
        <ClientTable
            table={table}
        />
    )
}