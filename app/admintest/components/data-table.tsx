"use client";
import { ColumnDef, useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from "@tanstack/react-table"
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

type DataTableProps<TData> = {
    data: TData[];
    columns: ColumnDef<TData>[];
    pageCount?: number;
    currentPage?: number;
}

export default function DataTable<TData>({data, columns, pageCount, currentPage = 1}: DataTableProps<TData>) {
    const [rowSelection, setRowSelection] = useState({});
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Create our checkbox column
    const selectionColumn: ColumnDef<TData>[] = [
        {
            id: "select",
            header: ({ table }) => {
                return (
                    <div className="flex items-center justify-center h-4">
                        {table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected() ? (
                            <Checkbox 
                                className={cn(
                                    "cursor-pointer group",
                                    "bg-blue-600 border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                )}
                                onClick={() => table.toggleAllPageRowsSelected()}
                                checked={true}
                            />) : (
                            <Checkbox 
                                className={cn(
                                    "cursor-pointer group",
                                    "bg-white hover:bg-blue-600/10 hover:shadow-md hover:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                )}
                                onClick={() => table.toggleAllPageRowsSelected()}
                                checked={false}
                            />
                        )}
                    </div>
                )
            },
            cell: ({ row }) => {
                return (
                    <div className="flex items-center justify-center h-4">
                        {row.getIsSelected() ? (
                            <Checkbox 
                                className={cn(
                                    "cursor-pointer group",
                                    "bg-blue-600 border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                )}
                                onClick={() => row.toggleSelected()}
                                checked={true}
                            />
                        ) : (
                            <Checkbox 
                                className={cn(
                                    "cursor-pointer group",
                                    "bg-white hover:bg-blue-600/10 hover:shadow-md hover:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                )}
                                onClick={() => row.toggleSelected()}
                                checked={false}
                            />
                        )}
                    </div>
                )
            }
        }
    ];

    // Combine selection column with provided columns
    const allColumns = [...selectionColumn, ...columns];

    // For client-side pagination
    const defaultPageCount = Math.ceil(data.length / 10);

    // Function to create URL with updated page parameter
    const createPageURL = (pageNumber: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    // Function to handle page change
    const handlePageChange = (pageNumber: number) => {
        router.push(createPageURL(pageNumber));
    };

    const table = useReactTable({
        data,
        columns: allColumns,
        state: {
            rowSelection,
            pagination: {
                pageIndex: 0, // Always show first page in the UI since actual pagination is server-side
                pageSize: data.length // Show all data we received for this page
            }
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        // Client-side pagination is disabled for server-side pagination
        manualPagination: true,
        manualFiltering: true,
        pageCount: pageCount || defaultPageCount
    });
    
    return (
        <div className="bg-white border-b border-gray-200 overflow-scroll">
            <div className="p-2">
                {Object.keys(rowSelection).length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-md text-sm">
                        {Object.keys(rowSelection).length} {Object.keys(rowSelection).length === 1 ? 'row' : 'rows'} selected
                    </div>
                )}
            </div>
            <table className="w-full">
                <thead className="border-b border-gray-200">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}> 
                            {headerGroup.headers.map((header) => (
                                <th 
                                    key={header.id}
                                    className={`px-3 py-3 text-left text-xs font-bold text-black uppercase tracking-wider ${
                                        header.id === 'select' ? 'w-12' : ''
                                    }`}
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
                            className={`hover:bg-blue-50 transition-colors ${row.getIsSelected() ? 'bg-blue-50' : ''}`}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <td 
                                    key={cell.id}
                                    className={`px-3 py-2 text-sm text-gray-600 ${
                                        cell.column.id === 'select' ? 'w-12' : ''
                                    }`}
                                >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* Server-side pagination controls */}
            <div className="relative flex items-center justify-center px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                <div className="absolute left-4">
                    <p className="text-sm text-gray-500">
                        {/* Calculate current page's item range */}
                        Showing {Math.min(((currentPage - 1) * 10) + 1, pageCount || 1)} - {
                            Math.min(
                                currentPage * 10,
                                data.length + ((currentPage - 1) * 10)
                            )
                        } of {data.length + ((currentPage - 1) * 10)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className={
                            `px-3 py-1 text-sm rounded-md cursor-pointer ${
                                currentPage > 1
                                ? "text-blue-600" 
                                : "text-gray-400 cursor-not-allowed"
                            }`
                        }
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-1">
                        {/* First page */}
                        <button 
                            onClick={() => handlePageChange(1)} 
                            className={`px-3 py-1 text-sm font-bold rounded-md cursor-pointer text-black border-1 border-gray-300 hover:bg-blue-100 transition-colors ${
                                currentPage === 1 ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
                            }`}
                        >
                            1
                        </button>

                        {/* Left ellipsis */}
                        {currentPage > 3 && (
                            <span className="px-2">...</span>
                        )}

                        {/* Pages around current page */}
                        {Array.from({length: pageCount || 1}).map((_, i) => {
                            const pageNumber = i + 1;
                            // Show 2 pages before and after current page
                            if (pageNumber > 1 && pageNumber < (pageCount || 1) && 
                                pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1) {
                                return (
                                    <button 
                                        key={i} 
                                        onClick={() => handlePageChange(pageNumber)} 
                                        className={`px-3 py-1 text-sm rounded-md font-bold cursor-pointer text-black border-1 border-gray-300 hover:bg-blue-100 transition-colors ${
                                            currentPage === pageNumber ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
                                        }`}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            }
                            return null;
                        })}

                        {/* Right ellipsis */}
                        {currentPage < ((pageCount || 1) - 2) && (
                            <span className="px-2">...</span>
                        )}

                        {/* Last page */}
                        {(pageCount || 1) > 1 && (
                            <button 
                                onClick={() => handlePageChange(pageCount || 1)} 
                                className={`px-3 py-1 text-sm rounded-md font-bold cursor-pointer text-black border-1 border-gray-300 hover:bg-blue-100 transition-colors ${
                                    currentPage === (pageCount || 1) ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
                                }`}
                            >
                                {pageCount || 1}
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= (pageCount || 1)}
                        className={
                            `px-3 py-1 text-sm rounded-md cursor-pointer ${
                                currentPage < (pageCount || 1)
                                ? "text-blue-600" 
                                : "text-gray-400 cursor-not-allowed"
                            }`
                        }
                    >
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}