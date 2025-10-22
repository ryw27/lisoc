import { 
    ColumnDef, 
    getCoreRowModel, 
    getSortedRowModel, 
    useReactTable, 
    SortingState, 
} from "@tanstack/react-table";
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from "@/components/ui/popover";
import { InferSelectModel } from "drizzle-orm";
import { classregistration, family, regchangerequest, student } from "@/lib/db/schema";
import { cn, REGSTATUS_DROPOUT, REGSTATUS_DROPOUT_SPRING, REGSTATUS_REGISTERED, REGSTATUS_SUBMITTED, REGSTATUS_TRANSFERRED, REQUEST_STATUS_PENDING } from "@/lib/utils";
import { useState, useMemo, useRef} from "react";
import { useRouter } from 'next/navigation'
import { IdMaps, threeSeasons } from "@/lib/registration/types";
import { arrangement } from "@/lib/db/schema";
import { 
    PencilIcon, 
    MoreHorizontal, 
    XIcon,
} from "lucide-react";
import { familyRequestDrop, familyRequestTransfer, familyRequestUndo } from "@/lib/registration/regchanges";
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
import { ClientTable } from "@/components/client-table";

import { Textarea } from "@/components/ui/textarea"

type regTableProps = {
    students: InferSelectModel<typeof student>[];
    seasons: threeSeasons;
    registrations: InferSelectModel<typeof classregistration>[];
    threeArrs: {
        year: InferSelectModel<typeof arrangement>[];
        fall: InferSelectModel<typeof arrangement>[];
        spring: InferSelectModel<typeof arrangement>[];
    }
    // selectOptions: selectOptions;
    idMaps: IdMaps;
    family: InferSelectModel<typeof family>;
    regchangerequests: InferSelectModel<typeof regchangerequest>[];
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
    reqstatus: number;
}


const regStatusMap = {
    1: "Submitted",
    2: "Registered",
    3: "Transferred", 
    4: "Dropout",
    5: "Dropout Spring"
}

const reqStatusMap = {
  1: { reqstatus: "Pending", reqstatuscn: "待批准" },
  2: { reqstatus: "Approved", reqstatuscn: "已批准" },
  3: { reqstatus: "Rejected", reqstatuscn: "已拒绝" }
} as const;

