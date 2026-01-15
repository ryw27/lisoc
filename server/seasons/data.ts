import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { arrangement } from "@/lib/db/schema";
import { type threeSeasons } from "@/types/seasons.types";
import { type dbClient } from "@/types/server.types";
import { type uiClasses } from "@/types/shared.types";

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
        const year = await tx.query.seasons.findFirst({
            where: (s, { eq }) => eq(s.status, "Active"),
            orderBy: (s, { asc }) => asc(s.seasonid),
        });
        if (!year) {
            throw new Error("No active season found");
        }

        const [fall, spring] = await tx.query.seasons.findMany({
            where: (s, { or, eq }) =>
                or(eq(s.seasonid, year.relatedseasonid), eq(s.seasonid, year.beginseasonid)),
            orderBy: (s, { asc }) => asc(s.seasonid),
        });

        console.log(fall, spring);

        const test = await tx.query.seasons.findMany({
            where: (s, { or, eq }) =>
                or(eq(s.seasonid, year.relatedseasonid), eq(s.seasonid, year.beginseasonid)),
            orderBy: (s, { asc }) => asc(s.seasonid),
        });
        console.log(test);

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
