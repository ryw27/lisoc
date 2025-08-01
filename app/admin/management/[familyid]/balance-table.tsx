"use client"
import { ColumnDef, SortingState, useReactTable } from "@tanstack/react-table";
import { getCoreRowModel, getSortedRowModel } from "@tanstack/react-table";
import { useState } from "react";
import { ClientTable } from "@/components/client-table";


type balanceTypes = {
    balanceid: number;
    regdate: string;
    semester: string;
    amount: number;
    check_no: string;
    paiddate: string;
}
const columns: ColumnDef<balanceTypes>[] = [
    {
        header: "Balance ID",
        accessorKey: "balanceid",
    },
    {
        header: "Registration Date",
        accessorKey: "regdate",
    },
    {
        header: "Semester",
        accessorKey: "semester",
    },
    {
        header: "Amount",
        accessorKey: "amount",
        cell: ({ getValue }) => {
            const amount = getValue() as number;
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
        }
    },
    {
        header: "Check No",
        accessorKey: "check_no",
    },
    {
        header: "Paid Date",
        accessorKey: "paiddate",
        cell: ({ getValue }) => {
            const paiddate = getValue() as string;
            if (paiddate === "1900-01-01 00:00:00") return "N/A";
            return paiddate ? new Date(paiddate).toLocaleDateString() : "N/A";
        }
    }
];

type balanceTableProps = {
    balanceData: balanceTypes[];
}
export default function BalanceTable({ balanceData }: balanceTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const table = useReactTable<balanceTypes>({
        data: balanceData,
        columns: columns, 
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSorting: true,
        onSortingChange: setSorting,
        state: { sorting }
    });
    return (
        <ClientTable table={table} />
    )
}