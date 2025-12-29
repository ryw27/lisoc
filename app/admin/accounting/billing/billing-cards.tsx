import { 
    FileText,
    Check,
    CreditCard,
    AlertCircle
} from "lucide-react"

import { formatCurrency } from "@/lib/utils"
import { BillingSummary } from "./page"



type BillingCardsProps = {
    summary: BillingSummary
}

export default function BillingCards({ summary }: BillingCardsProps) {
    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Billed */}
            <div className="bg-card p-6 rounded-sm border border-border shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-muted rounded border border-border text-muted-foreground"><FileText size={20} /></div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Billed</span>
                </div>
                <p className="text-4xl font-medium text-foreground tabular-nums tracking-tight">{formatCurrency(summary.billed)}</p>
            </div>

            {/* Collected */}
            <div className="bg-primary p-6 rounded-sm shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity text-white"><Check size={64} /></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                        <div className="p-2 bg-white/10 rounded text-accent"><CreditCard size={20} /></div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-accent">Collected YTD</span>
                    </div>
                    <div className="flex items-baseline gap-3 mb-3">
                        <p className="text-4xl font-medium text-primary-foreground tabular-nums tracking-tight">{formatCurrency(summary.collected)}</p>
                        <span className="text-emerald-400 text-xs font-bold ">+{(summary.progress).toFixed(2)}%</span>
                    </div>
                    <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${summary.progress}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Outstanding */}
            <div className="bg-card p-6 rounded-sm border border-destructive/20 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-destructive/5 rounded border border-destructive/10 text-destructive/60"><AlertCircle size={20} /></div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-destructive/60">Outstanding</span>
                </div>
                <p className="text-4xl font-medium text-destructive tabular-nums tracking-tight">{formatCurrency(summary.outstanding)}</p>
            </div>
        </section>
    )

}