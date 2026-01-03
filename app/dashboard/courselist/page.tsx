import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/actions";
import getThreeSeasons from "@/server/seasons/data";
import InfoBoxClass from "@/components/registration/family/info-box-class";

export default async function CourseListPage() {
    await requireRole(["FAMILY"]);

    return await db.transaction(async (tx) => {
        const seasons = await getThreeSeasons(tx);

        const yearArrangements = await db.query.arrangement.findMany({
            where: (arrangement, { and, eq }) =>
                and(
                    eq(arrangement.seasonid, seasons.year.seasonid),
                    eq(arrangement.isregclass, true)
                ),
            with: {
                class: {},
            },
        });

        const fallArrangements = await db.query.arrangement.findMany({
            where: (arrangement, { and, eq }) =>
                and(
                    eq(arrangement.seasonid, seasons.fall.seasonid),
                    eq(arrangement.isregclass, true)
                ),
            with: {
                class: {},
            },
        });

        const springArrangements = await db.query.arrangement.findMany({
            where: (arrangement, { and, eq }) =>
                and(
                    eq(arrangement.seasonid, seasons.spring.seasonid),
                    eq(arrangement.isregclass, true)
                ),
            with: {
                class: {},
            },
        });

        const allArrs = {
            year: yearArrangements,
            fall: fallArrangements,
            spring: springArrangements,
        };
        if (allArrs.year.length + allArrs.fall.length + allArrs.spring.length === 0) {
            return (
                <div className="flex min-h-screen items-center justify-center text-2xl font-bold">
                    No classes found
                </div>
            );
        }

        return (
            <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-2 px-4 py-8">
                <h1 className="mb-2 text-2xl font-bold text-black">Class List</h1>
                <p className="mb-6 text-xl">
                    In order to register, please visit{" "}
                    <Link href="/dashboard/register" className="text-blue-600 underline">
                        the registration link
                    </Link>
                </p>

                <section className="w-full rounded-md border-1 p-4 shadow-md">
                    <h2 className="mb-3 text-lg font-bold">Year Classes</h2>
                    <div className="flex w-full flex-col gap-4">
                        {allArrs.year.map((classData) => (
                            <InfoBoxClass
                                key={classData.arrangeid}
                                arrInfo={classData}
                                seasonInfo={seasons.year}
                                yearClass={true}
                            />
                        ))}
                    </div>
                </section>

                <section className="w-full rounded-md border-1 p-4 shadow-md">
                    <h2 className="mb-3 text-lg font-bold">Fall-only Classes</h2>
                    <div className="flex w-full flex-col gap-4">
                        {allArrs.fall.map((classData) => (
                            <InfoBoxClass
                                key={classData.arrangeid}
                                arrInfo={classData}
                                seasonInfo={seasons.fall}
                                yearClass={false}
                            />
                        ))}
                    </div>
                </section>

                <section className="w-full rounded-md border-1 p-4 shadow-md">
                    <h2 className="mb-3 text-lg font-bold">Spring-only Classes</h2>
                    <div className="flex w-full flex-col gap-4">
                        {allArrs.spring.map((classData) => (
                            <InfoBoxClass
                                key={classData.arrangeid}
                                arrInfo={classData}
                                seasonInfo={seasons.spring}
                                yearClass={false}
                            />
                        ))}
                    </div>
                </section>
            </div>
        );
    });
}
