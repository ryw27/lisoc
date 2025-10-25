"use server";
import { db } from "@/lib/db";
import { seasons } from "@/lib/db/schema";
import { asc, InferSelectModel } from "drizzle-orm";
import { getSeasonDrafts } from "../../helpers";


export async function getPreviousSeason() {
    return await db.transaction(async (tx) => {
        // Check for previous season
        const maxSeasonRow = await tx
            .select()
            .from(seasons)
            .orderBy(asc(seasons.seasonid))
            .limit(3);

        if (!maxSeasonRow || maxSeasonRow.length === 0) {
            // In case
            return { lastSeasonArrangements: { yearRows: [], fallRows: [], springRows: [] }, lastSeason: [{}, {}, {}] as InferSelectModel<typeof seasons>[] };
        }
        // TODO: Change -1 to -2 to get previous academic year in prod
        const yearRows = await getSeasonDrafts(tx, maxSeasonRow[0].seasonid); // Previous academic year
        const fallRows = await getSeasonDrafts(tx, maxSeasonRow[1].seasonid); // Fall semester
        const springRows = await getSeasonDrafts(tx, maxSeasonRow[2].seasonid); // Spring semester

        return { lastSeasonArrangements: { yearRows, fallRows, springRows }, lastSeason: [maxSeasonRow[0], maxSeasonRow[1], maxSeasonRow[2]] };
    }) 
}