"use client";

import { useState } from "react";
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

type ConfirmActionCellProps = {
    id: number;
    /** Icon rendered inside the trigger button. */
    icon: React.ReactNode;
    /** Tailwind classes for the trigger button colour. */
    buttonClassName: string;
    ariaLabel: string;
    title: React.ReactNode;
    description: React.ReactNode;
    confirmLabel: string;
    pendingLabel: string;
    /** Server action for the row; throws on failure (message is shown in the dialog). */
    onConfirm: (id: number) => Promise<void>;
};

/**
 * Small icon button in a table row that opens a confirm dialog and then runs a
 * server action. The page is expected to revalidate so the row updates itself.
 */
export function ConfirmActionCell({
    id,
    icon,
    buttonClassName,
    ariaLabel,
    title,
    description,
    confirmLabel,
    pendingLabel,
    onConfirm,
}: ConfirmActionCellProps) {
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
                className={cn("cursor-pointer rounded-md p-1", buttonClassName)}
                onClick={() => setOpen(true)}
                aria-label={ariaLabel}
            >
                {icon}
            </button>

            <AlertDialog open={open} onOpenChange={handleOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                        <AlertDialogDescription>{description}</AlertDialogDescription>
                    </AlertDialogHeader>

                    {error && <div className="text-sm text-red-600">Failed: {error}</div>}

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm} disabled={pending}>
                            {pending ? pendingLabel : confirmLabel}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
