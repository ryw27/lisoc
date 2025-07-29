import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, useReactTable, SortingState, ColumnPinningState } from "@tanstack/react-table";
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from "@/components/ui/popover";
import { InferSelectModel } from "drizzle-orm";
import { classregistration } from "@/app/lib/db/schema";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { IdMaps, selectOptions, threeBalances, threeSeason } from "@/app/lib/semester/sem-schemas";
import { studentObject } from "@/app/admintest/data/(people-pages)/students/student-helpers";
import { arrangement } from "@/app/lib/db/schema";
import { PencilIcon, MoreHorizontal, TrashIcon, XIcon } from "lucide-react";
import { dropRegistration, familyRequestTransfer } from "@/app/lib/semester/sem-actions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type regTableProps = {
    students: studentObject[];
    season: threeSeason;
    registrations: InferSelectModel<typeof classregistration>[];
    balances: threeBalances;
    fallArrs: InferSelectModel<typeof arrangement>[];
    yearArrs: InferSelectModel<typeof arrangement>[];
    springArrs: InferSelectModel<typeof arrangement>[];
    selectOptions: selectOptions;
    idMaps: IdMaps;
}

type regRow = {
    regno: number;
    registerdate: string;
    classid: number;
    studentid: number;
    teacherid: number;
    roomid: number;
    classroom: number;
    period: number;
    seasonid: number;
    tuition: number;
    status: number;
}


const regStatusMap = {
    1: "Submitted",
    2: "Registered",
    3: "Transferred", 
    4: "Dropout",
    5: "Dropout Spring"
}

