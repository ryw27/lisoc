"use server";

import { db } from "@/lib/db";
import { type uiClasses } from "@/types/shared.types";
import { getSeasonDrafts } from "../data";

export async function getCurrentSeason(seasonid: number): Promise<uiClasses[]> {
    return await db.transaction(async (tx) => {
        return await getSeasonDrafts(seasonid, tx);
    });
}
