"use client";

import { ClientTable } from "@/components/client-table";
import {
    Column,
    ColumnDef,
    getCoreRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";


export type adminFamilyRegView = {
    regid: number;
    nameen: string;
    namecn: string;
    regdate: string;
    classid: string;
    seasonid: string;
    teacherid: string;
    statusid: string;
};

function SelectColumnFilter({ column }: { column: Column<adminFamilyRegView> }): React.ReactNode {
    const uniqueValues = Array.from(column.getFacetedUniqueValues().keys()); // Get unique values

    return (
        <select
            value={(column.getFilterValue() as string) ?? ""}
            onChange={(e) => column.setFilterValue(e.target.value)}
        >
            <option value="">All</option>
            {uniqueValues.map((value) => (
                <option key={String(value)} value={String(value)}>
                    {String(value)}
                </option>
            ))}
        </select>
    );
}

const columns: ColumnDef<adminFamilyRegView>[] = [
    {
        accessorKey: "regid",
        header: "Reg ID",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "nameen",
        header: "Name (EN)",
    },
    {
        accessorKey: "namecn",
        header: "学生姓名 (CN)",
    },
    {
        accessorKey: "regdate",
        header: "Date/注册日期",
        sortingFn: "datetime",
    },
    {
        accessorKey: "classid", // Automatically gets classnamecn, no worries
        header: "Class/班级",
    },
    {
        accessorKey: "seasonid", // Same as classid
        header: ({ column }) => (
            <div>
                Semester/学期
                <br />
                <SelectColumnFilter column={column} />
            </div>
        ),
        filterFn: "equalsString", // Use a built-in filter function
        //filterFn: 'uniqueValueFilterFn', // Use a built-in filter function
        enableColumnFilter: true,
        enableSorting: false, // Disable sorting for this column
    },
    {
        accessorKey: "teacherid", // Same as classid
        header: "Teacher/教师",
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
    },
    {
        accessorKey: "statusid",
        header: "Status/状态",
    },
];


export default function FamilyRegistrationTable({ registrations }: {registrations: adminFamilyRegView[]}) {
    const [sorting, setSorting] = useState<SortingState>([]);


    const table = useReactTable<adminFamilyRegView>({
        data: registrations,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSorting: true,
        onSortingChange: setSorting,
        state: {
            sorting,
        },

        enableColumnFilters: true,
        getFacetedUniqueValues: getFacetedUniqueValues(), // Enable faceting
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Family Registration /注册记录</h1>
            </div>
            <ClientTable table={table} />
        </div>
    );
}
