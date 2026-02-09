import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { type threeSeasons } from "@/types/seasons.types";
import { requireRole } from "@/server/auth/actions";
import { calculateBalance } from "@/server/familymanagement/actions";
import { getSelectOptions } from "@/server/seasons/actions/getSelectOptions";
import fetchCurrentSeasons from "@/server/seasons/data";
import RegisterStudent from "@/components/registration/family/register-students";

export default async function RegisterPage() {
    // 1. Get User
    const user = await requireRole(["FAMILY"], { redirect: true });
    const userRow = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, user.user.id),
    });
    if (!userRow) {
        redirect("/login");
    }

    const res = await fetchCurrentSeasons();
    const seasons = { year: res.year, fall: res.fall, spring: res.spring } satisfies threeSeasons;

    // 4. Get arrangements for each separate term
    const yearArrangements = await db.query.arrangement.findMany({
        where: (arrangement, { eq }) => eq(arrangement.seasonid, seasons.year.seasonid),
    });

    const fallArrangements = await db.query.arrangement.findMany({
        where: (arrangement, { eq }) => eq(arrangement.seasonid, seasons.fall.seasonid),
    });

    const springArrangements = await db.query.arrangement.findMany({
        where: (arrangement, { eq }) => eq(arrangement.seasonid, seasons.spring.seasonid),
    });

    const allArrs = { year: yearArrangements, fall: fallArrangements, spring: springArrangements };

    // 5. Get family and students
    const userFamily = await db.query.family.findFirst({
        where: (family, { eq }) => eq(family.userid, user.user.id),
    });
    if (!userFamily) {
        throw new Error("No family found on register page");
    }
    const userStudents = await db.query.student.findMany({
        where: (student, { eq }) => eq(student.familyid, userFamily.familyid),
    });

    // 6. Get select options and idMaps
    const { idMaps } = await getSelectOptions();

    // 7. Get existing class registrations
    const classregistrations = await db.query.classregistration.findMany({
        where: (reg, { or, and, eq }) =>
            and(
                eq(reg.familyid, userFamily.familyid),
                or(
                    eq(reg.seasonid, seasons.year.seasonid),
                    eq(reg.seasonid, seasons.fall.seasonid),
                    eq(reg.seasonid, seasons.spring.seasonid)
                )
            ),
    });

    // 8. Get existing reg change requests
    const regchangerequests = await db.query.regchangerequest.findMany({
        where: (rcr, { and, or, eq }) =>
            and(
                eq(rcr.familyid, userFamily.familyid),
                or(
                    eq(rcr.seasonid, seasons.year.seasonid),
                    eq(rcr.seasonid, seasons.fall.seasonid),
                    eq(rcr.seasonid, seasons.spring.seasonid)
                )
            ),
    });

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
    );
}
