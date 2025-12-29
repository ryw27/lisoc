"use client";
import { useState, useTransition } from "react"
import BillingCards from "./billing-cards"
import BillingTable from "./billing-table"
import { 
    ChevronDown,
    Download,
    ArrowUpRight
} from "lucide-react"
import { 
    BillingRow, 
    BillingSummary, 
    FamilyRow 
} from "./page"
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { getLedgerAction } from "./actions";



type BillingLedgerProps = {
    initialData: {
        family: FamilyRow[]
        global: BillingRow[]
    }
    initialSummary: BillingSummary
    defaultSeason: billingSeasonInfo
    seasons: billingSeasonInfo[]
}

type billingSeasonInfo= {
    seasonid: number
    seasonnamecn: string
    seasonnameeng: string
}

export default function BillingLedger({ initialData, initialSummary, defaultSeason, seasons }: BillingLedgerProps) {
    const [selectedSeason, setSelectedSeason] = useState<billingSeasonInfo>(defaultSeason)

    const [familyData, setFamilyData] = useState<FamilyRow[]>(initialData.family);
    const [globalData, setGlobalData] = useState<BillingRow[]>(initialData.global);
    const [summary, setSummary] = useState<BillingSummary>(initialSummary)

    const [pending, start] = useTransition()

    const changeSeason = async (season: billingSeasonInfo) => {
        start(async () => {
            const newData = await getLedgerAction(season.seasonid)

            setSelectedSeason(season);
            setSummary(newData.summary);
            setFamilyData(newData.familyRows);
            setGlobalData(newData.globalRows);
        }) 
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* 1. Header + Global Controls */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-primary/10">
                <div className="space-y-2">
                    <div className="flex items-baseline gap-4">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary uppercase">Financial Ledger</h1>
                        <span className="text-3xl text-muted-foreground/40 font-light italic hidden md:inline">/</span>
                        <div className="relative group">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="text-3xl font-normal tracking-tight md:text-3xl text-secondary flex items-center gap-2 hover:opacity-80 transition-opacity outline-none">
                                        {selectedSeason.seasonnameeng} 
                                        <ChevronDown size={24} className="mt-1 opacity-50 stroke-[3]" />
                                    </button>
                                </DropdownMenuTrigger>
                                
                                <DropdownMenuContent align="start" className="w-[200px]">
                                    {seasons.map((season) => (
                                    <DropdownMenuItem
                                        key={season.seasonid}
                                        onClick={() => changeSeason(season)}
                                        className="cursor-pointer text-lg" 
                                    >
                                        {season.seasonnameeng}
                                    </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <p className="text-sm tracking-wide text-muted-foreground uppercase">
                        Billing Period: <span className="text-foreground font-semibold">Sep 01 — Dec 20</span>
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="h-10 px-5 bg-transparent border border-primary/20 rounded-sm text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-all flex items-center gap-2">
                        <Download size={16} /> Export
                    </button>
                    <button className="h-10 px-6 bg-primary text-white border border-primary rounded-sm shadow-sm hover:bg-primary/90 transition-all text-sm font-semibold tracking-wide flex items-center gap-2">
                        <ArrowUpRight size={16} /> Record Payment
                    </button>
                </div>
            </header>

            {/* 2. Card Digests */}
            <BillingCards summary={summary} />
             
            {/* 3. Billing Table */ }
            <BillingTable 
            families={familyData}
            globalActivity={globalData}
            />
        </div>
    )
}