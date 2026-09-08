"use client";

import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { type DutyRosterRow } from "@/types/duty.types";
import { type ListDnd } from "@/components/duty/duty-dnd";
import { cn } from "@/lib/utils";

export function rowKey(row: DutyRosterRow) {
    return `${row.familyid}-${row.studentid}-${row.classid}`;
}

/** Data columns in display order. `classname` filters via a dropdown, the rest by partial match. */
const COLUMNS = [
    { key: "familyid", label: "Family ID", width: "w-24" },
    { key: "studentname", label: "Student Name", width: "w-36" },
    { key: "classname", label: "Class", width: "w-48" },
    { key: "fathername", label: "Father", width: "w-36" },
    { key: "mothername", label: "Mother", width: "w-36" },
    { key: "address", label: "Address", width: "w-48" },
    { key: "phone", label: "Phone", width: "w-32" },
    { key: "email", label: "Email", width: "w-48" },
] as const satisfies readonly { key: keyof DutyRosterRow; label: string; width: string }[];

type ColumnKey = (typeof COLUMNS)[number]["key"];
type ColumnFilters = Partial<Record<ColumnKey, string>>;

const ALL_CLASSES = "__all__";
const COLUMN_COUNT = COLUMNS.length + 1; // + the select checkbox column

interface DutyRosterTableProps {
    rows: DutyRosterRow[];
    /** Keys (see `rowKey`) of the checked rows, owned by the parent so Apply can read them. */
    selected: Set<string>;
    setSelected: Dispatch<SetStateAction<Set<string>>>;
    dnd: ListDnd;
}

export default function DutyRosterTable({
    rows,
    selected,
    setSelected,
    dnd,
}: DutyRosterTableProps) {
    const [filters, setFilters] = useState<ColumnFilters>({});
    const [classFilter, setClassFilter] = useState(ALL_CLASSES);

    const classOptions = useMemo(
        () =>
            [...new Set(rows.map((row) => row.classname).filter(Boolean))].sort((a, b) =>
                a.localeCompare(b)
            ),
        [rows]
    );

    const visibleRows = useMemo(
        () =>
            rows.filter((row) => {
                if (classFilter !== ALL_CLASSES && row.classname !== classFilter) return false;
                return COLUMNS.every(({ key }) => {
                    if (key === "classname") return true; // Handled by the dropdown
                    const filter = filters[key]?.trim().toLowerCase();
                    return !filter || String(row[key]).toLowerCase().includes(filter);
                });
            }),
        [rows, filters, classFilter]
    );

    const visibleKeys = visibleRows.map(rowKey);
    const allSelected = visibleKeys.length > 0 && visibleKeys.every((key) => selected.has(key));
    const someSelected = !allSelected && visibleKeys.some((key) => selected.has(key));
    const hasFilters = classFilter !== ALL_CLASSES || Object.values(filters).some((v) => v?.trim());

    const toggleRow = (key: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    // Select-all only covers the rows currently passing the column filters.
    const toggleAll = () => {
        setSelected((prev) => {
            const next = new Set(prev);
            for (const key of visibleKeys) {
                if (allSelected) {
                    next.delete(key);
                } else {
                    next.add(key);
                }
            }
            return next;
        });
    };

    const clearFilters = () => {
        setFilters({});
        setClassFilter(ALL_CLASSES);
    };

    return (
        <>
            <div className="mb-2 flex items-center gap-3">
                <p className="text-muted-foreground text-sm">
                    {selected.size} selected · showing {visibleRows.length} of {rows.length}
                </p>
                {hasFilters ? (
                    <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                        Clear filters
                    </Button>
                ) : null}
            </div>

            <div
                className={cn(
                    "custom-scrollbar overflow-x-auto rounded-md border transition-colors",
                    dnd.isOver && "border-primary bg-primary/5"
                )}
                {...dnd.dropProps}
            >
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={
                                        allSelected ? true : someSelected ? "indeterminate" : false
                                    }
                                    onCheckedChange={toggleAll}
                                    disabled={visibleRows.length === 0}
                                    aria-label="Select all rows"
                                />
                            </TableHead>
                            {COLUMNS.map(({ key, label }) => (
                                <TableHead key={key}>{label}</TableHead>
                            ))}
                        </TableRow>
                        <TableRow className="hover:bg-transparent">
                            <TableHead />
                            {COLUMNS.map(({ key, label, width }) => (
                                <TableHead key={key} className="py-2">
                                    {key === "classname" ? (
                                        <Select value={classFilter} onValueChange={setClassFilter}>
                                            <SelectTrigger className={`h-8 ${width}`} size="sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={ALL_CLASSES}>
                                                    All classes
                                                </SelectItem>
                                                {classOptions.map((name) => (
                                                    <SelectItem key={name} value={name}>
                                                        {name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            value={filters[key] ?? ""}
                                            onChange={(e) =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    [key]: e.target.value,
                                                }))
                                            }
                                            placeholder="Filter…"
                                            aria-label={`Filter by ${label}`}
                                            className={`h-8 ${width}`}
                                        />
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visibleRows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={COLUMN_COUNT}
                                    className="text-muted-foreground text-center"
                                >
                                    No registrations match the current filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            visibleRows.map((row) => {
                                const key = rowKey(row);
                                return (
                                    <TableRow
                                        key={key}
                                        data-state={selected.has(key) && "selected"}
                                        draggable
                                        onDragStart={dnd.onRowDragStart(row)}
                                        className="cursor-grab active:cursor-grabbing"
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={selected.has(key)}
                                                onCheckedChange={() => toggleRow(key)}
                                                aria-label={`Select family ${row.familyid} student ${row.studentname} class ${row.classname}`}
                                            />
                                        </TableCell>
                                        {COLUMNS.map(({ key: columnKey }) => (
                                            <TableCell key={columnKey}>{row[columnKey]}</TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
