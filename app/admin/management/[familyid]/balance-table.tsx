"use client"
import { ColumnDef, SortingState, useReactTable } from "@tanstack/react-table";
import { getCoreRowModel, getSortedRowModel , getFilteredRowModel,  getFacetedUniqueValues, } from "@tanstack/react-table";
import { useState } from "react";
import { ClientTable } from "@/components/client-table";

function SelectColumnFilter({ column }: { column: any }) {
  const uniqueValues = Array.from(column.getFacetedUniqueValues().keys()); // Get unique values

  return (
    <select
      value={(column.getFilterValue() ?? '')}
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

type balanceTypes = {
    balanceid: number;
    regdate: string;
    semester: string;
    amount: number;
    check_no: string;
    paiddate: string;
}
const columns: ColumnDef<balanceTypes>[] = [
    {
        header: "Balance ID",
        accessorKey: "balanceid",
    },
    {
        header: "Registration Date",
        accessorKey: "regdate",
    },
    {
        //header: "Semester",
        accessorKey: "semester",
        header: ({ column }) => (
          <div>
            Semester<br/>
            <SelectColumnFilter column={column} />
         </div>
        ),
        filterFn: 'equalsString', // Use a built-in filter function
        //filterFn: 'uniqueValueFilterFn', // Use a built-in filter function
        enableColumnFilter: true,
        enableSorting: false, // Disable sorting for this column
   },
    
    {
        header: "Amount",
        accessorKey: "amount",
        cell: ({ getValue }) => {
            const amount = getValue() as number;
            const valStr =new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
            const style = amount < 0 ? { color: 'red' } : { color: 'green' }; // Conditional styling
            return <span style={style}>{valStr}</span>;
        }
    },
    {
        header: "Check No",
        accessorKey: "check_no",
    },
    {
        header: "Paid Date",
        accessorKey: "paiddate",
        cell: ({ getValue }) => {
            const paiddate = getValue() as string;
            if (paiddate === "1900-01-01 00:00:00") return "N/A";
            return paiddate ? new Date(paiddate).toLocaleDateString() : "N/A";
        }
    }
];

type balanceTableProps = {
    balanceData: balanceTypes[];
}


export default function BalanceTable({ balanceData }: balanceTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const table = useReactTable<balanceTypes>({
        data: balanceData,
        columns: columns, 
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        
        enableSorting: true,
        onSortingChange: setSorting,
        enableColumnFilters: true,
        getFacetedUniqueValues: getFacetedUniqueValues(), // Enable faceting
        getFilteredRowModel: getFilteredRowModel(),
        state: { sorting }
    });
    return (
        <ClientTable table={table} />
    )
}