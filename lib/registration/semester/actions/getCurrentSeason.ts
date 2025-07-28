import { db } from "@/lib/db";
import { uiClasses } from "../../types";
import { getSeasonDrafts } from "../helpers";


export async function getCurrentSeason(seasonid: number): Promise<uiClasses[]> {
    return await db.transaction(async (tx) => {
        return await getSeasonDrafts(tx, seasonid);
    })
}

