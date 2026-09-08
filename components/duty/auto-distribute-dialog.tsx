"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { type DutyDateOption } from "@/types/duty.types";

interface AutoDistributeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dutydates: DutyDateOption[];
    /** How many rows the available list will spread over the kept dates. */
    rowCount: number;
    isDistributing: boolean;
    onConfirm: (dates: string[]) => void;
}

export default function AutoDistributeDialog({
    open,
    onOpenChange,
    dutydates,
    rowCount,
    isDistributing,
    onConfirm,
}: AutoDistributeDialogProps) {
    // Dates the admin has removed from this run.
    const [dropped, setDropped] = useState<Set<string>>(new Set());

    // Every time the dialog opens it starts over from the full list of duty dates, however it
    // was opened or closed last time.
    const [wasOpen, setWasOpen] = useState(open);
    if (wasOpen !== open) {
        setWasOpen(open);
        if (open) setDropped(new Set());
    }

    const kept = dutydates.filter((date) => !dropped.has(date.value));

    const handleOpenChange = (next: boolean) => {
        if (isDistributing) return; // Don't close mid-write
        onOpenChange(next);
    };

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Automatic Distribute</AlertDialogTitle>
                    <AlertDialogDescription>
                        Remove any date you don&apos;t want, then confirm to spread the {rowCount}{" "}
                        available {rowCount === 1 ? "row" : "rows"} evenly across the {kept.length}{" "}
                        remaining {kept.length === 1 ? "date" : "dates"}.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <p className="text-sm font-medium">
                    {kept.length} Sunday{kept.length === 1 ? "" : "s"} in list
                </p>

                <div className="custom-scrollbar max-h-72 overflow-y-auto rounded-md border">
                    {kept.length === 0 ? (
                        <p className="text-muted-foreground p-4 text-center text-sm">
                            No dates left. Cancel and reopen to start over.
                        </p>
                    ) : (
                        <ul className="divide-y">
                            {kept.map((date) => (
                                <li
                                    key={date.value}
                                    className="flex items-center justify-between gap-2 px-3 py-2"
                                >
                                    <span className="text-sm">{date.label}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Remove ${date.label}`}
                                        disabled={isDistributing}
                                        onClick={() =>
                                            setDropped((prev) => new Set(prev).add(date.value))
                                        }
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <AlertDialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={isDistributing}
                        onClick={() => handleOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={kept.length === 0 || rowCount === 0 || isDistributing}
                        onClick={() => onConfirm(kept.map((date) => date.value))}
                    >
                        {isDistributing ? "Distributing…" : "Confirm"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
