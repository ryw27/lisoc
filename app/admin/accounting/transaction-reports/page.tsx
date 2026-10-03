import { getLedgerData, getLedgerSeasons } from "@/server/billing/data";
import BillingLedger from "@/components/billing/billing-ledger";

export default async function TransactionReportsPage() {
    const { seasons, defaultSeason } = await getLedgerSeasons();

    if (!defaultSeason) {
        return (
            <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground min-h-screen w-full p-8">
                <div className="mx-auto max-w-7xl space-y-8">
                    <span className="text-2xl">No seasons currently available</span>
                </div>
            </div>
        );
    }

    const ledgerData = await getLedgerData(defaultSeason.seasonid);

    return (
        <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground min-h-screen w-full p-8">
            <BillingLedger
                initialData={{ family: ledgerData.familyRows, global: ledgerData.globalRows }}
                defaultSeason={defaultSeason}
                seasons={seasons}
            />
            <div className="text-muted-foreground/20 py-8 text-center text-xs font-normal tracking-[0.2em] uppercase">
                Confidential Financial Record • Do Not Distribute
            </div>
        </div>
    );
}
