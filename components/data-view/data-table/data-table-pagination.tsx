"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps<TData> {
    table: Table<TData>;
    tableType: "client" | "server";
    totalCount: number;
}

export default function DataTablePagination<TData>({
    table,
    tableType,
    totalCount,
}: DataTablePaginationProps<TData>) {
    const [pageSize, setPageSize] = useState<number>(table.getState().pagination.pageSize);
    const router = useRouter();
    const searchParams = useSearchParams();

    // const submitPageSize = () => {
    //     const params = new URLSearchParams(Array.from(searchParams.entries()));
    //     params.set('pageSize', pageSize.toString());
    //     params.set('page', "1");
    //     router.replace(`?${params.toString()}`);
    // }

    const setPage_server = (page: number) => {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.set("page", page.toString());
        router.replace(`?${params.toString()}`);
    };

    const serverPage = Number(searchParams.get("page")) || 1;
    const serverPageSize = Number(searchParams.get("pageSize")) || 10;
    const totalPages = Math.ceil(totalCount / serverPageSize);
    // console.log(table.getCanNextPage());
    // console.log(table.getPageCount());

    return (
        <div className="flex items-center justify-between px-2">
            <div className="text-muted-foreground flex-1 text-sm font-normal">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Rows per page:</p>
                    <div className="flex items-center gap-2">
                        {/* <span className="text-sm">Show</span> */}
                        <Select
                            value={pageSize.toString()}
                            onValueChange={(value) => {
                                const num = Number(value);
                                setPageSize(num);
                                if (tableType === "client") {
                                    table.setPageSize(num);
                                    table.setPageIndex(0);
                                } else {
                                    // For server, reset to first page and update params
                                    const params = new URLSearchParams(
                                        Array.from(searchParams.entries())
                                    );
                                    params.set("pageSize", num.toString());
                                    params.set("page", "1");
                                    router.replace(`?${params.toString()}`);
                                }
                            }}
                        >
                            <SelectTrigger className="h-8 px-2 text-sm" aria-label="Rows per page">
                                <SelectValue></SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                {[10, 20, 30, 40, 50, 100, 150, 200, 250, 400, 500].map(
                                    (option) => (
                                        <SelectItem
                                            key={option}
                                            value={option.toString()}
                                            className="text-sm"
                                        >
                                            {option}
                                        </SelectItem>
                                    )
                                )}
                            </SelectContent>
                        </Select>
                        <span className="text-sm">rows</span>
                    </div>
                    {/* <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 px-2"
                                tabIndex={0}
                                type="button"
                                aria-label="Rows per page"
                            >
                                {tableType === "server"
                                    ? serverPageSize
                                    : table.getState().pagination.pageSize}
                                <ChevronDown className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="p-4 flex flex-col items-center gap-2 ">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">Show</span>
                                <Input
                                    name="rowsPerPage"
                                    type="number"
                                    min={1}
                                    max={1000}
                                    value={pageSize}
                                    className="w-16 h-8 text-sm"
                                    aria-label="Rows per page"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const value = Number(e.target.value);
                                        if (value && value > 0 && value <= 1000) {
                                            table.setPageSize(value);
                                            table.setPageIndex(0);
                                            setPageSize(value)
                                        }
                                    }}
                                />
                                <span className="text-sm">rows</span>
                            </div>
                            {tableType === "server" && (
                                <Button
                                    size="sm"
                                    className="flex items-center gap-1 px-2 self-end"
                                    tabIndex={0}
                                    type="button"
                                    aria-label="Change rows per page"
                                    onClick={submitPageSize}
                                >
                                    Change
                                </Button>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu> */}
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    {tableType === "server" ? (
                        <span className="font-semibold">
                            Page {serverPage} of {totalPages}
                        </span>
                    ) : (
                        <span className="font-semibold">
                            Page {table.getState().pagination.pageIndex + 1} of{" "}
                            {table.getPageCount()}
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="hidden size-8 lg:flex"
                        onClick={() => {
                            table.setPageIndex(0);
                            setPage_server(0);
                        }}
                        disabled={
                            tableType === "server" ? serverPage === 1 : !table.getCanPreviousPage()
                        }
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => {
                            table.previousPage();
                            setPage_server(serverPage - 1);
                        }}
                        disabled={
                            tableType === "server" ? serverPage === 1 : !table.getCanPreviousPage()
                        }
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => {
                            table.nextPage();
                            setPage_server(serverPage + 1);
                        }}
                        disabled={
                            tableType === "server"
                                ? serverPage === totalPages
                                : !table.getCanNextPage()
                        }
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="hidden size-8 lg:flex"
                        onClick={() => {
                            table.setPageIndex(table.getPageCount() - 1);
                            setPage_server(totalPages);
                        }}
                        disabled={
                            tableType === "server"
                                ? serverPage === totalPages
                                : !table.getCanNextPage()
                        }
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight />
                    </Button>
                </div>
            </div>
        </div>
    );
}
