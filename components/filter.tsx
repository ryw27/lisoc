"use client";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { FilterIcon, PlusIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { ColumnMetaFilter } from "@/app/admintest/components/columns/column-types";
import FilterBox from "./filter-box";


//Type is the columns available to filter by, and how to filter them
export type FilterableColumn<TData> =
  ColumnDef<TData, unknown>   // TanStack's generic column
  & { id: string           // force this to exist
      meta?: ColumnMetaFilter,
      accessorKey?: string
}

export type filterEntry = { id: string, col_id: string, mode?: string, val?:string}


//GOAL: Filter data based on column and specifications, then push as search params to force a re-render
//DONT FILTER HERE, FILTER IN THE MAIN PAGE, JUST PUSH THE FILTERS TO THE URL
export default function Filter<TData>({ columns }: { columns: FilterableColumn<TData>[] }) {
    // Ensure every column has a stable id (fall back to accessorKey)
    const normalizedColumns: FilterableColumn<TData>[] = columns.map((c, idx) => {
        if (c.id && c.id.length > 0) return c;
        if (c.accessorKey && typeof c.accessorKey === 'string') {
            console.log(c);
            return { ...c, id: c.accessorKey } as FilterableColumn<TData>;
        }
        // final fallback – generate predictable id
        return { ...c, id: `col_${idx}` } as FilterableColumn<TData>;
    });

    const [isOpen, setIsOpen] = useState(false);

    const searchParams = useSearchParams(); //where the real filtering happens
    const router = useRouter(); //set paths
    const pathname = usePathname(); //to set back to original path when cleared
    

    //this represents the DRAFTED filters - the real filters are in the searchParams
    //You want each draft to carry which column is being filtered, what the mode of the filter is, what the value of the filter is,
    //and the other possible options for the filter
    //mode = ['[gte]', '[lte]', '[gt]', '[lt]', '=']
    //val = ['some number', 'some Date object to string', 'false', 'true', 'user value']
    const ALL_MODES = ["[gte]", "[lte]", "[gt]", "[lt]"];

    const [drafts, setDrafts] = useState<filterEntry[]>(() => {
        const objects: filterEntry[] = [];
        searchParams.forEach((filtervalue: string, column: string) => {
            //check which column this is 
            const filteredColumn = normalizedColumns.find(col => col.id === column);
            if (!filteredColumn) throw new Error(`Column ${column} not found`);

            //get the val and mode
            const { curMode, curVal } = (() => {
                for (const mode of ALL_MODES) {
                    if (column.endsWith(mode)) {
                        return {curMode: mode, curVal: filtervalue}
                    }
                }
                //if it's none of the ALL_MODES, it's = (you don't have access to this in searchParams)
                return {curMode: "=", curVal: filtervalue} 
            })();
            
            objects.push({
                id: crypto.randomUUID(),
                col_id: column,
                mode: curMode,
                val: curVal 
            });
        });
        return objects;
    });

    //satisfy all filters or at least one of them: any or all?
    const [selectedOption, setSelectedOption] = useState("all");

    

    //handling adding filter to drafts - just to drafts, possibly to be applied.
    const handleAddFilter = ({ id, col_id, mode, val }: filterEntry) => {
        const column = normalizedColumns.find(col => col.id === col_id);
        if (!column) throw new Error("Column names are wrong"); //skip if column not found
        
        setDrafts(prev => {
            //check if filter with same properties already exists
            const exists = prev.some(entry => 
                entry.col_id === col_id && 
                entry.val === val && 
                entry.mode === mode
            );
            if (exists) return prev;
            //no duplicates
            return [...prev, { id, col_id, mode, val }];
        });
    }


    //apply filters when you're done choosing
    const handleApply = () => {
        const newParams = new URLSearchParams(); //clear the filters

        // helper to convert user-friendly mode to URL suffix
        const modeToSuffix = (mode?: string, val?: string) => {
            // Handle date modes
            if (mode?.startsWith('in the last')) {
                const [amount, unit] = val?.split(' ') || [];
                const date = new Date();
                switch(unit) {
                    case 'hours': date.setHours(date.getHours() - parseInt(amount)); break;
                    case 'days': date.setDate(date.getDate() - parseInt(amount)); break;
                    case 'months': date.setMonth(date.getMonth() - parseInt(amount)); break;
                    case 'years': date.setFullYear(date.getFullYear() - parseInt(amount)); break;
                }
                return { suffix: '[gte]', value: date.toISOString().split('T')[0] };
            }
            
            if (mode === 'is between') {
                const [start, end] = val?.split(' ') || [];
                return { 
                    suffix: '[gte]', 
                    value: start,
                    additional: { suffix: '[lte]', value: end }
                };
            }

            if (mode === 'is on or after') {
                return { suffix: '[gte]', value: val };
            }

            if (mode === 'is before or on') {
                return { suffix: '[lte]', value: val };
            }

            // Handle non-date modes
            const map: Record<string, string> = {
                'is greater than': '[gt]',
                'is less than': '[lt]',
                'is greater than or equal to': '[gte]',
                'is less than or equal to': '[lte]',
            };
            
            if (!mode || mode === 'is equal to' || mode === 'is') {
                return { suffix: '', value: val };
            }
            
            return { suffix: map[mode] || '', value: val };
        };

        drafts.forEach(filter => {
            if (!filter.val) return; // skip incomplete filters
            
            const result = modeToSuffix(filter.mode, filter.val);
            const key = result.suffix ? `${filter.col_id}${result.suffix}` : filter.col_id;
            newParams.set(key, result.value || '');

            // Handle additional parameter for 'is between'
            if (result.additional) {
                const additionalKey = `${filter.col_id}${result.additional.suffix}`;
                newParams.set(additionalKey, result.additional.value);
            }
        });
 
        //delete page to avoid confusion - i.e. if filter compresses rows and the page is empty - thus need to go to page 1
        newParams.delete('page'); 
        router.replace('?' + newParams.toString());
    }

    //key here should be the column id, while val should be the value of the filter you are trying to remove
    //this deletes individual filters
    const handleFilterDeletion = ({ id, col_id, mode, val }: filterEntry) => {
        setDrafts(prev => (
            prev.filter(entry => !(entry.id === id || 
                (entry.col_id === col_id && entry.val === val && entry.mode === mode)))
        )); 
        
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete(col_id, val);
        newParams.delete('page');
        router.replace('?' + newParams.toString());
    }

    //clear all filters
    const handleClearAll = () => {
        router.replace(pathname);
        setDrafts([]);
    }

    return (
        <div className="relative z-10">
            <button 
                className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md px-2 py-1 hover:bg-blue-600 hover:text-white transition-colors duration-200 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            > <FilterIcon className="w-4 h-4" /> Filters
            </button>
            {isOpen && (
                <div className="absolute left-0 mt-2 rounded-md border border-gray-300 bg-white p-4 shadow-lg w-max">
                    <div className="absolute -top-2 left-4 w-3 h-3 bg-white rotate-45 border-l border-gray-200"></div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-500"> Show rows that match </p>
                        <DropdownMenu>
                            <DropdownMenuTrigger className={cn(
                                "inline-flex items-center pl-1",
                                "text-sm font-medium text-blue-600 hover:text-blue-700",
                                "bg-white ",
                            )}>
                                {selectedOption}
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-32 p-1">
                                <DropdownMenuRadioGroup>
                                    <DropdownMenuRadioItem 
                                        value="all" 
                                        className="text-sm px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                                        onClick={() => setSelectedOption("all")}
                                    >
                                        All
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem 
                                        value="any" 
                                        className="text-sm px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                                        onClick={() => setSelectedOption("any")}
                                    >
                                        Any
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <p className="text-sm font-medium text-gray-500">of these conditions:</p>
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                        {drafts.map((filter, index) => (
                            <FilterBox 
                                key={filter.id}
                                entry={filter}
                                columns={normalizedColumns}
                                onChange={(col_id, mode, val) =>
                                    setDrafts(prev => prev.map(d => d.id === filter.id ? { ...d, col_id, mode, val } : d))
                                } 
                                onDelete={() => handleFilterDeletion(filter)} 
                            />
                        ))}
                        <div className="flex justify-between items-center">
                            <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start cursor-pointer" onClick={() => {
                                const firstColumnId = normalizedColumns[0].id as string;
                                handleAddFilter({
                                    id: crypto.randomUUID(),
                                    col_id: firstColumnId,
                                    val: '',
                                    mode: '='
                                });
                            }}>
                                <PlusIcon className="w-4 h-4" /> Add Filter
                            </button>
                            <div className="flex items-center gap-2 mr-13">
                                <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start cursor-pointer" onClick={handleApply}>
                                    Apply
                                </button>
                                <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start cursor-pointer" onClick={handleClearAll}>
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>


                </div>
            )}
        </div>
    )
}