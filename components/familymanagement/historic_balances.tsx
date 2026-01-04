"use client";

import { useMemo } from "react";
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { InferSelectModel } from "drizzle-orm";
import { familybalance } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { type BalanceHistoryEntry } from "@/types/familymanagement.types";

export default function BalanceHistoryTable({
    history,
}: {
    history: InferSelectModel<typeof familybalance>[];
}) {
    const tableData = useMemo(() => {
        return history.map((entry) => ({
            balanceid: entry.balanceid,
            paiddate:
                format(new Date(entry.paiddate), "yyyy-MM-dd HH:mm") === "1900-01-01 00:00"
                    ? "Not processed"
                    : format(new Date(entry.paiddate), "yyyy-MM-dd HH:mm"),
            notes: entry.notes ?? "",
            totalamount: Number(entry.totalamount),
        }));
    }, [history]);

    const table = useReactTable<BalanceHistoryEntry>({
        data: tableData,
        columns: [
            { header: "Balance ID", accessorKey: "balanceid" },
            { header: "Date", accessorKey: "paiddate" },
            { header: "Description", accessorKey: "notes" },
            { header: "Amount", accessorKey: "totalamount" },
        ],
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSorting: true,
    });

    return (
        <div className="w-full overflow-x-auto overflow-y-auto">
            <table className="relative min-w-full table-fixed rounded-lg border border-gray-200 shadow-md">
                {/* Header */}
                <thead className="border-b border-gray-200">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="bg-gray-50">
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className={cn(
                                        "text-md cursor-pointer px-3 py-3 text-left font-semibold tracking-wider whitespace-nowrap text-gray-700",
                                        header.id === "select" && "w-12",
                                        header.column.getIsPinned() === "left" &&
                                            "sticky left-0 z-10 bg-white",
                                        header.column.getIsPinned() === "right" &&
                                            "sticky right-0 z-10 bg-white"
                                    )}
                                    onClick={header.column.getToggleSortingHandler()}
                                    aria-sort={
                                        header.column.getIsSorted() === "desc"
                                            ? "descending"
                                            : header.column.getIsSorted() === "asc"
                                              ? "ascending"
                                              : "none"
                                    }
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                          )}
                                    {{
                                        asc: " ↑",
                                        desc: " ↓",
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
                                "cursor-pointer transition-colors hover:bg-blue-50",
                                row.getIsSelected() && "bg-blue-50"
                            )}
                        >
                            {row.getVisibleCells().map((cell) => {
                                // Special rendering for the "totalamount" column: green for positive, red for negative
                                if (cell.column.id === "totalamount") {
                                    const value = cell.getValue<number>();
                                    const isPositive = value > 0;
                                    const isNegative = value < 0;
                                    return (
                                        <td
                                            key={cell.id}
                                            className={cn(
                                                "px-3 py-1 text-sm",
                                                isPositive && "text-red-600",
                                                isNegative && "text-green-600",
                                                !isPositive && !isNegative && "text-gray-600",
                                                // cell.column.id === 'select' ? 'w-12' : 'whitespace-nowrap',
                                                cell.column.getIsPinned() === "left" &&
                                                    `sticky left-0 z-10 ${row.getIsSelected() ? "bg-blue-50" : "bg-white"}`,
                                                cell.column.getIsPinned() === "right" &&
                                                    `sticky right-0 z-10 ${row.getIsSelected() ? "bg-blue-50" : "bg-white"}`
                                            )}
                                            tabIndex={0}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    );
                                }
                                return (
                                    <td
                                        key={cell.id}
                                        className={cn(
                                            "px-3 py-1 text-sm text-gray-600",
                                            cell.column.id === "select"
                                                ? "w-12"
                                                : "whitespace-nowrap",
                                            cell.column.getIsPinned() === "left" &&
                                                `sticky left-0 z-10 ${row.getIsSelected() ? "bg-blue-50" : "bg-white"}`,
                                            cell.column.getIsPinned() === "right" &&
                                                `sticky right-0 z-10 ${row.getIsSelected() ? "bg-blue-50" : "bg-white"}`
                                        )}
                                        tabIndex={0}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
