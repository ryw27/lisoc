import { db } from "@/lib/db";
import { arrangement, classregistration, classtime, student } from "@/lib/db/schema";
import { arrangementSchema } from "@/lib/schema";
import { REGSTATUS_REGISTERED, REGSTATUS_SUBMITTED, toESTString } from "@/lib/utils";
import { type regKind, type uniqueRegistration } from "@/types/registration.types";
import { type seasonObj, type uiClasses } from "@/types/shared.types";
import { and, count, eq, inArray, lt, or, sql } from "drizzle-orm";
import { z } from "zod/v4";
import fetchCurrentSeasons from "../seasons/data";

//-----------------------------------------------------------------------------------------
//  DESC: None of these should be used, except by server actions.
//  Most of this is business logic or reusable db calls
//-----------------------------------------------------------------------------------------

export type Transaction = Parameters<Parameters<(typeof db)["transaction"]>[0]>[0];

export function canDrop(season: Partial<seasonObj>) {
    if (!season.canceldeadline) {
        throw new Error("Old season must have cancel deadline field");
    }
    const now = new Date(toESTString(new Date()));
    return now <= new Date(season.canceldeadline);
}

export function canTransferOutandIn(
    oldSeason: Partial<seasonObj>,
    newSeason: Partial<seasonObj>,
    closereg: boolean
): boolean {
    if (!oldSeason.canceldeadline) {
        throw new Error("Old season must have cancel deadline field");
    }
    if (!newSeason.earlyregdate || !newSeason.closeregdate) {
        throw new Error("New season must have earlyregdate and closeregdate fields");
    }
    const now = new Date(toESTString(new Date()));
    return now <= new Date(oldSeason.canceldeadline) && inReg(newSeason, closereg);
}

export function inReg(season: Partial<seasonObj>, closereg: boolean): boolean {
    if (!season.earlyregdate || !season.closeregdate) {
        throw new Error("Season must have earlyregdate and closeregdate");
    }
    if (!closereg) return true;
    const now = new Date(toESTString(new Date()));
    const early = new Date(season.earlyregdate);
    const close = new Date(season.closeregdate);
    return now >= early && now <= close;
}

export function inSession(season: seasonObj): boolean {
    const now = new Date(toESTString(new Date()));
    return now >= new Date(season.earlyregdate) && now <= new Date(season.enddate);
}

export async function isLateReg(tx: Transaction, arrData: uiClasses) {
    const { year, fall, spring } = await fetchCurrentSeasons(tx);
    const now = new Date(toESTString(new Date()));
    if (year.seasonid === arrData.seasonid)
        return now <= new Date(year.closeregdate) && now >= new Date(year.lateregdate1);
    if (fall.seasonid === arrData.seasonid)
        return now <= new Date(fall.closeregdate) && now >= new Date(fall.lateregdate1);
    if (spring.seasonid === arrData.seasonid)
        return now <= new Date(spring.closeregdate) && now >= new Date(spring.lateregdate1);
    throw new Error("Cannot find class season");
}

export async function isEarlyReg(tx: Transaction, arrData: uiClasses) {
    const { year, fall, spring } = await fetchCurrentSeasons(tx);
    const now = new Date(toESTString(new Date()));
    if (year.seasonid === arrData.seasonid)
        return now <= new Date(year.normalregdate) && now >= new Date(year.earlyregdate);
    if (fall.seasonid === arrData.seasonid)
        return now <= new Date(fall.normalregdate) && now >= new Date(fall.earlyregdate);
    if (spring.seasonid === arrData.seasonid)
        return now <= new Date(spring.normalregdate) && now >= new Date(spring.earlyregdate);
    throw new Error("Cannot find class season");
}

export async function getSubClassrooms(regclassid: number) {
    const classrooms = await db.query.classes.findMany({
        where: (c, { eq }) => eq(c.gradeclassid, regclassid),
    });

    return classrooms;
}

export async function getTermVariables(
    parsedData: z.infer<typeof arrangementSchema>,
    season: seasonObj,
    tx: Transaction
) {
    const { year, fall, spring } = await fetchCurrentSeasons(tx);
    // const now = new Date(toESTString(new Date()));
    const seasonid = season.seasonid;

    if (seasonid === year.seasonid) {
        // Full academic year
        return {
            seasonid: year.seasonid,
            activestatus: inSession(year) ? "Active" : "Inactive",
            regstatus: inReg(year, parsedData.closeregistration) ? "Open" : "Closed",
        };
    }

    if (seasonid === spring.seasonid) {
        return {
            seasonid: spring.seasonid,
            activestatus: inSession(spring) ? "Active" : "Inactive",
            regstatus: inReg(spring, parsedData.closeregistration) ? "Open" : "Closed",
        };
    }

    if (seasonid === fall.seasonid) {
        return {
            seasonid: fall.seasonid,
            activestatus: inSession(fall) ? "Active" : "Inactive",
            regstatus: inReg(fall, parsedData.closeregistration) ? "Open" : "Closed",
        };
    }

    throw new Error("No valid season found");
}

export async function getArrSeason(
    tx: Transaction,
    arrData: uiClasses
): Promise<"year" | "fall" | "spring"> {
    const { year, fall, spring } = await fetchCurrentSeasons(tx);
    const seasonid = arrData.seasonid;
    if (seasonid === year.seasonid) return "year";
    if (seasonid === fall.seasonid) return "fall";
    if (seasonid === spring.seasonid) return "spring";
    // default to year
    return "year";
}

