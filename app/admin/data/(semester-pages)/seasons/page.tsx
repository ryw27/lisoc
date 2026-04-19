import { db } from "@/lib/db";
import fetchCurrentSeasons from "@/server/seasons/data";
import { RegistrationView, SemesterRegistrations } from "./sem-registration";

export default async function SemestersPage() {
    // const semesters = await db
    //     .select()
    //     .from(seasons)
    //     .where(eq(seasons.status, "Active"))
    //     .limit(1)
    //     .execute();

    const seasons = await fetchCurrentSeasons();

    if (!seasons) {
        return (
            <div>
                <h1>Semesters</h1>
                <pre>No active seasons found.</pre>
            </div>
        );
    }

    const activeYear = seasons.year;
    const fall_season = seasons.fall;
    const spring_season = seasons.spring;

    const classdetails = await db.query.arrangement.findMany({
        where: (a, { or, eq }) =>
            or(
                eq(a.seasonid, activeYear.seasonid),
                eq(a.seasonid, fall_season.seasonid),
                eq(a.seasonid, spring_season.seasonid)
            ),
        with: {
            class: {
                columns: {
                    classid: true,
                    classnamecn: true,
                },
            },
            season: {
                columns: {
                    seasonid: true,
                    seasonnamecn: true,
                },
            },
            teacher: {
                columns: {
                    teacherid: true,
                    namecn: true,
                },
            },
        },
    });

    const classinfos = classdetails.reduce(
        (acc, obj) => {
            const key = `${obj.season.seasonid}_${obj.class.classid}`;
            acc[key] = {
                classnamecn: obj.class.classnamecn,
                seasonnamecn: obj.season.seasonnamecn,
                teacherid: obj.teacher.teacherid,
                teachernamecn: obj.teacher.namecn,
                arrangeid: obj.arrangeid,
            };
            return acc;
        },
        {} as Record<
            string,
            {
                classnamecn: string;
                seasonnamecn: string;
                teacherid: number;
                teachernamecn: string;
                arrangeid: number;
            }
        >
    );

    const getAllStudentsFull: () => Promise<RegistrationView[]> = async () => {
        const arr = await db.query.classregistration.findMany({
            where: (c, { or, eq }) =>
                or(
                    eq(c.seasonid, activeYear.seasonid),
                    eq(c.seasonid, fall_season.seasonid),
                    eq(c.seasonid, spring_season.seasonid)
                ),
            with: {
                student: {
                    columns: {
                        studentid: true,
                        namecn: true,
                        namefirsten: true,
                        namelasten: true,
                        gender: true,
                    },
                },
                class: {
                    columns: {
                        classnamecn: true,
                    },
                },
                season: {
                    columns: {
                        seasonid: true,
                        seasonnamecn: true,
                    },
                },
                family: {
                    columns: {
                        familyid: true,
                        userid: true,
                    },
                    with: {
                        user: {
                            columns: {
                                email: true,
                                phone: true,
                            },
                        },
                    },
                },
                regstatus: {
                    columns: {
                        regstatusid: true,
                        regstatus: true,
                    },
                },
            },
        });

        const regdetails = arr.map((reg) => {
            const classKey = `${reg.seasonid}_${reg.classid}`;
            const classInfo = classinfos[classKey] ?? {
                classnamecn: "N/A",
                seasonnamecn: "N/A",
                teacherid: 0,
                teachernamecn: "N/A",
            };

            return {
                studentid: reg.student.studentid,
                familyid: reg.family.familyid,
                regid: reg.regid,
                studentnameen: `${reg.student.namefirsten} ${reg.student.namelasten}`,
                studentnamecn: reg.student.namecn,
                gender: reg.student.gender ?? "N/A",

                arrangeid: classInfo.arrangeid,
                classnamecn: classInfo.classnamecn ?? "N/A",
                seasonnamecn: classInfo.seasonnamecn ?? "N/A",
                teachernamecn: classInfo.teachernamecn ?? "N/A",
                regdate: reg.registerdate.split(" ")[0], // Format date as YYYY-MM-DD
                statusnamecn: reg.regstatus.regstatus ?? "N/A",
                email: reg.family.user ? (reg.family.user.email ?? "N/A") : "N/A",
                phone: reg.family.user ? (reg.family.user.phone ?? "N/A") : "N/A",
            };
        });

        return regdetails;
    };

    const allRegs = await getAllStudentsFull();

    return (
        <div>
            <h1 className="text-2xl font-bold">
                Semester Registration / 当前学期注册记录 :{activeYear.seasonnamecn}
            </h1>
            <div style={{ breakAfter: "page" }}></div>
            <br />
            <SemesterRegistrations registrations={allRegs} />
        </div>
    );
}