export default function RegTable({ students, season, registrations, balances, fallArrs, yearArrs, springArrs, selectOptions, idMaps }: regTableProps) {
    
    const columns: ColumnDef<regRow>[] = [
        {
            accessorKey: "regno",
            header: "RegNo",
            sortingFn: "alphanumeric"
        },
        {
            accessorKey: "registerdate",
            header: "Register Date",
            cell: ({ getValue }) => {
                const date = getValue() as string;
                return new Date(date).toLocaleDateString();
            },
            sortingFn: "alphanumeric"
        },
        {
            accessorKey: "classid",
            header: "Course",
            cell: ({ getValue }) => {
                const classid = getValue() as number;
                return idMaps.classMap[classid] ? idMaps.classMap[classid].classnamecn : "N/A";
            },
            sortingFn: "alphanumeric"
        },
        {
            accessorKey: "studentid",
            header: "Student Name",
            cell: ({ getValue }) => {
                const studentid = getValue() as number;
                return (students.find((s) => s.studentid === studentid)!).namecn
            },
            sortingFn: "alphanumeric"
        },
        {
            accessorKey: "teacherid",
            header: "Teacher Name",
            cell: ({ getValue }) => {
                const teacherid = getValue() as number;
                return idMaps.teacherMap[teacherid] ? idMaps.teacherMap[teacherid].namecn : "N/A";
            },
            sortingFn: "alphanumeric"
        },
        {
            accessorKey: "roomid",
            header: "Classroom",
            cell: ({ getValue }) => {
                const roomid = getValue() as number;
                return idMaps.roomMap[roomid] ? idMaps.roomMap[roomid].roomno : "N/A";
            },
            sortingFn: "alphanumeric"
        },
        {
            accessorKey: "period",
            header: "Period",
            cell: ({ getValue }) => {
                const period = getValue() as number;
                return idMaps.timeMap[period] ? idMaps.timeMap[period].period : "N/A";
            },
            sortingFn: "alphanumeric"
        },
        {
            accessorKey: "seasonid",
            header: "Semester",
            cell: ({ getValue }) => {
                const seasonid = getValue() as number;
                return season.year.seasonid === seasonid ? season.year.seasonnamecn : season.fall.seasonid === seasonid ? season.fall.seasonnamecn : season.spring.seasonnamecn || "N/A";
            },
            sortingFn: "alphanumeric"
        },
        {
            accessorKey: "tuition",
            header: "Tuition",
            sortingFn: "alphanumeric"
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ getValue }) => {
                const statusid = getValue() as 1 | 2 | 3 | 4 | 5;
                return regStatusMap[statusid];
            },
            sortingFn: "alphanumeric"
        }
    ];

    const handleDelete = async (registration: number, tuition: number) => {
        try {
            await dropRegistration(registration, tuition);
        } catch (err) {
            console.error(err);
        }
    }

    const deleteColumn: ColumnDef<regRow>[] = [
        {
            id: "delete",
            cell: ({ row }) => {
                const onDelete = () => {
                    const reg_id = row.original.regno;
                    const tuition = row.original.tuition
                    if (reg_id === undefined || reg_id === null || tuition === undefined || tuition === null) {
                        throw new Error("Reg ID or tuition for registrations row not found");
                    } else {
                        handleDelete(reg_id, tuition);
                    }
                } 
                return (
                    <button className="rounded-md text-red-600 hover:text-red-800 cursor-pointer" onClick={onDelete}>
                        <XIcon className="w-4 h-4"/>
                    </button>
                )
            }
        }
    ]

    const editColumn: ColumnDef<regRow>[] = [
        {
            id: "edit",
            cell: ({ row }) => {
                const [transferDialogOpen, setTransferDialogOpen] = useState(false);
                const transferStudent = () => {
                    try {
                        const reg_id = row.original.regno;
                        const tuition = row.original.tuition
                        const statusid = row.original.status
                        if (reg_id === undefined || reg_id === null || tuition === undefined || tuition === null) {
                            throw new Error("Reg ID or tuition for registrations row not found");
                        } else {
                            familyRequestTransfer(reg_id);
                        } 
                    } catch (err) {
                        console.error(err);
                    }
                }
                const status = Number(row.original.status)
                return (
                    <>
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
                                <button 
                                    className={cn(
                                        cn(
                                            "flex items-center self-start text-left text-sm hover:bg-gray-100 whitespace-nowrap",
                                            "rounded-sm w-full p-1 cursor-pointer transition-colors duration-200 gap-1",
                                            "focus:outline-none focus:bg-gray-100",
                                            status !== 1 && status !== 2
                                                ? "cursor-not-allowed text-gray-300"
                                                : "text-blue-500 hover:text-blue-600 cursor-pointer"
                                        )
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setTransferDialogOpen(true);
                                    }}
                                    disabled={status !== 1 && status !== 2}
                                >
                                    <PencilIcon className="w-4 h-4" /> Transfer
                                </button>
                            </PopoverContent>
                        </Popover>
                        <AlertDialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Transfer Student</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Select a class to transfer the student to.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="my-4">
                                    <label htmlFor="transfer-class-select" className="block text-sm font-medium text-gray-700 mb-1">
                                        Choose new class
                                    </label>
                                    <Select>
                                        <SelectTrigger id="transfer-class-select" className="w-full">
                                            <SelectValue placeholder="Select a class..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* Example options, replace with dynamic class list */}
                                            {[...fallArrs, ...yearArrs, ...springArrs]
                                                .filter(cls => cls.isregclass)
                                                .map(cls => (
                                                    <SelectItem key={cls.classid} value={String(cls.classid)}>
                                                        {idMaps.classMap[cls.classid].classnamecn}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setTransferDialogOpen(false)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={transferStudent}>Transfer</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )
            }
        }
    ]
    const [sorting, setSorting] = useState<SortingState>([
        {
            id: "registerdate",
            desc: true
        }
    ]);

    const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
        left: ['delete'],
        right: ['edit']
    });

    const arrangementMap = useMemo(() => {
        const allArrs = [...yearArrs, ...fallArrs, ...springArrs];
        return new Map(allArrs.map(arr => [arr.arrangeid, arr]));
    }, [yearArrs, fallArrs, springArrs]);

    const tableData = useMemo(() => {
        return registrations.map((reg) => {
            const arrangement = arrangementMap.get(reg.arrangeid);
            return {
                regno: reg.regid,
                registerdate: reg.registerdate,
                classid: arrangement?.classid || 0,
                studentid: reg.studentid,
                teacherid: arrangement?.teacherid || 0,
                roomid: arrangement?.roomid || 0,
                classroom: arrangement?.roomid || 0,
                period: arrangement?.timeid || 0,
                seasonid: arrangement?.seasonid || 0,
                tuition: Number(arrangement?.tuitionW || 0) + Number(arrangement?.bookfeeW || 0) + Number(arrangement?.specialfeeW || 0),
                status: reg.statusid as 1 | 2 | 3 | 4 | 5 || "Unknown"
            }
        });
    }, [registrations, arrangementMap]);



    const table = useReactTable<regRow>({
        data: tableData,
        columns: [...deleteColumn, ...columns, ...editColumn], 
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSorting: true,
        onSortingChange: setSorting,
        state: { sorting, columnPinning }
    });

    return (
        <>
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


        </>
    )
}