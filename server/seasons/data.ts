import { db } from "@/lib/db";
import { arrangement } from "@/lib/db/schema";
import { type threeSeasons } from "@/types/seasons.types";
import { type dbClient } from "@/types/server.types";
import { type uiClasses } from "@/types/shared.types";
import { and, eq } from "drizzle-orm";

// /**
//  * @error Will first check if the given seasonid corresponds to the old season. Only checks ONE METHOD
//  * @returns the seasons in the old academic year
//  */
// // For the old academic year model
// export default async function fetchLegacySeason(seasonid: number) {

// }

// // For new academic year model
// export default async function fetchSeason(seasonid: number) {}
// export default async function fetchLastSeason();

export default async function fetchCurrentSeasons(client: dbClient = db) {
    return await client.transaction(async (tx) => {

        /* there can only be one active season, either spring or fall
        relationship is 


        fall relatedseasonid =0 beginseasiond = fall    and isspring=0 
        year releatedseasonid = fall beginseaionid = fall  and isspring = 0 
        spring relatedseasonid = 0 beginseasionid = fall and isspring =1 
        
        3 seasons  both have beginseasionid = fall, related seasionid differece year,spring,fall, ispring difference between spring and fall

        */
        const active_season = await tx.query.seasons.findFirst({
            where: (s, { eq }) => eq(s.status, "Active"),
            orderBy: (s, { asc }) => asc(s.seasonid),
        });
        if (!active_season) {
            throw new Error("No active season found");
        }

        const year = await tx.query.seasons.findFirst({
            where: (s, { eq }) => and (eq(s.relatedseasonid, active_season.beginseasonid), eq(s.beginseasonid, active_season.beginseasonid)),
            orderBy: (s, { asc }) => asc(s.seasonid),
        });

        if (!year) {
            throw new Error("No active season found");
        }

        const fall = active_season.isspring ? await tx.query.seasons.findFirst({
            where: (s, { eq }) => and (eq(s.relatedseasonid, 0), eq(s.beginseasonid, active_season.beginseasonid)),
            orderBy: (s, { asc }) => asc(s.seasonid),
        }) : active_season;
      
        const spring = active_season.isspring ? active_season : await tx.query.seasons.findFirst({
            where: (s, { eq }) => and (eq(s.relatedseasonid, 0), eq(s.beginseasonid, active_season.beginseasonid), eq(s.isspring, true)),
            orderBy: (s, { asc }) => asc(s.seasonid),
        });


        if (!fall || !spring) {
            throw new Error(
                "Error occurred in season fetch. Could not find fall or spring semester"
            );
        }

        return { year, fall, spring } satisfies threeSeasons;
    });
}

export async function getSeasonDrafts(seasonid: number, tx: dbClient = db) {
    const seasonRows = (await tx.query.arrangement.findMany({
        where: eq(arrangement.seasonid, seasonid),
        columns: {
            activestatus: false,
            regstatus: false,
            lastmodify: false,
            updateby: false,
        },
        orderBy: (arrangement, { asc }) => [
            asc(arrangement.suitableterm),
            asc(arrangement.agelimit),
        ],
    })) satisfies uiClasses[];

    return seasonRows;
}
