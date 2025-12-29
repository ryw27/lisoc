"use client";
import React, { useMemo, useState } from "react";
import { 
    ChevronDown,
    ArrowUpRight,
    Users,
    Calendar,
    Search,
    Filter,
    Check,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { cn, formatCurrency, monthAbbrevMap } from "@/lib/utils";
import { BillingRow, FamilyRow } from "./page";
import { ColumnDef, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, Table } from "@tanstack/react-table";
import { useReactTable } from "@tanstack/react-table";
import Link from "next/link";


type BillingTableProps = {
    families: FamilyRow[]
    globalActivity: BillingRow[]
}

const formatBillingDate = (date: string) => {
    const dateObj = new Date(date);
    const abbrev = monthAbbrevMap[dateObj.getMonth()];

    let day = dateObj.getDate().toString();
    if (day.length == 1) {
        day = "0" + day;
    }

    return [abbrev + " " + day, dateObj.getFullYear()];
}

const billingColumns: ColumnDef<BillingRow>[] = [
    {
        id: "tid",
        accessorKey: "tid",
    },
    {
        id: "amount",
        accessorKey: "amount"
    },
    {
        id: "date",
        accessorKey: "date",

    },
    {
        id: "desc",
        accessorKey: "desc",
        filterFn: (row, rowid, filterValue) => {
            if (!filterValue.length) return true;

            const rowValue = row.getValue(rowid) as string;
            return filterValue.some((val: string) => val.toLowerCase() === rowValue.toLowerCase());
        }
    },
    {
        id: "family",
        accessorKey: "family",
    },
    {
        id: "type",
        accessorKey: "type"
    }
]



function GlobalTable({ globalActivity }: { globalActivity: BillingRow[] }) {
    const [filterOpen, setFilterOpen] = useState<boolean>(false);
    const [globalFilter, setGlobalFilter] = useState<string>("");

    const handleFilterCheck = (option: string, checked: boolean) => {
        const column = globalTable.getColumn("desc");
        const currentFilters = (column?.getFilterValue() as string[]) ?? []

        let newFilter: string[];
        if (checked) {
            newFilter = [...currentFilters, option];
        } else {
            newFilter = currentFilters.filter((desc) => desc !== option);
        }

        column?.setFilterValue(newFilter.length > 0 ? newFilter : undefined)
    }

    const clearFilters = () => {
        const column = globalTable.getColumn("desc");
        column?.setFilterValue(undefined);
    }

    const globalTable = useReactTable({
        columns: billingColumns,
        data: globalActivity,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            globalFilter
        },
        onGlobalFilterChange: setGlobalFilter,
        initialState: {
            pagination: {
                pageSize: 20,
            }
        }
    })

    const descOptions = useMemo(() => {
        const allDescriptions = globalActivity.map((row) => row.desc);
        return Array.from(new Set(allDescriptions)).sort()
    }, [globalActivity])

    const currentFilterValues = (globalTable.getColumn("desc")?.getFilterValue() as string[]) ?? [];
    return (
        <div>
            {/* TOOLBAR */}
            <div className="p-4 flex justify-between items-center border-b border-border bg-card">
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input
                        type="text"
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder={"Search transaction ID..."}
                        className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-transparent focus:bg-card focus:border-ring rounded text-sm font-medium text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring/20"
                    />
                </div>

                <div className="relative">
                    <button
                        onClick={() => setFilterOpen(!filterOpen)}
                        className={cn(
                            "px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-all border",
                            filterOpen
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                        )}
                    >
                        <Filter size={14} /> Filter View
                    </button>

                    {filterOpen && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-background border border-primary/20 shadow-md rounded-lg z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                            {/* Header: Sticky so it doesn't scroll away */}
                            <div className="px-3 py-2.5 border-b border-primary/10 bg-background">
                                <div className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                                    By Description
                                </div>
                            </div>
                            {/* Scrollable List Area: Constraints height to avoid long page scrolls */}
                            <div className="max-h-[240px] overflow-y-auto p-1.5 space-y-0.5">
                                {descOptions.map((option) => (
                                    <label 
                                        key={option} 
                                        className="flex items-center gap-3 px-2 py-2 hover:bg-secondary/10 rounded-md cursor-pointer transition-colors group"
                                    >
                                        <input 
                                            type="checkbox" 
                                            checked={currentFilterValues.includes(option)}
                                            onChange={(e) => handleFilterCheck(option, e.target.checked)}
                                            className="
                                                h-4 w-4 shrink-0 rounded-sm 
                                                border border-primary/40 
                                                text-primary
                                                accent-primary
                                                focus:ring-accent focus:ring-offset-0
                                                cursor-pointer
                                            " 
                                        />
                                        <span className="text-sm font-bold text-primary group-hover:text-primary">
                                            {option.replace("_", " ")}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <div className="px-3 py-2 border-t border-primary/10 bg-background/50 flex justify-between">
                                <button 
                                    className="text-[10px] font-bold text-primary/60 hover:text-primary transition-colors"
                                    onClick={clearFilters}
                                >
                                    Clear All
                                </button>
                                <button 
                                    className="text-[10px] font-bold text-accent hover:text-primary transition-colors"
                                    onClick={() => setFilterOpen(false)}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <table className="w-full text-left border border-border">
                <thead>
                    <tr className="border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">

                        <th className="pl-6 pr-4 py-4 w-[20%]">Date</th>
                        <th className="px-4 py-4 w-[30%]">Description</th>
                        <th className="px-4 py-4 w-[30%]">Family Unit</th>
                        {/* <th className="px-4 py-4 w-[15%]">Type</th> */}
                        <th className="px-4 py-4 text-right w-[20%]">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {globalTable.getRowModel().rows.length > 0 ? (
                        globalTable.getRowModel().rows.map((row) => ( 
                            <tr key={row.id} className="group hover:bg-muted/30 transition-colors cursor-default">
                                <td className="pl-6 pr-4 py-5 text-sm font-medium text-muted-foreground tabular-nums">
                                    <div className="font-medium text-foreground tabular-nums leading-none">{formatBillingDate(row.original.date)[0]}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{formatBillingDate(row.original.date)[1]}</div>
                                </td>
                                <td className="px-4 py-5">
                                    <div className="font-bold text-foreground text-sm">{row.original.desc.replace("_", " ")}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">TX-{row.renderValue("tid")}</div>
                                </td>
                                <td className="px-4 py-5 text-md font-bold text-foreground">
                                    <Link
                                        href={`/admin/management/${row.original.familyid}`}
                                        className="transition-colors duration-200 hover:underline hover:text-secondary"
                                    >
                                        {row.original.family}
                                    </Link>
                                </td>
                                {/* <td className="px-4 py-5">
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border",
                                        row.original.type === 'credit'
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                            : "bg-muted text-muted-foreground border-border"
                                    )}>
                                        {row.renderValue("type")}
                                    </span>
                                </td> */}
                                <td className={cn(
                                    "px-4 py-5 text-right font-bold tabular-nums pr-6",
                                    row.original.amount > 0 ? "text-emerald-800" : "text-red-800"
                                )}>
                                    {row.original.amount > 0 ? "+" : ""}{formatCurrency(row.original.amount)}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                                No results found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <PaginationControls table={globalTable} />
        </div>
    )
}


const familyColumns: ColumnDef<FamilyRow>[] = [
    {
        id: "fid",
        accessorKey: "fid",
    }, 
    {
        id: "fbid",
        accessorKey: "fbid"
    },
    {
        id: "family",
        accessorKey: "family"
    },
    {
        id: "billed",
        accessorKey: "billed"
    },
    {
        id: "paid",
        accessorKey: "paid"
    },
    {
        id: "status",
        accessorKey: "status",
        filterFn: (row, rowid, filterValue) => {
            if (!filterValue.length) return true;

            const rowValue = row.getValue(rowid) as string;
            return filterValue.some((val: string) => val.toLowerCase() === rowValue.toLowerCase());
        }
    },
    {
        id: "students",
        accessorKey: "students"
    }
]

function FamilyTable({ families }: { families: FamilyRow[] }) {
    const [filterOpen, setFilterOpen] = useState<boolean>(false);
    const [expandedRow, setExpandedRow] = useState<string>("");

    const [globalFilter, setGlobalFilter] = useState<string>("")

    const toggleRow = (rowid: string) => {
        if (expandedRow === rowid) {
            setExpandedRow("");
        } else {
            setExpandedRow(rowid);
        }
    }

    const handleFilterCheck = (option: string, checked: boolean) => {
        const column = familyTable.getColumn("status");
        const currentFilters = (column?.getFilterValue() as string[]) ?? []

        let newFilter: string[];
        if (checked) {
            newFilter = [...currentFilters, option];
        } else {
            newFilter = currentFilters.filter((desc) => desc !== option);
        }

        column?.setFilterValue(newFilter.length > 0 ? newFilter : undefined)
    }

    const clearFilters = () => {
        const column = familyTable.getColumn("status");
        column?.setFilterValue(undefined);
    }

    const familyTable = useReactTable({
        columns: familyColumns,
        data: families,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            globalFilter
        },
        onGlobalFilterChange: setGlobalFilter,
        initialState: {
            pagination: {
                pageSize: 20,
            }
        }
    })

    const currentFilterValues = (familyTable.getColumn("status")?.getFilterValue() as string[]) ?? [];
    return (
        <div>
            {/* TOOLBAR */}
            <div className="p-4 flex justify-between items-center border-b border-border bg-card">
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input
                        type="text"
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder={"Search family ID..."}
                        className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-transparent focus:bg-card focus:border-ring rounded text-sm font-medium text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring/20"
                    />
                </div>

                <div className="relative">
                    <button
                        onClick={() => setFilterOpen(!filterOpen)}
                        className={cn(
                            "px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-all border",
                            filterOpen
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                        )}
                    >
                        <Filter size={14} /> Filter View
                    </button>

                    {filterOpen && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-background border border-primary/20 shadow-md rounded-lg z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                            {/* Header: Sticky so it doesn't scroll away */}
                            <div className="px-3 py-2.5 border-b border-primary/10 bg-background">
                                <div className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                                    By Status
                                </div>
                            </div>
                            {/* Scrollable List Area: Constraints height to avoid long page scrolls */}
                            <div className="max-h-[240px] overflow-y-auto p-1.5 space-y-0.5">
                                {["Paid", "Partial", "Unpaid"].map((option) => (
                                    <label 
                                        key={option} 
                                        className="flex items-center gap-3 px-2 py-2 hover:bg-secondary/10 rounded-md cursor-pointer transition-colors group"
                                    >
                                        <input 
                                            type="checkbox" 
                                            checked={currentFilterValues.includes(option)}
                                            onChange={(e) => handleFilterCheck(option, e.target.checked)}
                                            className="
                                                h-4 w-4 shrink-0 rounded-sm 
                                                border border-primary/40 
                                                text-primary
                                                accent-primary
                                                focus:ring-accent focus:ring-offset-0
                                                cursor-pointer
                                            " 
                                        />
                                        <span className="text-sm font-bold text-primary group-hover:text-primary">
                                            {option.replace("_", " ")}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <div className="px-3 py-2 border-t border-primary/10 bg-background/50 flex justify-between">
                                <button 
                                    className="text-[10px] font-bold text-primary/60 hover:text-primary transition-colors"
                                    onClick={clearFilters}
                                >
                                    Clear All
                                </button>
                                <button 
                                    className="text-[10px] font-bold text-accent hover:text-primary transition-colors"
                                    onClick={() => setFilterOpen(false)}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <table className="w-full text-left border border-border">
                <thead>
                    <tr className="border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <th className="pl-6 pr-4 py-4 w-[25%]">Family Unit</th>
                        <th className="px-4 py-4 w-[30%]">Students</th>
                        <th className="px-4 py-4 text-right w-[15%]">Billed</th>
                        <th className="px-4 py-4 text-right w-[15%]">Paid</th>
                        <th className="px-4 py-4 text-right w-[15%]">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">

                    {familyTable.getRowModel().rows.length > 0 ? (
                        familyTable.getRowModel().rows.map((row) => { 
                        const isExpanded = expandedRow === row.id;
                        // const lastActivity = formatBillingDate(row.original.lastActive).join(" ");
                        return (
                            <React.Fragment key={row.id}>
                                <tr
                                    onClick={() => toggleRow(row.id)}
                                    className={cn(
                                        "group transition-colors cursor-pointer",
                                        isExpanded ? "bg-muted/50" : "hover:bg-muted/30"
                                    )}
                                >
                                    <td className="px-4 py-5">
                                        <div className="flex items-start gap-3">
                                            <div className={cn("text-secondary transition-transform mt-0.5", isExpanded ? "rotate-180" : "")}>
                                                <ChevronDown size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="font-bold text-primary text-md leading-tight">
                                                    {row.original.family}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-xs leading-none">
                                                    {/* <span className="text-muted-foreground italic">
                                                        Active: {lastActivity}
                                                    </span>
                                                    <span className="text-gray-300">•</span> */}

                                                    <span className="font-mono font-medium text-secondary tracking-wide">
                                                        FAM-{row.original.fid}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="flex flex-wrap gap-2">
                                            {row.original.students.map((student, idx) => (
                                                <span key={idx} className="px-2 py-1 rounded bg-muted text-foreground/70 text-[11px] font-bold tracking-wide uppercase">{student.namecn}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 text-right font-medium text-muted-foreground tabular-nums">{formatCurrency(row.original.billed)}</td>
                                    <td className="px-4 py-5 text-right font-medium text-muted-foreground tabular-nums">{formatCurrency(row.original.paid)}</td>
                                    <td className="px-4 py-5 text-right pr-6">
                                        {row.original.status === 'paid' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary text-[#FAF9F6] text-[10px] font-bold uppercase tracking-wider shadow-xs">
                                                <Check size={12} strokeWidth={4} className="text-[#D4AF37]" /> 
                                                Paid
                                            </span>
                                        )}
                                        {row.original.status === 'partial' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/70 text-primary text-[10px] font-bold uppercase tracking-wider shadow-xs">
                                                Partial
                                            </span>
                                        )}
                                        {row.original.status === 'unpaid' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF9F6] border border-primary text-primary text-[10px] font-bold uppercase tracking-wider">
                                                Unpaid
                                            </span>
                                        )}
                                    </td>
                                </tr>

                                {/* Timeline View */}
                                {isExpanded && (
                                    <tr className="border-b border-border">
                                        <td colSpan={5} className="p-0 relative">
                                            {/* Accent Line */}
                                            <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-primary"></div>
                                            <div className="pl-12 pr-8 py-8 ml-[6px] shadow-inner">

                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-12 h-px bg-border"></div>
                                                    <span className="text-xs font-bold text-primary uppercase tracking-[0.2em] opacity-50">Recent Activity</span>
                                                    <div className="flex-1 h-px bg-border"></div>
                                                </div>

                                                <table className="w-full text-left mb-6">
                                                    <thead>
                                                        <tr>
                                                            <th className="pb-4 text-xs font-semibold text-primary uppercase tracking-widest w-40 opacity-50">Date</th>
                                                            <th className="pb-4 text-xs font-semibold text-primary uppercase tracking-widest w-48 opacity-50">Transaction ID</th>
                                                            <th className="pb-4 text-xs font-semibold text-primary uppercase tracking-widest opacity-50">Description</th>
                                                            <th className="pb-4 text-xs font-semibold text-primary uppercase tracking-widest text-right opacity-50">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="space-y-4">
                                                        {row.original.lastActivity.map((tx, i) => (
                                                            <tr key={i} className="border-b border-black/5 last:border-0 hover:bg-black/5 transition-colors">
                                                                <td className="py-3 text-sm text-primary/80 italic">
                                                                    {formatBillingDate(tx.date).join(" ")}
                                                                </td>
                                                                <td className="py-3 text-sm text-primary/60">TX-{tx.tid}</td>
                                                                <td className="py-3 text-sm text-primary font-medium">{tx.desc}</td>
                                                                <td className={cn(
                                                                    "py-3 text-sm font-normal text-right tabular-nums",
                                                                    tx.amount > 0 ? "text-emerald-800" : "text-red-800"
                                                                )}>
                                                                    {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>

                                                <div className="flex justify-end">
                                                    <Link href={`/admin/management/${row.original.fid}`} className="text-xs font-bold text-[var(--brand-brass)] hover:text-primary flex items-center gap-1 transition-colors uppercase tracking-widest">
                                                        View Full Record <ArrowUpRight size={14} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        )
                    })): (
                        <tr>
                            <td colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                                No results found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <PaginationControls table={familyTable} />

        </div>
    );
}

export function PaginationControls<T>({ table }: { table: Table<T> }) {
    return (
        <div className="flex items-center justify-between px-2">
            <div className="text-xs text-muted-foreground">
                Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{" "}
                <strong>{table.getPageCount()}</strong>
            </div>
            <div className="flex items-center space-x-2 py-2.5">
                <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="p-2 rounded-md bg-transparent hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="p-2 rounded-md bg-transparent hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}

export default function BillingTable({ families, globalActivity }: BillingTableProps) {
    const [view, setView] = useState<"family" | "activity">("activity");
    return (
        <section className="bg-card rounded-xl border border-border shadow-sm overflow-visible min-h-[200px] flex flex-col relative z-10">
            {/* TABS */}
            <div className="flex border-b border-border bg-muted/30 rounded-t-xl">
                <button
                    onClick={() => setView('family')}
                    className={cn(
                        "h-14 px-8 text-sm font-bold tracking-wide flex items-center gap-2 transition-all relative rounded-tl-xl",
                        view === 'family'
                            ? "text-foreground bg-card shadow-[0_-2px_10px_-2px_rgba(0,0,0,0.05)] border-t border-t-[2px] border-secondary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                >
                    <Users size={16} className={view === 'family' ? "text-secondary" : ""} />
                    Family Balances
                    {/* {view === 'family' && <div className="absolute top-0 left-0 right-0 h-[2px] bg-secondary rounded-xl" />} */}
                </button>

                <button
                    onClick={() => setView('activity')}
                    className={cn(
                        "h-14 px-8 text-sm font-bold tracking-wide flex items-center gap-2 transition-all relative",
                        view === 'activity'
                            ? "text-foreground bg-card shadow-[0_-2px_10px_-2px_rgba(0,0,0,0.05)]"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                >
                    <Calendar size={16} className={view === 'activity' ? "text-secondary" : ""} />
                    Global Activity
                    {view === 'activity' && <div className="absolute top-0 left-0 right-0 h-[2px] bg-secondary" />}
                </button>
            </div>



            {/* TABLE */}
            <div className="flex-1">
                {view === 'family' ? (
                    <FamilyTable families={families} />
                ) : (
                    <GlobalTable globalActivity={globalActivity} />
                )}
            </div>
        </section>
    )
}