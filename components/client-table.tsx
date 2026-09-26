"use client";

import { flexRender, type Table } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

// const formatDate = (date: string) => {
//     const dateObj = new Date(date);
//     const abbrev = monthAbbrevMap[dateObj.getMonth()];

//     let day = dateObj.getDate().toString();
//     if (day.length == 1) {
//         day = "0" + day;
//     }

//     return [abbrev + " " + day, dateObj.getFullYear()];
// };

export function ClientTable<RowShape>({
    table,
    maxHeight,
}: {
    table: Table<RowShape>;
    // A CSS length (e.g. "32rem"). When set, the rows scroll vertically inside this
    // height and the header sticks to the top of the box. That also keeps the
    // horizontal scrollbar on screen: without a cap, a long table pushes it below the
    // fold, so reading a wide row means scrolling to the bottom of the page and back.
    // Short tables are unaffected — the box only scrolls once the rows exceed it.
    maxHeight?: string;
}) {
    return (
        <div className="border-primary/20 bg-background w-full overflow-hidden rounded-xs border">
            <div className="w-full overflow-x-auto overflow-y-auto" style={{ maxHeight }}>
                <table className="relative min-w-full table-fixed text-sm">
                    {/* Header */}
                    <thead className="bg-muted border-primary/20 text-primary border-b-2 font-bold tracking-widest uppercase">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className={cn(
                                            "px-4 py-3 text-left text-xs whitespace-nowrap",
                                            // Stay put while the rows scroll under it. The
                                            // background has to be on the cell (the thead's
                                            // scrolls away) and has to be bg-background, not
                                            // bg-muted: --color-muted is missing from the
                                            // @theme block in globals.css, so bg-muted emits
                                            // no rule at all and the rows show through.
                                            "bg-background border-primary/20 sticky top-0 z-20 border-b-2",
                                            // Column Sizing
                                            header.id === "select" && "w-12",
                                            // Sticky Logic: Borders instead of shadows for tangibility.
                                            // z above the pinned body cells (z-10) so a pinned column
                                            // scrolls under, not over, its own header.
                                            header.column.getIsPinned() === "left" &&
                                                "border-primary/10 sticky left-0 z-30 border-r",
                                            header.column.getIsPinned() === "right" &&
                                                "border-primary/10 sticky right-0 z-30 border-l"
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
                                        <div className="hover:text-accent-foreground group flex cursor-pointer items-center gap-2 transition-colors">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef.header,
                                                      header.getContext()
                                                  )}
                                            {/* Sort Icon */}
                                            <span className="text-accent group-hover:text-accent-foreground text-[10px] opacity-70 transition-colors group-hover:opacity-100">
                                                {{
                                                    asc: "▲",
                                                    desc: "▼",
                                                }[header.column.getIsSorted() as string] ?? (
                                                    <span className="opacity-0 group-hover:opacity-50">
                                                        ↕
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>

                    <tbody className="divide-primary/10 divide-y">
                        {table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                className={cn(
                                    "cursor-pointer transition-colors",
                                    // Hover: Primary tint (Ink wash) instead of generic gray
                                    "hover:bg-primary/5",
                                    // Selected: Gold/Brass tint
                                    row.getIsSelected() && "bg-accent/10 hover:bg-accent/15"
                                )}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        key={cell.id}
                                        className={cn(
                                            "text-foreground px-4 py-3 text-sm",
                                            // Conditional Coloring for Financials
                                            cell.column.id.toLowerCase() === "totalamount" &&
                                                Number(cell.getValue()) > 0
                                                ? "font-medium text-emerald-800"
                                                : cell.column.id === "totalamount" &&
                                                    Number(cell.getValue()) < 0
                                                  ? "font-medium text-red-800"
                                                  : "",
                                            cell.column.id === "select"
                                                ? "w-12"
                                                : "whitespace-nowrap",

                                            // Sticky Column Logic: Matches row background + Hard Border
                                            cell.column.getIsPinned() === "left" &&
                                                `border-primary/10 sticky left-0 z-10 border-r ${
                                                    row.getIsSelected()
                                                        ? "bg-accent/10"
                                                        : "bg-background group-hover:bg-primary/5"
                                                }`,
                                            cell.column.getIsPinned() === "right" &&
                                                `border-primary/10 sticky right-0 z-10 border-l ${
                                                    row.getIsSelected()
                                                        ? "bg-accent/10"
                                                        : "bg-background group-hover:bg-primary/5"
                                                }`
                                        )}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
