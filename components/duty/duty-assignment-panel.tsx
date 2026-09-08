"use client";

import { Button } from "@/components/ui/button";
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
import { type DutyDateOption, type DutyRosterRow } from "@/types/duty.types";
import { type ListDnd } from "@/components/duty/duty-dnd";
import { cn } from "@/lib/utils";
import { rowKey } from "@/components/duty/duty-roster-table";

interface DutyAssignmentPanelProps {
    dutydates: DutyDateOption[];
    dutyDate: string;
    /** Changing the date sends every assigned row back to the available list. */
    onDutyDateChange: (value: string) => void;
    /** Rows already moved here by Apply or by dragging. */
    assigned: DutyRosterRow[];
    /** Moves the available list's checked rows here. */
    onApply: () => void;
    /** Opens the dialog that spreads the whole available list across the duty dates. */
    onAutoDistribute: () => void;
    canAutoDistribute: boolean;
    /** Writes the assigned rows to `dutyassignment` for the chosen duty date. */
    onConfirm: () => void;
    isConfirming: boolean;
    message: { text: string; isError: boolean } | null;
    dnd: ListDnd;
}

export default function DutyAssignmentPanel({
    dutydates,
    dutyDate,
    onDutyDateChange,
    assigned,
    onApply,
    onAutoDistribute,
    canAutoDistribute,
    onConfirm,
    isConfirming,
    message,
    dnd,
}: DutyAssignmentPanelProps) {
    const dutyDateLabel = dutydates.find((date) => date.value === dutyDate)?.label ?? "—";

    return (
        <section className="border-foreground mb-4 rounded-md border-2 p-4">
            <h2 className="mb-3 text-sm font-bold">Assignment Box</h2>
            <div className="grid gap-6 md:grid-cols-2">
                {/* Left: duty date + actions */}
                <div className="flex flex-col items-start gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-muted-foreground text-xs font-medium">
                            Duty Date
                        </label>
                        <Select value={dutyDate} onValueChange={onDutyDateChange}>
                            <SelectTrigger className="w-56">
                                <SelectValue placeholder="No dates in this academic year" />
                            </SelectTrigger>
                            <SelectContent>
                                {dutydates.map((date) => (
                                    <SelectItem key={date.value} value={date.value}>
                                        {date.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onAutoDistribute}
                            disabled={!canAutoDistribute}
                        >
                            Automatic Distribute
                        </Button>
                        <Button type="button" onClick={onApply} disabled={!dutyDate}>
                            Apply Selected
                        </Button>
                    </div>

                    {message ? (
                        <p
                            className={cn(
                                "text-sm",
                                message.isError ? "text-destructive" : "text-muted-foreground"
                            )}
                        >
                            {message.text}
                        </p>
                    ) : null}
                </div>

                {/* Right: rows carried over by Apply */}
                <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-muted-foreground text-xs font-medium">
                            Assigned ({assigned.length}) · Duty date: {dutyDateLabel}
                        </p>
                        <Button
                            type="button"
                            size="sm"
                            onClick={onConfirm}
                            disabled={assigned.length === 0 || !dutyDate || isConfirming}
                        >
                            {isConfirming ? "Saving…" : "Confirm"}
                        </Button>
                    </div>
                    <div
                        className={cn(
                            "custom-scrollbar max-h-56 overflow-auto rounded-md border transition-colors",
                            dnd.isOver && "border-primary bg-primary/5"
                        )}
                        {...dnd.dropProps}
                    >
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Family ID</TableHead>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Class</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assigned.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            className="text-muted-foreground text-center"
                                        >
                                            Drag rows here, or check them below and click Apply
                                            Selected.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    assigned.map((row) => (
                                        <TableRow
                                            key={rowKey(row)}
                                            draggable
                                            onDragStart={dnd.onRowDragStart(row)}
                                            className="cursor-grab active:cursor-grabbing"
                                        >
                                            <TableCell>{row.familyid}</TableCell>
                                            <TableCell>{row.studentname}</TableCell>
                                            <TableCell>{row.classname}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </section>
    );
}
