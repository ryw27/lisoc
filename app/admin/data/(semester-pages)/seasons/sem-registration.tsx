"use client";

import { ClientTable } from "@/components/client-table";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportRowsToCsv } from "@/lib/export-csv";
import { toESTString } from "@/lib/utils";
import {
    Column,
    ColumnDef,
    ColumnFiltersState,
    FilterFn,
    getCoreRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { type ColumnHeader } from "export-to-csv";
import { Download, Filter, TableIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export type RegistrationView = {
    studentid: number;
    familyid: number;
    balance: number;
    regid: number;
    studentnameen: string;
    studentnamecn: string;
    dob: string;
    gender: string;

    arrangeid: number;
    classnamecn: string;
    classno: number | null;
    seasonnamecn: string;
    teachernamecn: string;
    regdate: string;
    statusnamecn: string;
    email: string | undefined;
    phone: string | undefined;
};

function SelectColumnFilter({
    column,
    orderBy,
}: {
    column: Column<RegistrationView>;
    /** Optional numeric rank per row; options are sorted by it (then by label) instead of data order. */
    orderBy?: (row: RegistrationView) => number | null;
}): React.ReactNode {
    const uniqueValues = Array.from(column.getFacetedUniqueValues().keys()); // Get unique values

    if (orderBy) {
        // Rank each option by the first row that carries it; unranked (null) options sort last.
        const rank = new Map<string, number>();
        for (const row of column.getFacetedRowModel().flatRows) {
            const label = String(row.getValue(column.id));
            if (!rank.has(label)) {
                rank.set(label, orderBy(row.original) ?? Number.MAX_SAFE_INTEGER);
            }
        }
        uniqueValues.sort((a, b) => {
            const diff = (rank.get(String(a)) ?? 0) - (rank.get(String(b)) ?? 0);
            return diff !== 0 ? diff : String(a).localeCompare(String(b), "zh");
        });
    }

    return (
        <select
            value={(column.getFilterValue() as string) ?? ""}
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

/** Row passes when no options are checked, or its value is one of the checked options. */
const inSetFilter: FilterFn<RegistrationView> = (row, columnId, filterValue: unknown) =>
    !Array.isArray(filterValue) ||
    filterValue.length === 0 ||
    filterValue.includes(String(row.getValue(columnId)));

function MultiSelectColumnFilter({
    column,
}: {
    column: Column<RegistrationView>;
}): React.ReactNode {
    const uniqueValues = Array.from(column.getFacetedUniqueValues().keys()).map(String);
    const raw = column.getFilterValue();
    const selected: string[] = Array.isArray(raw) ? raw.map(String) : []; // tolerate stale saved state

    const toggle = (value: string, checked: boolean) => {
        const next = checked ? [...selected, value] : selected.filter((v) => v !== value);
        column.setFilterValue(next.length ? next : undefined);
    };

    return (
        // Stop clicks (incl. those bubbling from the portaled menu) from toggling column sort.
        <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger className="bg-background max-w-40 cursor-pointer truncate rounded border border-gray-300 px-2 py-1 text-left text-sm font-normal">
                    {selected.length ? selected.join(", ") : "All"}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-background">
                    <DropdownMenuItem
                        onSelect={() => column.setFilterValue(undefined)}
                        className="cursor-pointer"
                    >
                        All
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {uniqueValues.map((value) => (
                        <DropdownMenuCheckboxItem
                            key={value}
                            checked={selected.includes(value)}
                            onCheckedChange={(checked) => toggle(value, checked === true)}
                            onSelect={(e) => e.preventDefault()} // keep menu open for multi-pick
                            className="cursor-pointer"
                        >
                            {value}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

/**
 * Filter text like "> 3.0", "<= -10", "!= 0" or a bare number (equals). Empty or unparseable
 * text passes every row so the table doesn't blank out mid-typing.
 */
const NUMERIC_FILTER_RE = /^\s*(>=|<=|!=|>|<|=)?\s*(-?\d+(?:\.\d+)?)\s*$/;
const numericCompareFilter: FilterFn<RegistrationView> = (row, columnId, filterValue: unknown) => {
    const match = typeof filterValue === "string" ? NUMERIC_FILTER_RE.exec(filterValue) : null;
    if (!match) return true;
    const [, op = "=", num] = match;
    const target = Number(num);
    const value = Number(row.getValue(columnId));
    switch (op) {
        case ">":
            return value > target;
        case ">=":
            return value >= target;
        case "<":
            return value < target;
        case "<=":
            return value <= target;
        case "!=":
            return value !== target;
        default:
            return value === target;
    }
};

function TextInputFilter({
    column,
    placeholder = "Filter...",
}: {
    column: Column<RegistrationView>;
    placeholder?: string;
}): React.ReactNode {
    const filterValue = (column.getFilterValue() as string) ?? "";
    // Track which column value the input was last synced from so an external change
    // (e.g. filters restored from sessionStorage) is reflected in the box.
    const [state, setState] = useState({ input: filterValue, syncedFrom: filterValue });
    if (state.syncedFrom !== filterValue) {
        setState({ input: filterValue, syncedFrom: filterValue });
    }
    const inputValue = state.input;

    useEffect(() => {
        if (inputValue === filterValue) return; // nothing to push (also skips the mount tick)
        const timer = setTimeout(() => {
            column.setFilterValue(inputValue);
        }, 200); // 200ms delay after user stops typing

        return () => clearTimeout(timer);
    }, [inputValue, filterValue, column]);

    return (
        <input
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setState((s) => ({ ...s, input: e.target.value }))}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
        />
    );
}

// Picks and orders the columns written to the CSV, with the same labels as the table headers
const REGISTRATION_CSV_HEADERS: ColumnHeader[] = [
    { key: "studentid", displayLabel: "SID" },
    { key: "familyid", displayLabel: "FID" },
    { key: "regid", displayLabel: "RegID" },
    { key: "studentnameen", displayLabel: "Name_Eng" },
    { key: "studentnamecn", displayLabel: "学生姓名" },
    { key: "dob", displayLabel: "DOB" },
    { key: "classnamecn", displayLabel: "Courses" },
    { key: "teachernamecn", displayLabel: "老师" },
    { key: "regdate", displayLabel: "DATE" },
    { key: "statusnamecn", displayLabel: "Status" },
    { key: "balance", displayLabel: "Balance" },
    { key: "phone", displayLabel: "Phone" },
    { key: "email", displayLabel: "Email" },
];

const columns: ColumnDef<RegistrationView>[] = [
    {
        accessorKey: "studentid",
        header: "SID",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "familyid",
        header: "FID",
        sortingFn: "alphanumeric",
        cell: ({ getValue }) => {
            const FamId = getValue<number>();

            return (
                <Link href={`/admin/management/${FamId}`} className="text-blue-500 hover:underline">
                    <p className="text-green-500">{FamId}</p>
                </Link>
            );
        },
    },

    {
        accessorKey: "regid",
        header: "RegID",
        sortingFn: "alphanumeric",
    },

    {
        accessorKey: "studentnameen",
        header: "Name_Eng",
    },
    {
        accessorKey: "studentnamecn",
        header: "学生姓名",
    },
    {
        accessorKey: "dob",
        header: "DOB",
        sortingFn: "alphanumeric",
    },
    /*    {
        accessorKey: "gender",
        header: "Gender",
    },*/
    {
        accessorKey: "classnamecn",
        header: ({ column }) => (
            <div>
                Courses <br />
                <SelectColumnFilter column={column} orderBy={(row) => row.classno} />
            </div>
        ),
        filterFn: "equalsString", // Use a built-in filter function
        //filterFn: 'uniqueValueFilterFn', // Use a built-in filter function
        enableColumnFilter: true,
    },
    /*    {
        accessorKey: "seasonnamecn", 
        header:"Semester",
        
    },*/
    {
        accessorKey: "teachernamecn",
        header: "老师",
        cell: (info) => {
            const arrangeid = String(
                Number(info.row.original.arrangeid ? info.row.original.arrangeid : 0)
            );
            return arrangeid === "0" ? (
                <p className="text-gray-500">{info.row.original.teachernamecn}</p>
            ) : (
                <Link
                    href={`/admin/management/semester/${arrangeid}`}
                    className="text-blue-500 hover:underline"
                >
                    <p>{info.row.original.teachernamecn}</p>
                </Link>
            );
        },
        enableColumnFilter: true,
    },
    {
        accessorKey: "regdate",
        header: "DATE",
    },

    {
        accessorKey: "statusnamecn",
        header: ({ column }) => (
            <div>
                Status <br />
                <MultiSelectColumnFilter column={column} />
            </div>
        ),
        filterFn: inSetFilter, // multi-pick: row matches any checked status
        enableColumnFilter: true,
    },

    {
        accessorKey: "balance",
        header: ({ column }) => (
            <div>
                Balance <br />
                <TextInputFilter column={column} placeholder="> 0.0" />
            </div>
        ),
        cell: ({ getValue }) => {
            const v = getValue<number>();
            return (
                <span
                    className={v > 0 ? "text-green-600" : v < 0 ? "text-red-600" : "text-gray-600"}
                >
                    {v.toFixed(2)}
                </span>
            );
        },
        sortingFn: "basic", // numeric sort
        filterFn: numericCompareFilter,
        enableColumnFilter: true,
    },

    {
        accessorKey: "phone",
        header: ({ column }) => (
            <div>
                Phone
                <br />
                <TextInputFilter column={column} />
            </div>
        ),
        filterFn: "includesString",
        enableColumnFilter: true,
    },

    {
        accessorKey: "email",
        header: ({ column }) => (
            <div>
                Email
                <br />
                <TextInputFilter column={column} />
            </div>
        ),
        filterFn: "includesString", // Partial string match
        enableColumnFilter: true,
        enableSorting: false, // Disable sorting for email column
    },
];

// Filters/sorting survive a trip to /admin/management/[familyid] and back (per tab; cleared on close).
const TABLE_STATE_KEY = "lisoc_semester_registrations_table_state";

type PersistedTableState = { columnFilters: ColumnFiltersState; sorting: SortingState };

function readPersistedTableState(): PersistedTableState | null {
    try {
        const raw = sessionStorage.getItem(TABLE_STATE_KEY);
        if (!raw) return null;
        const candidate = JSON.parse(raw);
        if (!Array.isArray(candidate?.columnFilters) || !Array.isArray(candidate?.sorting)) {
            return null;
        }
        return candidate as PersistedTableState;
    } catch {
        return null;
    }
}

export function SemesterRegistrations({ registrations }: { registrations: RegistrationView[] }) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    // Don't persist until the restore has run, or the initial empty state would overwrite it.
    const [restored, setRestored] = useState(false);

    useEffect(() => {
        const saved = readPersistedTableState();
        if (saved) {
            setColumnFilters(saved.columnFilters);
            setSorting(saved.sorting);
        }
        setRestored(true);
    }, []);

    useEffect(() => {
        if (!restored) return;
        try {
            sessionStorage.setItem(TABLE_STATE_KEY, JSON.stringify({ columnFilters, sorting }));
        } catch {
            // Storage unavailable (private mode, quota) - filters just won't persist.
        }
    }, [columnFilters, sorting, restored]);

    const table = useReactTable<RegistrationView>({
        data: registrations,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSorting: true,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        state: {
            sorting,
            columnFilters,
        },
        enableColumnFilters: true,
        getFacetedUniqueValues: getFacetedUniqueValues(), // Enable faceting
        getFilteredRowModel: getFilteredRowModel(), // Required for filtering
        // NOTE: autoResetPageIndex is deliberately left at its default here. Setting it
        // to false measurably slowed filtering on this table (~900 rows x 15 columns).
    });

    const handleExport = (option: "all" | "filtered") => {
        // No pagination on this table, so getRowModel() is the filtered + sorted view
        const rows =
            option === "all" ? table.getPreFilteredRowModel().rows : table.getRowModel().rows;

        exportRowsToCsv(
            rows.map((row) => row.original),
            `lisoc_semester_registrations_${toESTString(new Date()).split("T")[0]}`,
            REGISTRATION_CSV_HEADERS
        );
    };

    return (
        <div>
            <div className="mb-4 flex items-center justify-end gap-3">
                <span className="text-muted-foreground text-sm tracking-wide uppercase">
                    {table.getRowModel().rows.length} of {registrations.length} rows
                </span>

                <DropdownMenu>
                    <DropdownMenuTrigger className="bg-primary border-primary hover:bg-primary/90 flex h-10 cursor-pointer items-center gap-2 border px-6 text-sm font-semibold tracking-wide text-white shadow-sm transition-all">
                        <Download size={16} />
                        Export
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="bg-background w-56">
                        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={() => handleExport("all")}
                            className="cursor-pointer"
                        >
                            <TableIcon className="text-muted-foreground mr-2 h-4 w-4" />
                            <span>Export All Rows</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => handleExport("filtered")}
                            className="cursor-pointer"
                        >
                            <Filter className="text-muted-foreground mr-2 h-4 w-4" />
                            <span>Export Filtered Rows</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <ClientTable table={table} maxHeight="min(48rem, 75vh)" />
        </div>
    );
}
