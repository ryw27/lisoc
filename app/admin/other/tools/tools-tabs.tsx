"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ColumnDef,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { Undo2, XIcon } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
    purgeBalance,
    purgeRegistration,
    restoreBalance,
    restoreRegistration,
} from "@/server/tools/actions";
import { ClientTable } from "@/components/client-table";
import { ConfirmActionCell } from "@/components/confirm-action-cell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type RegistrationSaveView = {
    saveid: number;
    regid: number;
    familyid: number;
    studentid: number;
    studentname: string;
    classname: string;
    season: string;
    status: string;
    regdate: string;
    deletedon: string;
    deletedby: string;
};

export type BalanceSaveView = {
    saveid: number;
    balanceid: number;
    familyid: number;
    season: string;
    type: string;
    amount: number;
    checkno: string;
    regdate: string;
    paiddate: string;
    notes: string;
    deletedon: string;
    deletedby: string;
};

function RestoreCell({
    saveid,
    label,
    originalId,
    onConfirm,
}: {
    saveid: number;
    label: string;
    originalId: number;
    onConfirm: (saveid: number) => Promise<void>;
}) {
    return (
        <ConfirmActionCell
            id={saveid}
            icon={<Undo2 className="h-4 w-4" />}
            buttonClassName="text-green-600 hover:text-green-800"
            ariaLabel={`Restore ${label} ${originalId}`}
            title="Confirm Restore / 确认恢复"
            description={
                <>
                    Restore {label} #{originalId} to its original table? / 确定将 {label} #
                    {originalId} 恢复到原表？
                    <br />
                    The record is removed from the recycle bin afterwards.
                </>
            }
            confirmLabel="Restore"
            pendingLabel="Restoring..."
            onConfirm={onConfirm}
        />
    );
}

function PurgeCell({
    saveid,
    label,
    originalId,
    onConfirm,
}: {
    saveid: number;
    label: string;
    originalId: number;
    onConfirm: (saveid: number) => Promise<void>;
}) {
    return (
        <ConfirmActionCell
            id={saveid}
            icon={<XIcon className="h-4 w-4" />}
            buttonClassName="text-red-600 hover:text-red-800"
            ariaLabel={`Permanently delete ${label} ${originalId}`}
            title="Permanently Delete / 永久删除"
            description={
                <>
                    Permanently delete {label} #{originalId} from the recycle bin? / 确定永久删除{" "}
                    {label} #{originalId}？
                    <br />
                    <span className="font-semibold text-red-600">
                        This cannot be undone. / 此操作无法撤销。
                    </span>
                </>
            }
            confirmLabel="Delete Forever"
            pendingLabel="Deleting..."
            onConfirm={onConfirm}
        />
    );
}

const FamilyLink = ({ familyid }: { familyid: number }) => (
    <Link href={`/admin/management/${familyid}`} className="text-green-600 hover:underline">
        {familyid}
    </Link>
);

const registrationColumns: ColumnDef<RegistrationSaveView>[] = [
    {
        id: "restore",
        header: "Restore",
        enableSorting: false,
        cell: ({ row }) => (
            <RestoreCell
                saveid={row.original.saveid}
                label="registration"
                originalId={row.original.regid}
                onConfirm={restoreRegistration}
            />
        ),
    },
    {
        id: "purge",
        header: "Delete",
        enableSorting: false,
        cell: ({ row }) => (
            <PurgeCell
                saveid={row.original.saveid}
                label="registration"
                originalId={row.original.regid}
                onConfirm={purgeRegistration}
            />
        ),
    },
    { accessorKey: "regid", header: "Reg ID" },
    {
        accessorKey: "familyid",
        header: "FID",
        cell: ({ getValue }) => <FamilyLink familyid={getValue<number>()} />,
    },
    { accessorKey: "studentname", header: "Student/学生" },
    { accessorKey: "classname", header: "Class/班级" },
    { accessorKey: "season", header: "Semester/学期" },
    { accessorKey: "status", header: "Status/状态" },
    { accessorKey: "regdate", header: "Reg Date/注册日期" },
    { accessorKey: "deletedon", header: "Deleted On/删除时间" },
    { accessorKey: "deletedby", header: "Deleted By/删除人" },
];

