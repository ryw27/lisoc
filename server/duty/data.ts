import { and, asc, eq, notExists, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
    classes,
    classregistration,
    dutyassignment,
    family,
    student,
    users,
} from "@/lib/db/schema";
import { REGSTATUS_REGISTERED } from "@/lib/utils";
import {
    type DutyAssignmentRow,
    type DutyAssignments,
    type DutyDateOption,
    type DutyRoster,
    type SeasonFilterOptions,
    type SeasonYearOption,
} from "@/types/duty.types";
import { requireRole } from "@/server/auth/actions";

/** Seasons default their dates to the 1900 sentinel, which means "not set". */
function isRealDate(timestamp: string | null | undefined) {
    return Boolean(timestamp) && !timestamp!.startsWith("1900-");
}

/**
 * Every Sunday from `start` to `end` inclusive. Season timestamps carry no timezone, so
 * only the date part is used and the arithmetic is done in UTC to avoid shifting a day.
 */
function sundaysBetween(start: string, end: string): DutyDateOption[] {
    const toUTC = (timestamp: string) => {
        const [year, month, day] = timestamp.slice(0, 10).split("-").map(Number);
        return Number.isNaN(year) ? null : new Date(Date.UTC(year, month - 1, day));
    };

    const from = toUTC(start);
    const to = toUTC(end);
    if (!from || !to || from > to) return [];

    // Advance to the first Sunday on or after the start date.
    from.setUTCDate(from.getUTCDate() + ((7 - from.getUTCDay()) % 7));

    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    const dates: DutyDateOption[] = [];
    for (const date = from; date <= to; date.setUTCDate(date.getUTCDate() + 7)) {
        dates.push({ value: date.toISOString().slice(0, 10), label: formatter.format(date) });
    }
    return dates;
}

/** Chinese name if one was filled in, otherwise the English "first last". */
function displayName(namecn: string | null, firsten: string | null, lasten: string | null) {
    return namecn?.trim() || [firsten, lasten].filter(Boolean).join(" ");
}

/**
 * Every academic year in `seasons`, grouped by `beginseasonid` (the fall semester's own id).
 * Within a group: fall is `relatedseasonid = 0, isspring = false`, spring is
 * `relatedseasonid = 0, isspring = true`, and the year row is `relatedseasonid = beginseasonid`.
 */
export async function fetchSeasonFilterOptions(): Promise<SeasonFilterOptions> {
    await requireRole(["ADMIN"]);

    const allSeasons = await db.query.seasons.findMany({
        orderBy: (s, { asc }) => asc(s.seasonid),
    });

    const groups = new Map<number, SeasonYearOption>();
    for (const season of allSeasons) {
        if (!season.beginseasonid) continue; // Unlinked/legacy rows have no academic year
        const group = groups.get(season.beginseasonid) ?? {
            beginseasonid: season.beginseasonid,
            label: "",
            fallseasonid: null,
            springseasonid: null,
        };

        if (season.relatedseasonid === season.beginseasonid) {
            group.label = season.seasonnameeng; // The academic-year row, e.g. "2025-2026"
        } else if (season.isspring) {
            group.springseasonid = season.seasonid;
        } else {
            group.fallseasonid = season.seasonid;
        }

        groups.set(season.beginseasonid, group);
    }

    const activeSeason = allSeasons.find((s) => s.status === "Active");

    return {
        years: [...groups.values()]
            .map((group) => ({
                ...group,
                label: group.label || `Season ${group.beginseasonid}`,
            }))
            .sort((a, b) => b.beginseasonid - a.beginseasonid), // Newest year first
        currentBeginSeasonId: activeSeason?.beginseasonid ?? null,
    };
}

/**
 * The duty dates for an academic year: every Sunday of the full year, from the academic-year
 * row's start/end dates. When those are unset it falls back to the fall semester's start date
 * and the spring semester's end date.
 */
export async function fetchDutyDates(beginseasonid: number | null): Promise<DutyDateOption[]> {
    await requireRole(["ADMIN"]);

    if (!beginseasonid) return [];

    const yearSeasons = await db.query.seasons.findMany({
        where: (s, { eq }) => eq(s.beginseasonid, beginseasonid),
    });

    const yearRow = yearSeasons.find((s) => s.relatedseasonid === s.beginseasonid);
    const fallRow = yearSeasons.find((s) => s.relatedseasonid === 0 && !s.isspring);
    const springRow = yearSeasons.find((s) => s.relatedseasonid === 0 && s.isspring);

    const start = isRealDate(yearRow?.startdate) ? yearRow!.startdate : fallRow?.startdate;
    const end = isRealDate(yearRow?.enddate) ? yearRow!.enddate : springRow?.enddate;

    if (!isRealDate(start) || !isRealDate(end)) return [];

    return sundaysBetween(start!, end!);
}

/**
 * Every REGISTERED class registration in `seasonid` that has no duty assignment yet — one row
 * per student/class — with the parents' names off the family row and the contact info off the
 * linked user row.
 * Column filtering happens client-side in the roster table.
 */
