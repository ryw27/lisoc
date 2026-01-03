"use client";

import React, { RefObject, useImperativeHandle, useMemo, useState } from "react";
import Link from "next/link";
import {
    ColumnDef,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    Row,
    RowSelectionState,
    Table,
    useReactTable,
} from "@tanstack/react-table";
import {
    ArrowUpRight,
    BoxSelect,
    Calendar,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Filter,
    Search,
    Users,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { type BillingRow, type FamilyRow } from "@/types/billing.types";
import { exportExcel, formatBillingDate, TableExportType } from "./billing-ledger";

type BillingTableProps = {
    families: FamilyRow[];
    globalActivity: BillingRow[];
    rowRef: RefObject<TableExportType | null>;
};

const billingColumns: ColumnDef<BillingRow>[] = [
    {
        id: "tid",
        accessorKey: "tid",
    },
    {
        id: "amount",
        accessorKey: "amount",
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
        },
    },
    {
        id: "family",
        accessorKey: "family",
    },
    {
        id: "type",
        accessorKey: "type",
    },
];

function GlobalTable({
    globalActivity,
    rowRef,
}: {
    globalActivity: BillingRow[];
    rowRef: RefObject<TableExportType | null>;
}) {
    const [filterOpen, setFilterOpen] = useState<boolean>(false);
    const [selectMode, setSelectMode] = useState<boolean>(false);

    const [globalFilter, setGlobalFilter] = useState<string>("");
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    const handleFilterCheck = (option: string, checked: boolean) => {
        const column = globalTable.getColumn("desc");
        const currentFilters = (column?.getFilterValue() as string[]) ?? [];

        let newFilter: string[];
        if (checked) {
            newFilter = [...currentFilters, option];
        } else {
            newFilter = currentFilters.filter((desc) => desc !== option);
        }

        column?.setFilterValue(newFilter.length > 0 ? newFilter : undefined);
    };

    const clearFilters = () => {
        const column = globalTable.getColumn("desc");
        column?.setFilterValue(undefined);
    };

    useImperativeHandle(rowRef, () => ({
        triggerExport: (option) => {
            let exportData;

            if (option === "all") {
                exportData = globalTable.getPrePaginationRowModel().rows.map((row) => row.original);
            } else if (option === "page") {
                exportData = globalTable.getRowModel().rows.map((row) => row.original);
            } else {
                exportData = globalTable.getSelectedRowModel().rows.map((row) => row.original);
            }

            exportExcel(exportData);
        },
    }));

    const globalTable = useReactTable({
        columns: billingColumns,
        data: globalActivity,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            globalFilter,
            rowSelection,
        },
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        initialState: {
            pagination: {
                pageSize: 20,
            },
        },
    });

    const descOptions = useMemo(() => {
        const allDescriptions = globalActivity.map((row) => row.desc);
        return Array.from(new Set(allDescriptions)).sort();
    }, [globalActivity]);

    const currentFilterValues = (globalTable.getColumn("desc")?.getFilterValue() as string[]) ?? [];
    return (
        <div>
            {/* TOOLBAR */}
            <div className="border-border bg-card flex items-center justify-between border-b p-4">
                <div className="relative w-80">
                    <Search
                        className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
                        size={14}
                    />
                    <input
                        type="text"
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder={"Search..."}
                        className="bg-muted/30 focus:bg-card focus:border-ring text-foreground placeholder:text-muted-foreground focus:ring-ring/20 w-full rounded border border-transparent py-2 pr-4 pl-9 text-sm font-medium transition-all focus:ring-2 focus:outline-none"
                    />
                </div>

                <div className="relative">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (selectMode) globalTable.resetRowSelection();
                                setSelectMode(!selectMode);
                            }}
                            className={cn(
                                "flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-all",
                                selectMode
                                    ? "bg-secondary/80 text-primary border-primary/20 shadow-sm"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent bg-transparent"
                            )}
                        >
                            <BoxSelect size={15} />
                            <span className={cn(selectMode && "font-bold")}>Select Mode</span>
                        </button>

                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className={cn(
                                "flex items-center gap-2 rounded border px-4 py-2 text-sm font-bold transition-all",
                                filterOpen
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                            )}
                        >
                            <Filter size={14} /> Filter View
                        </button>
                    </div>

                    {filterOpen && (
                        <div className="bg-background border-primary/20 animate-in fade-in zoom-in-95 absolute top-full right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border shadow-md duration-200">
                            {/* Header: Sticky so it doesn't scroll away */}
                            <div className="border-primary/10 bg-background border-b px-3 py-2.5">
                                <div className="text-primary/60 text-[10px] font-black tracking-widest uppercase">
                                    By Description
                                </div>
                            </div>
                            {/* Scrollable List Area: Constraints height to avoid long page scrolls */}
                            <div className="max-h-[240px] space-y-0.5 overflow-y-auto p-1.5">
                                {descOptions.map((option) => (
                                    <label
                                        key={option}
                                        className="hover:bg-secondary/10 group flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={currentFilterValues.includes(option)}
                                            onChange={(e) =>
                                                handleFilterCheck(option, e.target.checked)
                                            }
                                            className="border-primary/40 text-primary accent-primary focus:ring-accent h-4 w-4 shrink-0 cursor-pointer rounded-sm border focus:ring-offset-0"
                                        />
                                        <span className="text-primary group-hover:text-primary text-sm font-bold">
                                            {option.replace("_", " ")}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <div className="border-primary/10 bg-background/50 flex justify-between border-t px-3 py-2">
                                <button
                                    className="text-primary/60 hover:text-primary text-[10px] font-bold transition-colors"
                                    onClick={clearFilters}
                                >
                                    Clear All
                                </button>
                                <button
                                    className="text-accent hover:text-primary text-[10px] font-bold transition-colors"
                                    onClick={() => setFilterOpen(false)}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <table className="border-border w-full border text-left">
                <thead>
                    <tr className="border-border text-muted-foreground border-b text-[10px] font-black tracking-widest uppercase">
                        <th className="w-[20%] py-4 pr-4 pl-6">Date</th>
                        <th className="w-[30%] px-4 py-4">Description</th>
                        <th className="w-[30%] px-4 py-4">Family Unit</th>
                        {/* <th className="px-4 py-4 w-[15%]">Type</th> */}
                        <th className="w-[20%] px-4 py-4 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-border divide-y">
                    {globalTable.getRowModel().rows.length > 0 ? (
                        globalTable.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                onClick={() => {
                                    if (selectMode) {
                                        row.toggleSelected();
                                    }
                                }}
                                className={cn(
                                    "group hover:bg-muted/30 cursor-default transition-colors",
                                    row.getIsSelected() ? "bg-secondary/10" : ""
                                )}
                            >
                                <td className="text-muted-foreground py-5 pr-4 pl-6 text-sm font-medium tabular-nums">
                                    <div className="text-foreground leading-none font-medium tabular-nums">
                                        {formatBillingDate(row.original.date)[0]}
                                    </div>
                                    <div className="text-muted-foreground mt-0.5 text-xs leading-tight">
                                        {formatBillingDate(row.original.date)[1]}
                                    </div>
                                </td>
                                <td className="px-4 py-5">
                                    <div className="text-foreground text-sm font-bold">
                                        {row.original.desc.replace("_", " ")}
                                    </div>
                                    <div className="text-muted-foreground mt-0.5 text-xs">
                                        TX-{row.renderValue("tid")}
                                    </div>
                                </td>
                                <td className="text-md text-foreground px-4 py-5 font-bold">
                                    <Link
                                        href={`/admin/management/${row.original.familyid}`}
                                        className="hover:text-secondary transition-colors duration-200 hover:underline"
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
                                <td
                                    className={cn(
                                        "px-4 py-5 pr-6 text-right font-bold tabular-nums",
                                        row.original.amount > 0
                                            ? "text-emerald-800"
                                            : "text-red-800"
                                    )}
                                >
                                    {row.original.amount > 0 ? "+" : ""}
                                    {formatCurrency(row.original.amount)}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={4}
                                className="text-muted-foreground h-24 text-center text-sm"
                            >
                                No results found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <PaginationControls table={globalTable} />
        </div>
    );
}

const familyColumns: ColumnDef<FamilyRow>[] = [
    {
        id: "fid",
        accessorKey: "fid",
    },
    {
        id: "family",
        accessorKey: "family",
    },
    {
        id: "billed",
        accessorKey: "billed",
    },
    {
        id: "paid",
        accessorKey: "paid",
    },
    {
        id: "status",
        accessorKey: "status",
        filterFn: (row, rowid, filterValue) => {
            if (!filterValue.length) return true;

            const rowValue = row.getValue(rowid) as string;
            return filterValue.some((val: string) => val.toLowerCase() === rowValue.toLowerCase());
        },
    },
    {
        id: "students",
        accessorKey: "students",
        accessorFn: (row) => {
            const allStudents = row.students
                .map((s) => [s.namecn, s.namefirsten, s.namelasten].filter(Boolean).join(" "))
                .join(" ");
            return allStudents;
        },
    },
];

function FamilyTable({
    families,
    rowRef,
}: {
    families: FamilyRow[];
    rowRef: RefObject<TableExportType | null>;
}) {
    const [filterOpen, setFilterOpen] = useState<boolean>(false);
    const [expandedRow, setExpandedRow] = useState<string>("");

    const [selectMode, setSelectMode] = useState<boolean>(false);

    const [globalFilter, setGlobalFilter] = useState<string>();
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    const toggleRow = (row: Row<FamilyRow>) => {
        if (selectMode) {
            // If we're in select mode, don't expand, just select
            row.toggleSelected();
        } else {
            if (expandedRow === row.id) {
                setExpandedRow("");
            } else {
                setExpandedRow(row.id);
            }
        }
    };

    const handleFilterCheck = (option: string, checked: boolean) => {
        const column = familyTable.getColumn("status");
        const currentFilters = (column?.getFilterValue() as string[]) ?? [];

        let newFilter: string[];
        if (checked) {
            newFilter = [...currentFilters, option];
        } else {
            newFilter = currentFilters.filter((desc) => desc !== option);
        }

        column?.setFilterValue(newFilter.length > 0 ? newFilter : undefined);
    };

    const clearFilters = () => {
        const column = familyTable.getColumn("status");
        column?.setFilterValue(undefined);
    };

    useImperativeHandle(rowRef, () => ({
        triggerExport: (option) => {
            let exportData;

            if (option === "all") {
                exportData = familyTable.getPrePaginationRowModel().rows.map((row) => row.original);
            } else if (option === "page") {
                exportData = familyTable.getRowModel().rows.map((row) => row.original);
            } else {
                exportData = familyTable.getSelectedRowModel().rows.map((row) => row.original);
            }

            const cleanData = exportData.map((row) => {
                const { lastActivity, students, ...rest } = row;
                return {
                    ...rest,
                    students: students
                        .map(
                            (student) =>
                                student.namecn ||
                                [student.namefirsten, student.namelasten].filter(Boolean).join(" ")
                        )
                        .join(" "),
                };
            });

            exportExcel(cleanData);
        },
    }));

    const familyTable = useReactTable({
        columns: familyColumns,
        data: families,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            globalFilter,
            rowSelection,
        },
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        initialState: {
            pagination: {
                pageSize: 20,
            },
        },
    });

    const currentFilterValues =
        (familyTable.getColumn("status")?.getFilterValue() as string[]) ?? [];
    return (
        <div>
            {/* TOOLBAR */}
            <div className="border-border bg-card flex items-center justify-between border-b p-4">
                <div className="relative w-80">
                    <Search
                        className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
                        size={14}
                    />
                    <input
                        type="text"
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder={"Search..."}
                        className="bg-muted/30 focus:bg-card focus:border-ring text-foreground placeholder:text-muted-foreground focus:ring-ring/20 w-full rounded border border-transparent py-2 pr-4 pl-9 text-sm font-medium transition-all focus:ring-2 focus:outline-none"
                    />
                </div>

                <div className="relative">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (selectMode) familyTable.resetRowSelection();
                                setSelectMode(!selectMode);
                            }}
                            className={cn(
                                "flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-all",
                                selectMode
                                    ? "bg-secondary/80 text-primary border-primary/20 shadow-sm"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent bg-transparent"
                            )}
                        >
                            <BoxSelect size={15} />
                            <span className={cn(selectMode && "font-bold")}>Select Mode</span>
                        </button>

                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className={cn(
                                "flex items-center gap-2 rounded border px-4 py-2 text-sm font-bold transition-all",
                                filterOpen
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                            )}
                        >
                            <Filter size={14} /> Filter View
                        </button>
                    </div>

                    {filterOpen && (
                        <div className="bg-background border-primary/20 animate-in fade-in zoom-in-95 absolute top-full right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border shadow-md duration-200">
                            {/* Header: Sticky so it doesn't scroll away */}
                            <div className="border-primary/10 bg-background border-b px-3 py-2.5">
                                <div className="text-primary/60 text-[10px] font-black tracking-widest uppercase">
                                    By Status
                                </div>
                            </div>
                            {/* Scrollable List Area: Constraints height to avoid long page scrolls */}
                            <div className="max-h-[240px] space-y-0.5 overflow-y-auto p-1.5">
                                {["Paid", "Partial", "Unpaid"].map((option) => (
                                    <label
                                        key={option}
                                        className="hover:bg-secondary/10 group flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={currentFilterValues.includes(option)}
                                            onChange={(e) =>
                                                handleFilterCheck(option, e.target.checked)
                                            }
                                            className="border-primary/40 text-primary accent-primary focus:ring-accent h-4 w-4 shrink-0 cursor-pointer rounded-sm border focus:ring-offset-0"
                                        />
                                        <span className="text-primary group-hover:text-primary text-sm font-bold">
                                            {option.replace("_", " ")}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <div className="border-primary/10 bg-background/50 flex justify-between border-t px-3 py-2">
                                <button
                                    className="text-primary/60 hover:text-primary text-[10px] font-bold transition-colors"
                                    onClick={clearFilters}
                                >
                                    Clear All
                                </button>
                                <button
                                    className="text-accent hover:text-primary text-[10px] font-bold transition-colors"
                                    onClick={() => setFilterOpen(false)}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <table className="border-border w-full border text-left">
                <thead>
                    <tr className="border-border text-muted-foreground border-b text-[10px] font-black tracking-widest uppercase">
                        <th className="w-[25%] py-4 pr-4 pl-6">Family Unit</th>
                        <th className="w-[30%] px-4 py-4">Students</th>
                        <th className="w-[15%] px-4 py-4 text-right">Billed</th>
                        <th className="w-[15%] px-4 py-4 text-right">Paid</th>
                        <th className="w-[15%] px-4 py-4 text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-border divide-y">
                    {familyTable.getRowModel().rows.length > 0 ? (
                        familyTable.getRowModel().rows.map((row) => {
                            const isExpanded = expandedRow === row.id;
                            const isSelected = selectMode && row.getIsSelected();
                            // const lastActivity = formatBillingDate(row.original.lastActive).join(" ");
                            return (
                                <React.Fragment key={row.id}>
                                    <tr
                                        onClick={() => toggleRow(row)}
                                        className={cn(
                                            "group cursor-pointer transition-colors",
                                            isSelected ? "bg-secondary/10" : "",
                                            isExpanded ? "bg-muted/50" : "hover:bg-muted/30"
                                        )}
                                    >
                                        <td className="px-4 py-5">
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={cn(
                                                        "text-secondary mt-0.5 transition-transform",
                                                        isExpanded ? "rotate-180" : ""
                                                    )}
                                                >
                                                    <ChevronDown size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="text-primary text-md leading-tight font-bold">
                                                        {row.original.family}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2 text-xs leading-none">
                                                        {/* <span className="text-muted-foreground italic">
                                                        Active: {lastActivity}
                                                    </span>
                                                    <span className="text-gray-300">•</span> */}

                                                        <span className="text-secondary font-mono font-medium tracking-wide">
                                                            FAM-{row.original.fid}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="flex flex-wrap gap-2">
                                                {row.original.students.map((student, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors"
                                                    >
                                                        {student.namecn ||
                                                            [
                                                                student.namefirsten,
                                                                student.namelasten,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(" ")}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="text-muted-foreground px-4 py-5 text-right font-medium tabular-nums">
                                            {formatCurrency(row.original.billed)}
                                        </td>
                                        <td className="text-muted-foreground px-4 py-5 text-right font-medium tabular-nums">
                                            {formatCurrency(row.original.paid)}
                                        </td>
                                        <td className="px-4 py-5 pr-6 text-right">
                                            {row.original.status === "paid" && (
                                                <span className="bg-primary inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#FAF9F6] uppercase shadow-xs">
                                                    <Check
                                                        size={12}
                                                        strokeWidth={4}
                                                        className="text-[#D4AF37]"
                                                    />
                                                    Paid
                                                </span>
                                            )}
                                            {row.original.status === "partial" && (
                                                <span className="bg-secondary/70 text-primary inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase shadow-xs">
                                                    Partial
                                                </span>
                                            )}
                                            {row.original.status === "unpaid" && (
                                                <span className="border-primary text-primary inline-flex items-center gap-1.5 rounded-md border bg-[#FAF9F6] px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase">
                                                    Unpaid
                                                </span>
                                            )}
                                        </td>
                                    </tr>

                                    {/* Timeline View */}
                                    {isExpanded && (
                                        <tr className="border-border border-b">
                                            <td colSpan={5} className="relative p-0">
                                                {/* Accent Line */}
                                                <div className="bg-primary absolute top-0 bottom-0 left-0 w-[6px]"></div>
                                                <div className="ml-[6px] py-8 pr-8 pl-12 shadow-inner">
                                                    <div className="mb-6 flex items-center gap-4">
                                                        <div className="bg-border h-px w-12"></div>
                                                        <span className="text-primary text-xs font-bold tracking-[0.2em] uppercase opacity-50">
                                                            Recent Activity
                                                        </span>
                                                        <div className="bg-border h-px flex-1"></div>
                                                    </div>

                                                    <table className="mb-6 w-full text-left">
                                                        <thead>
                                                            <tr>
                                                                <th className="text-primary w-40 pb-4 text-xs font-semibold tracking-widest uppercase opacity-50">
                                                                    Date
                                                                </th>
                                                                <th className="text-primary w-48 pb-4 text-xs font-semibold tracking-widest uppercase opacity-50">
                                                                    Transaction ID
                                                                </th>
                                                                <th className="text-primary pb-4 text-xs font-semibold tracking-widest uppercase opacity-50">
                                                                    Description
                                                                </th>
                                                                <th className="text-primary pb-4 text-right text-xs font-semibold tracking-widest uppercase opacity-50">
                                                                    Amount
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="space-y-4">
                                                            {row.original.lastActivity.map(
                                                                (tx, i) => (
                                                                    <tr
                                                                        key={i}
                                                                        className="border-b border-black/5 transition-colors last:border-0 hover:bg-black/5"
                                                                    >
                                                                        <td className="text-primary/80 py-3 text-sm italic">
                                                                            {formatBillingDate(
                                                                                tx.date
                                                                            ).join(" ")}
                                                                        </td>
                                                                        <td className="text-primary/60 py-3 text-sm">
                                                                            TX-{tx.tid}
                                                                        </td>
                                                                        <td className="text-primary py-3 text-sm font-medium">
                                                                            {tx.desc}
                                                                        </td>
                                                                        <td
                                                                            className={cn(
                                                                                "py-3 text-right text-sm font-normal tabular-nums",
                                                                                tx.amount > 0
                                                                                    ? "text-emerald-800"
                                                                                    : "text-red-800"
                                                                            )}
                                                                        >
                                                                            {tx.amount > 0
                                                                                ? "+"
                                                                                : ""}
                                                                            {formatCurrency(
                                                                                tx.amount
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )}
                                                        </tbody>
                                                    </table>

                                                    <div className="flex justify-end">
                                                        <Link
                                                            href={`/admin/management/${row.original.fid}`}
                                                            className="hover:text-primary flex items-center gap-1 text-xs font-bold tracking-widest text-[var(--brand-brass)] uppercase transition-colors"
                                                        >
                                                            View Full Record{" "}
                                                            <ArrowUpRight size={14} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })
                    ) : (
                        <tr>
                            <td
                                colSpan={4}
                                className="text-muted-foreground h-24 text-center text-sm"
                            >
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

function PaginationControls<T>({ table }: { table: Table<T> }) {
    return (
        <div className="flex items-center justify-between p-2">
            <div className="text-muted-foreground flex w-[100px] items-center justify-center text-xs font-medium">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>

            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                    <p className="text-primary text-sm font-medium">Rows:</p>
                    <div className="relative">
                        <select
                            value={table.getState().pagination.pageSize}
                            onChange={(e) => {
                                table.setPageSize(Number(e.target.value));
                            }}
                            className="border-border text-primary focus:ring-accent hover:bg-background h-8 w-[70px] cursor-pointer appearance-none rounded-md border bg-white pr-8 pl-3 text-sm font-bold transition-colors focus:ring-1 focus:outline-none"
                        >
                            {[10, 20, 40, 50, 75, 100].map((pageSize) => (
                                <option key={pageSize} value={pageSize}>
                                    {pageSize}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="text-secondary pointer-events-none absolute top-2.5 right-2 h-3 w-3" />
                    </div>
                </div>

                <div className="h-5 w-[1px] bg-gray-400" />

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="hover:border-border flex h-8 w-8 items-center justify-center rounded-md border border-transparent transition-all hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ChevronLeft className="text-primary h-4 w-4" />
                    </button>
                    <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="hover:border-border flex h-8 w-8 items-center justify-center rounded-md border border-transparent transition-all hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ChevronRight className="text-primary h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function BillingTable({ families, globalActivity, rowRef }: BillingTableProps) {
    const [view, setView] = useState<"family" | "activity">("family");
    return (
        <section className="bg-card border-border relative z-10 flex min-h-[200px] flex-col overflow-visible rounded-xl border shadow-sm">
            {/* TABS */}
            <div className="border-border bg-muted/30 flex rounded-t-xl border-b">
                <button
                    onClick={() => setView("family")}
                    className={cn(
                        "relative flex h-14 items-center gap-2 rounded-tl-xl px-8 text-sm font-bold tracking-wide transition-all",
                        view === "family"
                            ? "text-foreground bg-card border-secondary border-t border-t-[2px] shadow-[0_-2px_10px_-2px_rgba(0,0,0,0.05)]"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                >
                    <Users size={16} className={view === "family" ? "text-secondary" : ""} />
                    Family Balances
                    {/* {view === 'family' && <div className="absolute top-0 left-0 right-0 h-[2px] bg-secondary rounded-xl" />} */}
                </button>

                <button
                    onClick={() => setView("activity")}
                    className={cn(
                        "relative flex h-14 items-center gap-2 px-8 text-sm font-bold tracking-wide transition-all",
                        view === "activity"
                            ? "text-foreground bg-card shadow-[0_-2px_10px_-2px_rgba(0,0,0,0.05)]"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                >
                    <Calendar size={16} className={view === "activity" ? "text-secondary" : ""} />
                    Global Activity
                    {view === "activity" && (
                        <div className="bg-secondary absolute top-0 right-0 left-0 h-[2px]" />
                    )}
                </button>
            </div>

            {/* TABLE */}
            <div className="flex-1">
                {view === "family" ? (
                    <FamilyTable families={families} rowRef={rowRef} />
                ) : (
                    <GlobalTable globalActivity={globalActivity} rowRef={rowRef} />
                )}
            </div>
        </section>
    );
}
