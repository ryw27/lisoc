"use client";
import { Column, flexRender, getCoreRowModel, getFacetedUniqueValues, getFilteredRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { useMemo } from "react";
//import { familybalance } from "@/lib/db/schema";
//import { InferSelectModel } from "drizzle-orm";
import { cn } from "@/lib/utils";
import { balanceTypes } from "@/types/shared.types";
import { format } from "date-fns";
import { useState } from "react";


/*type BalanceHistoryEntry = {
    balanceid: number;
    paiddate: string;
    notes: string | null;
    totalamount: number;
};
*/
function SelectColumnFilter({ column }: { column: Column<balanceTypes> }): React.ReactNode {
  const uniqueValues = Array.from(column.getFacetedUniqueValues().keys()); // Get unique values

  return (
    <select
      value={(column.getFilterValue() ?? '')}
      onChange={(e) => column.setFilterValue(e.target.value)}
    >
      <option value="">All</option>
      {uniqueValues.map((value) => (
        <option key={String(value)} value={String(value)}>
          {String(value)}
        </option>
      ))}
    </select>
  );
}


export default function BalanceHistoryTable({ history }: { history: balanceTypes[] }) {

    const tableData = useMemo(() => {
        return history.map((entry: balanceTypes) => ({
            balanceid: entry.balanceid,
            regdate: format(new Date(entry.regdate), "yyyy-MM-dd HH:mm"),
            semester: entry.semester,
            amount: Number(entry.amount),
            check_no: entry.check_no,
            paiddate: format(new Date(entry.paiddate), "yyyy-MM-dd HH:mm") === "1900-01-01 00:00" ? "" : format(new Date(entry.paiddate), "yyyy-MM-dd"),
            note: entry.note ?? "",
        }));
    }, [history]);

    const [sorting, setSorting] = useState<SortingState>([]);

    const table = useReactTable<balanceTypes>({
        data: tableData,
        columns: [
            {  accessorKey: "semester",
                header: ({ column }) => (
                    <div>
                        Semester/学期<br/>
                            <SelectColumnFilter column={column} />
                        </div>
                    ),
                    filterFn: 'equalsString', // Use a built-in filter function
                    //filterFn: 'uniqueValueFilterFn', // Use a built-in filter function
                    enableColumnFilter: true,
                    enableSorting: false, // Disable sorting for this column
             },

             { header: "Balance ID/编号", accessorKey: "balanceid" },
            { header: "Date/日期", accessorKey: "paiddate" },
            { header: "Description/注释", accessorKey: "note" },
            { header: "Amount/金额", accessorKey: "amount",
                    cell: ({ getValue }) => {
                        const amount = getValue() as number;
                        const valStr =new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                    }).format(amount);
                    const style = amount < 0 ? { color: 'red' } : { color: 'green' }; // Conditional styling
                    return <span style={style}>{valStr}</span>;

                },
            },
            { header: "Check No/支票号", accessorKey: "check_no" },

        ],
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSorting: true,
        onSortingChange: setSorting,
        enableColumnFilters: true,
        getFacetedUniqueValues: getFacetedUniqueValues(), // Enable faceting
        getFilteredRowModel: getFilteredRowModel(),
        state: { sorting }

    });

    return (
        <div className="overflow-x-auto w-full overflow-y-auto">
            <table className="min-w-full table-fixed relative border border-gray-200 rounded-lg shadow-md">
                {/* Header */}
                <thead className="border-b border-gray-200">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="bg-gray-50">
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className={cn(
                                        "whitespace-nowrap cursor-pointer px-3 py-3 text-left font-semibold text-gray-700 text-md tracking-wider",
                                        header.id === 'select' && 'w-12',
                                        header.column.getIsPinned() === 'left' && 'sticky left-0 z-10 bg-white',
                                        header.column.getIsPinned() === 'right' && 'sticky right-0 z-10 bg-white'
                                    )}
                                    onClick={header.column.getToggleSortingHandler()}
                                    aria-sort={
                                        header.column.getIsSorted() === 'desc' ? 'descending' :
                                        header.column.getIsSorted() === 'asc' ? 'ascending' :
                                        'none'
                                    }
                                >
                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    {{
                                        asc: ' ↑',
                                        desc: ' ↓',
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
                                "cursor-pointer hover:bg-blue-50 transition-colors",
                                row.getIsSelected() && 'bg-blue-50'
                            )}
                        >
                            {row.getVisibleCells().map((cell) => {
                                // Special rendering for the "totalamount" column: green for positive, red for negative
                                if (cell.column.id === 'totalamount') {
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
                                                cell.column.getIsPinned() === 'left' && `sticky left-0 z-10 ${row.getIsSelected() ? 'bg-blue-50' : 'bg-white'}`,
                                                cell.column.getIsPinned() === 'right' && `sticky right-0 z-10 ${row.getIsSelected() ? 'bg-blue-50' : 'bg-white'}`
                                            )}
                                            tabIndex={0}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    );
                                }
                                return (
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
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}