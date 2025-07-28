import { db } from "@/lib/db";
import { arrangement } from "@/lib/db/schema";
import { 
    uiClasses, 
    selectOptions, 
    IdMaps,
} from "@/lib/registration/types";
import { seasonObj } from "@/lib/shared/types";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import { arrangementSchema } from "@/lib/shared/validation";
import { SEMESTERONLY_SUITBALETERM_FOREIGNKEY } from "@/lib/utils";

type Transaction = Parameters<Parameters<typeof db["transaction"]>[0]>[0];

export function inSpring(springSeason: seasonObj): boolean {
    return new Date(Date.now()) >= new Date(springSeason.earlyregdate);
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

export async function getTermVariables(parsedData: z.infer<typeof arrangementSchema>, season: seasonObj, tx: Transaction) {
    let seasonid = season.seasonid;
    let activestatus = "Active";
    let regstatus = "Open";
    if (parsedData.suitableterm === SEMESTERONLY_SUITBALETERM_FOREIGNKEY) { // ID Number for the semester only key in suitbaleterms. Term should exist if first part is true
        if ("term" in parsedData) {
            // Get the spring semester to check if spring semester is right now
            const springSem = await tx.query.seasons.findFirst({
                where: (seasons, { eq }) => eq(seasons.seasonid, season.relatedseasonid)
            });
            // Spring semester validity check
            if (!springSem || !springSem.isspring || springSem.relatedseasonid !== season.seasonid) {
                throw new Error("[AddArrangement Action Error]: Spring semester not correctly set or wrong season passed in");
            }
            if (parsedData.term === "SPRING") {
                seasonid = season.relatedseasonid;
                ({ regstatus, activestatus } = inSpring(springSem) ? { regstatus: "Open", activestatus: "Active" } : { regstatus: "Close", activestatus: "Inactive" });
            } else {
                // Archival purposes in case
                seasonid = season.beginseasonid; 
                ({ regstatus, activestatus } = inSpring(springSem) ? { regstatus: "Close", activestatus: "Inactive" } : { regstatus: "Open", activestatus: "Active" });
            }
        } else {
            throw new Error("Term does not exist on data despite semester only input");
        }
    }
    return { seasonid, activestatus, regstatus };
}

export async function getSubClassrooms(regclassid: number) {
    const classrooms = await db.query.classes.findMany({
        where: (c, { eq }) => eq(c.gradeclassid, regclassid)
    });

    return classrooms
}

export async function canRegister(regData: uiClasses, tx: Transaction) {
    // Check if valid 
    const arrangement = await tx.query.arrangement.findFirst({
        where: (arr, { eq }) => eq(arr.arrangeid, regData.arrangeid as number),
        with: {
            season: {}
        }
    });

    if (!arrangement) {
        throw new Error("No arrangement found for registered class")
    }

    const now = new Date(Date.now());
    // Spring class and fall
    const springSem = inSpring(arrangement.season);
    if (springSem && !arrangement.season.isspring) {
        return false;
    }
    // Fall class and spring
    else if (!springSem && arrangement.season.isspring) {
        return false;
    }

    // Check for valid registration date - as long as it's after early reg and before late reg
    if (now <= new Date(arrangement.season.earlyregdate) || now >= new Date(arrangement.season.lateregdate1)) {
        return false;
    }

    return true;
}


// Select Options and idMaps for dropdowns
export async function getSelectOptions() {
    const teachers = await db.query.teacher.findMany({
        columns: {
            teacherid: true,
            namecn: true,
            namelasten: true,
            namefirsten: true
        }
    });

    // Get registration classes only
    const classes = await db.query.classes.findMany({
        // where: (classes, { eq }) => eq(classes.gradeclassid, classes.classid), // TODO: Uncomment this
        columns: {
            classid: true,
            classnamecn: true,
            classnameen: true,
        }
    })

    const rooms = await db.query.classrooms.findMany({
        columns: {
            roomid: true,
            roomno: true,
        }
    })

    const times = await db.query.classtime.findMany({
        columns: {
            timeid: true,
            period: true,
        }
    })

    const terms = await db.query.suitableterm.findMany({
        columns: {
            termno: true,
            suitableterm: true,
            suitabletermcn: true 
        }
    })
    const options = {
        teachers: teachers,
        classes: classes,
        rooms: rooms,
        times: times,
        terms: terms
    } satisfies selectOptions;


    const idMaps = {
        teacherMap: Object.fromEntries(
            teachers.map(teacher => [teacher.teacherid, teacher])
        ),
        classMap: Object.fromEntries(
            classes.map(cls => [cls.classid, cls])
        ),
        roomMap: Object.fromEntries(
            rooms.map(room => [room.roomid, room])
        ),
        timeMap: Object.fromEntries(
            times.map(time => [time.timeid, time])
        ),
        termMap: Object.fromEntries(
            terms.map(term => [term.termno, term])
        ),
    } satisfies IdMaps;


    return { options, idMaps };
}