"use client";

import { XIcon } from "lucide-react";
import { ConfirmActionCell } from "@/components/confirm-action-cell";

type DeleteConfirmCellProps = {
    id: number;
    /** Shown in the dialog, e.g. "balance" or "registration". */
    label: string;
    /** Server action that archives + deletes the row; throws on failure. */
    onConfirm: (id: number) => Promise<void>;
};

/**
 * Leading X column cell shared by the balance and registration tables on the
 * family management page. Deleted rows go to the recycle bin
 * (/admin/other/tools) where they can be restored.
 */
export function DeleteConfirmCell({ id, label, onConfirm }: DeleteConfirmCellProps) {
    return (
        <ConfirmActionCell
            id={id}
            icon={<XIcon className="h-4 w-4" />}
            buttonClassName="text-red-600 hover:text-red-800"
            ariaLabel={`Delete ${label} ${id}`}
            title="Confirm Deletion / 确认删除"
            description={
                <>
                    Delete {label} #{id}? / 确定删除 {label} #{id}？
                    <br />
                    The row is moved to the recycle bin (Other → Tools) and can be restored from
                    there.
                </>
            }
            confirmLabel="Confirm"
            pendingLabel="Deleting..."
            onConfirm={onConfirm}
        />
    );
}
