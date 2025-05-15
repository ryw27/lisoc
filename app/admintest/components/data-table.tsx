"use client";
import { ColumnDef, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import TableHeader from "@/components/table-header";
import { FilterableColumn } from "./columns/column-types";

type DataTableProps<TData> = {
    data: TData[];
    columns: FilterableColumn<TData>[];
    totalCount: number;
    tableName: string;
}

export default function DataTable<TData>({data, columns, totalCount, tableName}: DataTableProps<TData>) {
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
    
    
    useEffect(() => {
        try {
            const storedVisibility = localStorage.getItem(`${tableName} Columns`);
            if (storedVisibility) {
                // Use stored visibility if available
                setColumnVisibility(JSON.parse(storedVisibility));
            } else {
                console.log("hello");
                const initialVisibility: Record<string, boolean> = {}
                columns.forEach((column) => {
                    if (column.enableHiding !== false || column.id === 'select' || column.id == 'edit') {
                        initialVisibility[column.id] = true;
                    }
                })
                console.log(initialVisibility);
            }
        } catch (error) {
            console.error("Error parsing column visibility");
        }
    }, [tableName]);

    useEffect(() => {
        if (Object.keys(columnVisibility).length > 0) {
            localStorage.setItem(`${tableName} Columns`, JSON.stringify(columnVisibility));
        }
    }, [columnVisibility, tableName]);

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

    // Create edit column
    // const editColumn: ColumnDef<TData>[] = [
    //     {
    //         id: "edit",
    //         header: "Edit",
    //         cell: ({ row }) => {
    //             return <div>Edit</div>
    //         }
    //     }
    // ]
    // Combine selection column with provided columns
    const allColumns = [...selectionColumn, ...columns];

    // Pagination variables
    const currentPage = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pagesize')) || 10;
    const pageCount = Math.ceil(totalCount / pageSize);

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

    // Editing functions


    const table = useReactTable({
        data,
        columns: allColumns,
        state: {
            rowSelection,
            pagination: {
                pageIndex: 0, // Always show first page in the UI since actual pagination is server-side
                pageSize: data.length // Show all data we received for this page
            },
            columnVisibility // Select which columns to show
        },
        enableRowSelection: true,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        // Client-side pagination is disabled for server-side pagination
        manualPagination: true,
        manualFiltering: true,
        pageCount: pageCount 
    });

    const handleMassDelete = () => {
        console.log("mass delete");
    }

    
    return (
        <div className="bg-white border-b border-gray-200">
            {/* Alert for row selection*/ }
            <div className="p-2">
                {Object.keys(rowSelection).length > 0 && (
                    <div className="flex justify-between items-center bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-md text-sm">
                        <p>{Object.keys(rowSelection).length} {Object.keys(rowSelection).length === 1 ? 'row' : 'rows'} selected</p>
                        <button 
                            className="text-red-500 font-medium cursor-pointer"
                            onClick={handleMassDelete}
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>
            <TableHeader 
                columns={table.getAllColumns()}
                columnDefs={columns}
            />

            {/* Table with horizontal scroll */}
            <div className="overflow-x-auto w-full">
                <table className="min-w-full table-fixed">
                    {/* Header items */}
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
                        {/* Cells of the table */}
                        {table.getRowModel().rows.map((row) => (
                            <tr 
                                key={row.id}
                                className={`hover:bg-blue-50 transition-colors ${row.getIsSelected() ? 'bg-blue-50' : ''}`}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td 
                                        key={cell.id}
                                        className={`px-3 py-2 text-sm text-gray-600 ${
                                            cell.column.id === 'select' ? 'w-12' : 'whitespace-nowrap'
                                        }`}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Server-side pagination controls */}
            <div className="relative flex items-center justify-center px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                <div className="absolute left-4">
                    <p className="text-sm text-gray-500">
                        {/* Calculate current page's item range */}
                        Showing {Math.min(((currentPage - 1) * Number(pageSize)) + 1)} - {
                            Math.min(
                                currentPage * Number(pageSize),
                                data.length + ((currentPage - 1) * Number(pageSize))
                            )
                        } of {totalCount}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className={
                            cn(
                                "px-3 py-1 text-sm rounded-md cursor-pointer",
                                currentPage > 1
                                ? "text-blue-600" 
                                : "text-gray-400 cursor-not-allowed"
                            )
                        }
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-1">
                        {/* First page */}
                        <button 
                            onClick={() => handlePageChange(1)} 
                            className={
                                cn(
                                    "px-3 py-1 text-sm font-bold rounded-md cursor-pointer text-black border-1 border-gray-300 hover:bg-blue-100 transition-colors",
                                    currentPage === 1 ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
                                )
                            }
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
                                        className={
                                            cn(
                                                "px-3 py-1 text-sm rounded-md font-bold cursor-pointer text-black border-1 border-gray-300 hover:bg-blue-100 transition-colors",
                                                currentPage === pageNumber ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
                                            )
                                        }
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
                                className={
                                    cn(
                                        "px-3 py-1 text-sm rounded-md font-bold cursor-pointer text-black border-1 border-gray-300 hover:bg-blue-100 transition-colors",
                                        currentPage === (pageCount || 1) ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
                                    )
                                }
                            >
                                {pageCount || 1}
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= (pageCount || 1)}
                        className={
                            cn(
                                "px-3 py-1 text-sm rounded-md cursor-pointer",
                                currentPage < (pageCount || 1)
                                ? "text-blue-600" 
                                : "text-gray-400 cursor-not-allowed"
                            )
                        }
                    >
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}