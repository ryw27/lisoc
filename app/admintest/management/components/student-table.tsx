"use client";
import { 
    ColumnDef, 
    useReactTable, 
    getCoreRowModel, 
    flexRender, 
    SortingState, 
    getSortedRowModel,
    ColumnPinningState
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
import { studentView, uiClasses } from "@/app/lib/semester/sem-schemas";
import { cn } from "@/lib/utils";
import React, { useState, useContext } from "react";
import { SeasonOptionContext } from "./sem-view";
import { MoreHorizontal, PencilIcon, TrashIcon } from "lucide-react";
import { Action, fullRegID, fullSemDataID } from "./sem-view";
import { adminTransferStudent, adminDeleteRegistration } from "@/app/lib/semester/sem-actions";


const columns: ColumnDef<studentView>[] = [
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
        accessorKey: "dropped",
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
    registrations: studentView[];
    curClass: fullRegID;
    reducerState: fullSemDataID;
    dispatch: React.Dispatch<Action>;
    uuid: string;
}

// Helper function to find a student in the current class or its classrooms
const findStudentInClass = (regid: number, curClass: fullRegID): studentView | null => {
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

export default function StudentTable({ registrations, reducerState, curClass, dispatch, uuid }: studentTableProps) {
    const { seasons, selectOptions, idMaps } = useContext(SeasonOptionContext)!;
    const [sorting, setSorting] = useState<SortingState>([
        {
            id: "registerDate",
            desc: true
        }
    ]);
    const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
        right: ['edit']
    });


    const editColumn: ColumnDef<studentView> = {
        id: "edit",
        header: "",
        cell: ({ row }) => {
            const [phase, setPhase] = useState<"transfer" | "selectType" | "classTransfer" | "intraTransfer">("transfer");
            const [selectedIds, setSelectedIds] = useState<string>("");
            const [busy, setBusy] = useState<boolean>(false);

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
                        
                        // Find target arrangement within current class
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
                    await adminTransferStudent(regid, curClass.arrinfo, newArrangeObj);
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
                    
                    // Remove student from local state immediately for better UX
                    const updatedCurClass = removeStudentFromClass(regid, curClass);
                    dispatch({ type: "reg/distribute", id: curClass.id, newDistr: updatedCurClass });
                    
                    // Call server action
                    await adminDeleteRegistration(regid, curClass.arrinfo);
                    resetState();
                } catch (error) {
                    console.error("Delete failed:", error);
                    
                    // Rollback optimistic update
                    dispatch({ type: "reg/distribute", id: curClass.id, newDistr: snapshot });
                    setBusy(false);
                }
            };
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
                                                ? curClass.classrooms.map((item, idx) => (
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
    const table = useReactTable<studentView>({
        data: registrations,
        columns: [...columns, editColumn], 
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSorting: true,
        onSortingChange: setSorting,
        state: { sorting, columnPinning }
    });

    return (
        <div className="overflow-x-auto w-full overflow-y-auto">
            <table className="min-w-full table-fixed relative">
                {/* Header */}
                <thead className="border-b border-gray-200">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}> 
                            {headerGroup.headers.map((header) => (
                                <th 
                                    key={header.id}
                                    className={cn(
                                        "whitespace-nowrap cursor-pointer px-3 py-3 text-left text-xs font-bold text-black text-lg tracking-wider",
                                        header.id === 'select' && 'w-12',
                                        header.column.getIsPinned() === 'left' && 'sticky left-0 z-10 bg-white',
                                        header.column.getIsPinned() === 'right' && 'sticky right-0 z-10 bg-white'
                                    )}
                                    onClick={header.column.getToggleSortingHandler()}
                                    aria-sort={
                                        header.column.getIsSorted() === 'desc' ? 'descending' :
                                        header.column.getIsSorted() === 'asc' ? 'ascending' :
                                        'none'
                                    }
                                >
                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    {{
                                        asc: ' ↑',
                                        desc: ' ↓',
                                    }[header.column.getIsSorted() as string] ?? null}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {/* Table rows */}
                    {table.getRowModel().rows.map((row) => (
                        <tr 
                            key={row.id}
                            className={cn(
                                "cursor-pointer hover:bg-blue-50 transition-colors",
                                row.getIsSelected() && 'bg-blue-50'
                            )}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <td 
                                    key={cell.id}
                                    className={cn(
                                        "px-3 py-1 text-sm text-gray-600",
                                        cell.column.id === 'select' ? 'w-12' : 'whitespace-nowrap',
                                        cell.column.getIsPinned() === 'left' && `sticky left-0 z-10 ${row.getIsSelected() ? 'bg-blue-50' : 'bg-white'}`,
                                        cell.column.getIsPinned() === 'right' && `sticky right-0 z-10 ${row.getIsSelected() ? 'bg-blue-50' : 'bg-white'}`
                                    )}
                                    tabIndex={0}
                                >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}