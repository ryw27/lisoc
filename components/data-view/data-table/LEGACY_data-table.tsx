"use client";
import { ColumnDef, useReactTable, getCoreRowModel, flexRender, SortingState, ColumnPinningState, Row } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontal, PencilIcon, TrashIcon } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import TableHeader from "./data-table-toolbar";
import { FilterableColumn } from "@/lib/data-view/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '@/components/ui/alert-dialog'
import { PKVal, Table } from "@/lib/data-view/types";
import { InferSelectModel } from "drizzle-orm";

// Strict typing for DataTable props
interface DataTableProps<
    T extends Table,
    TData extends InferSelectModel<T> = InferSelectModel<T>
> {
    data: TData[];
    columns: FilterableColumn<TData>[];
    totalCount: number;
    tableName: string;
    primaryKey: keyof TData;
    deleteAction: (ids: (string | number | null)[]) => Promise<InferSelectModel<T>[]>;
}
 
export default function DataTable<
    T extends Table,
    TData extends InferSelectModel<T> = InferSelectModel<T>
>({
    data, 
    columns, 
    totalCount, 
    tableName, 
    primaryKey, 
    deleteAction
}: DataTableProps<T, TData>) {
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
        left: ['select'],
        right: ['edit']
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();



    // Handle column visibility
    useEffect(() => {
        // Helper function to set default column visibility
        const setDefaultColumnVisibility = () => {
            const initialVisibility: Record<string, boolean> = {};
            
            // Set all columns to hidden by default
            columns.forEach((column) => {
                initialVisibility[column.id as string] = false;
            });
            
            // Show special columns and non-hideable columns
            columns.forEach((column) => {
                if (column.enableHiding === false || column.id === 'select' || column.id === 'edit') {
                    initialVisibility[column.id as string] = true;
                }
            });
            
            setColumnVisibility(initialVisibility);
        };
        try {
            const storageKey = `LISOC_${tableName}_COLVIS`;
            const storedVisibility = localStorage.getItem(storageKey);
            
            if (storedVisibility) {
                const parsed = JSON.parse(storedVisibility);
                // Validate that parsed data is an object
                if (typeof parsed === 'object' && parsed !== null) {
                    setColumnVisibility(parsed);
                } else {
                    console.warn(`[DataTable] Invalid stored visibility for ${tableName}, using defaults`);
                    setDefaultColumnVisibility();
                }
            } else {
                setDefaultColumnVisibility();
            }
        } catch (error) {
            console.error(`[DataTable] Error loading column visibility for ${tableName}:`, error);
            setDefaultColumnVisibility();
        }
    }, [tableName, columns]);



    // Save column visibility
    useEffect(() => {
        if (Object.keys(columnVisibility).length > 0) {
            try {
                const storageKey = `LISOC_${tableName}_COLVIS`;
                localStorage.setItem(storageKey, JSON.stringify(columnVisibility));
            } catch (error) {
                console.error(`[DataTable] Error saving column visibility for ${tableName}:`, error);
            }
        }
    }, [columnVisibility, tableName]);

    // Create select checkbox column 
    const selectionColumn: ColumnDef<TData>[] = useMemo(() => [
        {
            id: "select",
            header: ({ table }) => {
                const isAllSelected = table.getIsAllPageRowsSelected();
                const isSomeSelected = table.getIsSomePageRowsSelected();
                
                return (
                    <div className="flex items-center justify-center h-4">
                        <Checkbox 
                            className={cn(
                                "cursor-pointer group",
                                isAllSelected || isSomeSelected
                                    ? "bg-blue-600 border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    : "bg-white hover:bg-blue-600/10 hover:shadow-md hover:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            )}
                            onClick={() => table.toggleAllPageRowsSelected()}
                            checked={isAllSelected || isSomeSelected}
                            aria-label="Select all rows"
                        />
                    </div>
                );
            },
            cell: ({ row }) => {
                const isSelected = row.getIsSelected();
                
                return (
                    <div className="flex items-center justify-center h-4">
                        <Checkbox 
                            className={cn(
                                "cursor-pointer group",
                                isSelected
                                    ? "bg-blue-600 border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    : "bg-white hover:bg-blue-600/10 hover:shadow-md hover:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            )}
                            onClick={() => row.toggleSelected()}
                            checked={isSelected}
                            aria-label={`Select row ${row.index + 1}`}
                        />
                    </div>
                );
            }
        }
    ], []);

    // Create edit column 
    const editColumn: ColumnDef<TData>[] = useMemo(() => [
        {
            id: "edit",
            cell: ({ row }) => {
                const handleEdit = () => {
                    try {
                        const rowId = (row.original as TData)[primaryKey as unknown as keyof TData];
                        if (rowId === undefined || rowId === null) {
                            console.error(`[DataTable] Primary key ${String(primaryKey)} not found in row data`);
                            return;
                        }
                        router.push(`${pathname}/${rowId}`);
                    } catch (error) {
                        console.error(`[DataTable] Error navigating to edit page:`, error);
                    }
                };

                const handleDeleteSingle = () => {
                    try {
                        handleDelete(row);
                    } catch (error) {
                        console.error(`[DataTable] Error deleting single row:`, error);
                    }
                };

                return (
                    <Popover>
                        <PopoverTrigger 
                            className={cn(
                                "items-center rounded-md p-1 cursor-pointer",
                                "border-1 border-gray-300 hover:border-gray-700",
                                "focus:outline-none focus:ring-2 focus:ring-blue-500"
                            )}
                            aria-label="Row actions"
                        >
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
                                    "text-blue-500 hover:text-blue-600",
                                    "focus:outline-none focus:bg-gray-100"
                                )}
                                onClick={handleEdit}
                                disabled={isDeleting}
                            >
                                <PencilIcon className="w-4 h-4 mr-2" /> Edit
                            </button>
                            <button 
                                className={cn(
                                    "flex items-center self-start text-left text-sm hover:bg-gray-100 whitespace-nowrap",
                                    "rounded-sm w-full p-1 cursor-pointer transition-colors duration-200",
                                    "text-red-500 hover:text-red-600",
                                    "focus:outline-none focus:bg-gray-100",
                                    isDeleting && "opacity-50 cursor-not-allowed"
                                )}
                                onClick={handleDeleteSingle}
                                disabled={isDeleting}
                            >
                                <TrashIcon className="w-4 h-4 mr-2" /> Delete
                            </button>
                        </PopoverContent>
                    </Popover>
                );
            }
        }
    ], [primaryKey, pathname, router, isDeleting]);

    // Combine selection column with provided columns
    const allColumns = useMemo(() => [...selectionColumn, ...columns, ...editColumn], [selectionColumn, columns, editColumn]);

    // Set sorting from URL params
    useEffect(() => {
        const sortBy = searchParams.get('sortBy');
        const sortOrder = searchParams.get('sortOrder');    
        if (sortBy && sortOrder) {
            setSorting([{id: sortBy, desc: sortOrder === 'desc'}]);
        } else {
            setSorting([]);
        }
    }, [searchParams]);

    // Update URL when sorting changes
    useEffect(() => {
        if (sorting.length > 0) {
            const params = new URLSearchParams(searchParams);
            params.set('sortBy', sorting[0].id);
            params.set('sortOrder', sorting[0].desc ? 'desc' : 'asc');
            router.replace(`${pathname}?${params.toString()}`);
        }
    }, [sorting, pathname, router, searchParams]);

    // Pagination logic
    const currentPage = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 10;
    const pageCount = Math.ceil(totalCount / pageSize);

    const createPageURL = (pageNumber: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    const handlePageChange = (pageNumber: number) => {
        if (pageNumber >= 1 && pageNumber <= pageCount) {
            router.push(createPageURL(pageNumber));
        }
    };

    // Delete handler 
    const handleDelete = async (selectedRow?: Row<TData>) => {
        if (isDeleting) return; // Prevent multiple simultaneous delete operations
        
        setIsDeleting(true);
        
        try {
            if (selectedRow) {
                table.resetRowSelection(); // Clear other selections when deleting single row
            }
            
            const selectedRows = selectedRow ? [selectedRow] : table.getSelectedRowModel().rows;
            
            if (selectedRows.length === 0) {
                console.warn(`[DataTable] No rows selected for deletion`);
                return;
            }

            // Extract IDs with proper type safety
            const ids: PKVal<T>[] = selectedRows.map(row => {
                const id = (row.original as TData)[primaryKey as unknown as keyof TData];
                if (id === undefined || id === null) {
                    throw new Error(`Primary key ${String(primaryKey)} not found in row data`);
                }
                return id as PKVal<T>;
            });

            
            await deleteAction(ids);
            
            // Reset selection after successful deletion
            table.resetRowSelection();
            
        } catch (error) {
            console.error(`[DataTable] Error deleting rows from ${tableName}:`, error);
        } finally {
            setIsDeleting(false);
        }
    };

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
            columnVisibility
        },
        enableRowSelection: true,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onColumnPinningChange: setColumnPinning, 
        getCoreRowModel: getCoreRowModel(),
        // Server-side pagination
        manualPagination: true,
        manualFiltering: true,
        pageCount: pageCount 
    });

    // Memoize the columns passed to TableHeader
    const memoizedTableColumns = useMemo(() => table.getAllColumns(), [table]);

    // Error boundary for rendering
    if (!data || !Array.isArray(data)) {
        return (
            <div className="bg-white border border-red-200 rounded-md p-4">
                <div className="text-red-600">
                    <h3 className="font-semibold">Data Error</h3>
                    <p>Unable to render table data. Please refresh the page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border-b border-gray-200">
            {/* Selection alert */}
            <div className="p-2">
                {Object.keys(rowSelection).length > 0 && (
                    <div className="flex justify-between items-center bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-md text-sm">
                        <p>
                            {Object.keys(rowSelection).length} {Object.keys(rowSelection).length === 1 ? 'row' : 'rows'} selected
                        </p>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button 
                                    className={cn(
                                        "text-red-500 font-medium cursor-pointer px-2 py-1 rounded",
                                        "hover:bg-red-50 transition-colors",
                                        "focus:outline-none focus:ring-2 focus:ring-red-500",
                                        isDeleting && "opacity-50 cursor-not-allowed"
                                    )}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Are you absolutely sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete {Object.keys(rowSelection).length} {Object.keys(rowSelection).length === 1 ? 'row' : 'rows'} from the {tableName} table.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={() => handleDelete()} 
                                        className="cursor-pointer bg-red-600 hover:bg-red-700"
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>
            
            <TableHeader 
                columns={memoizedTableColumns}
                columnDefs={columns}
                tableName={tableName}
            />

            {/* Table with horizontal scroll */}
            <div className="overflow-x-auto w-full">
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
                                        onClick={() => {
                                            if ((header.id !== 'select') && header.column.getCanSort()) {
                                                const direction = sorting[0]?.id === header.id && sorting[0]?.desc === false ? true : false;
                                                setSorting([{id: header.id, desc: direction}]);
                                            }
                                        }}
                                        aria-sort={
                                            sorting.length > 0 
                                                ? sorting[0].id === header.id 
                                                    ? sorting[0].desc === true ? 'descending' : 'ascending' 
                                                    : 'none' 
                                                : 'none'
                                        }
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
            
            {/* Server-side pagination controls */}
            <div className="relative flex items-center justify-center px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                <div className="absolute left-4">
                    <p className="text-sm text-gray-500">
                        Showing {Math.min(((currentPage - 1) * pageSize) + 1, totalCount)} - {
                            Math.min(currentPage * pageSize, totalCount)
                        } of {totalCount.toLocaleString()}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className={cn(
                            "px-3 py-1 text-sm rounded-md cursor-pointer",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500",
                            currentPage > 1
                                ? "text-blue-600 hover:bg-blue-50" 
                                : "text-gray-400 cursor-not-allowed"
                        )}
                        aria-label="Previous page"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                        {/* First page */}
                        <button 
                            onClick={() => handlePageChange(1)} 
                            className={cn(
                                "px-3 py-1 text-sm font-bold rounded-md cursor-pointer text-black border-1 border-gray-300 hover:bg-blue-100 transition-colors",
                                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                                currentPage === 1 ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
                            )}
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
                                        key={pageNumber}
                                        onClick={() => handlePageChange(pageNumber)} 
                                        className={cn(
                                            "px-3 py-1 text-sm font-bold rounded-md cursor-pointer text-black border-1 border-gray-300 hover:bg-blue-100 transition-colors",
                                            "focus:outline-none focus:ring-2 focus:ring-blue-500",
                                            currentPage === pageNumber ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
                                        )}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            }
                            return null;
                        })}

                        {/* Right ellipsis */}
                        {currentPage < (pageCount || 1) - 2 && (
                            <span className="px-2">...</span>
                        )}

                        {/* Last page */}
                        {(pageCount || 1) > 1 && (
                            <button 
                                onClick={() => handlePageChange(pageCount || 1)} 
                                className={cn(
                                    "px-3 py-1 text-sm font-bold rounded-md cursor-pointer text-black border-1 border-gray-300 hover:bg-blue-100 transition-colors",
                                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                                    currentPage === (pageCount || 1) ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
                                )}
                            >
                                {pageCount || 1}
                            </button>
                        )}
                    </div>
                    
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= (pageCount || 1)}
                        className={cn(
                            "px-3 py-1 text-sm rounded-md cursor-pointer",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500",
                            currentPage < (pageCount || 1)
                                ? "text-blue-600 hover:bg-blue-50" 
                                : "text-gray-400 cursor-not-allowed"
                        )}
                        aria-label="Next page"
                    >
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}