"use client";

import { useState } from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    Row,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { InferSelectModel } from "drizzle-orm";
import { Check, Reply } from "lucide-react";
import { feedback } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { FeedbackRow } from "@/types/feedback.types";
import { markFeedbackDone, ReplyFeedback } from "@/server/feedback/actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "../ui/textarea";

// import { ClientTable } from "../client-table";

export const feedbackCols: ColumnDef<FeedbackRow>[] = [
    {
        accessorKey: "recid",
        header: "Feedback ID",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "familyid",
        header: "Family ID",
        cell: ({ getValue }) => {
            const famid = getValue() as number | null;
            return famid ?? "N/A";
        },
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue }) => getValue() ?? "N/A",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ getValue }) => getValue() ?? "N/A",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "email",
        header: "Email",
        cell: ({ getValue }) => getValue() ?? "N/A",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "comment",
        header: "Comment",
        cell: ({ getValue }) => getValue() ?? "N/A",
    },
    {
        accessorKey: "postdate",
        header: "Post Date",
        cell: ({ getValue }) => {
            const date = getValue() as string | null;
            return date ? new Date(date).toLocaleDateString() : "N/A";
        },
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "followup",
        header: "Follow Up",
        cell: ({ getValue }) => getValue() ?? "N/A",
    },
];

function HandleCell(props: { row: Row<FeedbackRow> }) {
    const [message, setMessage] = useState<string>("");
    const [open, setOpen] = useState<boolean>(false);
    const [busy, setBusy] = useState<boolean>(false);

    const recid = props.row.original.recid;

    const handleSend = async () => {
        if (!message.trim()) return;
        setBusy(true);
        await ReplyFeedback({ recid, adminMessage: message });
        setMessage("");
        setBusy(false);
        setOpen(false);
    };

    return (
        <div className="flex gap-2">
            <Popover open={open}>
                <PopoverTrigger asChild>
                    <button
                        className="cursor-pointer"
                        title="Reply with email"
                        type="button"
                        onClick={() => setOpen(true)}
                    >
                        <Reply className="h-5 w-5 font-bold text-green-800" />
                    </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80 p-4">
                    <div className="flex flex-col">
                        <h2 className="text-sm font-semibold text-gray-800">
                            Write your message here
                        </h2>
                        <p className="mb-2 text-sm text-gray-600">
                            The system will automatically send an email
                        </p>
                        <Textarea
                            id={`Reply-${recid}`}
                            name={`Reply-${recid}`}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <div className="mt-2 flex items-center gap-1 self-end">
                            <button
                                className="cursor-pointer rounded-md border-2 border-gray-300 p-2 text-xs font-bold"
                                type="button"
                                onClick={() => setOpen(false)}
                                disabled={busy}
                                aria-disabled={busy}
                            >
                                Cancel
                            </button>
                            <button
                                className={cn(
                                    "flex cursor-pointer items-center justify-center rounded-md bg-blue-600 p-2 text-xs font-bold text-white",
                                    busy && "cursor-not-allowed opacity-60"
                                )}
                                type="button"
                                onClick={handleSend}
                                disabled={!message.trim() || busy}
                                aria-busy={busy}
                            >
                                {busy ? (
                                    <svg
                                        className="mr-1 h-4 w-4 animate-spin text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                        ></path>
                                    </svg>
                                ) : null}
                                {busy ? "Sending..." : "Send"}
                            </button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            <button
                onClick={() => markFeedbackDone({ recid })}
                className="cursor-pointer"
                title="Mark as done"
                type="button"
            >
                <Check className="h-5 w-5 font-bold text-green-400" />
            </button>
        </div>
    );
}

const handleColumn: ColumnDef<FeedbackRow>[] = [
    {
        accessorKey: "handle",
        cell(props) {
            return HandleCell(props);
        },
    },
];

export default function FeedbackTable({
    allFeedback,
}: {
    allFeedback: InferSelectModel<typeof feedback>[];
}) {
    const [sorting, setSorting] = useState<SortingState>([
        {
            id: "recid",
            desc: true,
        },
    ]);

    const table = useReactTable<FeedbackRow>({
        data: allFeedback,
        columns: [...feedbackCols, ...handleColumn],
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSorting: true,
        onSortingChange: setSorting,
        // getPaginationRowModel: getPaginationRowModel(),
        state: { sorting },
    });

    return (
        <div className="w-full">
            <h1 className="text-primary mb-6 text-xl font-bold tracking-wide uppercase">
                Feedback Log
            </h1>

            <div className="border-border rounded-none border shadow-sm">
                <div className="w-full overflow-x-auto">
                    <table className="relative min-w-full table-fixed border-collapse text-sm">
                        {/* Header */}
                        <thead className="bg-muted/20">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className={cn(
                                                "border-primary/20 text-muted-foreground hover:bg-muted/50 hover:text-primary relative border-b-2 px-4 py-3 text-left text-xs font-bold tracking-wider uppercase transition-colors",
                                                header.id === "select" && "w-12",
                                                header.column.getIsPinned() === "left" &&
                                                    "bg-background sticky left-0 z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]",
                                                header.column.getIsPinned() === "right" &&
                                                    "bg-background sticky right-0 z-20 shadow-[-1px_0_0_0_rgba(0,0,0,0.1)]"
                                            )}
                                            onClick={header.column.getToggleSortingHandler()}
                                            aria-sort={
                                                header.column.getIsSorted() === "desc"
                                                    ? "descending"
                                                    : header.column.getIsSorted() === "asc"
                                                      ? "ascending"
                                                      : "none"
                                            }
                                        >
                                            <div className="flex items-center gap-2">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column.columnDef.header,
                                                          header.getContext()
                                                      )}

                                                {/* Sort Indicator */}
                                                <span className="text-primary">
                                                    {{
                                                        asc: "↑",
                                                        desc: "↓",
                                                    }[header.column.getIsSorted() as string] ??
                                                        null}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>

                        <tbody className="divide-border divide-y">
                            {/* Table rows */}
                            {table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className={cn(
                                        "group hover:bg-primary/5 data-[state=selected]:bg-primary/10 transition-colors",
                                        row.getIsSelected() && "bg-primary/10"
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className={cn(
                                                "border-border/40 text-foreground border-r px-4 py-3",
                                                cell.column.getIsPinned() === "left" &&
                                                    "bg-background group-hover:bg-primary/5 group-data-[state=selected]:bg-primary/10 sticky left-0 z-10",
                                                cell.column.getIsPinned() === "right" &&
                                                    "bg-background group-hover:bg-primary/5 group-data-[state=selected]:bg-primary/10 sticky right-0 z-10"
                                            )}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
