"use client";
import { family, regchangerequest, student, users } from "@/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { useState } from "react";
import { cn, REQUEST_STATUS_PENDING } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MoreHorizontal, CheckIcon, XIcon } from "lucide-react";
import {
    ColumnDef,
    useReactTable,
    getCoreRowModel
} from '@tanstack/react-table'
import { ClientTable } from "@/components/client-table";
import { adminApproveRequest, adminRejectRequest } from "@/lib/registration/regchanges";

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
    const [busy, setBusy] = useState<boolean>(false);
    
    const editColumn: ColumnDef<regChangeRow> = {
        id: "edit",
        header: "",
        cell: ({ row }) => {

            const handleApprove = async () => {
                if (busy) return;
                setBusy(true);
                
                try {
                    const reqid = row.original.requestid;
                    const regid = row.original.regid;
                    // TODO: Implement server action for approving request
                    await adminApproveRequest(reqid, regid);
                    // Reset state on success
                    setBusy(false);
                } catch (error) {
                    console.error("Approve failed:", error);
                    setBusy(false);
                }
            };

            const handleReject = async () => {
                if (busy) return;
                setBusy(true);
                
                try {
                    const reqid = row.original.requestid;
                    const regid = row.original.regid;
                    // TODO: Implement server action for rejecting request
                    await adminRejectRequest(reqid, regid);
                    // console.log("Rejecting request:", reqid);
                    
                    // Reset state on success
                    setBusy(false);
                } catch (error) {
                    console.error("Reject failed:", error);
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
                        <button 
                            className={cn(
                                "flex items-center self-start text-left text-sm hover:bg-gray-100 whitespace-nowrap",
                                "rounded-sm w-full p-1 cursor-pointer transition-colors duration-200",
                                "text-green-500 hover:text-green-600 gap-1",
                                "focus:outline-none focus:bg-gray-100",
                                busy && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleApprove();
                            }}
                            disabled={busy}
                        >
                            <CheckIcon className="w-4 h-4" /> Approve
                        </button>
                        <button 
                            className={cn(
                                "flex items-center self-start text-left text-sm hover:bg-gray-100 whitespace-nowrap",
                                "rounded-sm w-full p-1 cursor-pointer transition-colors duration-200",
                                "text-red-500 hover:text-red-600 gap-1",
                                "focus:outline-none focus:bg-gray-100",
                                busy && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleReject();
                            }}
                            disabled={busy}
                        >
                            <XIcon className="w-4 h-4" /> Reject
                        </button>
                    </PopoverContent>
                </Popover>
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

            return {
                regid: r.regid,
                requestid: r.requestid,
                familyid,
                father,
                mother,
                phone,
                email,
                NumOfReq: numOfRequests,
                reqStatus,
                firstReq,
                lastProcess,
                processBy,
            } satisfies regChangeRow;
        }),
        columns: [...columns, editColumn], 
        getCoreRowModel: getCoreRowModel(),
        state: {
            columnPinning: { right: ["edit"] }
        }
    });

    return (
        <ClientTable
            table={table}
        />
    )
}