import { cn } from "@/lib/utils";
import { Column } from "@tanstack/react-table"
import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger  } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ChevronsUpDown, } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DataTableColumnHeader<TData, TValue>({ 
    column, 
    title, 
    className,
    tableType
}: {
    column: Column<TData, TValue>,
    title: string;
    className?: React.HTMLAttributes<HTMLDivElement>;
    tableType: "server" | "client"
}) {
    if (!column.getCanSort()) {
        return (
            <div className={cn(className)}>
                {title}
            </div>
        )
    }

    const router = useRouter();
    const searchParams = useSearchParams();

    const sortCol_server = (dir: 'asc' | 'desc') => {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.set('sortBy', column.columnDef.id ?? "");
        params.set('sortOrder', dir);
        router.replace(`?${params.toString()}`);
    }


    return (
        <div className={cn('flex items-center gap-2', className)}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm font-semibold text-black"
                    >
                        {column.getIsSorted() === "asc" ? (
                            <ArrowDown className="w-4 h-4"/>
                        ) : column.getIsSorted() === "desc" ? (
                            <ArrowUp className="w-4 h-4" />
                        ) : (
                            <ChevronsUpDown className="w-4 h-4" />
                        )}
                        {title}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem
                        onClick={() => {
                            column.toggleSorting(false);
                            if (tableType === "server") {
                                sortCol_server('asc');
                            }
                        }}
                    >
                        <ArrowUp className="w-4 h-4" />
                        Asc
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            column.toggleSorting(true);
                            if (tableType === "server") {
                                sortCol_server('desc');
                            }
                        }}
                    >
                        <ArrowDown className="w-4 h-4" />
                        Desc
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}