export async function getTotalPrice(
    tx: Transaction,
    arrData: uiClasses,
    season?: "year" | "fall" | "spring"
) {
    // in practice these should never be null
    if (season) {
        const totalPrice =
            season === "year" || season === "fall"
                ? Number(arrData.tuitionW) + Number(arrData.bookfeeW) + Number(arrData.specialfeeW)
                : Number(arrData.tuitionH) + Number(arrData.bookfeeH) + Number(arrData.specialfeeH);
        return totalPrice;
    } else {
        const term = await getArrSeason(tx, arrData);
        const totalPrice =
            term === "year" || term === "fall"
                ? Number(arrData.tuitionW) + Number(arrData.bookfeeW) + Number(arrData.specialfeeW)
                : Number(arrData.tuitionH) + Number(arrData.bookfeeH) + Number(arrData.specialfeeH);
        return totalPrice;
    }
}

// TODO: Business logic of half term registration in a full class has not been incorporated. A bunch of functions, mostly here, require this.
export async function canRegister(
    tx: Transaction,
    regData: uiClasses,
    arrSeason: seasonObj
): Promise<regKind> {
    // 1. Check if valid arrangement
    const arrangement = await tx.query.arrangement.findFirst({
        where: (arr, { eq }) => eq(arr.arrangeid, regData.arrangeid as number),
    });

    if (!arrangement) {
        throw new Error("No arrangement found for registered class");
    }

    // 2. Get current date in eastern time
    const now = new Date(toESTString(new Date()));
    const { earlyregdate, earlyregdate2, closeregdate, lateregdate1, lateregdate2 } = arrSeason;

    if (arrangement.closeregistration == true || now > new Date(closeregdate)) {
        return "closed";
    }

    // Registration closed if before early reg or after close reg
    /*    if (now < new Date(earlyregdate) || now > new Date(closeregdate)) {
        return "closed";
    }
*/
    // up to here not closed and now < closeregdate
    // Late2 registration period
    if (now >= new Date(lateregdate2)) {
        return "late2";
    }

    // Late1 registration period
    if (now >= new Date(lateregdate1)) {
        return "late1";
    }

    // Early registration period
    if (now <= new Date(earlyregdate)) {
        return "early";
    }

    if (earlyregdate2 && now <= new Date(earlyregdate2)) {
        return "early2";
    }

    // Fallback: closed
    return "normal";
}

// Ensures that a registration for a given timeline (class time) does not conflict with existing registrations.
// Returns true if registration is allowed, false otherwise.
//
// A student may only occupy one class per time slot. Overlap is decided from classtime.timebegin /
// timeend so "both periods" (1:30-4:30) conflicts with either single period. Only active
// (submitted/registered) registrations count so a student can re-register after a drop or transfer.
export async function ensureTimeline(
    tx: Transaction,
    curtimeid: number,
    regInfo: uniqueRegistration
): Promise<boolean> {
    // Serialize concurrent registrations for this student so two parallel requests cannot both
    // pass the conflict check and double-book the same period.
    await tx
        .select({ studentid: student.studentid })
        .from(student)
        .where(eq(student.studentid, regInfo.studentid))
        .limit(1)
        .for("update");

    const [curTime] = await tx
        .select({ timebegin: classtime.timebegin, timeend: classtime.timeend })
        .from(classtime)
        .where(eq(classtime.timeid, curtimeid))
        .limit(1);
    if (!curTime) {
        throw new Error("Class time not found for this arrangement");
    }

    // Legacy rows may carry arrangeid = 0; fall back to matching the arrangement by class + season.
    const [conflict] = await tx
        .select({ regid: classregistration.regid })
        .from(classregistration)
        .innerJoin(
            arrangement,
            or(
                eq(classregistration.arrangeid, arrangement.arrangeid),
                and(
                    eq(classregistration.arrangeid, 0),
                    eq(classregistration.classid, arrangement.classid),
                    eq(classregistration.seasonid, arrangement.seasonid)
                )
            )
        )
        .innerJoin(classtime, eq(arrangement.timeid, classtime.timeid))
        .where(
            and(
                eq(classregistration.seasonid, regInfo.seasonid),
                eq(classregistration.studentid, regInfo.studentid),
                inArray(classregistration.statusid, [REGSTATUS_SUBMITTED, REGSTATUS_REGISTERED]),
                // Two slots overlap when each starts before the other ends.
                lt(classtime.timebegin, curTime.timeend),
                lt(sql`${curTime.timebegin}::numeric`, classtime.timeend)
            )
        )
        .limit(1);

    return !conflict;
}

// Ensures the class still has an open seat. Returns true if registration is allowed, false otherwise.
// A null or 0 seatlimit means unlimited.
export async function ensureSeats(
    tx: Transaction,
    arrData: uiClasses,
    seasonid: number
): Promise<boolean> {
    if (arrData.arrangeid == null) {
        throw new Error("Arrangement id missing for registration");
    }
    if (arrData.seatlimit == null || arrData.seatlimit === 0) return true;

    // Serialize concurrent registrations for this class: without this lock two callers can both
    // read taken < seatlimit and both insert, putting the class over its limit.
    await tx
        .select({ arrangeid: arrangement.arrangeid })
        .from(arrangement)
        .where(eq(arrangement.arrangeid, arrData.arrangeid))
        .limit(1)
        .for("update");

    // Only active registrations occupy a seat; dropped and transferred students release theirs.
    const [taken] = await tx
        .select({ count: count() })
        .from(classregistration)
        .where(
            and(
                eq(classregistration.seasonid, seasonid),
                eq(classregistration.arrangeid, arrData.arrangeid),
                eq(classregistration.classid, arrData.classid),
                inArray(classregistration.statusid, [REGSTATUS_SUBMITTED, REGSTATUS_REGISTERED])
            )
        );

    return taken.count < arrData.seatlimit;
}
