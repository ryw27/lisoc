"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { download, generateCsv, mkConfig } from "export-to-csv";
import { ChevronRight, Download, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { type BalanceRecord, type BalanceTypeTotal } from "@/server/billing/data";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import BalanceTypeBars from "./balance-type-bars";
import SeasonTitle, { type BillingSeasonInfo } from "./season-title";

type FinancialLedgerProps = {
    season: BillingSeasonInfo;
    seasons: BillingSeasonInfo[];
    totals: BalanceTypeTotal[];
    selectedKey: string | null;
    records: BalanceRecord[];
};

// Timestamps are stored without timezone; show the date part only
const formatDate = (date: string) => (date.startsWith("1900") ? "" : date.slice(0, 10));

const amountColor = (amount: number) =>
    amount < 0
        ? "text-red-700 dark:text-red-400"
        : amount > 0
          ? "text-green-700 dark:text-green-400"
          : undefined;

// Selected season and type live in the URL (?season=&type=) so the view survives
// navigating away (e.g. to a family) and coming back
export default function FinancialLedger({
    season,
    seasons,
    totals,
    selectedKey,
    records,
}: FinancialLedgerProps) {
    const router = useRouter();
    const pathname = usePathname();

    const [pending, start] = useTransition();
    const [recordsPending, startRecords] = useTransition();

    const [optimisticSeason, setOptimisticSeason] = useOptimistic(season);
    const [optimisticKey, setOptimisticKey] = useOptimistic(selectedKey);

    const navigate = (seasonid: number, typeKey: string | null) => {
        const params = new URLSearchParams({ season: String(seasonid) });
        if (typeKey !== null) params.set("type", typeKey);
        router.replace(`${pathname}?${params}`, { scroll: false });
    };

    const changeSeason = (next: BillingSeasonInfo) => {
        start(() => {
            setOptimisticSeason(next);
            setOptimisticKey(null);
            navigate(next.seasonid, null);
        });
    };

    const selectType = (type: BalanceTypeTotal) => {
        const typeKey = optimisticKey === type.key ? null : type.key;
        startRecords(() => {
            setOptimisticKey(typeKey);
            navigate(season.seasonid, typeKey);
        });
    };

    const selectedType = totals.find((t) => t.key === optimisticKey) ?? null;
    // Records still belong to the previous type until navigation finishes
    const shownRecords = optimisticKey === selectedKey ? records : [];

    const exportRecords = () => {
        if (!selectedType || shownRecords.length === 0) return;
        const slug = (v: string) => v.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");
        const config = mkConfig({
            filename: `lisoc_${slug(season.seasonnameeng)}_${slug(selectedType.label)}`,
            columnHeaders: [
                "Balance ID",
                "Family ID",
                "Family",
                "Register Date",
                "Paid Date",
                "Status",
                "Check / Txn No.",
                "Reference",
                "Notes",
                "Amount",
                "User ID",
            ],
        });
        const rows = shownRecords.map((r) => ({
            "Balance ID": r.balanceid,
            "Family ID": r.familyid,
            Family: r.familyname,
            "Register Date": formatDate(r.registerdate),
            "Paid Date": formatDate(r.paiddate),
            Status: r.status ?? "",
            "Check / Txn No.": [r.checkno, r.transactionno].filter(Boolean).join(" / "),
            Reference: r.reference ?? "",
            Notes: r.notes ?? "",
            Amount: r.totalamount,
            "User ID": r.userid ?? "",
        }));
        download(config)(generateCsv(config)(rows));
    };

    const netTotal = totals.reduce((acc, t) => acc + t.total, 0);

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <header className="border-primary/10 border-b pb-6">
                <SeasonTitle
                    title="Financial Ledger"
                    seasons={seasons}
                    selectedSeason={optimisticSeason}
                    pending={pending}
                    onSelect={changeSeason}
                />
            </header>

            <div
                className={cn(
                    "grid items-start gap-6 transition-opacity lg:grid-cols-2",
                    pending && "pointer-events-none opacity-50"
                )}
            >
                <div className="border-border bg-card border shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Balance Type (类别)</TableHead>
                                <TableHead className="text-right">Total (总额)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {totals.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={2}
                                        className="text-muted-foreground text-center"
                                    >
                                        No records for this season
                                    </TableCell>
                                </TableRow>
                            ) : (
                                totals.map((t) => {
                                    const isSelected = optimisticKey === t.key;
                                    return (
                                        <TableRow
                                            key={t.key}
                                            role="button"
                                            tabIndex={0}
                                            aria-expanded={isSelected}
                                            onClick={() => selectType(t)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    selectType(t);
                                                }
                                            }}
                                            className={cn(
                                                "cursor-pointer",
                                                isSelected && "bg-primary/10 hover:bg-primary/10"
                                            )}
                                        >
                                            <TableCell>
                                                <span className="text-primary flex items-center gap-1 font-medium">
                                                    <ChevronRight
                                                        size={14}
                                                        className={cn(
                                                            "transition-transform",
                                                            isSelected && "rotate-90"
                                                        )}
                                                    />
                                                    <span className="font-bold text-blue-700 underline underline-offset-4 dark:text-blue-400">
                                                        {t.label}
                                                    </span>
                                                </span>
                                            </TableCell>
                                            <TableCell
                                                className={cn(
                                                    "text-right font-mono tabular-nums",
                                                    amountColor(t.total)
                                                )}
                                            >
                                                {formatCurrency(t.total)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                        {totals.length > 0 && (
                            <TableFooter>
                                <TableRow>
                                    <TableCell className="font-bold">Net Total</TableCell>
                                    <TableCell
                                        className={cn(
                                            "text-right font-mono font-bold tabular-nums",
                                            amountColor(netTotal)
                                        )}
                                    >
                                        {formatCurrency(netTotal)}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                </div>

                <BalanceTypeBars
                    totals={totals}
                    selectedKey={optimisticKey}
                    onSelect={selectType}
                />
            </div>

            {selectedType && (
                <section className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-primary flex items-center gap-2 text-lg font-bold tracking-wider uppercase">
                            {selectedType.label} Records
                            {recordsPending ? (
                                <Loader2 size={16} className="animate-spin opacity-50" />
                            ) : (
                                <span className="text-muted-foreground text-sm font-normal normal-case">
                                    ({shownRecords.length})
                                </span>
                            )}
                        </h2>
                        <button
                            type="button"
                            onClick={exportRecords}
                            disabled={recordsPending || shownRecords.length === 0}
                            className="bg-primary hover:bg-primary/90 flex h-9 shrink-0 cursor-pointer items-center gap-2 px-4 text-sm font-semibold tracking-wide text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Download size={16} />
                            Export CSV
                        </button>
                    </div>

                    <div
                        className={cn(
                            "border-border bg-card border shadow-sm transition-opacity",
                            recordsPending && "opacity-50"
                        )}
                    >
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Balance ID</TableHead>
                                    <TableHead>Family ID</TableHead>
                                    <TableHead>Family</TableHead>
                                    <TableHead>Register Date</TableHead>
                                    <TableHead>Paid Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Check / Txn No.</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>User ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!recordsPending && shownRecords.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={11}
                                            className="text-muted-foreground text-center"
                                        >
                                            No records
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    shownRecords.map((r) => (
                                        <TableRow key={r.balanceid}>
                                            <TableCell className="font-mono">
                                                {r.balanceid}
                                            </TableCell>
                                            <TableCell className="font-mono">
                                                <Link
                                                    href={`/admin/other/find-family?familyid=${r.familyid}`}
                                                    className="font-bold text-blue-700 underline underline-offset-4 dark:text-blue-400"
                                                >
                                                    {r.familyid}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{r.familyname}</TableCell>
                                            <TableCell>{formatDate(r.registerdate)}</TableCell>
                                            <TableCell>{formatDate(r.paiddate)}</TableCell>
                                            <TableCell>{r.status}</TableCell>
                                            <TableCell>
                                                {[r.checkno, r.transactionno]
                                                    .filter(Boolean)
                                                    .join(" / ")}
                                            </TableCell>
                                            <TableCell>{r.reference}</TableCell>
                                            <TableCell
                                                className="max-w-xs truncate"
                                                title={r.notes ?? ""}
                                            >
                                                {r.notes}
                                            </TableCell>
                                            <TableCell
                                                className={cn(
                                                    "text-right font-mono tabular-nums",
                                                    amountColor(r.totalamount)
                                                )}
                                            >
                                                {formatCurrency(r.totalamount)}
                                            </TableCell>
                                            <TableCell>{r.userid}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </section>
            )}
        </div>
    );
}
