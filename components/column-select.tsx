"use client";
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { ColumnsIcon } from "lucide-react";
import { Checkbox } from './ui/checkbox';
import { cn } from '@/lib/utils';
import { Column } from '@tanstack/react-table'
import { useMemo } from 'react';

interface ColumnSelectProps<TData> {
    columns: Column<TData>[]
}

export default function ColumnSelect<TData>({ columns }: ColumnSelectProps<TData>) {
    // Filter out utility columns first (select, edit)
    const filteredColumns = useMemo(() => columns.filter(column => 
        column.id !== "select" && column.id !== "edit"
    ), [columns]);
    
    // Partition into fixed and hideable columns
    const [fixedColumns, displayColumns] = useMemo(() => filteredColumns.reduce(
        (result, column) => {
            // Add to fixed or display columns based on getCanHide()
            result[column.getCanHide() ? 1 : 0].push(column);
            return result;
        }, 
        [[] as Column<TData>[], [] as Column<TData>[]]
    ), [filteredColumns]);
    
    return (
        <Popover>
            <PopoverTrigger className={cn(
                "text-gray-500 border border-gray-300 rounded-md px-2 py-1 text-sm flex items-center gap-2",
                "hover:bg-blue-600 hover:text-white hover:border-blue-600",
                "transition-colors duration-200 cursor-pointer"
            )}>
                <ColumnsIcon className="w-4 h-4" /> Select Columns
            </PopoverTrigger>
            <PopoverContent className={cn("p-2")}>
                <div className="overflow-y-auto max-h-[300px] space-y-3">
                    {fixedColumns.length > 0 && (
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-gray-500">Fixed Columns</div>
                            {fixedColumns.map((column) => (
                                <div key={column.id} className="flex items-center gap-2 text-sm opacity-70">
                                    <Checkbox 
                                        id={`fixed-${column.id}`}
                                        checked={true}
                                        disabled={true}
                                        onCheckedChange={() => {}}
                                        className="!bg-blue-600 !text-white !border-blue-600 opacity-70"
                                    />
                                    <label htmlFor={`fixed-${column.id}`} className="text-gray-500">
                                        {column.columnDef.header?.toString() || column.id}
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border border-gray-500"></div>
                    
                    <div className="space-y-1">
                        {fixedColumns.length > 0 && (
                            <div className="text-xs font-medium text-gray-500">Optional Columns</div>
                        )}
                        {displayColumns.map((column) => (
                            <div key={column.id} className="flex items-center gap-2 text-sm">
                                <Checkbox 
                                    id={column.id}
                                    checked={column.getIsVisible()}
                                    disabled={!column.getCanHide()}
                                    onCheckedChange={(checked) => {
                                        // Call the visibility handler with the new checked state
                                        column.toggleVisibility(!!checked);
                                    }}
                                    className={column.getIsVisible() 
                                        ? "!bg-blue-600 !text-white !border-blue-600 !font-bold" 
                                        : "!border-gray-300"
                                    }
                                />
                                <label htmlFor={column.id}>
                                    {column.columnDef.header?.toString() || column.id}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}