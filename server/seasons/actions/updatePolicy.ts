"use server";

import { db } from "@/lib/db";
import { seasons } from "@/lib/db/schema";
import { threeSeasons } from "@/types/seasons.types";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import fetchCurrentSeasons from "../data";

export async function updatePolicy(data: string) {
    const inSeason : threeSeasons = await fetchCurrentSeasons();

    await db.transaction(async (tx) => {
       await tx
            .update(seasons)
            .set({
                notes: data,
            })
            .where(eq(seasons.seasonid, inSeason.fall.seasonid))


    });

    revalidatePath("/admin/management/semester");

}
