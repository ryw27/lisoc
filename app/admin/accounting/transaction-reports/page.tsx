import { getLedgerData, getLedgerSeasons } from "@/server/billing/data";
import BillingLedger from "@/components/billing/billing-ledger";

const firstParam = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

export default async function TransactionReportsPage({
    searchParams,
}: {
    searchParams?: Promise<{ season?: string | string[] }>;
}) {
    const params = searchParams ? await searchParams : {};
    const { seasons, defaultSeason } = await getLedgerSeasons();

    // Season comes from the URL so it survives back/forward navigation
    const seasonParam = Number(firstParam(params.season));
    const season = seasons.find((s) => s.seasonid === seasonParam) ?? defaultSeason;

    if (!season) {
        return (
            <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground min-h-screen w-full p-8">
                <div className="mx-auto max-w-7xl space-y-8">
                    <span className="text-2xl">No seasons currently available</span>
                </div>
            </div>
        );
    }

    const ledgerData = await getLedgerData(season.seasonid);

    return (
        <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground min-h-screen w-full p-8">
            <BillingLedger
                initialData={{ family: ledgerData.familyRows, global: ledgerData.globalRows }}
                season={season}
                seasons={seasons}
            />
            <div className="text-muted-foreground/20 py-8 text-center text-xs font-normal tracking-[0.2em] uppercase">
                Confidential Financial Record • Do Not Distribute
            </div>
        </div>
    );
}
