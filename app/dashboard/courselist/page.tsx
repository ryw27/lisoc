import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/actions";
import fetchCurrentSeasons from "@/server/seasons/data";
import InfoBoxClass from "@/components/registration/family/info-box-class";

export default async function CourseListPage() {
    await requireRole(["FAMILY"]);

    return await db.transaction(async (tx) => {
        let seasons;
        try {
            seasons = await fetchCurrentSeasons(tx);
        } catch {
            return (
                <div className="flex flex-col items-center justify-center p-16 text-center opacity-60">
                    <p className="text-primary text-xl">No classes found.</p>
                </div>
            );
        }

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
                <div className="border-input flex flex-col items-center justify-center border-2 border-dashed p-16 text-center opacity-60">
                    <p className="text-muted-foreground text-xl italic">No classes found.</p>
                </div>
            );
        }

        return (
            <div className="text-foreground mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-4 py-8">
                {/* --- Header --- */}
                <div className="mb-2">
                    <h1 className="text-primary mb-2 text-3xl font-bold">Class List</h1>
                    <p className="text-muted-foreground text-lg">
                        In order to register, please visit{" "}
                        <Link
                            href="/dashboard/register"
                            className="text-primary decoration-accent font-bold underline decoration-2 underline-offset-4 hover:text-blue-800"
                        >
                            the registration link
                        </Link>
                    </p>
                </div>

                {/* --- Year Classes --- */}
                <section className="border-input bg-card w-full border p-5 shadow-sm">
                    <h2 className="text-primary mb-4 pb-2 text-xl font-bold">Year Classes</h2>
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

                {/* --- Fall Classes --- */}
                <section className="border-input bg-card w-full border p-5 shadow-sm">
                    <h2 className="border-input text-primary mb-4 border-b pb-2 text-xl font-bold">
                        Fall-only Classes
                    </h2>
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

                {/* --- Spring Classes --- */}
                <section className="border-input bg-card w-full border p-5 shadow-sm">
                    <h2 className="border-input text-primary mb-4 border-b pb-2 text-xl font-bold">
                        Spring-only Classes
                    </h2>
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
