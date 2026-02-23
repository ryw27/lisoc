"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


interface ConfirmActiveSemesterProps {
    hasActive: boolean;
    children: React.ReactNode;
}

export default function ConfirmActiveSemester({
    hasActive,
    children,
}: ConfirmActiveSemesterProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (hasActive) {
            setOpen(true);
        }
    }, [hasActive]);

    const handleConfirm = () => {
        setOpen(false);
    };

    const handleCancel = () => {
        setOpen(false);
        router.push("/admin/management/semester");
    };

    return (
        <>
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center justify-center gap-2 font-bold ">
                            Active Semester Exists
                            </AlertDialogTitle>
                        <AlertDialogDescription className="flex items-center justify-center gap-2 font-bold text-lg text-red-600">
                            There is an active semester. Are you sure you want to continue? <AlertTriangle className="h-18 w-18" />
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-2 justify-end">
                        <AlertDialogCancel onClick={handleCancel}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm}>
                            Continue
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
            {children}
        </>
    );
}
