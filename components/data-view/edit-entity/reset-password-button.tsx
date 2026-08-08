"use client";

import { useState } from "react";
import { adminResetUserPassword } from "@/server/auth/accountSetup.actions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ResetPasswordButtonProps = {
    userid: string;
    disabled?: boolean;
};

// Admin-only control. The server action re-checks the ADMIN role, so this
// component only drives the confirmation + status UI.
export default function ResetPasswordButton({ userid, disabled }: ResetPasswordButtonProps) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

    const onConfirm = async () => {
        setBusy(true);
        setResult(null);
        const res = await adminResetUserPassword({ userid });
        if (res.ok) {
            setResult({
                ok: true,
                message: `Reset link sent to ${res.data?.email ?? "the user"}. It expires in 3 days. Their current password no longer works until they set a new one.`,
            });
        } else {
            setResult({
                ok: false,
                message: res.errorMessage ?? "Could not send the reset link. Please try again.",
            });
        }
        setBusy(false);
        setOpen(false);
    };

    return (
        <div className="mt-2 flex flex-col gap-1">
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogTrigger asChild>
                    <button
                        type="button"
                        disabled={disabled || busy}
                        className="w-fit cursor-pointer rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {busy ? "Sending…" : "Reset password"}
                    </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reset this user&apos;s password?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This immediately invalidates their current password and emails them a
                            link to choose a new one. The link expires in 3 days. They will not be
                            able to sign in until they use it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                // Keep the dialog mounted while the action runs.
                                e.preventDefault();
                                void onConfirm();
                            }}
                            disabled={busy}
                        >
                            {busy ? "Sending…" : "Send reset link"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {result && (
                <p
                    aria-live="polite"
                    className={`text-xs ${result.ok ? "text-green-700" : "text-red-600"}`}
                >
                    {result.message}
                </p>
            )}
        </div>
    );
}
