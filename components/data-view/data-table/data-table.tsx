"use client";
import { 
    ColumnDef, 
    useReactTable, 
    getCoreRowModel, 
    flexRender, 
    ColumnPinningState, 
    Row, 
    VisibilityState,
} from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { MoreHorizontal, PencilIcon, TrashIcon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import TableHeader from "./data-table-toolbar";
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from "@/components/ui/popover";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { PKVal, Table } from "@/lib/data-view/types";
import { deleteRows } from "@/lib/data-view/actions/deleteRows";
import {
  Table as DTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader as DTHeader,
  TableRow,
} from "@/components/ui/table"
import DataTablePagination from "./data-table-pagination";
import { useDataEntityContext } from "@/lib/data-view/providers";

interface DataTableTestProps<TData> {
    data: TData[];
    totalCount: number;
}
 

export default function DataTable<T extends Table, TData>({
    data,
    totalCount
}: DataTableTestProps<TData>) {
    const { 
        table,
        columns,
        tableName,
        primaryKey,
    } = useDataEntityContext<T, TData>();
    if (!data || !Array.isArray(columns) ) {
        console.error(`[DataTableTest] Invalid data provided for table ${tableName}`);
        return (
            <div className="flex flex-col gap-4 p-4">
                 <div className="text-red-600 bg-red-50 border border-red-200 rounded-md p-4">
                     <h2 className="font-semibold">Data Error</h2>
                     <p>Unable to load data for {tableName}. Please try again later.</p>
                 </div>
             </div>
         );
    }

    if (!Array.isArray(columns) || !table || !columns || !primaryKey) {
        console.error(`[DataTableTest] Invalid values through Data Entity Context.`,
            JSON.stringify({
                table,
                columns,
                tableName,
                primaryKey,
            }, null, 2)
        );

        return (
            <div className="flex flex-col gap-4 p-4">
                <div className="text-red-600 bg-red-50 border border-red-200 rounded-md p-4">
                    <h2 className="font-semibold">Configuration Error</h2>
                    <p>Table configuration is invalid. Please contact support.</p>
                </div>
            </div>
        );
    }

    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    useEffect(() => {
        const key = `${tableName}_CV`;
        const colvisRaw = localStorage.getItem(key);

        let parsed: Record<string, boolean> | null = null;
        if (colvisRaw) {
            try {
                const candidate = JSON.parse(colvisRaw);
                // Defensive: ensure it's an object with string keys and boolean values
                if (
                    candidate &&
                    typeof candidate === "object" &&
                    !Array.isArray(candidate) &&
                    Object.values(candidate).every(v => typeof v === "boolean")
                ) {
                    parsed = candidate;
                }
            } catch (err) {
                // Malformed JSON, remove and reset
                localStorage.removeItem(key);
            }
        }

        if (parsed) {
            setColumnVisibility(parsed);
        } else {
            const defaultVis = Object.fromEntries(
                columns.map((c) => [c.id, c.enableHiding === false])
            ) as Record<string, boolean>;
            localStorage.setItem(key, JSON.stringify(defaultVis));
            setColumnVisibility(defaultVis);
        }
    // Only run on mount or if columns/tableName changes
    }, [columns, tableName]);

    const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
        left: ['select'],
        right: ['edit']
    });

    const router = useRouter();
    const pathname = usePathname();
    // const searchParams = useSearchParams();

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

    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (selectedRow?: Row<TData>) => {
        if (isDeleting) return; // Prevent multiple simultaneous delete operations
        
        setIsDeleting(true);
        
        try {
            if (selectedRow) {
                dataTable.resetRowSelection(); // Clear other selections when deleting single row
            }
            
            const selectedRows = selectedRow ? [selectedRow] : dataTable.getSelectedRowModel().rows;
            
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

            
            await deleteRows(table, primaryKey, ids);
            
            // Reset selection after successful deletion
            dataTable.resetRowSelection();
            
        } catch (error) {
            console.error(`[DataTable] Error deleting rows:`, error);
        } finally {
            setIsDeleting(false);
        }
    };

    const editColumn: ColumnDef<TData>[] = useMemo(() => [
        {
            id: "edit",
            cell: ({ row }) => {
                const handleEdit = () => {
                    try {
                        const rowId = (row.original as TData)[primaryKey as keyof TData];
                        console.log(row.original);
                        console.log(primaryKey);
                        if (rowId === undefined || rowId === null) {
                            console.error(`[DataTable] Primary key not found in row data`);
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
    ], [pathname, router, isDeleting]);


    const dataTable = useReactTable<TData>({
        data,
        columns: [...selectionColumn, ...columns, ...editColumn],
        state: {
            columnPinning,
            rowSelection,
            pagination: {
                pageIndex: 0, // Always show first page in the UI since actual pagination is server-side
                pageSize: data.length // Show all data we received for this page
            },
            sorting: [],
            columnVisibility
        },
        enableRowSelection: true,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onColumnPinningChange: setColumnPinning,
        getCoreRowModel: getCoreRowModel(),
    });
    
    return (
        <div className="p-2 flex flex-col gap-2">
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
                                type="button"
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

            <TableHeader
                columns={dataTable.getAllColumns()}
                columnDefs={columns}
                tableName={tableName}
            />

            <div className="overflow-x-auto w-full">
                <div className="rounded-md overflow-hidden border border-gray-200">
                    <DTable className="w-full">
                        <DTHeader>
                            {dataTable.getHeaderGroups().map((headerGroup, groupIdx) => (
                                <TableRow
                                    key={headerGroup.id}
                                    className={cn(
                                        "bg-gray-50",
                                        groupIdx === 0 && "first:rounded-t-md"
                                    )}
                                >
                                    {headerGroup.headers.map((header, colIdx) => {
                                        // For rounded corners on thead
                                        const isFirstHeader = groupIdx === 0 && colIdx === 0;
                                        const isLastHeader = groupIdx === 0 && colIdx === headerGroup.headers.length - 1;
                                        return (
                                            <TableHead
                                                key={header.id}
                                                className={cn(
                                                    "px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 bg-gray-50",
                                                    header.column.getIsSorted() && "bg-blue-100",
                                                    header.column.getIsPinned() === 'left' && "sticky left-0 z-10",
                                                    header.column.getIsPinned() === 'right' && "sticky right-0 z-10",
                                                    isFirstHeader && "rounded-tl-md",
                                                    isLastHeader && "rounded-tr-md"
                                                )}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(header.column.columnDef.header, header.getContext())
                                                }
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </DTHeader>
                        <TableBody>
                            {dataTable.getRowModel().rows.length !== 0 ? (
                                dataTable.getRowModel().rows.map((row, rowIdx) => {
                                    const isLastRow = rowIdx === dataTable.getRowModel().rows.length - 1;
                                    return (
                                        <TableRow
                                            key={row.id}
                                            className={cn(
                                                "cursor-pointer hover:bg-blue-50 transition-colors",
                                                row.getIsSelected() && 'bg-blue-50'
                                            )}
                                        >
                                            {row.getVisibleCells().map((cell, cellIdx) => {
                                                // For rounded corners on last row
                                                const isFirstCell = cellIdx === 0 && isLastRow;
                                                const isLastCell = cellIdx === row.getVisibleCells().length - 1 && isLastRow;
                                                return (
                                                    <TableCell
                                                        key={cell.id}
                                                        className={cn(
                                                            "px-4 py-2 text-sm text-gray-700 align-middle border-b border-gray-100 max-w-[480px]",
                                                            "truncate whitespace-nowrap overflow-hidden",
                                                            cell.column.getIsPinned() === 'left' && "sticky left-0 z-10 bg-white",
                                                            cell.column.getIsPinned() === 'right' && "sticky right-0 z-10 bg-white",
                                                            cell.column.getIsPinned() && "bg-white",
                                                            isFirstCell && "rounded-bl-md",
                                                            isLastCell && "rounded-br-md"
                                                        )}
                                                        // style={{ maxWidth: 480 }}
                                                    >
                                                        <span className="block truncate">
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </span>
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center text-gray-400 text-base rounded-b-md"
                                    >
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </DTable>
                </div>
            </div>

            <DataTablePagination
                table={dataTable}
                tableType="server"
                totalCount={totalCount}
            />
        </div>
    );
}