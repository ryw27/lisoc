"use client";
import ColumnSelect from "./column-select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { DownloadIcon, UploadIcon, RowsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterableColumn } from "@/lib/data-view/types";
import Filter from "@/components/data-table/filter";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Column } from '@tanstack/react-table'

type TableHeaderProps<TData> = {
    columns: Column<TData>[];
    columnDefs: FilterableColumn<TData>[]
}

export default function TableHeader<TData>({ columns, columnDefs }: TableHeaderProps<TData>) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const pageSize = Number(searchParams.get("pageSize") || 10);
    const [inputSize, setInputSize] = useState(String(pageSize));
    const [pageSizeError, setPageSizeError] = useState('');

    const pageSizeChange = () => {
        const parsed = Number(inputSize);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            // console.error("Invalid page size");
            setPageSizeError("Invalid page size");
        } else {
            const params = new URLSearchParams(searchParams.toString());
            params.set('pageSize', inputSize);
            params.delete('page');
            router.replace(`?${params.toString()}`);
        }
    }
    return (
        <div className="flex justify-between items-center gap-2 px-4 py-2">
            <div className="flex gap-2">
                {/* <button className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md px-2 py-1 hover:bg-blue-600 hover:text-white transition-colors duration-200 cursor-pointer"> <ColumnsIcon className="w-4 h-4" /> Select Columns</button> */}
                {/* <button className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md px-2 py-1 hover:bg-blue-600 hover:text-white transition-colors duration-200 cursor-pointer"> <FilterIcon className="w-4 h-4" /> Filters</button> */}
                <button className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md px-2 py-1 hover:bg-blue-600 hover:text-white transition-colors duration-200 cursor-pointer"> <UploadIcon className="w-4 h-4" /> Import</button>
                <button className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md px-2 py-1 hover:bg-blue-600 hover:text-white transition-colors duration-200 cursor-pointer"> <DownloadIcon className="w-4 h-4" /> Export</button>
                <Filter columns={columnDefs} />
            </div>
            <div className="flex gap-2">        
                <DropdownMenu onOpenChange={(open) => {
                    if (open) {
                        if (pageSize <= 0 || !Number.isInteger(pageSize)) {
                            setPageSizeError("Invalid Page Size");
                        } else {
                            setPageSizeError('');
                        }
                    }
                }}>
                    <DropdownMenuTrigger className={cn(
                        "flex items-center gap-2 text-sm",
                        "text-gray-500 bg-white border border-gray-300",
                        "rounded-md px-2 py-1",
                        "hover:bg-blue-600 hover:text-white",
                        "transition-colors duration-200 cursor-pointer"
                    )}>
                        <RowsIcon className="w-4 h-4" /> {pageSize} rows
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="p-4">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>Show</span>
                                <input 
                                    className={cn(
                                        "px-2 w-16 h-8 text-center rounded-md",
                                        "border border-gray-300",
                                        "focus:border-blue-600 focus:ring-1 focus:ring-blue-600",
                                        "outline-none"
                                    )}
                                    min="1"
                                    defaultValue={String(pageSize)}
                                    onChange={(e) => setInputSize(e.target.value)}
                                />
                                <span>rows per page</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-red-500 text-xs">{pageSizeError}</p>
                                <button onClick={() => pageSizeChange()} className={cn(
                                    "self-end text-sm text-white",
                                    "bg-blue-600 hover:bg-blue-700",
                                    "rounded-md px-3 py-1.5",
                                    "transition-colors duration-200 cursor-pointer"
                                )}>
                                    Apply
                                </button>
                                
                            </div>
                           
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
                <ColumnSelect columns={columns}/>
                {/* <button className="flex items-center gap-2 text-sm text-white bg-blue-600 font-medium px-2 py-1 rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer"> <PlusIcon className="w-4 h-4" /> Add Class</button> */}
            </div>
        </div>
    )
}