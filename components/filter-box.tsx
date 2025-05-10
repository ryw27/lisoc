"use client";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { ChevronDown, XIcon } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { ColumnMetaFilter } from "@/app/admintest/components/columns/column-types";

//type definition that matches how columns are structured
type FilterBoxProps<TData> = {
    column_id: string;
    value: string;
    columns: (ColumnDef<TData> & { 
        meta?: ColumnMetaFilter,
        accessorKey?: string 
    })[] //For dropdown, contains all columns to display and how to filter them, which allows you to disply mode + value dropdown/inputs
    onChange: (col_id: string, mode: string, val: string) => void;
    onDelete: () => void;
}

//filter dropdowns in the filter box
export default function FilterBox<TData>({ column_id, value, columns, onChange, onDelete }: FilterBoxProps<TData>) {
    const [selectedColumn, setSelectedColumn] = useState<string>(column_id); //once this is set, you can set mode + value
    const [selectedMode, setSelectedMode] = useState<string | null>(null); //once this is set, you can set value, conditional rendering
    const [selectedValue, setSelectedValue] = useState<string | null>(null); 


    useEffect(() => {

    }, [selectedValue])

    const getColumn = () => {
        return selectedColumn || "Select Column";
    } 

    const getMode = () => {
        return selectedMode || "Select Modes";
    }

    const getValue = () => {
        return selectedValue || "Enter Value"
    }

    const getModes = () => {
        const column = columns.find(col => col.id === column_id);
        if (!column?.meta?.filter) return [];
        if (!selectedMode) return [];
        return column.meta.filter.mode;
    }

    const getFilterType = () => {
        const column = columns.find(col => col.id === column_id);
        if (!column?.meta?.filter) return '';
        if (!selectedMode) return '';
        return column.meta.filter.type;
    }

    const getOptions = () => {
        const column = columns.find(col => col.id === column_id);
        if (!column?.meta?.filter) return [];
        if (!selectedMode) return [];
        if ('options' in column.meta.filter) {
            return column.meta.filter.options;
        }
        return [];
    }


    return (
        <div className="flex items-center">
            <div className="flex items-center border border-gray-300 rounded-md text-sm shadow-sm">
                <DropdownMenu>
                    <DropdownMenuTrigger className={cn(
                        "px-4 py-2 border-r border-gray-300 min-w-[180px]",
                        "text-gray-700 font-medium",
                        "hover:bg-gray-50 focus:outline-none",
                        "flex items-center justify-between cursor-pointer"
                    )}>
                        <span>{getColumn()}</span>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 p-1">
                        {columns.map((column, index) =>( 
                            <div
                                key={index}
                                className="px-2 py-1 text-sm hover:bg-gray-100 rounded-md"
                                onClick={() => {
                                    console.log(column);
                                    // Use accessorKey as the ID if available
                                    const columnId = column.accessorKey as string || column.id;
                                    if (!columnId) throw new Error("Wrong column");
                                    setSelectedColumn(columnId);
                                    setSelectedMode(null);
                                    setSelectedValue(null);
                                }}
                            >
                                {typeof column.header === 'string' ? column.header : 'Column'}
                            </div>
                        ))} 
                    </DropdownMenuContent>
                </DropdownMenu> 
                <DropdownMenu>
                    <DropdownMenuTrigger className={cn(
                        "px-4 py-2 border-r border-gray-300 min-w-[180px]",
                        "text-gray-700 font-medium",
                        "hover:bg-gray-50 focus:outline-none",
                        "flex items-center justify-between cursor-pointer"
                    )}>
                        <span>{getMode()}</span>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 p-1">
                        {getModes().map((filterMode, index) =>( 
                            <div
                                key={index}
                                className="px-2 py-1 text-sm hover:bg-gray-100 rounded-md"
                                onClick={() => {
                                    setSelectedMode(filterMode);
                                    setSelectedValue(null);
                                }}
                            >
                                {filterMode}
                                {/* {typeof column.header === 'string' ? column.header : 'Column'} */}
                            </div>
                        ))}  
                    </DropdownMenuContent>
                </DropdownMenu> 
                {getFilterType() === 'enum' ? (
                    <DropdownMenu>
                    <DropdownMenuTrigger className={cn(
                        "px-4 py-2 min-w-[280px]",
                        "text-gray-700 font-medium",
                        "hover:bg-gray-50 focus:outline-none",
                        "flex items-center justify-between cursor-pointer"
                    )}>
                        <span>{selectedValue || "Enter value"}</span>
                        <ChevronDown className="w-4 h-4 text-gray-500 self-end" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 p-1">
                        {getFilterType() === 'enum' ? (
                            getOptions().map((mode: string, index: number) => (
                                <div 
                                    key={index} 
                                    className="p-2 hover:bg-gray-100 cursor-pointer rounded-md" 
                                    onClick={() => {
                                        setSelectedValue(mode);
                                        onChange(selectedColumn, selectedMode as string, mode);
                                    }}
                                >
                                    {mode}
                                </div>
                            ))
                        ) : (
                            <input 
                                type="text" 
                                className="px-4 py-2 min-w-[280px] text-gray-700 font-medium hover:bg-gray-50 focus:outline-none flex items-center justify-between cursor-text" 
                                placeholder="Enter value"
                                onChange={(e) => {
                                    setSelectedValue(e.target.value);
                                    onChange(selectedColumn, selectedMode as string, e.target.value);
                                }}
                            />
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
                ) : getFilterType() === "date" ? (
                    getMode() === "in the last" ? (
                        <div className="flex items-stretch w-[280px]">
                            <input 
                                type="text" 
                                className="px-4 py-2 w-[200px] text-gray-700 font-medium hover:bg-gray-50 focus:outline-none flex items-center justify-between cursor-text border-r border-gray-300 text-sm" 
                                placeholder="Enter Value"
                                onChange={(e) => setSelectedValue(e.target.value)}
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger className="min-w-[80px] flex items-center justify-center hover:bg-gray-50 hover:text-gray-700 rounded-md focus:outline-none">
                                    <span>{selectedValue || "Select"}</span>
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="p-1">
                                    {getOptions().map((option: string, index: number) => (
                                        <div key={index} className="px-2 py-1 hover:bg-gray-100 cursor-pointer rounded-md" onClick={() => setSelectedValue(selectedValue + " " + option)}>
                                            {option}
                                        </div>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        getMode() === "is between" ? (
                        <div className="flex items-stretch w-[280px]">
                            <input 
                                type="date" 
                                className="px-2 py-2 w-[140px] text-gray-700 font-medium hover:bg-gray-50 focus:outline-none flex items-center justify-between cursor-text border-r border-gray-300 text-sm"
                            />
                            <input 
                                type="date" 
                                className="px-2 py-2 w-[140px] text-gray-700 font-medium hover:bg-gray-50 focus:outline-none flex items-center justify-between cursor-text text-sm"
                            />
                        </div>
                        ) : (
                            <input 
                                type="date" 
                                className="px-4 py-2 w-[280px] text-gray-700 font-medium hover:bg-gray-50 focus:outline-none flex items-center justify-between cursor-text text-sm" 
                                placeholder="Select date"
                            />
                        )
                    )
                ) : (
                    <input 
                        type="text" 
                        className="px-4 py-2 min-w-[280px] text-gray-700 font-medium hover:bg-gray-50 focus:outline-none flex items-center justify-between cursor-text text-sm" 
                        placeholder="Enter value"
                    />
                )}
                
            </div>
            <button className="px-4 py-2" onClick={() => onDelete()}>
                <XIcon className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-700" />
            </button>
        </div>
    )
}
