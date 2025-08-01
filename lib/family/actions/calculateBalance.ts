"use server";
import { db } from "@/lib/db";
import { threeSeasons } from "@/lib/registration/types";
import { balanceFees, familyObj } from "@/lib/shared/types";
import { InferSelectModel } from "drizzle-orm";
import { familybalance } from "@/lib/db/schema";

function calculateTerm(balances: InferSelectModel<typeof familybalance>[]): balanceFees {
    const totals: balanceFees = {
        childnumRegfee: 0,
        regfee: 0,
        earlyregdiscount: 0,
        lateregfee: 0,
        extrafee4newfamily: 0,
        managementfee: 0,
        dutyfee: 0,
        cleaningfee: 0,
        otherfee: 0,
        tuition: 0,
        groupdiscount: 0,
        processfee: 0,
        totalamount: 0,
    };
    for (const bal of balances) {
        totals.childnumRegfee += Number(bal.childnumRegfee ?? 0);
        totals.regfee += Number(bal.regfee ?? 0);
        totals.earlyregdiscount += Number(bal.earlyregdiscount ?? 0);
        totals.lateregfee += Number(bal.lateregfee ?? 0);
        totals.extrafee4newfamily += Number(bal.extrafee4newfamily ?? 0);
        totals.managementfee += Number(bal.managementfee ?? 0);
        totals.dutyfee += Number(bal.dutyfee ?? 0);
        totals.cleaningfee += Number(bal.cleaningfee ?? 0);
        totals.otherfee += Number(bal.otherfee ?? 0);
        totals.tuition += Number(bal.tuition ?? 0);
        totals.groupdiscount += Number(bal.groupdiscount ?? 0);
        totals.processfee += Number(bal.processfee ?? 0);
        totals.totalamount += Number(bal.totalamount ?? 0);
    }

    return totals;
}

export default async function calculateBalance(family: familyObj, seasons: threeSeasons) {
    return await db.transaction(async (tx) => {
        const yearBalances = await tx.query.familybalance.findMany({
            where: (bal, { and, eq }) => and(
                eq(bal.familyid, family.familyid),
                eq(bal.seasonid, seasons.year.seasonid)
            )
        })

        const yearPrices = calculateTerm(yearBalances);

        const fallBalances = await tx.query.familybalance.findMany({
            where: (bal, { and, eq }) => and(
                eq(bal.familyid, family.familyid),
                eq(bal.seasonid, seasons.fall.seasonid)
            )
        })

        const fallPrices = calculateTerm(fallBalances);

        const springBalances = await tx.query.familybalance.findMany({
            where: (bal, { and, eq }) => and(
                eq(bal.familyid, family.familyid),
                eq(bal.seasonid, seasons.spring.seasonid)
            )
        })

        const springPrices = calculateTerm(springBalances);

        return { yearPrices: yearPrices, fallPrices: fallPrices, springPrices: springPrices };
    })
}