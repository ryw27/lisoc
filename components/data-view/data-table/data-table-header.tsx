"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DataTableColumnHeader<TData, TValue>({
    column,
    title,
    className,
    tableType,
}: {
    column: Column<TData, TValue>;
    title: string;
    className?: React.HTMLAttributes<HTMLDivElement>;
    tableType: "server" | "client";
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    if (!column.getCanSort()) {
        return <div className={cn(className)}>{title}</div>;
    }

    const sortCol_server = (dir: "asc" | "desc") => {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.set("sortBy", column.columnDef.id ?? "");
        params.set("sortOrder", dir);
        router.replace(`?${params.toString()}`);
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-sm font-semibold text-black">
                        {column.getIsSorted() === "asc" ? (
                            <ArrowDown className="h-4 w-4" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ArrowUp className="h-4 w-4" />
                        ) : (
                            <ChevronsUpDown className="h-4 w-4" />
                        )}
                        {title}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem
                        onClick={() => {
                            column.toggleSorting(false);
                            if (tableType === "server") {
                                sortCol_server("asc");
                            }
                        }}
                    >
                        <ArrowUp className="h-4 w-4" />
                        Asc
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            column.toggleSorting(true);
                            if (tableType === "server") {
                                sortCol_server("desc");
                            }
                        }}
                    >
                        <ArrowDown className="h-4 w-4" />
                        Desc
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
