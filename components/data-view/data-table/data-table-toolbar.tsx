"use client";

import { Column } from "@tanstack/react-table";
import { DownloadIcon, UploadIcon } from "lucide-react";
import { FilterableColumn } from "@/types/dataview.types";
import AddEntityButton from "../add-entity-button";
import ColumnSelect from "./column-select";
import Filter from "./filter";

type DataTableToolbarProps<TData> = {
    columns: Column<TData>[];
    columnDefs: FilterableColumn<TData>[];
    tableName: string;
};

export default function DataTableToolbar<TData>({
    columns,
    columnDefs,
    tableName,
}: DataTableToolbarProps<TData>) {
    return (
        <div className="flex items-center justify-between gap-2 px-1 py-2">
            <div className="flex gap-2">
                {/* <button className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md px-2 py-1 hover:bg-blue-600 hover:text-white transition-colors duration-200 cursor-pointer"> <ColumnsIcon className="w-4 h-4" /> Select Columns</button> */}
                {/* <button className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md px-2 py-1 hover:bg-blue-600 hover:text-white transition-colors duration-200 cursor-pointer"> <FilterIcon className="w-4 h-4" /> Filters</button> */}
                <button className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-500 transition-colors duration-200 hover:bg-blue-600 hover:text-white">
                    {" "}
                    <UploadIcon className="h-4 w-4" /> Import
                </button>
                <button className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-500 transition-colors duration-200 hover:bg-blue-600 hover:text-white">
                    {" "}
                    <DownloadIcon className="h-4 w-4" /> Export
                </button>
                <Filter columns={columnDefs} />
            </div>
            <div className="flex gap-2">
                <ColumnSelect columns={columns} />
                <AddEntityButton tablename={tableName} />
            </div>
        </div>
    );
}