export default function RegTable({ students, seasons, registrations, threeArrs, idMaps, family, regchangerequests }: regTableProps) {
    
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
                return seasons.year.seasonid === seasonid 
                    ? seasons.year.seasonnamecn 
                    : seasons.fall.seasonid === seasonid 
                        ? seasons.fall.seasonnamecn 
                        : seasons.spring.seasonid === seasonid 
                            ? seasons.spring.seasonnamecn 
                            : "N/A";
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
        },
        {
            accessorKey: "reqstatus",
            header: "Req Status",
            cell: ({ getValue }) => {
                const reqstatusid = getValue() as 0 | 1 | 2 | 3;
                if (reqstatusid === 0) {
                    return "N/A";
                }
                return `${reqStatusMap[reqstatusid].reqstatus} request`
            }
        }
    ];

    const handleDelete = async (registration: number, studentid: number) => {
        try {
            const familyOverride = false;
            await familyRequestDrop(registration, studentid, family.familyid, familyOverride, "");
        } catch (err) {
            console.error(err);
        }
    }

    const deleteColumn: ColumnDef<regRow>[] = [
        {
            id: "delete",
            cell: ({ row }) => {
                const status = Number(row.original.status);
                const deleteEnabled = status === REGSTATUS_SUBMITTED;

                const onDelete = () => {
                    if (!deleteEnabled) return;
                    const reg_id = row.original.regno;
                    const studentid = row.original.studentid;
                    if (reg_id === undefined || reg_id === null || studentid === undefined || studentid === null) {
                        throw new Error("Reg ID or studentid for registrations row not found");
                    } else {
                        handleDelete(reg_id, studentid);
                    }
                };

                return (
                    <button
                        className={cn(
                            'rounded-md p-1',
                            deleteEnabled
                                ? 'text-red-600 hover:text-red-800 cursor-pointer'
                                : 'text-gray-300 cursor-not-allowed opacity-60'
                        )}
                        onClick={onDelete}
                        disabled={!deleteEnabled}
                        aria-disabled={!deleteEnabled}
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                );
            }
        }
    ]

    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    //const [newArrangeID, setNewArrangeID] = useState<number>(0);
    const [transferError, setTransferError] = useState<string | null>(null);
    const [transferErrorOpen, setTransferErrorOpen] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    const router = useRouter();
    const [dropoutDialogOpen, setDropoutDialogOpen] = useState(false);
    const [dropoutRegId, setDropoutRegId] = useState<number | null>(null);
    const [dropoutStudentId, setDropoutStudentId] = useState<number | null>(null);
    const [isDroppingOut, setIsDroppingOut] = useState(false);
    const transferTextRef = useRef<HTMLTextAreaElement>(null);
    const dropTextRef = useRef<HTMLTextAreaElement>(null);
    const selectTransferRef = useRef<string>(""); // Specify the type for better type safety
    const [ clickedRow,setClickedRegRow] = useState<regRow>(); // Specify the type for better type safety


    const editColumn: ColumnDef<regRow>[] = [
        {
            id: "edit",
            header:"转退课",
            cell: ({ row }) => {

                const transferStudent = async () => {
                    setIsTransferring(true);
                    try {
                        const regid = clickedRow?.regno; //row.original.regno;
                        const tuition = clickedRow?.tuition; //row.original.tuition;
                        const studentid = clickedRow?.studentid || 0 ; //row.original.studentid;
                        const originalClassid = clickedRow?.classid ; 
                        if (regid === undefined || regid === null || tuition === undefined || tuition === null || originalClassid === null) {
                            const msg = "Reg ID or tuition for registrations row not found";
                            console.error(msg);
                            setTransferError(msg);
                            setTransferErrorOpen(true);
                            return;
                        }
                        const transferNote = transferTextRef.current?.value || "";              
                        const selectedNewClassId  = Number(selectTransferRef.current);
                        console.log("transfer id:", selectedNewClassId);                        
                        //if (newArrangeID === 0) {
                        if (selectedNewClassId === 0) {

                            const msg = "Cannot find new class being transferred to";
                            console.error(msg);
                            setTransferError(msg);
                            setTransferErrorOpen(true);
                            return;
                        }


                        //const arrObj = [...threeArrs.fall, ...threeArrs.year, ...threeArrs.spring].find((arr) => arr.arrangeid === newArrangeID);
                        const arrObj = [...threeArrs.fall, ...threeArrs.year, ...threeArrs.spring].find((arr) => arr.arrangeid === selectedNewClassId);
                        if (!arrObj) {
                            const msg = "Cannot find new class being transferred to";
                            console.error(msg);
                            setTransferError(msg);
                            setTransferErrorOpen(true);
                            return;
                        }

                        if (arrObj.classid  === originalClassid) {
                            const msg = "New class same as the current class";
                            console.error(msg);
                            setTransferError(msg);
                            setTransferErrorOpen(true);
                            return;
                        }

                        const res = await familyRequestTransfer(regid, studentid, family.familyid, arrObj, transferNote);
                        if (!res || !res.ok) {
                            const msg = res && res.message ? res.message : 'Transfer failed';
                            console.error('Transfer failed', msg);
                            setTransferError(msg);
                            setTransferErrorOpen(true);
                            return;
                        }

                        // Success: close dialog and refresh screen
                        setTransferDialogOpen(false);
                        try {
                            router.refresh();
                        } catch (e) {
                            console.log(e)
                            window.location.reload();
                        }

                    } catch (err) {
                        console.error(err);
                        const msg = err instanceof Error ? err.message : String(err);
                        setTransferError(msg);
                        setTransferErrorOpen(true);
                    } finally {
                        setIsTransferring(false);
                    }
                }
                const status = Number(row.original.status)
                const transferDisabled = status === REGSTATUS_SUBMITTED 
                                        || status === REGSTATUS_TRANSFERRED 
                                        || status === REGSTATUS_DROPOUT 
                                        || status === REGSTATUS_DROPOUT_SPRING

                const currentRegid = row.original.regno ;
                const familyid = family.familyid ;
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
                               { (status == REGSTATUS_REGISTERED && row.original.reqstatus == REQUEST_STATUS_PENDING) ? 
                               (
                                <button
                                    className={cn(
                                        cn(
                                            "flex items-center self-start text-left text-sm hover:bg-gray-100 whitespace-nowrap",
                                            "rounded-sm w-full p-1 cursor-pointer transition-colors duration-200 gap-1",
                                            "focus:outline-none focus:bg-gray-100",
                                        )
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        familyRequestUndo(currentRegid,familyid);

                                    }}
                                >
                                    <PencilIcon className="w-4 h-4" /> Undo Trans/Drop
                                </button>
                               
                                ) :
                                                              
                               ( 
                                <>
                                <button 
                                    className={cn(
                                        cn(
                                            "flex items-center self-start text-left text-sm hover:bg-gray-100 whitespace-nowrap",
                                            "rounded-sm w-full p-1 cursor-pointer transition-colors duration-200 gap-1",
                                            "focus:outline-none focus:bg-gray-100",
                                            transferDisabled
                                                ? "cursor-not-allowed text-gray-300"
                                                : "text-blue-500 hover:text-blue-600 cursor-pointer"
                                        )
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log("clicked",row.original);
                                        setClickedRegRow(row.original); 
                                        if (!transferDisabled) setTransferDialogOpen(true);
                                    }}
                                    disabled={transferDisabled}
                                >
                                    <PencilIcon className="w-4 h-4" /> Transfer
                                </button>
                                <button 
                                    className={cn(
                                        cn(
                                            "flex items-center self-start text-left text-sm hover:bg-gray-100 whitespace-nowrap",
                                            "rounded-sm w-full p-1 cursor-pointer transition-colors duration-200 gap-1",
                                            "focus:outline-none focus:bg-gray-100",
                                            transferDisabled
                                                ? "cursor-not-allowed text-gray-300"
                                                : "text-red-500 hover:text-red-600 cursor-pointer"
                                        )
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const reg_id = row.original.regno;
                                        const studentid = row.original.studentid;
                                        if (reg_id === undefined || reg_id === null || studentid === undefined || studentid === null) {
                                            const msg = "Reg ID or studentid for registrations row not found";
                                            console.error(msg);
                                            setTransferError(msg);
                                            setTransferErrorOpen(true);
                                            return;
                                        }
                                        setDropoutRegId(reg_id);
                                        setDropoutStudentId(studentid);
                                        setDropoutDialogOpen(true);
                                    }}
                                    disabled={transferDisabled} 
                                >
                                    <PencilIcon className="w-4 h-4" /> Dropout
                                </button>
                                </>
                                )}
                            </PopoverContent>
                        </Popover>
                        <AlertDialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen} >
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Transfer Student: </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Select a class to transfer the student to.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="my-4">
                                    <label htmlFor="transfer-class-select" className="block text-sm font-medium text-gray-700 mb-1">
                                        Choose new class(请选择)
                                    </label>
                                    <Select onValueChange={(value) => {
                                        selectTransferRef.current = value;
                                    }}
                                    >
                                        <SelectTrigger id="transfer-class-select" className="w-full">
                                            <SelectValue placeholder="Select a class..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[...threeArrs.fall, ...threeArrs.year, ...threeArrs.spring]
                                                .filter(cls => cls.isregclass)
                                                .map(cls => (
                                                    <SelectItem key={cls.arrangeid} value={String(cls.arrangeid)}>
                                                        {idMaps.classMap[cls.classid].classnamecn}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="my-6" />
                                    <label htmlFor="transfer-class-select" className="block text-sm font-medium text-gray-700 mb-1">
                                        Comment/注释(maximum 200)
                                    </label>
                                    <Textarea className="resize-none" ref={transferTextRef} placeholder="Type your message here." spellCheck={false}
                                             maxLength={200}  rows={4} />
                                </div>
                                
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setTransferDialogOpen(false)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={transferStudent} disabled={isTransferring}>
                                        {isTransferring ? 'Transferring...' : 'Transfer'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog open={transferErrorOpen} onOpenChange={setTransferErrorOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Transfer Failed</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {transferError ?? 'An unknown error occurred while transferring the student.'}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogAction onClick={() => setTransferErrorOpen(false)}>Close</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog open={dropoutDialogOpen} onOpenChange={setDropoutDialogOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Dropout</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to drop this student from the class? 你确定要退课吗？
                                    </AlertDialogDescription>
                                    <div className="my-6" />
                                    <label htmlFor="transfer-class-select" className="block text-sm font-medium text-gray-700 mb-1">
                                        Comment/注释 
                                    </label>
                                    <Textarea ref={dropTextRef} className="resize-none" placeholder="Type your message here." spellCheck={false}
                                        maxLength={200}  rows={3} />
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDropoutDialogOpen(false)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={async () => {
                                        if (!dropoutRegId || !dropoutStudentId) {
                                            const msg = 'Missing registration or student id';
                                            setTransferError(msg);
                                            setTransferErrorOpen(true);
                                            return;
                                        }
                                        setIsDroppingOut(true);
                                        try {

                                            const dropNote  = dropTextRef.current?.value || ""
                                            await familyRequestDrop(dropoutRegId, dropoutStudentId, family.familyid, false, dropNote);
                                            setDropoutDialogOpen(false);
                                            try { router.refresh(); } catch (e) { console.log(e); window.location.reload(); }
                                        } catch (err) {
                                            const msg = err instanceof Error ? err.message : String(err);
                                            setTransferError(msg);
                                            setTransferErrorOpen(true);
                                        } finally {
                                            setIsDroppingOut(false);
                                        }
                                    }}>
                                        {isDroppingOut ? 'Dropping...' : 'Confirm Dropout'}
                                    </AlertDialogAction>
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

    const arrangementMap = useMemo(() => {
        const allArrs = [...threeArrs.year, ...threeArrs.fall, ...threeArrs.spring];
        return new Map(allArrs.map(arr => [arr.arrangeid, arr]));
    }, [threeArrs]);

    const tableData = useMemo(() => {
        return registrations.map((reg) => {
            const arrangement = arrangementMap.get(reg.arrangeid);
            const regreq = regchangerequests.find((rcr) => rcr.regid === reg.regid);
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
                status: reg.statusid as 1 | 2 | 3 | 4 | 5 || "Unknown",
                reqstatus: regreq?.reqstatusid || 0
            }
        });
    }, [registrations, arrangementMap, regchangerequests]);



    const table = useReactTable<regRow>({
        data: tableData,
        columns: [...deleteColumn, ...columns, ...editColumn], 
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSorting: true,
        onSortingChange: setSorting,
        state: { sorting, columnPinning: {
            left: ['delete'],
            right: ['edit']
        }}
    });

    return (
        <ClientTable
            table={table}
        />
    )
}