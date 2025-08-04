"use server";
import { db } from "@/lib/db";
import { threeSeasons } from "@/lib/registration/types";


export default async function getThreeSeasons() {
    return await db.transaction(async (tx) => {
        const year = await tx.query.seasons.findFirst({
            where: (s, { eq }) => eq(s.status, "Active"),
            orderBy: (s, { asc }) => asc(s.seasonid),
        });
        if (!year) {
            throw new Error("No active season found");
        }

        const [fall, spring] = await tx.query.seasons.findMany({
            where: (s, { and, eq }) =>
                and(
                    eq(s.seasonid, year.relatedseasonid),
                    eq(s.seasonid, year.beginseasonid)
                ),
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