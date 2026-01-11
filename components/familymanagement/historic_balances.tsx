"use client";

import { use, useMemo } from "react";
import { getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { format } from "date-fns";
import { InferSelectModel } from "drizzle-orm";
import { familybalance } from "@/lib/db/schema";
import { type BalanceHistoryEntry } from "@/types/familymanagement.types";
import { ClientTable } from "../client-table";

export default function BalanceHistoryTable({
    history,
}: {
    history: Promise<InferSelectModel<typeof familybalance>[]>;
}) {
    // Test use hook from react
    const finalHistory = use(history);

    const tableData = useMemo(() => {
        return finalHistory.map((entry) => ({
            balanceid: entry.balanceid,
            paiddate:
                format(new Date(entry.paiddate), "yyyy-MM-dd HH:mm") === "1900-01-01 00:00"
                    ? "Not processed"
                    : format(new Date(entry.paiddate), "yyyy-MM-dd HH:mm"),
            notes: entry.notes ?? "",
            totalamount: Number(entry.totalamount),
        }));
    }, [finalHistory]);

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

    if (!finalHistory?.length) {
        return <div className="py-8 text-center text-gray-500">No balance history found.</div>;
    }

    return (
        <ClientTable table={table} />
        // <div className="border-primary/20 bg-background w-full overflow-hidden rounded-sm border shadow-sm">
        //     <div className="w-full overflow-x-auto overflow-y-auto">
        //         <table className="bg-background relative min-w-full table-fixed text-sm">
        //             {/* Header - Styled like a formal ledger */}
        //             <thead className="bg-muted/50 border-primary/20 border-b-2">
        //                 {table.getHeaderGroups().map((headerGroup) => (
        //                     <tr key={headerGroup.id}>
        //                         {headerGroup.headers.map((header) => (
        //                             <th
        //                                 key={header.id}
        //                                 className={cn(
        //                                     // Layout & Spacing
        //                                     "cursor-pointer px-4 py-3 text-left whitespace-nowrap",
        //                                     // Typography: Serif, Navy, Uppercase, Tracking
        //                                     "text-primary font-serif text-xs font-bold tracking-widest uppercase",
        //                                     // Sticky Logic
        //                                     header.id === "select" && "w-12",
        //                                     header.column.getIsPinned() === "left" &&
        //                                         "bg-background sticky left-0 z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]",
        //                                     header.column.getIsPinned() === "right" &&
        //                                         "bg-background sticky right-0 z-10 shadow-[-1px_0_0_0_rgba(0,0,0,0.05)]"
        //                                 )}
        //                                 onClick={header.column.getToggleSortingHandler()}
        //                                 aria-sort={
        //                                     header.column.getIsSorted() === "desc"
        //                                         ? "descending"
        //                                         : header.column.getIsSorted() === "asc"
        //                                           ? "ascending"
        //                                           : "none"
        //                                 }
        //                             >
        //                                 <div className="hover:text-accent-foreground flex items-center gap-1 transition-colors">
        //                                     {header.isPlaceholder
        //                                         ? null
        //                                         : flexRender(
        //                                               header.column.columnDef.header,
        //                                               header.getContext()
        //                                           )}
        //                                     <span className="text-accent text-[10px]">
        //                                         {{
        //                                             asc: " ▲",
        //                                             desc: " ▼",
        //                                         }[header.column.getIsSorted() as string] ?? null}
        //                                     </span>
        //                                 </div>
        //                             </th>
        //                         ))}
        //                     </tr>
        //                 ))}
        //             </thead>

        //             <tbody className="divide-y divide-stone-200/60">
        //                 {/* Table rows */}
        //                 {table.getRowModel().rows.map((row) => (
        //                     <tr
        //                         key={row.id}
        //                         className={cn(
        //                             "hover:bg-muted/50 transition-colors", // Warm hover
        //                             row.getIsSelected() && "bg-muted" // Warm selection
        //                         )}
        //                     >
        //                         {row.getVisibleCells().map((cell) => {
        //                             // Special rendering for the "totalamount" column
        //                             if (cell.column.id === "totalamount") {
        //                                 const value = cell.getValue<number>();
        //                                 const isPositive = value > 0;
        //                                 const isNegative = value < 0;
        //                                 return (
        //                                     <td
        //                                         key={cell.id}
        //                                         className={cn(
        //                                             "px-4 py-3 font-mono font-medium", // Monospace for financial data
        //                                             isPositive && "text-destructive font-bold", // Red for Owed
        //                                             isNegative && "font-bold text-emerald-700", // Dark Green for Credit
        //                                             !isPositive &&
        //                                                 !isNegative &&
        //                                                 "text-muted-foreground",
        //                                             cell.column.getIsPinned() === "left" &&
        //                                                 `sticky left-0 z-10 ${
        //                                                     row.getIsSelected()
        //                                                         ? "bg-muted"
        //                                                         : "bg-background"
        //                                                 }`,
        //                                             cell.column.getIsPinned() === "right" &&
        //                                                 `sticky right-0 z-10 ${
        //                                                     row.getIsSelected()
        //                                                         ? "bg-muted"
        //                                                         : "bg-background"
        //                                                 }`
        //                                         )}
        //                                         tabIndex={0}
        //                                     >
        //                                         {flexRender(
        //                                             cell.column.columnDef.cell,
        //                                             cell.getContext()
        //                                         )}
        //                                     </td>
        //                                 );
        //                             }
        //                             return (
        //                                 <td
        //                                     key={cell.id}
        //                                     className={cn(
        //                                         "text-foreground px-4 py-3", // Default Navy text
        //                                         cell.column.id === "select"
        //                                             ? "w-12"
        //                                             : "whitespace-nowrap",
        //                                         cell.column.getIsPinned() === "left" &&
        //                                             `sticky left-0 z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] ${
        //                                                 row.getIsSelected()
        //                                                     ? "bg-muted"
        //                                                     : "bg-background"
        //                                             }`,
        //                                         cell.column.getIsPinned() === "right" &&
        //                                             `sticky right-0 z-10 shadow-[-1px_0_0_0_rgba(0,0,0,0.05)] ${
        //                                                 row.getIsSelected()
        //                                                     ? "bg-muted"
        //                                                     : "bg-background"
        //                                             }`
        //                                     )}
        //                                     tabIndex={0}
        //                                 >
        //                                     {flexRender(
        //                                         cell.column.columnDef.cell,
        //                                         cell.getContext()
        //                                     )}
        //                                 </td>
        //                             );
        //                         })}
        //                     </tr>
        //                 ))}
        //             </tbody>
        //         </table>
        //     </div>
        // </div>
    );
}
