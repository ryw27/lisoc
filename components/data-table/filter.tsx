"use client";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { FilterIcon, PlusIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import FilterBox from "./filter-box";
import { FilterableColumn } from "@/lib/data-view/types";
import React, { useMemo, useReducer, useState } from 'react';
import { startOfToday, sub, formatISO, Duration, parseISO, isValid } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

// ------------------------------------------------------------
// TYPES AND HELPER FUNCTIONS 
// ------------------------------------------------------------
export type filterMode =
  | '='
  | '≠'
  | '>'
  | '>='
  | '<'
  | '<='
  | 'between'
  | 'in the last';

export interface filterEntry { 
    id: string, 
    col_id: string, 
    mode: filterMode, 
    val:string, 
    aux?: string 
}
// id - unique identifier for the filter, randomly generated UUID
// col_id - the column id of the column being filtered - found in column-types.ts
// mode - the mode of the filter - >=, <=, >, <, =, ≠
// val - the value of the filter - the value you want to filter by
// aux - the auxiliary/secondary value of the filter - used for between, in the last, etc.

const modeToSuffix = (
    mode: filterMode,
): string | undefined => {
    const map: Record<filterMode, string | undefined> = {
        '=': undefined,
        '≠': undefined, // handled by negate flag higher up the stack
        '>': '[gt]',
        '>=': '[gte]',
        '<': '[lt]',
        '<=': '[lte]',
        between: undefined, // two params generated separately
        'in the last': '[gte]' // relative, value will be computed
    } as const;

    return map[mode];
}

// Add browser-compatible UUID generation
function generateUUID() {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
}



// ---------- validation ----------
const unitOptions = ['hours', 'days', 'months', 'years'] as const;

function validateEntry(entry: filterEntry, colType: 'text' | 'enum' | 'number' | 'date'): string | null {
  // empty rows allowed (treated as draft)
  if (entry.val === '' && !entry.aux) return null;

  switch (entry.mode) {
    case 'between': {
      const { val: from, aux: to } = entry;
      if (!from || !to) return 'Both dates required';
      const start = parseISO(from);
      const end = parseISO(to);
      if (!isValid(start) || !isValid(end)) return 'Invalid date(s)';
      if (start > end) return 'Start date must precede end date';
      return null;
    }

    case 'in the last': {
      const n = Number(entry.val);
      if (!n || n <= 0) return 'Positive number required';
      if (!entry.aux || !unitOptions.includes(entry.aux as typeof unitOptions[number])) return 'Unit missing';
      return null;
    }

    default: {
      if (entry.val === '') return 'Value required';
      if (colType === 'number' && Number.isNaN(Number(entry.val))) return 'Not a number';
      if (colType === 'date' && !isValid(parseISO(entry.val))) return 'Invalid date';
      return null;
    }
  }
}


// ------------------------------------------------------------
// DRAFT REDUCER
// ------------------------------------------------------------
type draftAction =
  | { type: 'add'; col_id: string }
  | { type: 'update'; id: string; payload: Partial<Omit<filterEntry, 'id'>> }
  | { type: 'remove'; id: string }
  | { type: 'reset'; entries: filterEntry[] };

// Helper function for handling actions to draft of filters
function draftsReducer(state: filterEntry[], action: draftAction): filterEntry[] {
  switch (action.type) {
    case 'add':
      return [...state, { id: generateUUID(), col_id: action.col_id, mode: '=', val: '' }];
    case 'update':
      return state.map((e) => (e.id === action.id ? { ...e, ...action.payload } : e));
    case 'remove':
      return state.filter((e) => e.id !== action.id);
    case 'reset':
      return action.entries;
    default:
      return state;
  }
}
  
// GOAL: Filter data based on column and specifications, then push as search params to force a re-render
// DONT FILTER HERE, FILTER IN THE MAIN PAGE, JUST PUSH THE FILTERS TO THE URL
export default function Filter<TData>({ columns }: { columns: FilterableColumn<TData>[] }) {
    const router = useRouter(); // Set paths
    const searchParams = useSearchParams(); // Where the real filtering happens
    const pathname = usePathname(); // To set back to original path when cleared
    const [matchStrategy, setMatchStrategy] = useState<'all' | 'any'>('all'); // Satisfy all filters or at least one of them: any or all?
    
    // This represents the DRAFTED filters - the real filters are in the searchParams
    // You want each draft to carry which column is being filtered, what the mode of the filter is, what the value of the filter is,
    // and the other possible options for the filter
    // mode = ['[gte]', '[lte]', '[gt]', '[lt]', '=']
    // val = ['some number', 'some Date object to string', 'false', 'true', 'user value']
    const initialDrafts = useMemo<filterEntry[]>(() => {
        const result: filterEntry[] = [];
        searchParams.forEach((rawVal, rawKey) => {
            const match = rawKey.match(/^(.*?)(\[(?:gte|lte|gt|lt)\])?$/); // remove the suffixes if exists
            if (!match) console.error("No matching column found from search paramter parsing");
            let [, baseCol, suffix] = match as [string, string, string];
            if (rawVal === 'false' || rawVal === 'true') {
                const boolMatch = rawKey.split('_')[0];
                if (!boolMatch) {
                    console.error("No matching column found from boolean search parameter parsing");
                    return;
                }
                baseCol = boolMatch;
                suffix = '';
                rawVal = rawKey.split('_')[1];
            }
            // Nothing to do with filtering
            if (baseCol === 'match' || baseCol === 'page' 
                || baseCol == 'pageSize' || baseCol == 'sortBy' || baseCol == 'sortOrder') return;
            
            // Get the column
            const col = columns.find((c) => c.id === baseCol);
            if (!col) console.error("No matching column id found while parsing search paramters");
            const mode = (() => {
                switch (suffix) {
                case '[gt]':
                    return '>';
                case '[gte]':
                    return '>=';
                case '[lt]':
                    return '<';
                case '[lte]':
                    return '<=';
                default:
                    return '=';
                }
            })() as filterMode;

            result.push({ id: generateUUID(), col_id: baseCol, mode, val: rawVal });
        })
        return result;
    }, [columns, searchParams])

    const [drafts, dispatch] = useReducer(draftsReducer, initialDrafts);


    // Only have one date filter - simplifies logic
    const dateFilterPresent = useMemo(() => drafts.some((d) => columns.find((c) => c.id === d.col_id)?.meta?.filter?.type === 'date'), [drafts, columns]);

    const errors: string[] = useMemo(() => {
        return drafts.map((d) => validateEntry(d, columns.find((c) => c.id === d.col_id)?.meta?.filter?.type || 'text')).filter(Boolean) as string[];
    }, [drafts, columns]);

    // Apply filters when you're done choosing
    const handleApply = () => {
        if (errors.length > 0) return;
        const params = new URLSearchParams();

        drafts.forEach((filter) => {
            const col = columns.find((c) => c.id === filter.col_id);
            if (!col) console.error("Column id not found upon applying filters");
            if (validateEntry(filter, col?.meta?.filter?.type || 'text') !== null) return; // skip invalid filters
            if (!filter.val)   return; // skip unfinished filters


            if (filter.mode === 'in the last') {
                const amount = Number(filter.val);
                if (Number.isNaN(amount)) return ; // invalid value
                const date = sub(startOfToday(), { [filter.aux as keyof Duration ]: amount}); // subtract right now from amount
                params.set(`${filter.col_id}[gte]`, formatISO(date, { representation: 'date' }));
                return;
            }

            if (filter.mode === 'between') {
                if (filter.val) params.set(`${filter.col_id}[gte]`, filter.val);
                if (filter.aux) params.set(`${filter.col_id}[lte]`, filter.aux);
                return ;   
            } 

            if (filter.mode === '≠' && col?.meta?.filter?.type === 'number') {
                if (Number.isNaN(Number(filter.val))) return;
                params.set(`${filter.col_id}[gte]`, (Number(filter.val) + 1).toString());
                params.set(`${filter.col_id}[lte]`, (Number(filter.val) - 1).toString());
                return;
            }

            if (filter.mode === '≠' && col?.meta?.filter?.type === 'enum') {
                if (col?.meta?.filter?.options.includes(filter.val)) return;
                params.set(`${filter.col_id}_${filter.val}`, 'false');
                return;
            }

            if (filter.mode === '=' && col?.meta?.filter?.type === 'enum') {
                if (!col?.meta?.filter?.options.includes(filter.val)) return;
                params.set(`${filter.col_id}_${filter.val}`, 'true');
                return;
            }

            const key = modeToSuffix(filter.mode) ? `${filter.col_id}${modeToSuffix(filter.mode)}` : filter.col_id;
            params.set(key, filter.val);
        });

        if (params.size) params.set('match', matchStrategy);
        params.delete('page');
        router.replace(`?${params.toString()}`); 
    } 


    // Clear all filters
    const handleClear = () => {
        router.replace(pathname);
        dispatch({ type: 'reset', entries: [] });
    }

    return (
        <Popover>
            <PopoverTrigger className={cn(
                "flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md px-2 py-1",
                "hover:bg-blue-600 hover:text-white transition-colors duration-200 cursor-pointer"
            )}> 
                <FilterIcon className="w-4 h-4" /> Filters
            </PopoverTrigger>
            <PopoverContent 
                className="mt-2 rounded-md border border-gray-300 bg-white p-4 shadow-lg w-max relative" 
                align="start"
                alignOffset={0}
                side="bottom"
                sideOffset={5}
            >

                {/* Custom arrow that's properly attached to the popover */}
                <div className="absolute -top-[10px] left-[10px] h-0 w-0 border-x-8 border-x-transparent border-b-[10px] border-b-white z-30"></div>
                {/* Border for the arrow */}
                <div className="absolute -top-[11px] left-[10px] h-0 w-0 border-x-8 border-x-transparent border-b-[10px] border-b-gray-300 z-20"></div>
                <div className="overflow-y-auto max-h-[300px]">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-500"> Show rows that match </p>
                        <DropdownMenu>
                            <DropdownMenuTrigger className={cn(
                                "inline-flex items-center pl-1",
                                "text-sm font-medium text-blue-600 hover:text-blue-700",
                                "bg-white cursor-pointer ",
                            )}>
                                {matchStrategy}
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-32 p-1">
                                <DropdownMenuRadioGroup>
                                    <DropdownMenuRadioItem 
                                        value="all" 
                                        className="text-sm px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                                        onClick={() => setMatchStrategy("all")}
                                    >
                                        All
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem 
                                        value="any" 
                                        className="text-sm px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                                        onClick={() => setMatchStrategy("any")}
                                    >
                                        Any
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <p className="text-sm font-medium text-gray-500">of these conditions:</p>
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                        {drafts.map((filter) => (
                            <FilterBox 
                                key={filter.id}
                                entry={filter}
                                columns={columns}
                                dateExists={dateFilterPresent && columns.find((c) => c.id === filter.col_id)?.meta?.filter?.type !== 'date'}
                                onChange={(payload) => dispatch({ type: 'update', id: filter.id, payload })} 
                                onDelete={() => dispatch({ type: 'remove', id: filter.id })} 
                            />
                        ))}
                        {/* actions */}
                        <div className="flex justify-between items-center">
                            <button 
                                type="button"
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start cursor-pointer" 
                                onClick={() => {
                                    dispatch({ type: 'add', col_id: columns[0].id as string});
                                }}
                            >
                                <PlusIcon className="w-4 h-4" /> Add Filter
                            </button>
                            <div className="flex items-center gap-2 mr-13">
                                <button 
                                    type="button"
                                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start cursor-pointer" 
                                    disabled={errors.length > 0}
                                    onClick={handleApply}
                                >
                                    Apply
                                </button>
                                <button 
                                    type="button"
                                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start cursor-pointer" 
                                    onClick={handleClear}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                        {errors.length > 0 && <p className="mt-1 text-xs text-red-600">{errors[0]}</p>}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}