import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { arrangement } from "@/lib/db/schema";
import { type threeSeasons } from "@/types/seasons.types";
import { type dbClient } from "@/types/server.types";
import { type uiClasses } from "@/types/shared.types";

export default async function getThreeSeasons(client: dbClient = db) {
    return await client.transaction(async (tx) => {
        const year = await tx.query.seasons.findFirst({
            where: (s, { eq }) => eq(s.status, "Active"),
            orderBy: (s, { asc }) => asc(s.seasonid),
        });
        if (!year) {
            throw new Error("No active season found");
        }

        const [fall, spring] = await tx.query.seasons.findMany({
            where: (s, { and, eq }) =>
                and(eq(s.seasonid, year.relatedseasonid), eq(s.seasonid, year.beginseasonid)),
            orderBy: (s, { asc }) => asc(s.seasonid),
        });

        // if (!fall || !spring) {
        //     throw new Error(
        //         "Error occurred in season fetch. Could not find fall or spring semester"
        //     );
        // }

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
