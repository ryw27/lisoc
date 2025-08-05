"use client";
import { feedback } from "@/lib/db/schema";
import { ColumnDef, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { InferSelectModel } from "drizzle-orm";
import { useState } from "react";
import { ClientTable } from "../client-table";


interface FeedbackRow {
    recid: number;
    familyid: number | null;
    name: string | null;
    phone: string | null;
    email: string | null;
    comment: string | null;
    postdate: string | null;
    followup: string | null;
}

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
] 


export default function FeedbackTable({ allFeedback }: { allFeedback: InferSelectModel<typeof feedback>[]}) {
    const [sorting, setSorting] = useState<SortingState>([{
        id: "recid",
        desc: true
    }])

    const table = useReactTable<FeedbackRow>({
        data: allFeedback,
        columns: feedbackCols,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSorting: true,
        onSortingChange: setSorting,
        // getPaginationRowModel: getPaginationRowModel(),
        state: { sorting }
    })

    return (
        <ClientTable
            table={table}
        />
    )
}