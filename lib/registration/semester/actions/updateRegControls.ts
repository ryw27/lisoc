"use server";
import { db } from "@/lib/db";
import { seasons } from "@/lib/db/schema";
import { eq, InferSelectModel, or } from "drizzle-orm";
import { toESTString } from "@/lib/utils";
import { z } from "zod/v4";
import { seasonRegSettingsSchema } from "@/lib/registration/validation";
import { revalidatePath } from "next/cache";
import { term } from "@/lib/registration/types";

export async function updateRegControls(data: z.infer<typeof seasonRegSettingsSchema>, inSeason: InferSelectModel<typeof seasons>, changeSeason: term) {
    const parsed = seasonRegSettingsSchema.parse(data);
    await db.transaction(async (tx) => {
        const seasonIds = [inSeason.seasonid, inSeason.seasonid + 1, inSeason.seasonid + 2];
        const where =
            changeSeason === "year"
                ? or(...seasonIds.map(id => eq(seasons.seasonid, id))) // Change all 3
                : eq( // Or change one term
                    seasons.seasonid,
                    changeSeason === "fall"
                        ? inSeason.seasonid + 1
                        : inSeason.seasonid + 2
                );

        const [updated] = await tx
            .update(seasons)
            .set({
                ...(parsed.isspring !== undefined ? { isspring: parsed.isspring } : {}),
                haslateregfee: parsed.haslateregfee,
                haslateregfee4newfamily: parsed.haslateregfee4newfamily,
                hasdutyfee: parsed.hasdutyfee,
                showadmissionnotice: parsed.showadmissionnotice,
                showteachername: parsed.showteachername,
                days4showteachername: parsed.days4showteachername,
                allownewfamilytoregister: parsed.allownewfamilytoregister,
                date4newfamilytoregister: toESTString(parsed.date4newfamilytoregister),
            })
            .where(where)
            .returning();

        if (!updated) {
            throw new Error("Unknown DB error occured with season update");
        }

        revalidatePath("/admintest/management/semester")
        return updated;
    })
}