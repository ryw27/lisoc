"use client";
import { ColumnDef, useReactTable, getCoreRowModel, flexRender, SortingState, ColumnPinningState, Row } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontal, PencilIcon, TrashIcon } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import TableHeader from "@/components/table-header";
import { FilterableColumn } from "@/app/lib/column-types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '@/components/ui/alert-dialog'
// import { deleteClasses } from "../dashboard/(class-pages)/class-helpers";


type DataTableProps<TData extends Record<string, any>, TId = string | number> = {
    data: TData[];
    columns: FilterableColumn<TData>[];
    totalCount: number;
    tableName: string;
    primaryKey: string;
    // getTableRowID: (row: TData) => TId;
    deleteAction: (ids: TId[]) => Promise<void>;
}
 
// TODO: Check Record<string, any>
export default function DataTable<TData extends Record<string, any>, TId extends string | number>({data, columns, totalCount, tableName, primaryKey, deleteAction}: DataTableProps<TData, TId>) {
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
        left: ['select'],
        right: ['edit']
    });

    useEffect(() => {
        try {
            const storedVisibility = localStorage.getItem(`${tableName} Columns`);
            if (storedVisibility) {
                // Use stored visibility if available
                setColumnVisibility(JSON.parse(storedVisibility));
            } else {
                const initialVisibility: Record<string, boolean> = {};
                
                // First, set all columns to false (hidden)
                columns.forEach((column) => {
                    initialVisibility[column.id] = false;
                });
                
                // Then, set special columns to true (visible)
                columns.forEach((column) => {
                    if (column.enableHiding === false || column.id === 'select' || column.id === 'edit') {
                        initialVisibility[column.id] = true;
                    }
                });
                
                setColumnVisibility(initialVisibility);
            }
        } catch (error) {
            console.error("Error parsing column visibility");
        }
    }, [tableName]);

    useEffect(() => {
        if (Object.keys(columnVisibility).length > 0) {
            localStorage.setItem(`${tableName} Columns`, JSON.stringify(columnVisibility));
        }
    }, [columnVisibility, tableName, columns]);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Create our checkbox column
    const selectionColumn: ColumnDef<TData>[] = useMemo(() => [
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
    ], []);

    // Create edit column
    const editColumn: ColumnDef<TData>[] = useMemo(() => [
        {
            id: "edit",
            cell: ({ row }) => {
                return (
                    <Popover>
                        <PopoverTrigger className={cn(
                            "items-center rounded-md p-1 cursor-pointer",
                            "border-1 border-gray-300 hover:border-gray-700",
                        )}>
                            <MoreHorizontal className="w-4 h-4" />
                        </PopoverTrigger>
                        <PopoverContent 
                            className={cn(
                            "flex flex-col gap-1 justify-begin items-center w-36",
                            "bg-white border border-gray-300 rounded-md",
                            "p-1"
                            )}
                            align="end"
                            side="bottom"
                            sideOffset={5}
                        >
                            <button 
                                className={cn(
                                    "flex items-center self-start text-left text-sm hover:bg-gray-100 whitespace-nowrap",
                                    "rounded-sm w-full p-1 cursor-pointer transition-colors duration-200",
                                    "text-blue-500 hover:text-blue-600"
                                )}
                                onClick={() => {
                                    //TODO: find path
                                    const row_id = row.getValue(primaryKey);
                                    router.push(pathname + `${row_id}`)
                                    // console.log("edit");
                                }}
                            >
                                <PencilIcon className="w-4 h-4 mr-2" /> Edit
                            </button>
                            <button 
                                className={cn(
                                    "flex items-center self-start text-left text-sm hover:bg-gray-100 whitespace-nowrap",
                                    "rounded-sm w-full p-1 cursor-pointer transition-colors duration-200",
                                    "text-red-500 hover:text-red-600"
                                )}
                                onClick={() => {
                                    handleDelete(row);
                                }}
                            >
                                <TrashIcon className="w-4 h-4 mr-2" /> Delete
                            </button>
                        </PopoverContent>
                    </Popover>
                )
            }
        }
    ], [])
    // Combine selection column with provided columns
    const allColumns = useMemo(() => [...selectionColumn, ...columns, ...editColumn], [columns])

    // Set sorting 
    useEffect(() => {
        const sortBy = searchParams.get('sortBy');
        const sortOrder = searchParams.get('sortOrder');    
        if (sortBy && sortOrder) {
            setSorting([{id: sortBy, desc: sortOrder === 'desc'}]);
        } else {
            setSorting([]);
        }
    }, [searchParams.toString()]);

    useEffect(() => {
        if (sorting.length > 0) {
            if (sorting[0].id && sorting[0].desc) {
                const params = new URLSearchParams(searchParams.toString());
                params.set('sortBy', sorting[0].id);
                params.set('sortOrder', sorting[0].desc ? 'desc' : 'asc');
                router.replace(`?${params.toString()}`);
            }
        }
    }, [sorting]) 

    // Pagination variables
    const currentPage = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 10;
    const pageCount = Math.ceil(totalCount / pageSize);

    // Function to create URL with updated page parameter
    const createPageURL = (pageNumber: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    // Function to handle page change
    const handlePageChange = (pageNumber: number) => {
        router.replace(createPageURL(pageNumber));
    };

    const handleDelete = async (selectedRow?: Row<TData>) => {
        if (selectedRow) {
            console.log("there is a row");
            table.resetRowSelection(); // Make sure no others are toggled
        }
        console.log("deleting");
        const selectedRows = selectedRow ? [selectedRow] : table.getSelectedRowModel().rows;
        const ids = selectedRows.map(row => row.original[primaryKey]) as TId[];
        console.log(ids);
        if (!ids.length) return;
        await deleteAction(ids);
        table.resetRowSelection();
    }


    const table = useReactTable({
        data,
        columns: allColumns, 
        state: {
            columnPinning,
            rowSelection,
            pagination: {
                pageIndex: 0, // Always show first page in the UI since actual pagination is server-side
                pageSize: data.length // Show all data we received for this page
            },
            sorting,
            columnVisibility // Select which columns to show
        },
        // getRowId: row => String(getTableRowID(row)),
        enableRowSelection: true,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onColumnPinningChange: setColumnPinning, 
        getCoreRowModel: getCoreRowModel(),
        // Client-side pagination is disabled for server-side pagination
        manualPagination: true,
        manualFiltering: true,
        pageCount: pageCount 
    });


    // Memoize the columns passed to TableHeader
    const memoizedTableColumns = useMemo(() => table.getAllColumns(), [table]);

    return (
        <div className="bg-white border-b border-gray-200">
            {/* Alert for row selection*/ }
            <div className="p-2">
                {Object.keys(rowSelection).length > 0 && (
                    <div className="flex justify-between items-center bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-md text-sm">
                        <p>{Object.keys(rowSelection).length} {Object.keys(rowSelection).length === 1 ? 'row' : 'rows'} selected</p>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button 
                                    className="text-red-500 font-medium cursor-pointer"
                                >
                                    Delete
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Are you absolutely sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the selected rows from 
                                        the database.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete()} className="cursor-pointer">Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                    </div>
                )}
            </div>
            <TableHeader 
                columns={memoizedTableColumns}
                columnDefs={columns}
            />

            {/* Table with horizontal scroll */}
            <div className="overflow-x-auto w-full">
                <table className="min-w-full table-fixed relative">
                    {/* Header items */}
                    <thead className="border-b border-gray-200">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}> 
                                {headerGroup.headers.map((header) => (
                                    <th 
                                        key={header.id}
                                        className={`whitespace-nowrap cursor-pointer px-3 py-3 text-left text-xs font-bold text-black text-lg tracking-wider ${
                                            header.id === 'select' ? 'w-12' : ''
                                        } ${
                                            header.column.getIsPinned() === 'left' ? 'sticky left-0 z-10 bg-white' : ''
                                        } ${
                                            header.column.getIsPinned() === 'right' ? 'sticky right-0 z-10 bg-white' : ''
                                        }`}
                                        onClick={() => {
                                            if ((header.id !== 'select') && header.column.getCanSort()) {
                                                const direction = sorting[0]?.id === header.id && sorting[0]?.desc === false ? true : false; // true it's desc, false it's asc
                                                setSorting([{id: header.id, desc: direction}]);
                                            }
                                        }}
                                        aria-sort={sorting.length > 0 ? sorting[0].id === header.id ? sorting[0].desc === true ? 'descending' : 'ascending' : 'none' : 'none'}
                                    >
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        {header.id === sorting[0]?.id && (
                                            <span>{sorting[0].desc === false ? ' ↑' : ' ↓'}</span>
                                        )}
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
                                className={`cursor-pointer hover:bg-blue-50 transition-colors ${row.getIsSelected() ? 'bg-blue-50' : ''}`}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td 
                                        key={cell.id}
                                        className={`px-3 py-1 text-sm text-gray-600 ${
                                            cell.column.id === 'select' ? 'w-12' : 'whitespace-nowrap'
                                        } ${
                                            cell.column.getIsPinned() === 'left' ? `sticky left-0 z-10 ${row.getIsSelected() ? 'bg-blue-50' : 'bg-white'}` : ''
                                        } ${
                                            cell.column.getIsPinned() === 'right' ? `sticky right-0 z-10 ${row.getIsSelected() ? 'bg-blue-50' : 'bg-white'}` : ''
                                        }`}
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