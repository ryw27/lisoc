"use server";

import { db } from "@/lib/db";
import { seasons } from "@/lib/db/schema";
import { uiClasses } from "@/types/shared.types";
import { desc, eq, InferSelectModel } from "drizzle-orm";
import { getSeasonDrafts } from "../data";


// export async function getPreviousSeason() {
//     return await db.transaction(async (tx) => {
//         // Check for previous season
//         const maxSeasonRow = await tx
//             .select()
//             .from(seasons)
//             .orderBy(desc(seasons.seasonid))
//             .limit(3);

//         if (!maxSeasonRow || maxSeasonRow.length === 0) {
//             // In case
//             return { lastSeasonArrangements: { yearRows: [], fallRows: [], springRows: [] }, lastSeason: [{}, {}, {}] as InferSelectModel<typeof seasons>[] };
//         }
//         // TODO: Change -1 to -2 to get previous academic year in prod
//         const yearRows = await getSeasonDrafts(tx, maxSeasonRow[2].seasonid - 1); // Previous academic year
//         const fallRows = await getSeasonDrafts(tx, maxSeasonRow[1].seasonid); // Fall semester
//         const springRows = await getSeasonDrafts(tx, maxSeasonRow[0].seasonid); // Spring semester

//         return { lastSeasonArrangements: { yearRows, fallRows, springRows }, lastSeason: [maxSeasonRow[0], maxSeasonRow[1], maxSeasonRow[2]] };
//     })
// }

// TODO: TEMP FUNCTION TO WORK IN DEV.
export async function getPreviousSeason() {
    return await db.transaction(async (tx) => {
        const maxSeasonRow = await tx
            .select()
            .from(seasons)
            .where(eq(seasons.relatedseasonid, seasons.beginseasonid))
            .orderBy(desc(seasons.seasonid))
            .limit(1);

        if (maxSeasonRow.length == 0) 
        {
            //TODO let's fake it 


        }

        const fallseasonid = maxSeasonRow[0].beginseasonid;

        const threeSeasons = await tx
                            .select()
                            .from(seasons)
                            .where(eq(seasons.beginseasonid, fallseasonid))


        // there is no guarteen three season will be back 
        let yearRows : uiClasses[] = [];
        let fallRows : uiClasses[] = [];
        let springRows : uiClasses[] = [] ;

        let yearSeason: InferSelectModel<typeof seasons>|null  = null;
        let fallSeason: InferSelectModel<typeof seasons> |null  = null ;
        let springSeason: InferSelectModel<typeof seasons> | null =null ;


        for (const oneSeason of threeSeasons)
        {
            const oneArrangement= await getSeasonDrafts(oneSeason.seasonid, tx);

            if (oneSeason.isspring)
            {
                springRows = oneArrangement ;
                springSeason = oneSeason  ;
            }
            else if (oneSeason.relatedseasonid == oneSeason.beginseasonid)
            {
                // this is year 
                yearRows = oneArrangement
                yearSeason = oneSeason ;

            }
            else {
                //this is fall
                fallRows = oneArrangement 
                fallSeason = oneSeason 

            }

        }

        return {
            lastSeasonArrangements: { year: yearRows, fall: fallRows, spring: springRows },
//            lastSeason: {seasons:[...threeSeasons],yearCourses: yearRows, fallCourses: fallRows, springCourses: springRows                }
            lastSeason: {year:yearSeason, fall:fallSeason,spring:springSeason }

        }

    });
}
