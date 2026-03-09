"use client";

import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { teacherClassStudentView } from "@/types/shared.types";
import { ClientTable } from "@/components/client-table";

const columns: ColumnDef<teacherClassStudentView>[] = [
    {
        accessorKey: "student",
        header: "Student",
        sortingFn: "alphanumeric",
    },

    {
        accessorKey: "gender",
        header: "Gender",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "age",
        header: "Age",
        sortingFn: "alphanumeric",
    },

    {
        accessorKey: "status",
        header: "Status",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "familyid",
        header: "FamilyId",
        sortingFn: "alphanumeric",
    },

    {
        accessorKey: "father",
        header: "Father",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "mother",
        header: "Mother",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "phone",
        header: "phone",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "email",
        header: "Email",
        sortingFn: "alphanumeric",
    },
];

export default function TeacherWithClassStudent({
    allClassStudent,
}: {
    allClassStudent: teacherClassStudentView[];
}) {
    const table = useReactTable<teacherClassStudentView>({
        data: allClassStudent,
        columns: [...columns],
        getCoreRowModel: getCoreRowModel(),
        //getSortedRowModel: getSortedRowModel(),
        enableSorting: true,
    });

    return (
        <div className="p-4">
            <ClientTable table={table} />
        </div>
    );
}
