"use client";

import { useRef, useState, useTransition } from "react";
import { download, generateCsv, mkConfig } from "export-to-csv";
import { CheckSquare, ChevronDown, Download, FileText, Loader2, TableIcon } from "lucide-react";
import { cn, monthAbbrevMap, toESTString } from "@/lib/utils";
import { type BillingRow, type BillingSummary, type FamilyRow } from "@/types/billing.types";
import { getLedgerAction } from "@/server/billing/actions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BillingCards from "./billing-cards";
import BillingTable from "./billing-table";

const csvConfig = mkConfig({
    fieldSeparator: ",",
    filename: `lisoc_billing_record_${toESTString(new Date())}`,
    decimalSeparator: ".",
    useKeysAsHeaders: true,
});

export function exportExcel<T extends Record<string, string | number | boolean | null | undefined>>(
    rows: T[]
) {
    const csv = generateCsv(csvConfig)(rows);
    download(csvConfig)(csv);
}

export const formatBillingDate = (date: string) => {
    const dateObj = new Date(date);
    const abbrev = monthAbbrevMap[dateObj.getMonth()];

    let day = dateObj.getDate().toString();
    if (day.length == 1) {
        day = "0" + day;
    }

    return [abbrev + " " + day, dateObj.getFullYear()];
};

type BillingLedgerProps = {
    initialData: {
        family: FamilyRow[];
        global: BillingRow[];
    };
    initialSummary: BillingSummary;
    defaultSeason: billingSeasonInfo;
    seasons: billingSeasonInfo[];
};

type billingSeasonInfo = {
    seasonid: number;
    seasonnamecn: string;
    seasonnameeng: string;
    earlyregdate: string;
    enddate: string;
};

export type TableExportType = {
    triggerExport: (option: "all" | "page" | "selected") => void;
};

export default function BillingLedger({
    initialData,
    initialSummary,
    defaultSeason,
    seasons,
}: BillingLedgerProps) {
    const [selectedSeason, setSelectedSeason] = useState<billingSeasonInfo>(defaultSeason);

    const [familyData, setFamilyData] = useState<FamilyRow[]>(initialData.family);
    const [globalData, setGlobalData] = useState<BillingRow[]>(initialData.global);
    const [summary, setSummary] = useState<BillingSummary>(initialSummary);

    // Export all rows (from filter), all rows on a page, or selected rows
    const selectRowsRef = useRef<TableExportType>(null);

    const [pending, start] = useTransition();

    const changeSeason = async (season: billingSeasonInfo) => {
        start(async () => {
            const newData = await getLedgerAction(season.seasonid);

            setSelectedSeason(season);
            setSummary(newData.summary);
            setFamilyData(newData.familyRows);
            setGlobalData(newData.globalRows);
        });
    };

    const formattedBillingDate = [
        formatBillingDate(selectedSeason.earlyregdate)[0],
        formatBillingDate(selectedSeason.enddate)[0],
    ].join(" — ");

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <header className="border-primary/10 flex flex-col justify-between gap-6 border-b pb-6 md:flex-row md:items-end">
                <div className="space-y-2">
                    <div className="flex items-baseline gap-4">
                        <h1 className="text-primary text-3xl font-bold tracking-tight uppercase md:text-4xl">
                            Financial Ledger
                        </h1>
                        <span className="text-muted-foreground/40 hidden text-3xl font-light italic md:inline">
                            /
                        </span>
                        <div className="group relative">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild disabled={pending}>
                                    <button
                                        className={cn(
                                            "flex items-center gap-2 text-3xl font-normal tracking-tight transition-all outline-none md:text-3xl",
                                            // Color logic: Primary when active, muted when pending
                                            pending
                                                ? "text-muted-foreground cursor-wait"
                                                : "text-secondary hover:opacity-80"
                                        )}
                                    >
                                        {selectedSeason.seasonnameeng}

                                        {/* Swap Chevron for Spinner */}
                                        {pending ? (
                                            <Loader2
                                                size={24}
                                                className="mt-1 animate-spin opacity-50"
                                            />
                                        ) : (
                                            <ChevronDown
                                                size={24}
                                                className="mt-1 stroke-[3] opacity-50"
                                            />
                                        )}
                                    </button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="start"
                                    className="bg-background max-h-[300px] w-[200px] overflow-y-auto"
                                >
                                    {seasons.map((season) => (
                                        <DropdownMenuItem
                                            key={season.seasonid}
                                            onClick={() => changeSeason(season)}
                                            className="cursor-pointer text-lg"
                                        >
                                            {season.seasonnamecn}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <p className="text-muted-foreground text-sm tracking-wide uppercase">
                        Billing Period:{" "}
                        <span className="text-foreground font-semibold">
                            {formattedBillingDate}{" "}
                        </span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            disabled={pending}
                            className={cn(
                                "bg-primary border-primary flex h-10 items-center gap-2 border px-6 text-sm font-semibold tracking-wide text-white shadow-sm transition-all",
                                pending
                                    ? "cursor-not-allowed opacity-50"
                                    : "hover:bg-primary/90 cursor-pointer"
                                // "h-10 px-5 bg-background border border-primary/20 rounded-sm text-sm font-semibold text-primary transition-all flex items-center gap-2 focus:outline-none",
                                // pending ? "opacity-50 cursor-not-allowed" : "hover:bg-primary hover:text-white cursor-pointer"
                            )}
                        >
                            {pending ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            Export
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="bg-background w-56">
                            <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={() => selectRowsRef.current?.triggerExport("all")}
                                className="cursor-pointer"
                            >
                                <TableIcon className="text-muted-foreground mr-2 h-4 w-4" />
                                <span>Export All Rows</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => selectRowsRef.current?.triggerExport("page")}
                                className="cursor-pointer"
                            >
                                <FileText className="text-muted-foreground mr-2 h-4 w-4" />
                                <span>Export Current Page</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => selectRowsRef.current?.triggerExport("selected")}
                                className="cursor-pointer"
                            >
                                <CheckSquare className="text-muted-foreground mr-2 h-4 w-4" />
                                <span>Export Selected</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* <button 
                        disabled={pending}
                        onClick={() => router.push("/admin/accounting/billing/record")}
                        className={cn(
                            "h-10 px-6 bg-primary text-white border border-primary rounded-sm shadow-sm transition-all text-sm font-semibold tracking-wide flex items-center gap-2",
                            pending ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90 cursor-pointer"
                        )}
                    >
                        <ArrowUpRight size={16} /> Record Payment
                    </button> */}
                </div>
            </header>

            <div
                className={cn(
                    "space-y-8 transition-all duration-500 ease-in-out",
                    pending
                        ? "pointer-events-none scale-[0.99] opacity-50 grayscale-[0.5]"
                        : "scale-100 opacity-100"
                )}
            >
                {/* 2. Card Digests */}
                <BillingCards summary={summary} />

                {/* 3. Billing Table */}
                <BillingTable
                    families={familyData}
                    globalActivity={globalData}
                    rowRef={selectRowsRef}
                />
            </div>
        </div>
    );
}
