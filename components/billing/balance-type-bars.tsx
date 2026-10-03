"use client";

import { useRef, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { type BalanceTypeTotal } from "@/server/billing/data";

type BalanceTypeBarsProps = {
    totals: BalanceTypeTotal[];
    selectedKey: string | null;
    onSelect: (type: BalanceTypeTotal) => void;
};

const compactCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
});

// Horizontal bars sized by absolute amount; color carries the sign (green positive, red negative)
export default function BalanceTypeBars({ totals, selectedKey, onSelect }: BalanceTypeBarsProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hover, setHover] = useState<{ type: BalanceTypeTotal; x: number; y: number } | null>(
        null
    );

    const max = Math.max(0, ...totals.map((t) => Math.abs(t.total)));
    if (totals.length === 0 || max === 0) return null;

    const showTooltip = (type: BalanceTypeTotal, clientX: number, clientY: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setHover({ type, x: clientX - rect.left, y: clientY - rect.top });
    };

    return (
        <div
            ref={containerRef}
            className="border-border bg-card relative border p-4 shadow-sm"
            onPointerLeave={() => setHover(null)}
        >
            <div className="space-y-1">
                {totals.map((t) => {
                    const isSelected = t.key === selectedKey;
                    const dimmed = selectedKey !== null && !isSelected;
                    const width = (Math.abs(t.total) / max) * 100;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => onSelect(t)}
                            onPointerMove={(e) => showTooltip(t, e.clientX, e.clientY)}
                            onFocus={(e) => {
                                const r = e.currentTarget.getBoundingClientRect();
                                showTooltip(t, r.left + r.width / 2, r.top);
                            }}
                            onBlur={() => setHover(null)}
                            aria-label={`${t.label}: ${formatCurrency(t.total)}`}
                            aria-pressed={isSelected}
                            className={cn(
                                "grid w-full cursor-pointer grid-cols-[8rem_1fr] items-center gap-3 rounded-sm px-1 py-1 text-left text-sm transition-opacity",
                                "hover:bg-muted focus-visible:ring-ring outline-none focus-visible:ring-2",
                                isSelected && "bg-primary/10 hover:bg-primary/10",
                                dimmed && "opacity-40"
                            )}
                        >
                            <span className="truncate font-bold text-blue-700 underline underline-offset-4 dark:text-blue-400">
                                {t.label}
                            </span>
                            {/* plot area; right padding leaves room for the longest bar's label */}
                            <span className="border-border flex h-5 items-center border-l pr-14">
                                <span
                                    className={cn(
                                        "relative block h-full rounded-r",
                                        t.total < 0
                                            ? "bg-red-600 dark:bg-red-500"
                                            : "bg-green-600 dark:bg-green-500",
                                        t.total !== 0 && "min-w-0.5"
                                    )}
                                    style={{ width: `${width}%` }}
                                >
                                    <span className="text-muted-foreground absolute top-1/2 left-full ml-1.5 -translate-y-1/2 font-mono text-[11px] whitespace-nowrap tabular-nums">
                                        {compactCurrency.format(Math.abs(t.total))}
                                    </span>
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>

            {hover && (
                <div
                    className="bg-popover text-popover-foreground border-border pointer-events-none absolute z-10 min-w-36 border px-3 py-2 text-xs shadow-md"
                    style={{ left: hover.x + 12, top: hover.y + 12 }}
                >
                    <div className="font-mono text-sm font-bold tabular-nums">
                        {formatCurrency(hover.type.total)}
                    </div>
                    <div className="text-muted-foreground">{hover.type.label}</div>
                </div>
            )}
        </div>
    );
}
