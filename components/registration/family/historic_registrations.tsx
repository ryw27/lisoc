"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    Column,
    ColumnDef,
    getCoreRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
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
import {
    REGSTATUS_DROPOUT,
    REGSTATUS_DROPOUT_SPRING,
    REGSTATUS_REGISTERED,
    REGSTATUS_SUBMITTED,
    REGSTATUS_TRANSFERRED,
} from "@/lib/utils";
import { ClientTable } from "@/components/client-table";

type regClassFormProps = {
    registrations: {
        arrinfo: InferSelectModel<typeof arrangement>;
        arrSeason: InferSelectModel<typeof seasons>;
        registration: InferSelectModel<typeof classregistration>;
        regclass: InferSelectModel<typeof classes>;
        teacher: Partial<InferSelectModel<typeof teacher>>;
        price: number;
    }[];
    // family: InferSelectModel<typeof family>;
    students: InferSelectModel<typeof student>[];
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

function SelectColumnFilter({ column }: { column: Column<historicRegRow> }): React.ReactNode {
    const uniqueValues = Array.from(column.getFacetedUniqueValues().keys()); // Get unique values

    return (
        <select
            value={(column.getFilterValue() as string) ?? ""}
            onChange={(e) => column.setFilterValue(e.target.value)}
        >
            <option value="">All</option>
            {uniqueValues.map((value) => (
                <option key={String(value)} value={String(value)}>
                    {String(value)}
                </option>
            ))}
        </select>
    );
}

const columns: ColumnDef<historicRegRow>[] = [
    {
        accessorKey: "regid",
        header: "Reg ID",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "nameen",
        header: "Name (EN)",
    },
    {
        accessorKey: "namecn",
        header: "学生姓名 (CN)",
    },
    {
        accessorKey: "regdate",
        header: "Date/注册日期",
        sortingFn: "datetime",
    },
    {
        accessorKey: "classid", // Automatically gets classnamecn, no worries
        header: "Class/班级",
    },
    {
        accessorKey: "seasonid", // Same as classid
        header: ({ column }) => (
            <div>
                Semester/学期
                <br />
                <SelectColumnFilter column={column} />
            </div>
        ),
        filterFn: "equalsString", // Use a built-in filter function
        //filterFn: 'uniqueValueFilterFn', // Use a built-in filter function
        enableColumnFilter: true,
        enableSorting: false, // Disable sorting for this column
    },
    {
        accessorKey: "teacherid", // Same as classid
        header: "Teacher/教师",
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
    },
    {
        accessorKey: "statusid",
        header: "Status/状态",
    },
];

const regMap = {
    [REGSTATUS_SUBMITTED]: "S/提交",
    [REGSTATUS_REGISTERED]: "R/注册",
    [REGSTATUS_TRANSFERRED]: "T/转课",
    [REGSTATUS_DROPOUT]: "D/退课",
    [REGSTATUS_DROPOUT_SPRING]: "DS/春季退课",
} satisfies Record<number, string>;

export default function HistoricRegistrations({ registrations, students }: regClassFormProps) {
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
                regdate: new Date(r.registration.registerdate).toISOString().split("T")[0],
                classid: r.regclass.classnamecn,
                seasonid: r.arrSeason.seasonnamecn,
                teacherid:
                    r.teacher.namecn ??
                    `${r.teacher.namefirsten ?? ""} ${r.teacher.namelasten ?? ""}`.trim(),
                statusid: regMap[r.registration.statusid as keyof typeof regMap] ?? "Unknown/未知",
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

        enableColumnFilters: true,
        getFacetedUniqueValues: getFacetedUniqueValues(), // Enable faceting
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Registration History/注册历史</h1>
                <Link
                    href="/dashboard/register"
                    className="hover: flex items-center gap-2 rounded-md bg-blue-600 bg-blue-700 px-4 py-2 text-white"
                >
                    <PlusIcon className="h-4 w-4" />
                    Add Registration
                </Link>
            </div>
            <ClientTable table={table} />
        </div>
    );
}
