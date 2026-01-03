"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { InferSelectModel } from "drizzle-orm";
import { MoreHorizontal, PencilIcon } from "lucide-react";
import { classregistration, student } from "@/lib/db/schema";
import { cn, REQUEST_STATUS_PENDING } from "@/lib/utils";
import {
    adminApproveRequest,
    adminRejectRequest,
    adminUndoRequest,
} from "@/server/registration/regchanges";
//import { useRouter } from 'next/navigation';
import { ClientTable } from "@/components/client-table";
//import { request } from "http";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

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
};

type processRegChangeProps = {
    requestId: number;
    regId: number;
    appliedRegId: number;
    classId: number;
    familyId: number;
    status: number;
    //   requestDate: string,
    registration: (InferSelectModel<typeof classregistration> & {
        student: InferSelectModel<typeof student>;
    })[];
    //   parentNote: string,
    classMap: Record<number, string>;
    feeMap: Record<number, string>;
};
//const reqStatusMap = {
//    1: "Pending",
//   2: "Approved",
//   3: "Rejected"
//}

const columns: ColumnDef<processRegChangeRow>[] = [
    /* {
         accessorKey: "requestId",
         header: "Request ID",
         cell: info => info.getValue(),
     },*/
    {
        accessorKey: "regId",
        header: "Reg ID",
        cell: (info) => info.getValue(),
    },
    /*  {
          accessorKey: "familyId",
          header: "Family ID",
          cell: info => info.getValue(),
      },*/
    {
        accessorKey: "student",
        header: "Student",
        cell: (info) => info.getValue(),
    },
    {
        accessorKey: "regClassId",
        header: "Class",
        cell: (info) => info.getValue(),
    },
    {
        accessorKey: "transClassId",
        header: "Transfer To",
        cell: (info) => info.getValue(),
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

async function handleDropTransfer(
    requestId: number,
    regId: number,
    adminMemo: string,
    balanceType: number,
    extraFee: number,
    action: string
) {
    if (action == "A") {
        adminApproveRequest(requestId, regId, adminMemo, balanceType, extraFee);
    } else if (action == "R") {
        adminRejectRequest(requestId, regId, adminMemo);
    }
}

type handleFunction = {
    onValueChange: (newValue: string) => void;
};

function NumericTextInput({ onValueChange }: handleFunction) {
    const [value, setValue] = useState<string>("");

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const inputValue = event.target.value;
        // This regex allows for digits (0-9) and a single literal dot (.)

        if (
            inputValue.length == 0 ||
            inputValue[inputValue.length - 1] == "." ||
            (inputValue.length == 1 && inputValue[0] == "-")
        ) {
            const ivalue = inputValue.length === 0 ? "" : inputValue;
            setValue(ivalue);
            onValueChange(ivalue);
            return;
        }

        const matched = inputValue.match(/^-?\d+(?:\.\d+)?$/);

        if (matched !== null) {
            setValue(inputValue);
            onValueChange(inputValue);
        }

        // any invalid input don't change value, keep original
    };

    return (
        <Textarea
            className="min-h-10 min-w-10 resize-none"
            value={value}
            onChange={handleInputChange}
            placeholder="0.0"
        />
    );
}

export default function ProcessRegChange({
    requestId,
    regId,
    appliedRegId,
    classId,
    familyId,
    status,
    registration,
    classMap,
    feeMap,
}: processRegChangeProps) {
    const router = useRouter();

    const extraFeeRef = useRef<string>("");
    const adminMemoRef = useRef<HTMLTextAreaElement>(null);
    const balanceTypeRef = useRef<HTMLSelectElement>(null);
    const [validationOpen, setValidationOpen] = useState(false);
    //const [validationError, setValidationError] = useState<string | null>(null);

    //const canEdit = status === 1 ; // pending

    const handleExtraFeeChange = (newValue: string) => {
        extraFeeRef.current = newValue;
    };

    const editColumn: ColumnDef<processRegChangeRow> = {
        id: "edit",
        header: "",
        cell: ({ row }) => {
            if (row.original.regId !== regId) {
                return <div> </div>;
            }
            return (
                <>
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
                            {status == REQUEST_STATUS_PENDING ? (
                                <>
                                    <button
                                        className={cn(
                                            cn(
                                                "flex items-center self-start text-left text-sm whitespace-nowrap hover:bg-gray-100",
                                                "w-full cursor-pointer gap-1 rounded-sm p-1 transition-colors duration-200",
                                                "focus:bg-gray-100 focus:outline-none",
                                                false
                                                    ? "cursor-not-allowed text-gray-300"
                                                    : "cursor-pointer text-blue-500 hover:text-blue-600"
                                            )
                                        )}
                                        onClick={() => {
                                            const adminMemo = adminMemoRef.current?.value || "";
                                            const extraFeeStr = extraFeeRef.current;
                                            const balanceTypeStr =
                                                balanceTypeRef.current?.value || "6";
                                            console.log("balanceTypeStr", balanceTypeStr);
                                            let extraFee = 0.0;
                                            if (extraFeeStr.length != 0) {
                                                extraFee = parseFloat(extraFeeStr);
                                            }
                                            handleDropTransfer(
                                                requestId,
                                                regId,
                                                adminMemo,
                                                parseInt(balanceTypeStr),
                                                extraFee,
                                                "A"
                                            );
                                            router.push("/admin/management/regchangerequests/");
                                        }}
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                        Approve
                                    </button>
                                    <button
                                        className={cn(
                                            cn(
                                                "flex items-center self-start text-left text-sm whitespace-nowrap hover:bg-gray-100",
                                                "w-full cursor-pointer gap-1 rounded-sm p-1 transition-colors duration-200",
                                                "focus:bg-gray-100 focus:outline-none",
                                                false
                                                    ? "cursor-not-allowed text-gray-300"
                                                    : "cursor-pointer text-red-500 hover:text-red-600"
                                            )
                                        )}
                                        onClick={() => {
                                            const adminMemo = adminMemoRef.current?.value || "";
                                            handleDropTransfer(
                                                requestId,
                                                regId,
                                                adminMemo,
                                                6,
                                                0.0,
                                                "R"
                                            );
                                            router.push("/admin/management/regchangerequests/");
                                        }}
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                        Reject
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className={cn(
                                            cn(
                                                "flex items-center self-start text-left text-sm whitespace-nowrap hover:bg-gray-100",
                                                "w-full cursor-pointer gap-1 rounded-sm p-1 transition-colors duration-200",
                                                "focus:bg-gray-100 focus:outline-none",
                                                false
                                                    ? "cursor-not-allowed text-gray-300"
                                                    : "cursor-pointer text-blue-500 hover:text-blue-600"
                                            )
                                        )}
                                        onClick={() => {
                                            // handle undo

                                            adminUndoRequest(requestId, familyId, status);

                                            router.push("/admin/management/regchangerequests/");
                                        }}
                                    >
                                        <PencilIcon className="h-4 w-4" /> UNDO
                                    </button>
                                </>
                            )}
                        </PopoverContent>
                    </Popover>
                    <AlertDialog open={validationOpen} onOpenChange={setValidationOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Validation Failed</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {"validation Error"}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogAction onClick={() => setValidationOpen(false)}>
                                    Close
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            );
        },
    };

    const adminMemoColumn: ColumnDef<processRegChangeRow> = {
        id: "aminMemo",
        header: "[adminstration Memo /管理员 笔记(50max)]",
        minSize: 400,
        maxSize: 400,
        size: 400,
        enableResizing: false,
        cell: ({ row }) => {
            if (row.original.regId !== regId) {
                return <div> </div>;
            }
            return (
                <Textarea
                    ref={adminMemoRef}
                    className="min-w 1200 max-w 2400 min-h-10 resize-none"
                    maxLength={50}
                    placeholder="please enter memo here no more than 50 chars"
                />
            );
        },
    };

    const extraFeeColumn: ColumnDef<processRegChangeRow> = {
        id: "extraFee",
        header: "extra Fee",
        minSize: 80,
        maxSize: 80,
        size: 80,
        enableResizing: false,
        cell: ({ row }) => {
            if (row.original.regId !== regId) {
                return <div> </div>;
            }

            return <NumericTextInput onValueChange={handleExtraFeeChange} />;
        },
    };

    const BalanceColumn: ColumnDef<processRegChangeRow> = {
        id: "balanceType",
        header: "Balance Type",
        minSize: 40,
        maxSize: 40,
        size: 80,
        enableResizing: false,
        cell: ({ row }) => {
            if (row.original.regId !== regId) {
                return <div> </div>;
            }

            return (
                <div>
                    <select ref={balanceTypeRef} defaultValue={6}>
                        {/*<option value="">-- Please Select  --</option> */}
                        {Object.entries(feeMap).map(([key, value]) => (
                            <option key={key} value={`${key}`}>
                                {key}-{value}
                            </option>
                        ))}
                    </select>
                </div>
            );
        },
    };

    const table = useReactTable<processRegChangeRow>({
        data: registration.map((r) => {
            const currentRegId = r.regid;
            const studentName = r.student
                ? [r.student.namefirsten, r.student.namelasten].filter(Boolean).join(" ")
                : "N/A";
            const classOut = r.classid && r.classid in classMap ? classMap[r.classid] : "N/A";
            const classIn =
                appliedRegId === r.regid && classId in classMap ? classMap[classId] : "N/A";
            //            const parentComment = r.regid == regId ? parentNote : "";

            return {
                //requestId: currentRegId == regId? requestId : null,
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

        columns: [editColumn, ...columns, BalanceColumn, extraFeeColumn, adminMemoColumn],
        getCoreRowModel: getCoreRowModel(),
        state: {
            columnPinning: { left: ["edit"] },
        },
    });

    return (
        <>
            <ClientTable table={table} />
        </>
    );
}
