import getThreeSeasons from '@/lib/shared/server/getThreeSeasons';
import BillingLedger from './billing-ledger';
import { getLedgerData } from './fetch';
import { db } from '@/lib/db';


export type FamilyRow = {
    fbid: number  // family balance id
    fid: number  // family id
    family: string // family name
    students: { namecn: string, namefirsten: string }[] // students

    billed: number // how much they are billed this sem
    paid: number // how much they paid
    status: "paid" | "unpaid" | "partial" | "overdue" // status

    lastActive: string
    lastActivity: BillingRow[]
}

export type BillingRow = {
    tid: number // transaction id
    date: string // date
    family: string //  family name
    familyid: number
    desc: string // what payment this is
    amount: number // amount
    // type: string // check, online
}

export type BillingSummary = {
    billed: number,
    collected: number,
    outstanding: number,
    progress: number 
}


export default async function BillingPage() {
    const seasons = await getThreeSeasons()
    const ledgerData = await getLedgerData(seasons.year.seasonid);

    const allSeasons = await db.query.seasons.findMany({
        columns: {
            seasonid: true,
            seasonnamecn: true,
            seasonnameeng: true,
        }
    });
    return (
        <div className="min-h-screen w-full bg-background text-foreground  p-8 selection:bg-primary selection:text-primary-foreground">

            <BillingLedger
                initialData={{ family: ledgerData.familyRows, global: ledgerData.globalRows }}
                initialSummary={ledgerData.summary}
                defaultSeason={{ seasonid: seasons.year.seasonid, seasonnamecn: seasons.year.seasonnamecn, seasonnameeng: seasons.year.seasonnameeng }}
                seasons={allSeasons}
            />

            <div className="text-center text-muted-foreground/20 text-xs font-normal uppercase tracking-[0.2em] py-8">
                Confidential Financial Record • Do Not Distribute
            </div>

        </div>
    );
}