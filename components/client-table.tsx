"use client";
import { type Table } from "@tanstack/react-table"
import { flexRender } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

export function ClientTable<RowShape>({ table }: { table: Table<RowShape> }) {
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