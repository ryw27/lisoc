"use client";

import { ClientTable } from "@/components/client-table";
import {
    Column,
    ColumnDef,
    getCoreRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable
} from "@tanstack/react-table";
import { useRouter } from 'next/navigation';
import { useState } from "react";

export type RegistrationView = {
    studentid:number,
    familyid: number,
    regid: number,
    studentnameen: string,
    studentnamecn: string,
    gender: string,

    arrangeid: number;
    classnamecn: string;
    seasonnamecn: string;
    teachernamecn: string;
    regdate:string;
    statusnamecn: string;
    email: string | undefined;
    phone: string | undefined;

};

function SelectColumnFilter({ column }: { column: Column<RegistrationView> }): React.ReactNode {
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

const columns: ColumnDef<RegistrationView>[] = [

    {
        accessorKey: "studentid",
        header: "SID",
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: "familyid",
        header: "FID",
        sortingFn: "alphanumeric",
        cell: ({ getValue }) => {
            const router = useRouter()
            const FamId = getValue<number>()

            return (
                <div 
                    onClick={() => router.push(`/admin/management/${FamId}`)}
                    className="cursor-pointer hover:text-green-500"
                    >
                    <p className="text-green-500">{FamId}</p>
                </div>
            )
        }
    },

    {
        accessorKey: "regid",
        header: "RegID",
        sortingFn: "alphanumeric",
    },

    {
        accessorKey: "studentnameen",
        header: "Name_Eng",
    },
    {
        accessorKey: "studentnamecn",
        header: "学生姓名",
    },
/*    {
        accessorKey: "gender",
        header: "Gender",
    },*/
    {
        accessorKey: "classnamecn",
        header: ({ column }) => (
            <div>
                Courses                <br />
                <SelectColumnFilter column={column} />
            </div>
        ),
        filterFn: "equalsString", // Use a built-in filter function
        //filterFn: 'uniqueValueFilterFn', // Use a built-in filter function
        enableColumnFilter: true,

    },
/*    {
        accessorKey: "seasonnamecn", 
        header:"Semester",
        
    },*/
    {
        accessorKey: "teachernamecn", 
        header: "老师",
        cell: info => {
            const router = useRouter()

            const arrangeid  = String(Number(info.row.original.arrangeid ? info.row.original.arrangeid : 0))

            return (
                <div 
                    onClick={() =>{ arrangeid !== "0" && router.push(`/admin/management/semester/${arrangeid}`)}}
                    style = { arrangeid === "0" ? { color: "gray", cursor: "default" } : { color: "blue", cursor: "pointer" } }
                    >
                    <p className={arrangeid === "0" ? "text-gray-500" : "text-blue-500"}>
                        {info.row.original.teachernamecn}
                    </p>
                </div>
            )
        }



    },
    {
        accessorKey: "regdate",
        header: "Date",
    },

    {
        accessorKey: "statusnamecn",
        header: ({ column }) => (
            <div>
                Status                <br />
                <SelectColumnFilter column={column} />
            </div>
        ),
        filterFn: "equalsString", // Use a built-in filter function
        //filterFn: 'uniqueValueFilterFn', // Use a built-in filter function
        enableColumnFilter: true,

    },

    {
        accessorKey: "phone",
        header: "Phone",
    },

    {
        accessorKey: "email",
        header: "Email",
    },


];

export  function SemesterRegistrations({
    registrations
}: {
    registrations: RegistrationView[];
}) {
    const [sorting, setSorting] = useState<SortingState>([]);

    const table = useReactTable<RegistrationView>({
        data: registrations,
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
        getFilteredRowModel: getFilteredRowModel(), // Required for filtering
    });

    return (
        <div>
            <div className="mb-4"/>
            <ClientTable table={table} />
        </div>
    );
}
