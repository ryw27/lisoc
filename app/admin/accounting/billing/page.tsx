import BillingLedger from "@/components/billing/billing-ledger";
import { db } from "@/lib/db";
import { seasons } from "@/lib/db/schema";
import { getLedgerData } from "@/server/billing/data";
import fetchCurrentSeasons from "@/server/seasons/data";
import { InferSelectModel } from "drizzle-orm";

// TODO: Should we have a record page?
export default async function BillingPage() {
    let lastSeason: InferSelectModel<typeof seasons> | undefined;
    try {
        const seasons = await fetchCurrentSeasons();

        lastSeason = seasons.fall.status === "Active" ? seasons.fall : seasons.spring;
    } catch {
        lastSeason = await db.query.seasons.findFirst({
            orderBy: (s, { desc }) => desc(s.seasonid),
        });
    }

    if (!lastSeason) {
        return (
            <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground min-h-screen w-full p-8">
                <div className="mx-auto max-w-7xl space-y-8">
                    <span className="text-2xl">No seasons currently available</span>
                </div>
            </div>
        );
    }

    const ledgerData = await getLedgerData(lastSeason.seasonid);

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
                    seasonid: lastSeason.seasonid,
                    seasonnamecn: lastSeason.seasonnamecn,
                    seasonnameeng: lastSeason.seasonnameeng,
                    earlyregdate: lastSeason.earlyregdate,
                    enddate: lastSeason.enddate,
                }}
                seasons={allSeasons}
            />
            <div className="text-muted-foreground/20 py-8 text-center text-xs font-normal tracking-[0.2em] uppercase">
                Confidential Financial Record • Do Not Distribute
            </div>
        </div>
    );
}
