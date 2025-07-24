import { requireRole } from "@/app/lib/auth-lib/auth-actions";
import { db } from "@/app/lib/db";
import { threeBalances, threeSeason } from "@/app/lib/semester/sem-schemas";
import RegisterStudent from "./register-students";
import { getSelectOptions } from "@/app/lib/semester/sem-actions";

export default async function RegisterPage() {
    // 1. Get User
    const user = await requireRole(["FAMILY"], { redirect: true });
    if (!user) {
        return <div>Unauthorized</div>;
    }
    const userRow = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, user.user.userid)
    });
    if (!userRow) {
        return <div>Unauthorized</div>;
    }

    // Get all arrangements for the active season
    // TODO: standardize season fetching
    // Get academic year season
    const activeYear = await db.query.seasons.findFirst({
        where: (season, { eq }) => eq(season.status, "Active"),
        orderBy: (season, { asc }) => [asc(season.seasonid)]
    });

    if (!activeYear) {
        return (
            <div>
                No active semesters. If you think this is a mistake, please contact ...
            </div>
        )
    }

    const curFall = await db.query.seasons.findFirst({
        where: (season, { eq }) => eq(season.seasonid, activeYear.beginseasonid)
    });
    if (!curFall) {
        throw new Error("Cannot find fall");
    }

    const curSpring = await db.query.seasons.findFirst({
        where: (season, { eq }) => eq(season.seasonid, activeYear.relatedseasonid)
    });

    if (!curSpring) {
        throw new Error("Cannot find spring");
    }


    const seasons = { year: activeYear, fall: curFall, spring: curSpring } satisfies threeSeason;

    const yearArrangements = await db.query.arrangement.findMany({
        where: (arrangement, { eq }) => eq(arrangement.seasonid, seasons.year.seasonid)
    });

    const fallArrangements = await db.query.arrangement.findMany({
        where: (arrangement, { eq }) => eq(arrangement.seasonid, seasons.fall.seasonid)
    });

    const springArrangements = await db.query.arrangement.findMany({
        where: (arrangement, { eq }) => eq(arrangement.seasonid, seasons.spring.seasonid)
    });

    // Get current time in EST (America/New_York) for accurate registration comparison
    // TODO: Standardize
    const nowEST = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    );

    const registerSpring = nowEST >= new Date(curSpring.earlyregdate);

    const userFamily = await db.query.family.findFirst({
        where: (family, { eq }) => eq(family.userid, user.user.userid)
    });

    if (!userFamily) {
        throw new Error("No family found on register page")
    }

    const userStudents = await db.query.student.findMany({
        where: (student, { eq }) => eq(student.familyid, userFamily.familyid)
    })

    const { options, idMaps } = await getSelectOptions()


    const classregistrations = await db.query.classregistration.findMany({
        where: (reg, { or, and, eq }) => and(
            eq(reg.familyid, userFamily.familyid), 
            or(eq(reg.seasonid, seasons.year.seasonid), eq(reg.seasonid, seasons.fall.seasonid), eq(reg.seasonid, seasons.spring.seasonid))
        )
    })


    // Fetch family balances for each season in parallel, keyed by seasonid
    const familyBalances = await Promise.all([
        db.query.familybalance.findFirst({
            where: (fb, { eq, and }) => and(
                eq(fb.familyid, userFamily.familyid),
                eq(fb.seasonid, seasons.year.seasonid)
            )
        }),
        db.query.familybalance.findFirst({
            where: (fb, { eq, and }) => and(
                eq(fb.familyid, userFamily.familyid),
                eq(fb.seasonid, seasons.fall.seasonid)
            )
        }),
        db.query.familybalance.findFirst({
            where: (fb, { eq, and }) => and(
                eq(fb.familyid, userFamily.familyid),
                eq(fb.seasonid, seasons.spring.seasonid)
            )
        }),
    ]);
    const balances = {
        year: familyBalances[0] ?? null,
        fall: familyBalances[1] ?? null,
        spring: familyBalances[2] ?? null
    } satisfies threeBalances;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const isNewFamily = new Date(userRow.createon!) > oneDayAgo;

    return (
        <RegisterStudent 
            registrations={classregistrations}
            family={userFamily}
            students={userStudents}
            registerSpring={registerSpring} 
            season={seasons} 
            yearArrs={yearArrangements} 
            fallArrs={fallArrangements} 
            springArrs={springArrangements}
            idMaps={idMaps}
            balances={balances}
        />
    )
}