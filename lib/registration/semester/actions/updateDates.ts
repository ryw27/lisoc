"use server";
import { db } from "@/lib/db";
import { seasons } from "@/lib/db/schema";
import { eq, InferSelectModel } from "drizzle-orm";
import { toESTString } from "@/lib/utils";
import { z } from "zod/v4";
import { seasonDatesSchema } from "@/lib/registration/validation";
import { revalidatePath } from "next/cache";

// TODO: Add better validation for dates
export async function updateDates(data: z.infer<typeof seasonDatesSchema>, inSeason: InferSelectModel<typeof seasons>) {
    const parsed = seasonDatesSchema.parse(data);
    await db.transaction(async (tx) => {
        const [updatedYear] = await tx
        .update(seasons)
        .set({
            startdate: toESTString(parsed.fallstart),
            enddate: toESTString(parsed.springend),
            earlyregdate: toESTString(parsed.fallearlyreg),
            normalregdate: toESTString(parsed.fallnormalreg), 
            lateregdate1: toESTString(parsed.falllatereg),
            lateregdate2: toESTString(parsed.falllatereg),
            closeregdate: toESTString(parsed.fallclosereg),
            canceldeadline: toESTString(parsed.fallcanceldeadline),
        })
        .where(eq(seasons.seasonid, inSeason.seasonid))
        .returning();

        if (!updatedYear) {
            throw new Error("Unknown DB error occured with season update");
        }

        if (inSeason.seasonid + 1 !== inSeason.beginseasonid) {
            throw new Error("Fall Semester ID does not match expected value in academic year row");
        }

        const [updatedFall] = await tx
            .update(seasons)
            .set({
                startdate: toESTString(parsed.fallstart),
                enddate: toESTString(parsed.fallend),
                earlyregdate: toESTString(parsed.fallearlyreg),
                normalregdate: toESTString(parsed.fallnormalreg), 
                lateregdate1: toESTString(parsed.falllatereg),
                lateregdate2: toESTString(parsed.falllatereg),
                closeregdate: toESTString(parsed.fallclosereg),
                canceldeadline: toESTString(parsed.fallcanceldeadline),
            })
            .where(eq(seasons.seasonid, inSeason.seasonid + 1))
            .returning();

        if (!updatedFall) {
            throw new Error("Unknown DB error occured with fall semester update");
        }

        if (inSeason.seasonid + 2 !== inSeason.relatedseasonid) {
            throw new Error("Spring Semester ID does not match expected value in academic year row");
        }

        const [updatedSpring] = await tx
            .update(seasons)
            .set({
                startdate: toESTString(parsed.springstart),
                enddate: toESTString(parsed.springend),
                earlyregdate: toESTString(parsed.springearlyreg),
                normalregdate: toESTString(parsed.springnormalreg), 
                lateregdate1: toESTString(parsed.springlatereg),
                lateregdate2: toESTString(parsed.springlatereg),
                closeregdate: toESTString(parsed.springclosereg),
                canceldeadline: toESTString(parsed.springcanceldeadline),
            })
            .where(eq(seasons.seasonid, inSeason.seasonid + 2))
            .returning();

        if (!updatedSpring) {
            throw new Error("Unknown DB error occured with spring semester update");
        }

        revalidatePath("/admintest/management/semester")
    })
}