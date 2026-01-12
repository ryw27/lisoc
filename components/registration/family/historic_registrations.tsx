"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import {
    ColumnDef,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { InferSelectModel } from "drizzle-orm";
import { PlusIcon } from "lucide-react";
import {
    arrangement,
    classes,
    classregistration,
    seasons,
    student,
    teacher,
} from "@/lib/db/schema";
import { regStatusMap } from "@/lib/utils";
import { ClientTable } from "@/components/client-table";

type regClassFormProps = {
    fetchedRegistrations: Promise<
        {
            arrinfo: InferSelectModel<typeof arrangement>;
            arrSeason: InferSelectModel<typeof seasons>;
            registration: InferSelectModel<typeof classregistration>;
            regclass: InferSelectModel<typeof classes>;
            teacher: Partial<InferSelectModel<typeof teacher>>;
            price: number;
        }[]
    >;
    // family: InferSelectModel<typeof family>;
    fetchedStudents: Promise<InferSelectModel<typeof student>[]>;
};

type historicRegRow = {
    regid: number;
    nameen: string;
    namecn: string;
    regdate: string;
    classid: string;
    teacherid: string;
    statusid: string;
};

const columns: ColumnDef<historicRegRow>[] = [
    {
        accessorKey: "regid",
        header: "Registration ID",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "nameen",
        header: "Student Name (EN)",
    },
    {
        accessorKey: "namecn",
        header: "学生姓名 (CN)",
    },
    {
        accessorKey: "regdate",
        header: "Registration Date",
        sortingFn: "datetime",
    },
    {
        accessorKey: "classid", // Automatically gets classnamecn, no worries
        header: "Class",
    },
    {
        accessorKey: "seasonid", // Same as classid
        header: "Season",
    },
    {
        accessorKey: "teacherid", // Same as classid
        header: "Teacher",
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
    },
    {
        accessorKey: "statusid",
        header: "Status",
    },
];

export default function HistoricRegistrations({
    fetchedRegistrations,
    fetchedStudents,
}: regClassFormProps) {
    const registrations = use(fetchedRegistrations);
    const students = use(fetchedStudents);

    const [sorting, setSorting] = useState<SortingState>([]);

    // Memoize the processed data to avoid unnecessary recalculations
    const tableData = useMemo(() => {
        // Build a map for fast student lookup
        const studentMap = students.reduce<Record<number, (typeof students)[number]>>((acc, s) => {
            acc[s.studentid] = s;
            return acc;
        }, {});

        return registrations.map((r) => {
            const regStudent = studentMap[r.registration.studentid];
            return {
                regid: r.registration.regid,
                nameen: `${regStudent?.namefirsten ?? ""} ${regStudent?.namelasten ?? ""}`.trim(),
                namecn: regStudent?.namecn ?? "",
                regdate: r.registration.registerdate,
                classid: r.regclass.classnamecn,
                seasonid: r.arrSeason.seasonnamecn,
                teacherid:
                    r.teacher.namecn ??
                    `${r.teacher.namefirsten ?? ""} ${r.teacher.namelasten ?? ""}`.trim(),
                statusid: regStatusMap[r.registration.statusid as keyof typeof regStatusMap],
            };
        });
    }, [registrations, students]);

    const table = useReactTable<historicRegRow>({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSorting: true,
        onSortingChange: setSorting,
        state: {
            sorting,
        },
    });

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Registration History</h1>
                <Link
                    href="/dashboard/register"
                    className="bg-primary hover:bg-primary/80 flex items-center gap-2 rounded-md px-4 py-2 text-white transition-colors duration-300"
                >
                    <PlusIcon className="h-4 w-4" />
                    Add Registration
                </Link>
            </div>
            <ClientTable table={table} />
        </div>
    );
}
