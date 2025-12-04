"use client"
import { useMemo } from 'react';
import { ColumnDef, SortingState, useReactTable, Row } from "@tanstack/react-table";
import { getCoreRowModel, getSortedRowModel , getFilteredRowModel,  getFacetedUniqueValues, } from "@tanstack/react-table";
import { useState } from "react";
import { ClientTable } from "@/components/client-table";
import { cn  } from "@/lib/utils";
import { 
    XIcon,
} from "lucide-react";

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
import { removeBalance } from "@/lib/payments/actions/adminApplyCheck";
import { mkConfig, generateCsv, download } from 'export-to-csv'

const csvConfig = mkConfig({
  fieldSeparator: ',',
  filename: 'lisoc_'+Date.now().toString(), // export file name (without .csv)
  decimalSeparator: '.',
  useKeysAsHeaders: true,
})

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
    note: string;
}

// export function
// Note: change _ in Row<_>[] with your Typescript type.
const exportExcel = (rows: Row<balanceTypes>[]) => {
  const rowData = rows.map((row) => row.original)
  const csv = generateCsv(csvConfig)(rowData)
  download(csvConfig)(csv)
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
    },
    {
        header: "Note",
        accessorKey: "note",
    }

];

type balanceTableProps = {
    balanceData: balanceTypes[];
}

const deleteColumn: ColumnDef<balanceTypes>[] = [
{
  id: "delete",
  cell: ({ row }) => {
    const balanceid = row.original.balanceid;
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const onDelete = () => {
        
        console.log(balanceid) ; //   handleDelete(reg_id, studentid);
        setShowConfirmDialog(true);
  }

  return (
      <>
        <button
          className={cn(
                        'rounded-md p-1',
                        'text-red-600 hover:text-red-800 cursor-pointer'
                )}
                    onClick={onDelete}
          >
            <XIcon className="w-4 h-4" />
          </button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Deletion </AlertDialogTitle>
                      <AlertDialogDescription>
                          Are you sure you want to delete this {balanceid} ? <br/>This action cannot be undone.
                      </AlertDialogDescription>
              </AlertDialogHeader>
              
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={async () => {
                          try {
                                console.log("Deleting balance ID: ", balanceid);
                                await removeBalance(balanceid);

                          } catch (err) {
                              const msg = err instanceof Error ? err.message : String(err);
                              console.error("Deletion failed: ", msg);
                          } finally {
                                  setShowConfirmDialog(false);
                          }
                        }}>
                      Confirm
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      </>
      );
    }
  }
]


export default function BalanceTable({ balanceData }: balanceTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const table = useReactTable<balanceTypes>({
        data: balanceData,
        columns: [...deleteColumn,...columns], 
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        
        enableSorting: true,
        onSortingChange: setSorting,
        enableColumnFilters: true,
        getFacetedUniqueValues: getFacetedUniqueValues(), // Enable faceting
        getFilteredRowModel: getFilteredRowModel(),
        state: { sorting }
    });

    // Calculate the sum of the 'amount' column
  const totalBalance = useMemo(() => {
    // Use if you want only sum filter then use tale.getFilteredRowModel().rows to sum 
    // otherwise using all rows 
     return table.getCoreRowModel().rows.reduce((total, row) => {
      const value = row.getValue('amount'); // Replace 'visits' with your accessorKey
      // Ensure value is a number before adding
      return total + (typeof value === 'number' ? value : Number(value) || 0);
    }, 0);
  }, [table.getCoreRowModel().rows.length]); // Recalculate if table state (like filtering) changes

    return (
        <>
        <div>
            <div className="flex justify-between items-center">
              <div>
              <button className="bg-blue-600 rounded-md p-2 text-white font-bold" onClick={() => exportExcel(table.getFilteredRowModel().rows)}>
                Export To Excel</button>
              </div>
              <h2 className="text-lg font-semibold">Registrations  </h2>
               
              <span style={totalBalance < 0 ? { color: 'red' } : { color: 'green' }}>
                <strong style={{ color: 'black' }}>TotalBalance : </strong> {totalBalance.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD'
                })}
              </span>
            </div>
        </div>
        <ClientTable table={table} />
        </>
    )
}