import { requireRole } from "@/lib/auth/actions/requireRole";
import { db } from "@/lib/db";
import { type threeSeasons } from "@/lib/registration/types";
import RegisterStudent from "@/components/registration/family/register-students";
import { getSelectOptions } from "@/lib/registration/semester";
import { redirect } from "next/navigation";
import calculateBalance from "@/lib/family/actions/calculateBalance";

export default async function RegisterPage() {
    // 1. Get User
    const user = await requireRole(["FAMILY"], { redirect: true });
    const userRow = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, user.user.userid)
    });
    if (!userRow) {
        redirect("/login");
    }

    // 2. Get active school year
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

    // 3. Get fall and spring
    const terms = await db.query.seasons.findMany({
        where: (s, { or, eq }) => or(
            eq(s.seasonid, activeYear.beginseasonid),
            eq(s.seasonid, activeYear.relatedseasonid)
        ),
        orderBy: (s, { asc }) => asc(s.seasonid)
    });
    if (terms.length !== 2) {
        return (
            <div>
                Error occured. Please report.
            </div>
        )
    }

    const seasons = { year: activeYear, fall: terms[0], spring: terms[1] } satisfies threeSeasons;

    // 4. Get arrangements for each separate term
    const yearArrangements = await db.query.arrangement.findMany({
        where: (arrangement, { eq }) => eq(arrangement.seasonid, seasons.year.seasonid)
    });

    const fallArrangements = await db.query.arrangement.findMany({
        where: (arrangement, { eq }) => eq(arrangement.seasonid, seasons.fall.seasonid)
    });

    const springArrangements = await db.query.arrangement.findMany({
        where: (arrangement, { eq }) => eq(arrangement.seasonid, seasons.spring.seasonid)
    });

    const allArrs = { year: yearArrangements, fall: fallArrangements, spring: springArrangements };


    // 5. Get family and students
    const userFamily = await db.query.family.findFirst({
        where: (family, { eq }) => eq(family.userid, user.user.userid)
    });
    if (!userFamily) {
        throw new Error("No family found on register page")
    }
    const userStudents = await db.query.student.findMany({
        where: (student, { eq }) => eq(student.familyid, userFamily.familyid)
    })


    // 6. Get select options and idMaps
    const { idMaps } = await getSelectOptions()


    // 7. Get existing class registrations
    const classregistrations = await db.query.classregistration.findMany({
        where: (reg, { or, and, eq }) => and(
            eq(reg.familyid, userFamily.familyid), 
            or(eq(reg.seasonid, seasons.year.seasonid), eq(reg.seasonid, seasons.fall.seasonid), eq(reg.seasonid, seasons.spring.seasonid))
        )
    })


    // 8. Get existing reg change requests
    const regchangerequests = await db.query.regchangerequest.findMany({
        where: (rcr, { and, or, eq }) => and(
            eq(rcr.familyid, userFamily.familyid), 
            or(eq(rcr.seasonid, seasons.year.seasonid), eq(rcr.seasonid, seasons.fall.seasonid), eq(rcr.seasonid, seasons.spring.seasonid))
        )
    })

    // 9. Get total balances
    const balancePrices = await calculateBalance(userFamily, seasons);

    return (
        <RegisterStudent 
            seasons={seasons} 
            threeArrs={allArrs}
            family={userFamily}
            students={userStudents}
            registrations={classregistrations}
            regchangerequests={regchangerequests}
            termPrices={balancePrices}
            idMaps={idMaps}
        />
    )
}