const balanceColumns: ColumnDef<BalanceSaveView>[] = [
    {
        id: "restore",
        header: "Restore",
        enableSorting: false,
        cell: ({ row }) => (
            <RestoreCell
                saveid={row.original.saveid}
                label="balance"
                originalId={row.original.balanceid}
                onConfirm={restoreBalance}
            />
        ),
    },
    {
        id: "purge",
        header: "Delete",
        enableSorting: false,
        cell: ({ row }) => (
            <PurgeCell
                saveid={row.original.saveid}
                label="balance"
                originalId={row.original.balanceid}
                onConfirm={purgeBalance}
            />
        ),
    },
    { accessorKey: "balanceid", header: "Balance ID" },
    {
        accessorKey: "familyid",
        header: "FID",
        cell: ({ getValue }) => <FamilyLink familyid={getValue<number>()} />,
    },
    { accessorKey: "season", header: "Semester/学期" },
    { accessorKey: "type", header: "Type/类型" },
    {
        accessorKey: "amount",
        header: "Amount/金额",
        cell: ({ getValue }) => {
            const amount = getValue<number>();
            return (
                <span className={amount < 0 ? "text-red-600" : "text-green-600"}>
                    {formatCurrency(amount)}
                </span>
            );
        },
    },
    { accessorKey: "checkno", header: "Check No" },
    { accessorKey: "regdate", header: "Reg Date/注册日期" },
    { accessorKey: "paiddate", header: "Paid Date/付款日期" },
    { accessorKey: "notes", header: "Note/备注" },
    { accessorKey: "deletedon", header: "Deleted On/删除时间" },
    { accessorKey: "deletedby", header: "Deleted By/删除人" },
];

function RecycleTable<T>({
    data,
    columns,
    emptyText,
}: {
    data: T[];
    columns: ColumnDef<T>[];
    emptyText: string;
}) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const table = useReactTable<T>({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSorting: true,
        onSortingChange: setSorting,
        state: { sorting },
        // No pagination row model here, so there is no page index to reset. Left on, the
        // row-model getters queue a resetPageIndex() that lands as a setState during
        // render (see balance-table.tsx for the full trace).
        autoResetPageIndex: false,
    });

    if (data.length === 0) {
        return <div className="text-gray-500">{emptyText}</div>;
    }
    return (
        <>
            <div className="text-muted-foreground mb-2 text-sm">{data.length} record(s)</div>
            <ClientTable table={table} />
        </>
    );
}

export default function ToolsTabs({
    registrations,
    balances,
}: {
    registrations: RegistrationSaveView[];
    balances: BalanceSaveView[];
}) {
    const triggerClass = "text-lg text-blue-100 data-[state=active]:text-green-600";
    const contentClass = cn("mt-4 rounded-md border-4 border-green-500 p-4");

    return (
        <Tabs defaultValue="registrations" className="w-full">
            <TabsList>
                <TabsTrigger value="registrations" className={triggerClass}>
                    Deleted Registrations/已删注册 ({registrations.length})
                </TabsTrigger>
                <TabsTrigger value="balances" className={triggerClass}>
                    Deleted Balances/已删缴款 ({balances.length})
                </TabsTrigger>
            </TabsList>
            <TabsContent value="registrations" className={contentClass}>
                <RecycleTable
                    data={registrations}
                    columns={registrationColumns}
                    emptyText="No deleted registrations. / 没有已删除的注册记录。"
                />
            </TabsContent>
            <TabsContent value="balances" className={contentClass}>
                <RecycleTable
                    data={balances}
                    columns={balanceColumns}
                    emptyText="No deleted balances. / 没有已删除的缴款记录。"
                />
            </TabsContent>
        </Tabs>
    );
}
