"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronsUpDown, ChevronUp, Pencil, PencilOff, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { type DutyAssignmentRow } from "@/types/duty.types";
import { DUTY_STATUSES } from "@/lib/utils";
import { deleteDutyAssignment, updateDutyAssignment } from "@/server/duty/actions";

/** Columns with a partial-match filter box, in display order. */
const FILTER_COLUMNS = [
    { key: "familyid", label: "Family ID", width: "w-24" },
    { key: "mothername", label: "Mother", width: "w-36" },
    { key: "fathername", label: "Father", width: "w-36" },
    { key: "phone", label: "Phone", width: "w-32" },
    { key: "email", label: "Email", width: "w-48" },
    { key: "address", label: "Address", width: "w-48" },
    { key: "note", label: "Note", width: "w-48" },
] as const satisfies readonly { key: keyof DutyAssignmentRow; label: string; width: string }[];

type FilterKey = (typeof FILTER_COLUMNS)[number]["key"];
type ColumnFilters = Partial<Record<FilterKey, string>>;

/** The two editable columns. */
interface RowEdit {
    dutystatus: number;
    note: string;
}

const ALL_STATUSES = "__all__";
const ALL_DATES = "__all__";
const COLUMN_COUNT = 13;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
});

/** `YYYY-MM-DD` as e.g. `Sep 7, 2025`; parsed as UTC so the day can't shift. */
function formatDutyDate(dutydate: string) {
    const parsed = new Date(`${dutydate}T00:00:00Z`);
    return Number.isNaN(parsed.getTime()) ? dutydate : dateFormatter.format(parsed);
}

