"use client";
import { family, regchangerequest, student, users } from "@/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";

import { useRouter } from 'next/navigation';
import { cn, REQUEST_STATUS_PENDING } from "@/lib/utils";
import { PencilIcon } from "lucide-react";
import {
    ColumnDef,
    useReactTable,
    getCoreRowModel
} from '@tanstack/react-table'
import { ClientTable } from "@/components/client-table";


type regChangeRow = {
    regid: number;
    requestid: number;
    // oldclass: number
    // newclass: number
    familyid: string;
    father: string;
    mother: string;
    phone: string;
    email: string;
    NumOfReq: number;
    action: string;
    reqStatus: number;
    firstReq: string;
    lastProcess: string;
    processBy: string;
}

type regChangeTableProps = {
    requests: (InferSelectModel<typeof regchangerequest> & { 
        student: InferSelectModel<typeof student>, 
        family: (InferSelectModel<typeof family> & { user: InferSelectModel<typeof users> | null }) | null
    })[]
    adminMap: Record<number, string>;
}
const reqStatusMap = {
    1: "Pending",
    2: "Approved",
    3: "Rejected"
}

const columns: ColumnDef<regChangeRow>[] = [
    {
        accessorKey: "regid",
        header: "Reg ID",
        cell: info => info.getValue(),
    },
    {
        accessorKey: "requestid",
        header: "Request ID",
        cell: info => info.getValue(),
    },
    {
        accessorKey: "familyid",
        header: "Family ID",
        cell: info => info.getValue(),
    },
    {
        accessorKey: "father",
        header: "Father",
        cell: info => info.getValue(),
    },
    {
        accessorKey: "mother",
        header: "Mother",
        cell: info => info.getValue(),
    },
    {
        accessorKey: "phone",
        header: "Phone",
        cell: info => info.getValue(),
    },
    {
        accessorKey: "email",
        header: "Email",
        cell: info => info.getValue(),
    },
    {
        accessorKey: "NumOfReq",
        header: "Requests",
        cell: info => info.getValue(),
    },
    {
        accessorKey: "action",
        header: "Action",
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
    {
        accessorKey: "firstReq",
        header: "First Request",
        cell: info => info.getValue(),
    },
    {
        accessorKey: "lastProcess",
        header: "Last Processed",
        cell: info => info.getValue(),
    },
    {
        accessorKey: "processBy",
        header: "Processed By",
        cell: info => info.getValue(),
    },
];
export default function RegChangeTable({ requests, adminMap }: regChangeTableProps) {
    const router = useRouter();
    
    const editColumn: ColumnDef<regChangeRow> = {
        id: "edit",
        header: "",
        cell: ({ row }) => {
            const requestid = row.original.requestid;
            const regid = row.original.regid;
            const familyid = row.original.familyid;
            const action = row.original.action;


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
                    onClick={(e) => { e.stopPropagation(); router.push(`/admin/management/regchangerequests/processregchange?requestid=${requestid}&regid=${regid}&action=${action}&familyid=${encodeURIComponent(familyid)}`); }}
                >
                    <PencilIcon className="w-5 h-5 text-white" />
                </button>
            );
        }
    }

    const table = useReactTable<regChangeRow>({
        data: requests.map((r) => {
            const numOfRequests = requests.filter(req => req.familyid === r.familyid).length;

            // Defensive null checks for family and user
            const family = r.family;
            const user = family?.user;

            const father = family
                ? [family.fatherfirsten, family.fatherlasten, family.fathernamecn].filter(Boolean).join(" ")
                : "N/A";
            const mother = family
                ? [family.motherfirsten, family.motherlasten, family.mothernamecn].filter(Boolean).join(" ")
                : "N/A";
            const phone = user?.phone ?? "N/A";
            const email = user?.email ?? "N/A";
            const familyid = family?.familyid?.toString() ?? "N/A";
            const reqStatus = r.reqstatusid ?? REQUEST_STATUS_PENDING;
            const firstReq = requests
                .filter(req => req.familyid === r.familyid)
                .sort((a, b) => new Date(a.submitdate ?? 0).getTime() - new Date(b.submitdate ?? 0).getTime())[0]?.submitdate ?? "";
            const lastProcess = r.processdate ?? "";
            const processBy = typeof r.adminuserid === "number" && r.adminuserid in (adminMap ?? {})
                ? adminMap[r.adminuserid]
                : r.adminuserid?.toString() ?? "N/A";

            const action =r.appliedid ==0 ? "D" : "T";

            return {
                regid: r.regid,
                requestid: r.requestid,
                familyid,
                father,
                mother,
                phone,
                email,
                NumOfReq: numOfRequests,
                action,
                reqStatus,
                firstReq,
                lastProcess,
                processBy,
            } satisfies regChangeRow;
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