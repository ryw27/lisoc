"use client";
import { classregistration, student } from "@/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";

//import { useRouter } from 'next/navigation';
import { cn} from "@/lib/utils";
import { PencilIcon } from "lucide-react";
import {
    ColumnDef,
    useReactTable,
    getCoreRowModel,
} from '@tanstack/react-table'
import { ClientTable } from "@/components/client-table";
//import { request } from "http";
import { Textarea } from "@/components/ui/textarea";

import  { useState, useEffect } from 'react';

import { 
    Select, 
    SelectContent, 
    SelectGroup, 
    SelectItem, 
    SelectLabel, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"


export type processRegChangeRow = {
//    requestId: number | null;
    regId: number;
//    familyId: number;
    student: string;
    regClassId: string;
    transClassId: string;
 //   requestDate: string;
//    parentComment: string;
//    adminComment: string;
//    reqStatus: number;
}

type processRegChangeProps = {
    requestId: number,
    regId : number,
    appliedRegId: number,
    classId: number 
 //  familyId: number,
 //   status: number,
 //   requestDate: string,
    registration: (InferSelectModel<typeof classregistration> & { 
        student: InferSelectModel<typeof student>, 
    })[],
 //   parentNote: string, 
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
/*    {
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
        cell: info => info.getValue(),
    },

    {
        accessorKey: "reqStatus",
        header: "Status",
        cell: ({ getValue }) => {
            const reqstatusid = getValue() as 1 | 2 | 3;
            return reqStatusMap[reqstatusid];
        }
    },
    */
];

function NumericTextInput() {
  const [value, setValue] = useState<string>("");

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = event.target.value;
    // This regex allows for digits (0-9) and a single literal dot (.)

    if(inputValue.length == 0)
    {
        setValue("") ;
        return 
    }
    if (inputValue[inputValue.length-1]==".")
    {
        setValue(inputValue);
        return 
    }
    if (inputValue.length == 1 && inputValue[0]=="-")
    {
        setValue(inputValue);
        return 
    }

    const matched = inputValue.match(/^-?\d+(?:\.\d+)?$/)

    if (matched !== null)
    {
        setValue(inputValue);
    }
  };

  return (
    <Textarea
      className="resize-none min-h-10 min-w-10"
      
      value={value}
      onChange={handleInputChange}
      placeholder="0.0"
    />
  );
}


export default function ProcessRegChange({requestId, regId,appliedRegId,classId, registration, classMap,feeMap } :processRegChangeProps) {
    

    const editColumn: ColumnDef<processRegChangeRow> = {
        id: "edit",
        header: "",
        cell: ({row}) => {

            if( row.original.regId !== regId ){  
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

    const adminMemoColumn: ColumnDef<processRegChangeRow> = {
        id: "aminMemo",
        header: "[adminstration Memo /管理员 笔记(50max)]",
        minSize: 400,
        maxSize: 400,
       size: 400,
       enableResizing: false,
       cell: ({row}) => {

            if( row.original.regId !== regId ){  
                return (<div>   </div>) 
            }
            return (

                <Textarea className="resize-none min-h-10 min-w 1200 max-w 2400" maxLength={50} placeholder="please enter memo here no more than 50 chars"/>
            )
        }
    }

    const extraFeeColumn: ColumnDef<processRegChangeRow> = {
        id: "extraFee",
        header: "extra Fee",
        minSize: 80,
        maxSize: 80,
       size: 80,
       enableResizing: false,
       cell: ({row}) => {

            if( row.original.regId !== regId ){  
                return (<div>   </div>) 
            }
            return (

                <NumericTextInput/>
            )
        }
    }

    const BalanceColumn: ColumnDef<processRegChangeRow> = {
        id: "balanceType",
        header: "Balance Type",
        minSize: 40,
        maxSize: 40,
       size: 80,
       enableResizing: false,
       cell: ({row}) => {

            if( row.original.regId !== regId ){  
                return (<div>   </div>) 
            }
            return (
                    <div>
                     <select>   
                    <option value="">-- Please Select  --</option>
                    {Object.entries(feeMap).map(([key, value]) => (
                        <option key={key} value={value}>
                            {value}
                        </option>)
                    )}
                    </select>
                    </div>
            )
        }
    }




    const table = useReactTable<processRegChangeRow>({
        data: registration.map((r) => {

            const currentRegId = r.regid;
            const studentName = r.student ? [r.student.namefirsten, r.student.namelasten].filter(Boolean).join(" ") : "N/A";
            const classOut = r.classid && r.classid in classMap ? classMap[r.classid] : "N/A";
            const classIn = appliedRegId===r.regid && classId in classMap ? classMap[classId] : "N/A";
//            const parentComment = r.regid == regId ? parentNote : "";


            return {//requestId: currentRegId == regId? requestId : null,
                    regId: currentRegId,
//                    familyId: familyId,
                    student: studentName,
                    regClassId: classOut,
                    transClassId: classIn,
//                    requestDate: currentRegId == regId? requestDate : "",
//                    parentComment: parentComment,
//                    adminComment: adminComment,
//                    reqStatus: currentRegId == regId? status :0 
                } satisfies processRegChangeRow;
        }),

        columns: [editColumn, ...columns,BalanceColumn,extraFeeColumn,adminMemoColumn], 
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