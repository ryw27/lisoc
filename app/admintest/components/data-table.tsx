"use client";
import { ColumnDef, useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from "@tanstack/react-table"
import { useMemo } from "react";

type DataTableProps<TData> = {
    data: TData[];
    columns: ColumnDef<TData>[];
    pageCount?: number;
}

export default function DataTable<TData>({data, columns, pageCount}: DataTableProps<TData>) {
    const referenceCols = useMemo(() => columns, [columns])

    const table = useReactTable({
        data,
        columns: referenceCols,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize: 2 
            }
        }
    })
    
    return (
        <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th 
                                    key={header.id}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {table.getRowModel().rows.map((row) => (
                        <tr 
                            key={row.id}
                            className="hover:bg-blue-50 transition-colors"
                        >
                            {row.getVisibleCells().map((cell) => (
                                <td 
                                    key={cell.id}
                                    className="px-6 py-4 text-sm text-gray-600"
                                >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* Pagination controls */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className={
                            `px-3 py-1 text-sm rounded-md cursor-pointer ${
                                table.getCanPreviousPage() 
                                ? "text-blue-600 hover:bg-blue-100 transition-colors" 
                                : "text-gray-400 cursor-not-allowed"
                            }`
                        }
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className={
                            `px-3 py-1 text-sm rounded-md cursor-pointer ${
                                table.getCanNextPage() 
                                ? "text-blue-600 hover:bg-blue-100 transition-colors" 
                                : "text-gray-400 cursor-not-allowed"
                            }`
                        }
                    >
                        Next
                    </button>
                </div>
                <div className="text-sm text-gray-500">
                    {table.getRowCount()} records found.
                    Showing page {table.getState().pagination.pageIndex + 1} of{' '}
                    {table.getPageCount()}
                </div>
            </div>
        </div>
    )
}