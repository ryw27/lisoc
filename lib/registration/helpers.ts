import { db } from "@/lib/db";
import { arrangement } from "@/lib/db/schema";
import { 
    uiClasses, 
    regKind,
    uniqueRegistration,
} from "@/lib/registration/types";
import { seasonObj } from "@/lib/shared/types";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import { arrangementSchema } from "@/lib/shared/validation";
import { CLASSTIME_PERIOD_BOTH_TIMEID, toESTString } from "@/lib/utils";

//-----------------------------------------------------------------------------------------
//  DESC: None of these should be used, except by server actions. 
//  Most of this is business logic or reusable db calls
//-----------------------------------------------------------------------------------------


export type Transaction = Parameters<Parameters<typeof db["transaction"]>[0]>[0];

export function canDrop(season: Partial<seasonObj>) {
    if (!season.canceldeadline) {
        throw new Error("Old season must have cancel deadline field");
    }
    const now = new Date(toESTString(new Date()));
    return now <= new Date(season.canceldeadline)
}

export function canTransferOutandIn(oldSeason: Partial<seasonObj>, newSeason: Partial<seasonObj>, closereg: boolean): boolean {
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
    const now = new Date(toESTString(new Date()))
    return now >= new Date(season.startdate) && now <= new Date(season.enddate);
}

export async function isLateReg(tx: Transaction, arrData: uiClasses)  {
    const { year, fall, spring } = await getThreeSeasons(tx);
    const now = new Date(toESTString(new Date()))
    if (year.seasonid === arrData.seasonid) return (now <= new Date(year.closeregdate) && now >= new Date(year.lateregdate1))
    if (fall.seasonid === arrData.seasonid) return (now <= new Date(fall.closeregdate) && now >= new Date(fall.lateregdate1))
    if (spring.seasonid === arrData.seasonid) return (now <= new Date(spring.closeregdate) && now >= new Date(spring.lateregdate1))
    throw new Error("Cannot find class season");
}

export async function isEarlyReg(tx: Transaction, arrData: uiClasses) {
    const { year, fall, spring } = await getThreeSeasons(tx);
    const now = new Date(toESTString(new Date()))
    if (year.seasonid === arrData.seasonid) return (now <= new Date(year.normalregdate) && now >= new Date(year.earlyregdate))
    if (fall.seasonid === arrData.seasonid) return (now <= new Date(fall.normalregdate) && now >= new Date(fall.earlyregdate))
    if (spring.seasonid === arrData.seasonid) return (now <= new Date(spring.normalregdate) && now >= new Date(spring.earlyregdate))
    throw new Error("Cannot find class season");
}

export async function getSeasonDrafts(tx: Transaction, seasonid: number) {
    const seasonRows = await tx.query.arrangement.findMany({
        where: eq(arrangement.seasonid, seasonid),
        columns: {
            activestatus: false,
            regstatus: false,
            lastmodify: false,
            updateby: false,
        },
        orderBy: (arrangement, { asc }) => [asc(arrangement.suitableterm), asc(arrangement.agelimit)]
    }) satisfies uiClasses[];

    return seasonRows;
}

export async function getSubClassrooms(regclassid: number) {
    const classrooms = await db.query.classes.findMany({
        where: (c, { eq }) => eq(c.gradeclassid, regclassid)
    });

    return classrooms
}

export async function getTermVariables(
    parsedData: z.infer<typeof arrangementSchema>,
    season: seasonObj,
    tx: Transaction
) {
    const { year, fall, spring } = await getThreeSeasons(tx);
    // const now = new Date(toESTString(new Date()));
    const seasonid = season.seasonid;

    if (seasonid === year.seasonid) {
        // Full academic year
        return {
            seasonid: year.seasonid,
            activestatus: inSession(year) ? "Active" : "Inactive",
            regstatus: inReg(year, parsedData.closeregistration) ? "Open" : "Closed"
        };
    }

    if (seasonid === spring.seasonid) {
        return {
            seasonid: spring.seasonid,
            activestatus: inSession(spring) ? "Active" : "Inactive",
            regstatus: inReg(spring, parsedData.closeregistration) ? "Open" : "Closed"
        };
    }

    if (seasonid === fall.seasonid) {
        return {
            seasonid: fall.seasonid,
            activestatus: inSession(fall) ? "Active" : "Inactive",
            regstatus: inReg(fall, parsedData.closeregistration) ? "Open" : "Closed"
        };
    }

    throw new Error("No valid season found");
}



