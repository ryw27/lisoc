"use client";

import { type DragEvent, useState } from "react";
import { type DutyRosterRow } from "@/types/duty.types";

export type DutyList = "available" | "assigned";

interface DragPayload {
    keys: string[];
    from: DutyList;
}

/** Wiring a list needs to be both a drag source and a drop target. */
export interface ListDnd {
    onRowDragStart: (row: DutyRosterRow) => (event: DragEvent<HTMLElement>) => void;
    isOver: boolean;
    dropProps: {
        onDragOver: (event: DragEvent<HTMLElement>) => void;
        onDragEnter: (event: DragEvent<HTMLElement>) => void;
        onDragLeave: (event: DragEvent<HTMLElement>) => void;
        onDrop: (event: DragEvent<HTMLElement>) => void;
    };
}

function readPayload(event: DragEvent<HTMLElement>): DragPayload | null {
    try {
        const payload = JSON.parse(event.dataTransfer.getData("text/plain"));
        return Array.isArray(payload?.keys) ? (payload as DragPayload) : null;
    } catch {
        return null;
    }
}

/**
 * Makes one list draggable and droppable. `keysForDrag` decides what a grabbed row carries —
 * the whole checked set when the row is part of it. `onDropRows` receives the keys dragged in
 * from the *other* list; drops from the same list are ignored.
 */
export function useListDnd(
    list: DutyList,
    keysForDrag: (row: DutyRosterRow) => string[],
    onDropRows: (keys: string[]) => void
): ListDnd {
    const [isOver, setIsOver] = useState(false);

    return {
        onRowDragStart: (row) => (event) => {
            const payload: DragPayload = { keys: keysForDrag(row), from: list };
            event.dataTransfer.setData("text/plain", JSON.stringify(payload));
            event.dataTransfer.effectAllowed = "move";
        },
        isOver,
        dropProps: {
            // The payload can't be read during dragover, so accept and validate on drop.
            onDragOver: (event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
            },
            onDragEnter: () => setIsOver(true),
            onDragLeave: (event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setIsOver(false);
                }
            },
            onDrop: (event) => {
                event.preventDefault();
                setIsOver(false);
                const payload = readPayload(event);
                if (payload && payload.from !== list && payload.keys.length > 0) {
                    onDropRows(payload.keys);
                }
            },
        },
    };
}
