import InfoBoxClass from "@/components/registration/family/info-box-class";
import { requireRole } from "@/lib/auth/actions/requireRole";
import { db } from "@/lib/db";
import { getThreeSeasons } from "@/lib/registration/helpers";
import Link from "next/link";

export default async function CourseListPage() {
    await requireRole(["FAMILY"]);

    return await db.transaction(async (tx) => {
        const seasons = await getThreeSeasons(tx);

        const yearArrangements = await db.query.arrangement.findMany({
            where: (arrangement, { and, eq }) => and(
                eq(arrangement.seasonid, seasons.year.seasonid),
                eq(arrangement.isregclass, true)
            ),
            with: {
                class: {}
            }
        });

        const fallArrangements = await db.query.arrangement.findMany({
            where: (arrangement, { and, eq }) => and(
                eq(arrangement.seasonid, seasons.fall.seasonid),
                eq(arrangement.isregclass, true)
            ),
            with: {
                class: {}
            }
        });

        const springArrangements = await db.query.arrangement.findMany({
            where: (arrangement, { and, eq }) => and(
                eq(arrangement.seasonid, seasons.spring.seasonid),
                eq(arrangement.isregclass, true)
            ),
            with: {
                class: {}
            }
        });

        const allArrs = { year: yearArrangements, fall: fallArrangements, spring: springArrangements };
        if (allArrs.year.length + allArrs.fall.length + allArrs.spring.length === 0) {
            return (
                <div className="flex justify-center items-center text-2xl font-bold min-h-screen">
                    No classes found
                </div>
            )
        }

        return (
            <div className="flex flex-col w-full max-w-5xl mx-auto px-4 py-8 gap-2 items-start">
                <h1 className="text-2xl font-bold text-black mb-2">Class List</h1>
                <p className="text-xl mb-6">
                    In order to register, please visit{" "}
                    <Link href="/dashboard/register" className="underline text-blue-600">
                        the registration link
                    </Link>
                </p>

                <section className="w-full border-1 rounded-md shadow-md p-4">
                    <h2 className="font-bold text-lg mb-3">Year Classes</h2>
                    <div className="flex flex-col gap-4 w-full">
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

                <section className="w-full border-1 rounded-md shadow-md p-4">
                    <h2 className="font-bold text-lg mb-3">Fall-only Classes</h2>
                    <div className="flex flex-col gap-4 w-full">
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

                <section className="w-full border-1 rounded-md shadow-md p-4">
                    <h2 className="font-bold text-lg mb-3">Spring-only Classes</h2>
                    <div className="flex flex-col gap-4 w-full">
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
        )
    })



    
} 