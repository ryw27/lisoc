import { AlertCircle, Check, CreditCard, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { type BillingSummary } from "@/types/billing.types";

type BillingCardsProps = {
    summary: BillingSummary;
};

export default function BillingCards({ summary }: BillingCardsProps) {
    return (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Billed */}
            <div className="bg-card border-border rounded-sm border p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                    <div className="bg-muted border-border text-muted-foreground rounded border p-2">
                        <FileText size={20} />
                    </div>
                    <span className="text-muted-foreground text-[10px] font-black tracking-wider uppercase">
                        Total Billed
                    </span>
                </div>
                <p className="text-foreground text-4xl font-medium tracking-tight tabular-nums">
                    {formatCurrency(summary.billed)}
                </p>
            </div>

            {/* Collected */}
            <div className="bg-primary group relative overflow-hidden rounded-sm p-6 shadow-xl">
                <div className="absolute top-0 right-0 p-6 text-white opacity-10 transition-opacity group-hover:opacity-20">
                    <Check size={64} />
                </div>
                <div className="relative z-10">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="text-accent rounded bg-white/10 p-2">
                            <CreditCard size={20} />
                        </div>
                        <span className="text-accent text-[10px] font-black tracking-wider uppercase">
                            Collected YTD
                        </span>
                    </div>
                    <div className="mb-3 flex items-baseline gap-3">
                        <p className="text-primary-foreground text-4xl font-medium tracking-tight tabular-nums">
                            {formatCurrency(summary.collected)}
                        </p>
                        <span className="text-xs font-bold text-emerald-400">
                            +{summary.progress.toFixed(2)}%
                        </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/20">
                        <div
                            className="bg-accent h-full"
                            style={{ width: `${summary.progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Outstanding */}
            <div className="bg-card border-destructive/20 rounded-sm border p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                    <div className="bg-destructive/5 border-destructive/10 text-destructive/60 rounded border p-2">
                        <AlertCircle size={20} />
                    </div>
                    <span className="text-destructive/60 text-[10px] font-black tracking-wider uppercase">
                        Outstanding
                    </span>
                </div>
                <p className="text-destructive text-4xl font-medium tracking-tight tabular-nums">
                    {formatCurrency(summary.outstanding)}
                </p>
            </div>
        </section>
    );
}
