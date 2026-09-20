"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DeleteConfirmCellProps = {
    id: number;
    /** Shown in the dialog, e.g. "balance" or "registration". */
    label: string;
    /** Server action that archives + deletes the row; throws on failure. */
    onConfirm: (id: number) => Promise<void>;
};

/**
 * Leading X column cell shared by the balance and registration tables on the
 * family management page. Opens a confirm dialog, then calls the delete
 * action; the page re-renders via revalidatePath so no client state changes.
 */
export function DeleteConfirmCell({ id, label, onConfirm }: DeleteConfirmCellProps) {
    const [open, setOpen] = useState<boolean>(false);
    const [pending, setPending] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpenChange = (next: boolean) => {
        if (pending) return;
        setOpen(next);
        if (!next) setError(null);
    };

    const handleConfirm = async (e: React.MouseEvent<HTMLButtonElement>) => {
        // Keep the dialog open until the action settles so errors can be shown.
        e.preventDefault();
        setPending(true);
        setError(null);
        try {
            await onConfirm(id);
            setOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setPending(false);
        }
    };

    return (
        <>
            <button
                type="button"
                className={cn("rounded-md p-1", "cursor-pointer text-red-600 hover:text-red-800")}
                onClick={() => setOpen(true)}
                aria-label={`Delete ${label} ${id}`}
            >
                <XIcon className="h-4 w-4" />
            </button>

            <AlertDialog open={open} onOpenChange={handleOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion / 确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            Delete {label} #{id}? / 确定删除 {label} #{id}？
                            <br />
                            The row is moved to the recycle bin and can only be restored by a
                            database admin.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {error && <div className="text-sm text-red-600">Deletion failed: {error}</div>}

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm} disabled={pending}>
                            {pending ? "Deleting..." : "Confirm"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
