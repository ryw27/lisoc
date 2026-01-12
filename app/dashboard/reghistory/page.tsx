import { Suspense } from "react";
import { InferSelectModel } from "drizzle-orm";
import { db } from "@/lib/db";
import { classregistration } from "@/lib/db/schema";
import { requireRole } from "@/server/auth/actions";
import { TableSkeleton } from "@/components/familymanagement/table-skeleton";
import HistoricRegistrations from "@/components/registration/family/historic_registrations";

export default async function RegistrationHistory() {
    const user = await requireRole(["FAMILY"]);

    const userRow = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, user.user.id),
    });
    if (!userRow) {
        throw new Error("User not found");
    }

    const userFamily = await db.query.family.findFirst({
        where: (f, { eq }) => eq(f.userid, userRow.id),
    });
    if (!userFamily) {
        throw new Error("Family account not found");
    }

    // Get registrations
    const historicRegistrations = await db.query.classregistration.findMany({
        where: (reg, { eq }) => eq(reg.familyid, userFamily.familyid),
        orderBy: (reg, { desc }) => desc(reg.registerdate),
    });

    const getNiceArrInfo = async (reg: InferSelectModel<typeof classregistration>) => {
        const arr = await db.query.arrangement.findFirst({
            where: (a, { and, or, eq }) =>
                or(
                    and(eq(a.classid, reg.classid), eq(a.seasonid, reg.seasonid)),
                    eq(a.arrangeid, reg.arrangeid)
                ),
            with: {
                class: {
                    columns: {
                        gradeclassid: true,
                    },
                },
                teacher: {
                    columns: {
                        teacherid: true,
                        namecn: true,
                        namefirsten: true,
                        namelasten: true,
                    },
                },
            },
        });
        if (!arr) {
            return {
                arrinfo: undefined,
                arrSeason: undefined,
                registration: reg,
                regclass: undefined,
                teacher: undefined,
                price: 0,
            };
        }

        const regClass = await db.query.classes.findFirst({
            where: (c, { eq }) => eq(c.classid, arr.class.gradeclassid as number),
        });
        if (!regClass) {
            throw new Error("Could not find reg class ");
        }
        // TODO: Make sure this is ok lol
        const arrSeason = await db.query.seasons.findFirst({
            where: (s, { eq }) => eq(s.seasonid, arr.seasonid),
        });
        if (!arrSeason) {
            throw new Error("Could not find season");
        }

        let halfsem = false;
        if (
            arrSeason.seasonid < arrSeason.beginseasonid &&
            arrSeason.seasonid < arrSeason.relatedseasonid
        ) {
            halfsem = true;
        }

        let totalPrice = 0;
        if (halfsem) {
            totalPrice =
                Number(arr.tuitionH || "0") +
                Number(arr.bookfeeH || "0") +
                Number(arr.specialfeeH || "0");
        } else {
            totalPrice =
                Number(arr.tuitionW || "0") +
                Number(arr.bookfeeW || "0") +
                Number(arr.specialfeeW || "0");
        }

        const niceArrObj = {
            arrinfo: arr,
            arrSeason: arrSeason,
            registration: reg,
            regclass: regClass,
            teacher: arr.teacher,
            price: totalPrice,
        };

        return niceArrObj;
    };

    const enhancedReg = Promise.all(
        historicRegistrations.map(async (r) => {
            const arrangement = await getNiceArrInfo(r);
            return arrangement;
        })
    ).then((results) => {
        // This runs automatically once the data is ready
        return results.filter((r) => r.arrinfo !== undefined);
    });

    const students = db.query.student.findMany({
        where: (s, { eq }) => eq(s.familyid, userFamily.familyid),
    });

    return (
        <Suspense fallback={<TableSkeleton />}>
            <HistoricRegistrations
                fetchedRegistrations={enhancedReg}
                // family={userFamily}
                fetchedStudents={students}
            />
        </Suspense>
    );
}
