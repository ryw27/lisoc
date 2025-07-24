import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { ChevronDown, XIcon } from "lucide-react";
import { FilterableColumn } from "@/app/lib/column-types";
import { filterEntry, filterMode } from "./filter";

// Type definition that matches how columns are structured
interface FilterBoxProps<TData> {
    entry: filterEntry;
    columns: FilterableColumn<TData>[] //For dropdown, contains all columns to display and how to filter them, which allows you to disply mode + value dropdown/inputs
    dateExists: boolean;
    onChange: (payload: Partial<Omit<filterEntry, 'id'>>) => void;
    onDelete: () => void;
}

// Validate the entry
const validateEntry = (entry: filterEntry, type: string | undefined) => {
    if (type === 'enum') {
        return !entry.val || !entry.mode;
    }
    return !entry.val;
}
// Filter dropdowns in the filter box
// All rerendering will be handled by filter panel parent component
export default function FilterBox<TData>({ entry, columns, dateExists, onChange, onDelete }: FilterBoxProps<TData>) {
    const column = columns.find((col) => col.id === entry.col_id) ?? columns[0];
    const filterMeta = column.meta?.filter;
    const modes = filterMeta?.mode || [];
    const isEnum = filterMeta?.type === 'enum';
    const isDate = filterMeta?.type === 'date';
    
    const error = validateEntry(entry, filterMeta?.type);

    const set = (patch: Partial<Omit<filterEntry, 'id'>>) => onChange(patch);


    const valueUI = () => {
        if (isEnum) {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger className={cn(
                        "px-4 py-2 min-w-[280px]",
                        "text-gray-700 hover:bg-gray-50 focus:outline-none",
                        "flex items-center justify-between cursor-pointer"
                        )}>
                            <span>{entry.val || "Select value"}</span>
                            <ChevronDown className="w-4 h-4 text-gray-500 self-end" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 p-1">
                        {(filterMeta && 'options' in filterMeta ? filterMeta.options : []).map((option: string) => (
                            <button
                                key={option} 
                                type="button"
                                className="block w-full rounded-md px-2 py-1 text-sm text-left hover:bg-gray-100" 
                                onClick={() => {
                                    set({ val: option });
                                }}
                            >
                                {option}
                            </button>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }

        if (entry.mode === 'between') {
            return (
                <div className="flex items-stretch w-[280px]">
                    <input 
                        type={isDate ? "date" : "text"} 
                        className="px-2 py-2 w-full text-gray-700 hover:bg-gray-50 focus:outline-none flex items-center cursor-text text-sm gap-2 border-r border-gray-300"
                        placeholder="Select date"
                        value={entry.val}
                        onChange={(e) => {
                            set({ val: e.target.value });
                        }} 
                    />
                    <input 
                        type={isDate ? "date" : "text"} 
                        className="px-2 py-2 w-full text-gray-700 hover:bg-gray-50 focus:outline-none flex items-center cursor-text text-sm gap-2"
                        placeholder="Select date"
                        value={entry.aux}
                        onChange={(e) => {
                            set({ aux: e.target.value });   
                        }}
                    />
                </div>
            );
        }

        if (isDate && entry.mode === 'in the last') {
            return (
                <div className="flex items-stretch w-[280px]">
                    <input 
                        type="text" 
                        className="px-4 py-2 w-[200px] text-gray-700 font-medium hover:bg-gray-50 focus:outline-none flex items-center justify-between cursor-text border-r border-gray-300 text-sm" 
                        placeholder="Enter Value"
                        onChange={(e) => {
                            set({ val: e.target.value });
                        }}
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger className={cn(
                            "min-w-[80px] flex items-center justify-center hover:bg-gray-50 hover:text-gray-700 rounded-md focus:outline-none",
                            "px-2 py-2 w-[140px] text-gray-700 font-medium hover:bg-gray-50 focus:outline-none flex items-center justify-between cursor-text text-sm"
                        )}>
                            <span>{entry.aux || "Select"}</span>
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="p-1">
                            {(filterMeta && 'options' in filterMeta ? filterMeta.options : []).map((option: string, index: number) => (
                                <button
                                    key={index}
                                    type="button"
                                    className="block w-full rounded-md px-2 py-1 text-sm text-left hover:bg-gray-100"
                                    onClick={() => {
                                        set({ aux: option });
                                    }}
                                >
                                    {option}
                                </button>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        }

        if (isDate) {
            return (
                <input 
                    type="date" 
                    className="px-4 py-2 min-w-[280px] text-gray-700 font-medium hover:bg-gray-50 focus:outline-none flex items-center justify-between cursor-text text-sm" 
                    placeholder="Enter value"
                    onChange={(e) => {
                        set({ val: e.target.value });
                    }}
                />
            );
        }

        return (
            <input 
                type="text" 
                className="px-4 py-2 min-w-[280px] text-gray-700 font-medium hover:bg-gray-50 focus:outline-none flex items-center justify-between cursor-text text-sm" 
                placeholder="Enter value"
                onChange={(e) => {
                    set({ val: e.target.value });
                }}
            />
        );
    }
    return (
        <div className="flex items-center">
            <div className="flex items-center border border-gray-300 rounded-md text-sm shadow-sm">
                {/* Column dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger className={cn(
                        "px-4 py-2 border-r border-gray-300 min-w-[180px]",
                        "text-gray-700 font-medium",
                        "hover:bg-gray-50",
                        "flex items-center justify-between cursor-pointer"
                    )}>
                        <span>{column?.header as string || "Select Column"}</span>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 p-1">
                        {columns.map((column) => {
                            const disabled = dateExists && column.meta?.filter?.type === "date";
                            return (
                                <button
                                    key={column.id as string}
                                    className={cn(
                                        "block w-full text-left px-2 py-1 text-sm rounded-md",
                                        disabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-100"
                                    )}
                                    disabled={disabled}
                                    onClick={() => {
                                        set({ col_id: column.id, mode: "=", val: "", aux: "" });
                                    }}
                                >
                                    {column?.header as string}
                                </button>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu> 
                {/* Mode dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger className={cn(
                        "px-4 py-2 border-r border-gray-300 min-w-[180px]",
                        "text-gray-700 font-medium",
                        "hover:bg-gray-50 focus:outline-none",
                        "flex items-center justify-between cursor-pointer"
                    )}>
                        <span>{entry.mode}</span>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 p-1">
                        {modes.map((mode) =>( 
                            <button
                                key={mode}
                                type="button"
                                className="block w-full rounded-md px-2 py-1 text-sm text-left hover:bg-gray-100"
                                onClick={() => {
                                    set({ mode: mode as filterMode, val: "", aux: "" });
                                }}
                            >
                                {mode}
                            </button>
                        ))}  
                    </DropdownMenuContent>
                </DropdownMenu> 
                {/* Value dropdown */}
                {valueUI()}
            </div>
            <button className="px-4 py-2" onClick={() => onDelete()}>
                <XIcon className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-700" />
            </button>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    )
}