export default function DutyManagementTable({ rows }: { rows: DutyAssignmentRow[] }) {
    // Values written since the page loaded, keyed by dutyassignid.
    const [saved, setSaved] = useState<Record<number, RowEdit>>({});
    // Rows currently open for editing, holding their in-progress values.
    const [drafts, setDrafts] = useState<Record<number, RowEdit>>({});
    const [savingId, setSavingId] = useState<number | null>(null);
    // Rows deleted in this session, hidden until the refresh lands.
    const [deleted, setDeleted] = useState<Set<number>>(new Set());
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const router = useRouter();
    const [error, setError] = useState("");
    const [isSaving, startSave] = useTransition();

    const [filters, setFilters] = useState<ColumnFilters>({});
    const [statusFilter, setStatusFilter] = useState(ALL_STATUSES);
    const [dateFilter, setDateFilter] = useState(ALL_DATES);
    const [dateSort, setDateSort] = useState<"asc" | "desc" | null>(null);

    const dateOptions = useMemo(
        () => [...new Set(rows.map((row) => row.dutydate).filter(Boolean))].sort(),
        [rows]
    );

    /** What the row shows: its draft while editing, else the last saved value. */
    const valuesOf = (row: DutyAssignmentRow): RowEdit =>
        drafts[row.dutyassignid] ??
        saved[row.dutyassignid] ?? { dutystatus: row.dutystatus, note: row.note };

    const visibleRows = useMemo(
        () =>
            rows.filter((row) => {
                if (deleted.has(row.dutyassignid)) return false;

                const current = drafts[row.dutyassignid] ??
                    saved[row.dutyassignid] ?? { dutystatus: row.dutystatus, note: row.note };

                if (statusFilter !== ALL_STATUSES && String(current.dutystatus) !== statusFilter) {
                    return false;
                }
                if (dateFilter !== ALL_DATES && row.dutydate !== dateFilter) return false;

                return FILTER_COLUMNS.every(({ key }) => {
                    const filter = filters[key]?.trim().toLowerCase();
                    if (!filter) return true;
                    // Notes filter on what's shown, which is the pending edit when there is one.
                    const value = key === "note" ? current.note : row[key];
                    return String(value).toLowerCase().includes(filter);
                });
            }),
        [rows, filters, statusFilter, dateFilter, drafts, saved, deleted]
    );

    // `YYYY-MM-DD` sorts lexicographically, so plain string compare is chronological.
    const sortedRows = useMemo(() => {
        if (!dateSort) return visibleRows;
        return [...visibleRows].sort((a, b) =>
            dateSort === "asc"
                ? a.dutydate.localeCompare(b.dutydate)
                : b.dutydate.localeCompare(a.dutydate)
        );
    }, [visibleRows, dateSort]);

    const hasFilters =
        statusFilter !== ALL_STATUSES ||
        dateFilter !== ALL_DATES ||
        Object.values(filters).some((value) => value?.trim());

    const startEdit = (row: DutyAssignmentRow) => {
        setError("");
        setDrafts((prev) => ({ ...prev, [row.dutyassignid]: valuesOf(row) }));
    };

    /** Cancel drops the draft, so the row falls back to its pre-edit values. */
    const cancelEdit = (dutyassignid: number) => {
        setError("");
        setDrafts((prev) => {
            const next = { ...prev };
            delete next[dutyassignid];
            return next;
        });
    };

    const updateDraft = (dutyassignid: number, patch: Partial<RowEdit>) => {
        setDrafts((prev) => ({ ...prev, [dutyassignid]: { ...prev[dutyassignid], ...patch } }));
    };

    const saveEdit = (dutyassignid: number) => {
        const draft = drafts[dutyassignid];
        if (!draft) return;

        setSavingId(dutyassignid);
        startSave(async () => {
            const result = await updateDutyAssignment({
                dutyassignid,
                dutystatus: draft.dutystatus,
                note: draft.note.trim() ? draft.note.trim() : null,
            });
            setSavingId(null);

            if (!result.ok) {
                setError(result.errorMessage ?? "Could not save the row.");
                return;
            }

            setError("");
            setSaved((prev) => ({ ...prev, [dutyassignid]: draft }));
            cancelEdit(dutyassignid);
        });
    };

    const removeRow = (dutyassignid: number) => {
        setDeletingId(dutyassignid);
        startSave(async () => {
            const result = await deleteDutyAssignment({ dutyassignid });
            setDeletingId(null);

            if (!result.ok) {
                setError(result.errorMessage ?? "Could not delete the row.");
                return;
            }

            setError("");
            setDeleted((prev) => new Set(prev).add(dutyassignid));
            // The student is available again on the arrange page.
            router.refresh();
        });
    };

    const filterCell = (key: FilterKey) => {
        const column = FILTER_COLUMNS.find((c) => c.key === key)!;
        return (
            <Input
                value={filters[key] ?? ""}
                onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder="Filter…"
                aria-label={`Filter by ${column.label}`}
                className={`h-8 ${column.width}`}
            />
        );
    };

    return (
        <>
            <div className="mb-2 flex items-center gap-3">
                <p className="text-muted-foreground text-sm">
                    Showing {sortedRows.length} of {rows.length}
                </p>
                {hasFilters ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setFilters({});
                            setStatusFilter(ALL_STATUSES);
                            setDateFilter(ALL_DATES);
                        }}
                    >
                        Clear filters
                    </Button>
                ) : null}
                {error ? <p className="text-destructive text-sm">{error}</p> : null}
            </div>

            <div className="custom-scrollbar overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">Delete</TableHead>
                            <TableHead className="w-24">Edit</TableHead>
                            <TableHead>D_ID</TableHead>
                            <TableHead>Family ID</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Mother</TableHead>
                            <TableHead>Father</TableHead>
                            <TableHead>
                                <button
                                    type="button"
                                    className="flex items-center gap-1 hover:underline"
                                    onClick={() =>
                                        setDateSort((prev) => (prev === "asc" ? "desc" : "asc"))
                                    }
                                    aria-label={`Sort by duty date, currently ${dateSort ?? "unsorted"}`}
                                >
                                    Duty Date
                                    {dateSort === "asc" ? (
                                        <ChevronUp className="h-3.5 w-3.5" />
                                    ) : dateSort === "desc" ? (
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    ) : (
                                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                                    )}
                                </button>
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Note</TableHead>
                        </TableRow>
                        <TableRow className="hover:bg-transparent">
                            <TableHead />
                            <TableHead />
                            <TableHead />
                            <TableHead className="py-2">{filterCell("familyid")}</TableHead>
                            <TableHead />
                            <TableHead className="py-2">{filterCell("mothername")}</TableHead>
                            <TableHead className="py-2">{filterCell("fathername")}</TableHead>
                            <TableHead className="py-2">
                                <Select value={dateFilter} onValueChange={setDateFilter}>
                                    <SelectTrigger className="h-8 w-40" size="sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL_DATES}>All dates</SelectItem>
                                        {dateOptions.map((date) => (
                                            <SelectItem key={date} value={date}>
                                                {formatDutyDate(date)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableHead>
                            <TableHead className="py-2">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-8 w-36" size="sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
                                        {DUTY_STATUSES.map((status) => (
                                            <SelectItem key={status.id} value={String(status.id)}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableHead>
                            <TableHead className="py-2">{filterCell("phone")}</TableHead>
                            <TableHead className="py-2">{filterCell("email")}</TableHead>
                            <TableHead className="py-2">{filterCell("address")}</TableHead>
                            <TableHead className="py-2">{filterCell("note")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedRows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={COLUMN_COUNT}
                                    className="text-muted-foreground text-center"
                                >
                                    No duty assignments match the current filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedRows.map((row) => {
                                const id = row.dutyassignid;
                                const isEditing = Boolean(drafts[id]);
                                const values = valuesOf(row);
                                const rowSaving = isSaving && savingId === id;

                                const rowDeleting = isSaving && deletingId === id;

                                return (
                                    <TableRow key={id}>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Delete duty ${id}`}
                                                title="Delete"
                                                disabled={rowDeleting}
                                                onClick={() => removeRow(id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label={`Cancel editing duty ${id}`}
                                                        title="Cancel"
                                                        disabled={rowSaving}
                                                        onClick={() => cancelEdit(id)}
                                                    >
                                                        <PencilOff className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label={`Save duty ${id}`}
                                                        title="Save"
                                                        disabled={rowSaving}
                                                        onClick={() => saveEdit(id)}
                                                    >
                                                        <Save className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`Edit duty ${id}`}
                                                    title="Edit"
                                                    onClick={() => startEdit(row)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell>{id}</TableCell>
                                        <TableCell>{row.familyid}</TableCell>
                                        <TableCell>{row.studentname}</TableCell>
                                        <TableCell>{row.mothername}</TableCell>
                                        <TableCell>{row.fathername}</TableCell>
                                        <TableCell>{formatDutyDate(row.dutydate)}</TableCell>
                                        <TableCell>
                                            <Select
                                                value={String(values.dutystatus)}
                                                disabled={!isEditing || rowSaving}
                                                onValueChange={(value) =>
                                                    updateDraft(id, { dutystatus: Number(value) })
                                                }
                                            >
                                                <SelectTrigger className="w-36" size="sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DUTY_STATUSES.map((status) => (
                                                        <SelectItem
                                                            key={status.id}
                                                            value={String(status.id)}
                                                        >
                                                            {status.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>{row.phone}</TableCell>
                                        <TableCell>{row.email}</TableCell>
                                        <TableCell>{row.address}</TableCell>
                                        <TableCell>
                                            <Input
                                                value={values.note}
                                                disabled={!isEditing || rowSaving}
                                                onChange={(e) =>
                                                    updateDraft(id, { note: e.target.value })
                                                }
                                                placeholder="Note"
                                                aria-label={`Note for duty ${id}`}
                                                className="h-8 w-48"
                                            />
                                        </TableCell>
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