export async function fetchDutyRoster(seasonid: number | null): Promise<DutyRoster> {
    await requireRole(["ADMIN"]);

    if (!seasonid) {
        return { seasonid: null, seasonname: null, assignedcount: 0, rows: [] };
    }

    const season = await db.query.seasons.findFirst({
        where: (s, { eq }) => eq(s.seasonid, seasonid),
    });

    if (!season) {
        return { seasonid: null, seasonname: null, assignedcount: 0, rows: [] };
    }

    const [{ assignedcount }] = await db
        .select({ assignedcount: sql<number>`count(*)::int` })
        .from(dutyassignment)
        .where(eq(dutyassignment.seasonid, season.seasonid));

    const rows = await db
        .selectDistinct({
            familyid: classregistration.familyid,
            studentid: classregistration.studentid,
            classid: classregistration.classid,
            classnameen: classes.classnameen,
            classnamecn: classes.classnamecn,
            studentnamecn: student.namecn,
            studentfirsten: student.namefirsten,
            studentlasten: student.namelasten,
            fathernamecn: family.fathernamecn,
            fatherfirsten: family.fatherfirsten,
            fatherlasten: family.fatherlasten,
            mothernamecn: family.mothernamecn,
            motherfirsten: family.motherfirsten,
            motherlasten: family.motherlasten,
            address: users.address,
            phone: users.phone,
            email: users.email,
        })
        .from(classregistration)
        .innerJoin(family, eq(family.familyid, classregistration.familyid))
        .leftJoin(student, eq(student.studentid, classregistration.studentid))
        .leftJoin(classes, eq(classes.classid, classregistration.classid))
        .leftJoin(users, eq(users.id, family.userid))
        .where(
            and(
                eq(classregistration.seasonid, season.seasonid),
                eq(classregistration.statusid, REGSTATUS_REGISTERED),
                // Students already holding a duty row for the season are no longer available.
                notExists(
                    db
                        .select({ dutyassignid: dutyassignment.dutyassignid })
                        .from(dutyassignment)
                        .where(
                            and(
                                eq(dutyassignment.seasonid, season.seasonid),
                                eq(dutyassignment.familyid, classregistration.familyid),
                                eq(dutyassignment.studentid, classregistration.studentid)
                            )
                        )
                )
            )
        )
        .orderBy(
            asc(classregistration.familyid),
            asc(classregistration.studentid),
            asc(classes.classnameen)
        );

    return {
        seasonid: season.seasonid,
        seasonname: season.seasonnameeng,
        assignedcount,
        rows: rows.map((r) => ({
            familyid: r.familyid,
            studentid: r.studentid,
            studentname: displayName(r.studentnamecn, r.studentfirsten, r.studentlasten),
            classid: r.classid,
            classname: r.classnameen ?? r.classnamecn ?? "",
            fathername: displayName(r.fathernamecn, r.fatherfirsten, r.fatherlasten),
            mothername: displayName(r.mothernamecn, r.motherfirsten, r.motherlasten),
            address: r.address ?? "",
            phone: r.phone ?? "",
            email: r.email ?? "",
        })),
    };
}

/** Every duty assignment in `seasonid`, with the parents and contact info joined in. */
export async function fetchDutyAssignments(seasonid: number | null): Promise<DutyAssignments> {
    await requireRole(["ADMIN"]);

    if (!seasonid) {
        return { seasonid: null, seasonname: null, rows: [] };
    }

    const season = await db.query.seasons.findFirst({
        where: (s, { eq }) => eq(s.seasonid, seasonid),
    });

    if (!season) {
        return { seasonid: null, seasonname: null, rows: [] };
    }

    const rows = await db
        .select({
            dutyassignid: dutyassignment.dutyassignid,
            familyid: dutyassignment.familyid,
            dutydate: dutyassignment.dutydate,
            studentnamecn: student.namecn,
            studentfirsten: student.namefirsten,
            studentlasten: student.namelasten,
            dutystatus: dutyassignment.dutystatus,
            note: dutyassignment.note,
            fathernamecn: family.fathernamecn,
            fatherfirsten: family.fatherfirsten,
            fatherlasten: family.fatherlasten,
            mothernamecn: family.mothernamecn,
            motherfirsten: family.motherfirsten,
            motherlasten: family.motherlasten,
            phone: users.phone,
            email: users.email,
            address: users.address,
        })
        .from(dutyassignment)
        .innerJoin(family, eq(family.familyid, dutyassignment.familyid))
        .leftJoin(student, eq(student.studentid, dutyassignment.studentid))
        .leftJoin(users, eq(users.id, family.userid))
        .where(eq(dutyassignment.seasonid, season.seasonid))
        .orderBy(asc(dutyassignment.dutyassignid));

    return {
        seasonid: season.seasonid,
        seasonname: season.seasonnameeng,
        rows: rows.map(
            (r): DutyAssignmentRow => ({
                dutyassignid: r.dutyassignid,
                familyid: r.familyid,
                studentname: displayName(r.studentnamecn, r.studentfirsten, r.studentlasten),
                dutydate: r.dutydate.slice(0, 10),
                mothername: displayName(r.mothernamecn, r.motherfirsten, r.motherlasten),
                fathername: displayName(r.fathernamecn, r.fatherfirsten, r.fatherlasten),
                dutystatus: r.dutystatus,
                phone: r.phone ?? "",
                email: r.email ?? "",
                address: r.address ?? "",
                note: r.note ?? "",
            })
        ),
    };
}
