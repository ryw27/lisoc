"use server";

import { z } from "zod/v4";
import { HIGHEST_GRADE, LOWEST_GRADE } from "@/lib/utils";
import { requireRole } from "@/server/auth/actions";
import { getGradeOverview } from "@/server/registration/grade-overview";
import fetchCurrentSeasons from "@/server/seasons/data";

const gradeSchema = z.number().int().min(LOWEST_GRADE).max(HIGHEST_GRADE);

/**
 * Admin home page: classes and students of one grade in the active semester,
 * plus whole-year classes of the current academic year.
 */
export async function getGradeOverviewAction(grade: number) {
    await requireRole(["ADMIN"], { redirect: false });
    const parsed = gradeSchema.parse(grade);

    const seasons = await fetchCurrentSeasons();
    const active = seasons.fall.status === "Active" ? seasons.fall : seasons.spring;

    return getGradeOverview(parsed, [active.seasonid, seasons.year.seasonid]);
}
