"use client";

import { useMemo } from "react";
import { Column } from "@tanstack/react-table";
import { ColumnsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ColumnSelectProps<TData> {
    columns: Column<TData>[];
}

export default function ColumnSelect<TData>({ columns }: ColumnSelectProps<TData>) {
    // Filter out utility columns first (select, edit)
    const filteredColumns = useMemo(
        () => columns.filter((column) => column.id !== "select" && column.id !== "edit"),
        [columns]
    );

    // Partition into fixed and hideable columns
    const [fixedColumns, displayColumns] = useMemo(
        () =>
            filteredColumns.reduce(
                (result, column) => {
                    // Add to fixed or display columns based on getCanHide()
                    result[column.getCanHide() ? 1 : 0].push(column);
                    return result;
                },
                [[] as Column<TData>[], [] as Column<TData>[]]
            ),
        [filteredColumns]
    );

    // console.log(columns);

    const getColumnLabel = (column: Column<TData>) => {
        const metaLabel = (column.columnDef.meta as { label?: string } | undefined)?.label;
        if (metaLabel) return metaLabel;
        const headerVal = column.columnDef.header;
        return typeof headerVal === "string" ? headerVal : column.id;
    };

    return (
        <Popover>
            <PopoverTrigger
                className={cn(
                    "flex items-center gap-2 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-500",
                    "hover:border-blue-600 hover:bg-blue-600 hover:text-white",
                    "cursor-pointer transition-colors duration-200"
                )}
            >
                <ColumnsIcon className="h-4 w-4" /> Select Columns
            </PopoverTrigger>
            <PopoverContent className={cn("p-2")}>
                <div className="max-h-[300px] space-y-3 overflow-y-auto">
                    {fixedColumns.length > 0 && (
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-gray-500">Fixed Columns</div>
                            {fixedColumns.map((column) => (
                                <div
                                    key={column.id}
                                    className="flex items-center gap-2 text-sm opacity-70"
                                >
                                    <Checkbox
                                        id={`fixed-${column.id}`}
                                        checked={true}
                                        disabled={true}
                                        onCheckedChange={() => {}}
                                        className="!border-blue-600 !bg-blue-600 !text-white opacity-70"
                                    />
                                    <label htmlFor={`fixed-${column.id}`} className="text-gray-500">
                                        {getColumnLabel(column)}
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border border-gray-500"></div>

                    <div className="space-y-1">
                        {fixedColumns.length > 0 && (
                            <div className="text-xs font-medium text-gray-500">
                                Optional Columns
                            </div>
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
                                    className={
                                        column.getIsVisible()
                                            ? "!border-blue-600 !bg-blue-600 !font-bold !text-white"
                                            : "!border-gray-300"
                                    }
                                />
                                <label htmlFor={column.id}>{getColumnLabel(column)}</label>
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
