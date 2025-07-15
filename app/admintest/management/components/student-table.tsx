"use client";
import { ColumnDef, useReactTable, getCoreRowModel, flexRender, ColumnPinningState, SortingState, getSortedRowModel } from "@tanstack/react-table";
import { studentView } from "@/app/lib/semester/sem-schemas";
import { cn } from "@/lib/utils";
import { useState } from "react";

const columns: ColumnDef<studentView>[] = [
    {
        accessorKey: "regid",
        header: "RegID",
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "familyid",
        header: "Family ID",
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "studentid",
        header: "Student ID",       
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "namecn",
        header: "中文姓名",
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "namelasten",
        header: "Last Name",
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "namefirsten", 
        header: "First Name",
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "gender",
        header: "Gender",
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "dob",
        header: "Date of Birth",
        cell: ({ getValue }) => {
            const date = getValue() as string;
            return new Date(date).toLocaleDateString();
        },
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "registerDate",
        header: "Register Date",
        cell: ({ getValue }) => {
            const date = getValue() as string;
            return new Date(date).toLocaleDateString();
        },
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "dropped",
        header: "Status",
        sortingFn: "alphanumeric"
    },
    {
        accessorKey: "notes",
        header: "Notes",
        sortingFn: "alphanumeric"
    }
]

            

export default function StudentTable({ registrations }: { registrations: studentView[] }) {
    const [sorting, setSorting] = useState<SortingState>([
        {
            id: "registerDate",
            desc: true
        }
    ]);
    const table = useReactTable<studentView>({
        data: registrations,
        columns, 
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSorting: true,
        onSortingChange: setSorting,
        state: { sorting }
    });

    return (
        <div className="overflow-x-auto w-full overflow-y-auto">
            <table className="min-w-full table-fixed relative">
                {/* Header */}
                <thead className="border-b border-gray-200">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}> 
                            {headerGroup.headers.map((header) => (
                                <th 
                                    key={header.id}
                                    className={cn(
                                        "whitespace-nowrap cursor-pointer px-3 py-3 text-left text-xs font-bold text-black text-lg tracking-wider",
                                        header.id === 'select' && 'w-12',
                                        header.column.getIsPinned() === 'left' && 'sticky left-0 z-10 bg-white',
                                        header.column.getIsPinned() === 'right' && 'sticky right-0 z-10 bg-white'
                                    )}
                                    onClick={header.column.getToggleSortingHandler()}
                                    aria-sort={
                                        header.column.getIsSorted() === 'desc' ? 'descending' :
                                        header.column.getIsSorted() === 'asc' ? 'ascending' :
                                        'none'
                                    }
                                >
                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    {{
                                        asc: ' ↑',
                                        desc: ' ↓',
                                    }[header.column.getIsSorted() as string] ?? null}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {/* Table rows */}
                    {table.getRowModel().rows.map((row) => (
                        <tr 
                            key={row.id}
                            className={cn(
                                "cursor-pointer hover:bg-blue-50 transition-colors",
                                row.getIsSelected() && 'bg-blue-50'
                            )}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <td 
                                    key={cell.id}
                                    className={cn(
                                        "px-3 py-1 text-sm text-gray-600",
                                        cell.column.id === 'select' ? 'w-12' : 'whitespace-nowrap',
                                        cell.column.getIsPinned() === 'left' && `sticky left-0 z-10 ${row.getIsSelected() ? 'bg-blue-50' : 'bg-white'}`,
                                        cell.column.getIsPinned() === 'right' && `sticky right-0 z-10 ${row.getIsSelected() ? 'bg-blue-50' : 'bg-white'}`
                                    )}
                                    tabIndex={0}
                                >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}