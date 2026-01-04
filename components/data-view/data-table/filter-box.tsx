import { ChevronDown, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { type FilterableColumn } from "@/types/dataview.types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { filterEntry, filterMode } from "./filter";

// Type definition that matches how columns are structured
interface FilterBoxProps<TData> {
    entry: filterEntry;
    columns: FilterableColumn<TData>[]; //For dropdown, contains all columns to display and how to filter them, which allows you to disply mode + value dropdown/inputs
    dateExists: boolean;
    onChange: (payload: Partial<Omit<filterEntry, "id">>) => void;
    onDelete: () => void;
}

// Validate the entry
const validateEntry = (entry: filterEntry, type: string | undefined) => {
    if (type === "enum") {
        return !entry.val || !entry.mode;
    }
    return !entry.val;
};
// Filter dropdowns in the filter box
// All rerendering will be handled by filter panel parent component
export default function FilterBox<TData>({
    entry,
    columns,
    dateExists,
    onChange,
    onDelete,
}: FilterBoxProps<TData>) {
    const column = columns.find((col) => col.id === entry.col_id) ?? columns[0];
    const filterMeta = column.meta?.filter;
    const modes = filterMeta?.mode || [];
    const isEnum = filterMeta?.type === "enum";
    const isDate = filterMeta?.type === "date";

    const error = validateEntry(entry, filterMeta?.type);

    const set = (patch: Partial<Omit<filterEntry, "id">>) => onChange(patch);

    const valueUI = () => {
        if (isEnum) {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className={cn(
                            "min-w-[280px] px-4 py-2",
                            "text-gray-700 hover:bg-gray-50 focus:outline-none",
                            "flex cursor-pointer items-center justify-between"
                        )}
                    >
                        <span>{entry.val || "Select value"}</span>
                        <ChevronDown className="h-4 w-4 self-end text-gray-500" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 p-1">
                        {(filterMeta && "options" in filterMeta ? filterMeta.options : []).map(
                            (option: string) => (
                                <button
                                    key={option}
                                    type="button"
                                    className="block w-full rounded-md px-2 py-1 text-left text-sm hover:bg-gray-100"
                                    onClick={() => {
                                        set({ val: option });
                                    }}
                                >
                                    {option}
                                </button>
                            )
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }

        if (entry.mode === "between") {
            return (
                <div className="flex w-[280px] items-stretch">
                    <input
                        type={isDate ? "date" : "text"}
                        className="flex w-full cursor-text items-center gap-2 border-r border-gray-300 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none"
                        placeholder="Select date"
                        value={entry.val}
                        onChange={(e) => {
                            set({ val: e.target.value });
                        }}
                    />
                    <input
                        type={isDate ? "date" : "text"}
                        className="flex w-full cursor-text items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none"
                        placeholder="Select date"
                        value={entry.aux}
                        onChange={(e) => {
                            set({ aux: e.target.value });
                        }}
                    />
                </div>
            );
        }

        if (isDate && entry.mode === "in the last") {
            return (
                <div className="flex w-[280px] items-stretch">
                    <input
                        type="text"
                        className="flex w-[200px] cursor-text items-center justify-between border-r border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                        placeholder="Enter Value"
                        onChange={(e) => {
                            set({ val: e.target.value });
                        }}
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            className={cn(
                                "flex min-w-[80px] items-center justify-center rounded-md hover:bg-gray-50 hover:text-gray-700 focus:outline-none",
                                "flex w-[140px] cursor-text items-center justify-between px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                            )}
                        >
                            <span>{entry.aux || "Select"}</span>
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="p-1">
                            {(filterMeta && "options" in filterMeta ? filterMeta.options : []).map(
                                (option: string, index: number) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className="block w-full rounded-md px-2 py-1 text-left text-sm hover:bg-gray-100"
                                        onClick={() => {
                                            set({ aux: option });
                                        }}
                                    >
                                        {option}
                                    </button>
                                )
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        }

        if (isDate) {
            return (
                <input
                    type="date"
                    className="flex min-w-[280px] cursor-text items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
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
                className="flex min-w-[280px] cursor-text items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                placeholder="Enter value"
                onChange={(e) => {
                    set({ val: e.target.value });
                }}
            />
        );
    };
    return (
        <div className="flex items-center">
            <div className="flex items-center rounded-md border border-gray-300 text-sm shadow-sm">
                {/* Column dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className={cn(
                            "min-w-[180px] border-r border-gray-300 px-4 py-2",
                            "font-medium text-gray-700",
                            "hover:bg-gray-50",
                            "flex cursor-pointer items-center justify-between"
                        )}
                    >
                        <span>{column?.meta?.label || "Select Column"}</span>
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 p-1">
                        {columns.map((column) => {
                            const disabled = dateExists && column.meta?.filter?.type === "date";
                            return (
                                <button
                                    key={column.id as string}
                                    className={cn(
                                        "block w-full rounded-md px-2 py-1 text-left text-sm",
                                        disabled
                                            ? "cursor-not-allowed opacity-50"
                                            : "hover:bg-gray-100"
                                    )}
                                    disabled={disabled}
                                    onClick={() => {
                                        set({ col_id: column.id, mode: "=", val: "", aux: "" });
                                    }}
                                >
                                    {column?.meta?.label || "Select Column"}
                                </button>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
                {/* Mode dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className={cn(
                            "min-w-[180px] border-r border-gray-300 px-4 py-2",
                            "font-medium text-gray-700",
                            "hover:bg-gray-50 focus:outline-none",
                            "flex cursor-pointer items-center justify-between"
                        )}
                    >
                        <span>{entry.mode}</span>
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 p-1">
                        {modes.map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                className="block w-full rounded-md px-2 py-1 text-left text-sm hover:bg-gray-100"
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
                <XIcon className="h-5 w-5 cursor-pointer text-red-500 hover:text-red-700" />
            </button>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
