"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { seasons } from "@/lib/db/schema";
import { threeSeasons } from "@/types/seasons.types";
import fetchCurrentSeasons from "../data";

export async function updatePolicy(data: string) {
    const inSeason: threeSeasons = await fetchCurrentSeasons();

    await db.transaction(async (tx) => {
        await tx
            .update(seasons)
            .set({
                notes: data,
            })
            .where(eq(seasons.seasonid, inSeason.fall.seasonid));
    });

    revalidatePath("/admin/management/semester");
}
