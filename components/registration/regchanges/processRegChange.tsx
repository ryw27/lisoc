"use client";
import { classregistration, student } from "@/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";

//import { useRouter } from 'next/navigation';
import { cn} from "@/lib/utils";
import { PencilIcon } from "lucide-react";
import {
    ColumnDef,
    useReactTable,
    getCoreRowModel
} from '@tanstack/react-table'
import { ClientTable } from "@/components/client-table";
//import { request } from "http";


export type processRegChangeRow = {
//    requestId: number | null;
    regId: number;
//    familyId: number;
    student: string;
    regClassId: string;
    transClassId: string;
    requestDate: string;
    parentComment: string;
    adminComment: string;
    reqStatus: number;
}

type processRegChangeProps = {
    requestId: number,
    regId : number,
    appliedRegId: number,
    classId: number 
    familyId: number,
    status: number,
    requestDate: string,
    registration: (InferSelectModel<typeof classregistration> & { 
        student: InferSelectModel<typeof student>, 
    })[],
    parentNote: string, 
    classMap: Record<number, string>,
    feeMap : Record<number, string>,
}
const reqStatusMap = {
    1: "Pending",
    2: "Approved",
    3: "Rejected"
}

const columns: ColumnDef<processRegChangeRow>[] = [
   /* {
        accessorKey: "requestId",
        header: "Request ID",
        cell: info => info.getValue(),
    },*/
    {
        accessorKey: "regId",
        header: "Reg ID",
        cell: info => info.getValue(),
    },
  /*  {
        accessorKey: "familyId",
        header: "Family ID",
        cell: info => info.getValue(),
    },*/
    {
        accessorKey: "student",
        header: "Student",
        cell: info => info.getValue(),
    },
    {
        accessorKey: "regClassId",
        header: "Class",
        cell: info => info.getValue(),
    },
    {
        accessorKey: "transClassId",
        header: "Transfer To",
        cell: info => info.getValue(),
    },
    {
        accessorKey: "requestDate",
        header: "Request Date",
        cell: info => info.getValue(),
    },
    {
        accessorKey: "parentComment",
        header: "Parent Comment",
        cell: info => info.getValue(),
    },
    {
        accessorKey: "adminComment ",
        header: "Admin Comment",
//        cell: info => info.getValue(),
    },

    {
        accessorKey: "reqStatus",
        header: "Status",
        cell: ({ getValue }) => {
            const reqstatusid = getValue() as 1 | 2 | 3;
            return reqStatusMap[reqstatusid];
        }
    },
];

type Props = {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function ProcessRegChange({requestId, regId,appliedRegId,classId, familyId, status, requestDate,registration,parentNote, classMap,feeMap } :processRegChangeProps) {
    
    const editColumn: ColumnDef<processRegChangeRow> = {
        id: "edit",
        header: "",
        cell: ({row}) => {

            if( row.original.reqStatus === 0 ){  
                return (<div>   </div>) 
            }
            return (
                <button
                    className={cn(
                        "inline-flex items-center justify-center rounded-md p-2 cursor-pointer",
                        "bg-blue-600 text-white",
                        "hover:bg-blue-700",
                        "focus:outline-none focus:ring-2 focus:ring-blue-300",
                        "shadow-sm"
                    )}
                    aria-label="Edit"
                    onClick={(e) => { e.stopPropagation()}}
                >
                    <PencilIcon className="w-5 h-5 text-white" />
                </button>
            );
        }
    }

    const table = useReactTable<processRegChangeRow>({
        data: registration.map((r) => {

            const currentRegId = r.regid;
            const studentName = r.student ? [r.student.namefirsten, r.student.namelasten].filter(Boolean).join(" ") : "N/A";
            const classOut = r.classid && r.classid in classMap ? classMap[r.classid] : "N/A";
            const classIn = appliedRegId===r.regid && classId in classMap ? classMap[classId] : "N/A";
            const parentComment = r.regid == regId ? parentNote : "";
            const adminComment = "to be added";

            let  cAction = "";            

            if (currentRegId == regId) {
                cAction = "T" ;
            }


            return {//requestId: currentRegId == regId? requestId : null,
                    regId: currentRegId,
//                    familyId: familyId,
                    student: studentName,
                    regClassId: classOut,
                    transClassId: classIn,
                    requestDate: currentRegId == regId? requestDate : "",
                    parentComment: parentComment,
                    adminComment: adminComment,
                    reqStatus: currentRegId == regId? status :0 
                } satisfies processRegChangeRow;
        }),

        columns: [editColumn, ...columns], 
        getCoreRowModel: getCoreRowModel(),
        state: {
            columnPinning: { left: ["edit"] }
        }
    });

    return (
        <ClientTable
            table={table}
        />
    )
}