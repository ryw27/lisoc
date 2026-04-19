"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { ClientTable } from "@/components/client-table";

export type RegistrationView = {
    studentid: number;
    familyid: number;
    regid: number;
    studentnameen: string;
    studentnamecn: string;
    gender: string;

    arrangeid: number;
    classnamecn: string;
    seasonnamecn: string;
    teachernamecn: string;
    regdate: string;
    statusnamecn: string;
    email: string | undefined;
    phone: string | undefined;
};

function SelectColumnFilter({ column }: { column: Column<RegistrationView> }): React.ReactNode {
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

function TextInputFilter({ column }: { column: Column<RegistrationView> }): React.ReactNode {
    const [inputValue, setInputValue] = useState((column.getFilterValue() as string) ?? "");

    useEffect(() => {
        const timer = setTimeout(() => {
            column.setFilterValue(inputValue);
        }, 200); // 200ms delay after user stops typing

        return () => clearTimeout(timer);
    }, [inputValue, column]);

    return (
        <input
            type="text"
            placeholder="Filter..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
        />
    );
}

const columns: ColumnDef<RegistrationView>[] = [
    {
        accessorKey: "studentid",
        header: "SID",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "familyid",
        header: "FID",
        sortingFn: "alphanumeric",
        cell: ({ getValue }) => {
            const FamId = getValue<number>();

            return (
                <Link href={`/admin/management/${FamId}`} className="text-blue-500 hover:underline">
                    <p className="text-green-500">{FamId}</p>
                </Link>
            );
        },
    },

    {
        accessorKey: "regid",
        header: "RegID",
        sortingFn: "alphanumeric",
    },

    {
        accessorKey: "studentnameen",
        header: "Name_Eng",
    },
    {
        accessorKey: "studentnamecn",
        header: "学生姓名",
    },
    /*    {
        accessorKey: "gender",
        header: "Gender",
    },*/
    {
        accessorKey: "classnamecn",
        header: ({ column }) => (
            <div>
                Courses <br />
                <SelectColumnFilter column={column} />
            </div>
        ),
        filterFn: "equalsString", // Use a built-in filter function
        //filterFn: 'uniqueValueFilterFn', // Use a built-in filter function
        enableColumnFilter: true,
    },
    /*    {
        accessorKey: "seasonnamecn", 
        header:"Semester",
        
    },*/
    {
        accessorKey: "teachernamecn",
        header: "老师",
        cell: (info) => {
            const arrangeid = String(
                Number(info.row.original.arrangeid ? info.row.original.arrangeid : 0)
            );
            return arrangeid === "0" ? (
                <p className="text-gray-500">{info.row.original.teachernamecn}</p>
            ) : (
                <Link
                    href={`/admin/management/semester/${arrangeid}`}
                    className="text-blue-500 hover:underline"
                >
                    <p>{info.row.original.teachernamecn}</p>
                </Link>
            );
        },
        enableColumnFilter: true,
    },
    {
        accessorKey: "regdate",
        header: "DATE",
    },

    {
        accessorKey: "statusnamecn",
        header: ({ column }) => (
            <div>
                Status <br />
                <SelectColumnFilter column={column} />
            </div>
        ),
        filterFn: "equalsString", // Use a built-in filter function
        //filterFn: 'uniqueValueFilterFn', // Use a built-in filter function
        enableColumnFilter: true,
    },

    {
        accessorKey: "phone",
        header: ({ column }) => (
            <div>
                Phone
                <br />
                <TextInputFilter column={column} />
            </div>
        ),
        filterFn: "includesString",
        enableColumnFilter: true,
    },

    {
        accessorKey: "email",
        header: ({ column }) => (
            <div>
                Email
                <br />
                <TextInputFilter column={column} />
            </div>
        ),
        filterFn: "includesString", // Partial string match
        enableColumnFilter: true,
        enableSorting: false, // Disable sorting for email column
    },
];

export function SemesterRegistrations({ registrations }: { registrations: RegistrationView[] }) {
    const [sorting, setSorting] = useState<SortingState>([]);

    const table = useReactTable<RegistrationView>({
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
        getFilteredRowModel: getFilteredRowModel(), // Required for filtering
    });

    return (
        <div>
            <div className="mb-4" />
            <ClientTable table={table} />
        </div>
    );
}