// TODO: This is slightly suspicious and relies on a lot of things going correct. See if a better, more reliable solution can be found
export async function getThreeSeasons(tx: Transaction) {
    const year = await tx.query.seasons.findFirst({
        where: (s, { eq }) => eq(s.status, "Active"),
        orderBy: (s, { asc }) => asc(s.seasonid)
    });

    if (!year) {
        throw new Error("No active year found");
    }

    const terms = await tx.query.seasons.findMany({
        where: (s, { or, eq }) => or(
            eq(s.seasonid, year.beginseasonid),
            eq(s.seasonid, year.relatedseasonid)
        ),
        orderBy: (s, { asc }) => asc(s.seasonid)
    });

    return { year: year, fall: terms[0], spring: terms[1] };
}

export async function getArrSeason(tx: Transaction, arrData: uiClasses): Promise<"year" | "fall" | "spring"> {
    const { year, fall, spring } = await getThreeSeasons(tx);
    const seasonid = arrData.seasonid;
    if (seasonid === year.seasonid) return "year";
    if (seasonid === fall.seasonid) return "fall";
    if (seasonid === spring.seasonid) return "spring"
    throw new Error("No valid season found");
}

export async function getTotalPrice(tx: Transaction, arrData: uiClasses, season?: "year" | "fall" | "spring") {
    // in practice these should never be null
    if (season) {
        const totalPrice = season === "year" 
            ? Number(arrData.tuitionW) + Number(arrData.bookfeeW) + Number(arrData.specialfeeW)
            : Number(arrData.tuitionH) + Number(arrData.bookfeeH) + Number(arrData.specialfeeH)
        return totalPrice;
    } else {
        const term = await getArrSeason(tx, arrData);
        const totalPrice = term === "year" 
            ? Number(arrData.tuitionW) + Number(arrData.bookfeeW) + Number(arrData.specialfeeW)
            : Number(arrData.tuitionH) + Number(arrData.bookfeeH) + Number(arrData.specialfeeH)
        return totalPrice;
    }
}

// TODO: Business logic of half term registration in a full class has not been incorporated. A bunch of functions, mostly here, require this.
export async function canRegister(tx: Transaction, regData: uiClasses, arrSeason: seasonObj): Promise<regKind> {
    // 1. Check if valid arrangement
    const arrangement = await tx.query.arrangement.findFirst({
        where: (arr, { eq }) => eq(arr.arrangeid, regData.arrangeid as number),
    });

    if (!arrangement) {
        throw new Error("No arrangement found for registered class");
    }

    // 2. Get current date in eastern time
    const now = new Date(toESTString(new Date()));
    const { earlyregdate, closeregdate, lateregdate1, lateregdate2, normalregdate } = arrSeason;

    if (arrangement.closeregistration !== true) {
        return "noclosereg";
    }

    // Registration closed if before early reg or after close reg
    if (now < new Date(earlyregdate) || now > new Date(closeregdate)) {
        return "closed";
    }

    // Late2 registration period
    if (now >= new Date(lateregdate2)) {
        return "late2";
    }

    // Late1 registration period
    if (now >= new Date(lateregdate1)) {
        return "late1";
    }

    // Normal registration period
    if (now >= new Date(normalregdate)) {
        return "normal";
    }

    // Early registration period
    if (now >= new Date(earlyregdate)) {
        return "early";
    }

    // Fallback: closed
    return "closed";
}

// Ensures that a registration for a given timeline (class time) does not conflict with existing registrations.
// Returns true if registration is allowed, false otherwise.
export async function ensureTimeline(
    tx: Transaction,
    curtimeid: number,
    regInfo: uniqueRegistration
): Promise<boolean> {
    // If the class time is "both periods", check for any registration for this student/family/class/season
    if (curtimeid === CLASSTIME_PERIOD_BOTH_TIMEID) {
        const reg = await tx.query.classregistration.findFirst({
            where: (cr, { and, or, eq }) =>
                and(
                    eq(cr.seasonid, regInfo.seasonid),
                    eq(cr.familyid, regInfo.familyid),
                    eq(cr.studentid, regInfo.studentid),
                    eq(cr.classid, regInfo.classid),
                    or(eq(cr.statusid, 1), eq(cr.statusid, 2))  // Submitted or registered, still being considered or already paid
                ),
        });
        return !reg;
    }

    // For a specific class time, check if the student is already registered for this class/time/season/family
    const reg = await tx.query.classregistration.findFirst({
        where: (cr, { and, eq }) =>
            and(
                eq(cr.seasonid, regInfo.seasonid),
                eq(cr.familyid, regInfo.familyid),
                eq(cr.studentid, regInfo.studentid),
                eq(cr.classid, regInfo.classid)
            ),
        with: {
            class: {
                with: {
                    arrangements: {
                        columns: { timeid: true }
                    }
                }
            }
        }
    });

    // If registration exists, check if any arrangement matches the current time id
    if (reg?.class?.arrangements?.some(a => a.timeid === curtimeid)) {
        return false;
    }

    return true;
}

