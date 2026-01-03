import { db } from "@/lib/db";
import { getLedgerData } from "@/server/billing/data";
import getThreeSeasons from "@/server/seasons/data";
import BillingLedger from "@/components/billing/billing-ledger";

// TODO: Should we have a record page?
export default async function BillingPage() {
    const seasons = await getThreeSeasons();
    const ledgerData = await getLedgerData(seasons.year.seasonid);

    const allSeasons = await db.query.seasons.findMany({
        columns: {
            seasonid: true,
            seasonnamecn: true,
            seasonnameeng: true,
            earlyregdate: true,
            enddate: true,
        },
    });
    return (
        <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground min-h-screen w-full p-8">
            <BillingLedger
                initialData={{ family: ledgerData.familyRows, global: ledgerData.globalRows }}
                initialSummary={ledgerData.summary}
                defaultSeason={{
                    seasonid: seasons.year.seasonid,
                    seasonnamecn: seasons.year.seasonnamecn,
                    seasonnameeng: seasons.year.seasonnameeng,
                    earlyregdate: seasons.year.earlyregdate,
                    enddate: seasons.year.enddate,
                }}
                seasons={allSeasons}
            />
            <div className="text-muted-foreground/20 py-8 text-center text-xs font-normal tracking-[0.2em] uppercase">
                Confidential Financial Record • Do Not Distribute
            </div>
        </div>
    );
}
