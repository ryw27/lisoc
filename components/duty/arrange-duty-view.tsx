"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AutoDistributeDialog from "@/components/duty/auto-distribute-dialog";
import DutyAssignmentPanel from "@/components/duty/duty-assignment-panel";
import { useListDnd } from "@/components/duty/duty-dnd";
import DutyRosterTable, { rowKey } from "@/components/duty/duty-roster-table";
import { type DutyDateOption, type DutyRosterRow } from "@/types/duty.types";
import { autoDistributeDuty, confirmDutyAssignments } from "@/server/duty/actions";

interface ArrangeDutyViewProps {
    seasonid: number | null;
    dutydates: DutyDateOption[];
    rows: DutyRosterRow[];
}

/** Keeps the available list in its server ordering as rows move back and forth. */
function sortRows(rows: DutyRosterRow[]) {
    return [...rows].sort(
        (a, b) =>
            a.familyid - b.familyid ||
            a.studentid - b.studentid ||
            a.classname.localeCompare(b.classname)
    );
}

/** Owns both lists so rows can move between them by drag or by Apply. */
export default function ArrangeDutyView({ seasonid, dutydates, rows }: ArrangeDutyViewProps) {
    // Rows still up for assignment. Assigned rows leave this list.
    const [availableRows, setAvailableRows] = useState(rows);
    const [assigned, setAssigned] = useState<DutyRosterRow[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [dutyDate, setDutyDate] = useState(dutydates[0]?.value ?? "");
    const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
    const [isConfirming, startConfirm] = useTransition();
    const [distributeOpen, setDistributeOpen] = useState(false);
    const [isDistributing, startDistribute] = useTransition();
    const router = useRouter();

    // A refresh re-queries the roster; adopt it so saved rows drop out of the available list.
    const [lastRows, setLastRows] = useState(rows);
    if (lastRows !== rows) {
        setLastRows(rows);
        setAvailableRows(rows);
        setAssigned([]);
    }

    const selectedRows = useMemo(
        () => availableRows.filter((row) => selected.has(rowKey(row))),
        [availableRows, selected]
    );

    const moveToAssigned = (moving: DutyRosterRow[]) => {
        if (moving.length === 0) return;
        const keys = new Set(moving.map(rowKey));
        setAssigned((prev) => [...prev, ...moving]);
        setAvailableRows((prev) => prev.filter((row) => !keys.has(rowKey(row))));
        setSelected((prev) => {
            const next = new Set(prev);
            for (const key of keys) next.delete(key);
            return next;
        });
    };

    const moveToAvailable = (moving: DutyRosterRow[]) => {
        if (moving.length === 0) return;
        const keys = new Set(moving.map(rowKey));
        setAvailableRows((prev) => sortRows([...prev, ...moving]));
        setAssigned((prev) => prev.filter((row) => !keys.has(rowKey(row))));
    };

    const applySelected = () => {
        if (selectedRows.length === 0) {
            setMessage({ text: "Select at least one row in the available list.", isError: true });
            return;
        }
        moveToAssigned(selectedRows);
        setMessage(null);
    };

    // A different duty date starts over: everything assigned goes back to the available list.
    const changeDutyDate = (value: string) => {
        setDutyDate(value);
        moveToAvailable(assigned);
        setMessage(null);
    };

    const confirmAssignments = () => {
        if (!seasonid || assigned.length === 0 || !dutyDate) return;

        startConfirm(async () => {
            const result = await confirmDutyAssignments({
                seasonid,
                dutydate: dutyDate,
                rows: assigned.map(({ familyid, studentid }) => ({ familyid, studentid })),
            });

            if (!result.ok) {
                setMessage({
                    text: result.errorMessage ?? "Could not save the duty assignments.",
                    isError: true,
                });
                return;
            }

            const { inserted = 0, skipped = 0 } = result.data ?? {};
            // Confirmed students are no longer available, so they stay out of both lists.
            setAssigned([]);
            setMessage({
                text: `Saved ${inserted} duty assignment${inserted === 1 ? "" : "s"}${
                    skipped > 0 ? ` (${skipped} already assigned)` : ""
                }.`,
                isError: false,
            });
        });
    };

    // Everything still unsaved: the available list plus whatever sits in the assignment box.
    const distributableRows = useMemo(
        () => [...availableRows, ...assigned],
        [availableRows, assigned]
    );

    const distribute = (dates: string[]) => {
        if (!seasonid || distributableRows.length === 0) return;

        startDistribute(async () => {
            const result = await autoDistributeDuty({
                seasonid,
                dutydates: dates,
                rows: distributableRows.map(({ familyid, studentid }) => ({ familyid, studentid })),
            });

            if (!result.ok) {
                setMessage({
                    text: result.errorMessage ?? "Could not distribute the duty assignments.",
                    isError: true,
                });
                return;
            }

            const { inserted = 0, failed = [] } = result.data ?? {};
            setDistributeOpen(false);
            setMessage({
                text: `Distributed ${inserted} student${inserted === 1 ? "" : "s"}${
                    failed.length > 0
                        ? `. ${failed.length} failed and ${failed.length === 1 ? "is" : "are"} still listed below`
                        : ""
                }.`,
                isError: failed.length > 0,
            });
            // Pull the roster again so the saved students leave the available list.
            router.refresh();
        });
    };

    // Dragging a checked row carries the whole checked set; an unchecked row travels alone.
    const availableDnd = useListDnd(
        "available",
        (row) => (selected.has(rowKey(row)) ? [...selected] : [rowKey(row)]),
        (keys) => moveToAvailable(assigned.filter((row) => keys.includes(rowKey(row))))
    );
    // Nothing in the assigned list is checkable, so those rows always travel alone.
    const assignedDnd = useListDnd(
        "assigned",
        (row) => [rowKey(row)],
        (keys) => moveToAssigned(availableRows.filter((row) => keys.includes(rowKey(row))))
    );

    return (
        <>
            <DutyAssignmentPanel
                dutydates={dutydates}
                dutyDate={dutyDate}
                onDutyDateChange={changeDutyDate}
                assigned={assigned}
                onApply={applySelected}
                onAutoDistribute={() => setDistributeOpen(true)}
                canAutoDistribute={distributableRows.length > 0 && dutydates.length > 0}
                onConfirm={confirmAssignments}
                isConfirming={isConfirming}
                message={message}
                dnd={assignedDnd}
            />
            <AutoDistributeDialog
                open={distributeOpen}
                onOpenChange={setDistributeOpen}
                dutydates={dutydates}
                rowCount={distributableRows.length}
                isDistributing={isDistributing}
                onConfirm={distribute}
            />

            <h2 className="mb-2 text-sm font-bold">Available List</h2>
            <DutyRosterTable
                rows={availableRows}
                selected={selected}
                setSelected={setSelected}
                dnd={availableDnd}
            />
        </>
    );
}
