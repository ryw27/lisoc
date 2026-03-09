import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { REGSTATUS_REGISTERED, REGSTATUS_SUBMITTED, regStatusMap } from "@/lib/utils";
import { threeSeasons } from "@/types/seasons.types";
import { teacherClassStudentView } from "@/types/shared.types";
import { requireRole } from "@/server/auth/actions";
import fetchCurrentSeasons from "@/server/seasons/data";
import ClassCardWithPrint from "@/components/teacher/class-card-with-print";

export default async function TeacherPage() {
    const user = await requireRole(["TEACHER"], { redirect: true });

    const teacher = await db.query.teacher.findFirst({
        where: (teacher, { eq }) => eq(teacher.userid, user.user.id),
        with: {
            user: {
                columns: {
                    phone: true,
                },
            },
        },
    });

    if (!teacher) {
        redirect("/login/teacher");
    }

    let activeYear: threeSeasons["year"] | undefined;
    let fall_season: threeSeasons["fall"] | undefined;
    let spring_season: threeSeasons["year"] | undefined;

    try {
        const res = await fetchCurrentSeasons();
        activeYear = res.year;
        fall_season = res.fall;
        spring_season = res.spring;
    } catch {
        activeYear = undefined;
    }

    if (!activeYear || !fall_season || !spring_season) {
        return <div>No active semester</div>;
    }

    const { year, fall, spring } = {
        year: activeYear.seasonid,
        fall: fall_season.seasonid,
        spring: spring_season.seasonid,
    };

    const classesToTeach = await db.query.arrangement.findMany({
        where: (arrangement, { and, eq, or }) =>
            and(
                eq(arrangement.teacherid, teacher.teacherid),
                or(
                    eq(arrangement.seasonid, fall),
                    eq(arrangement.seasonid, spring),
                    eq(arrangement.seasonid, year)
                )
            ),
        with: {
            class: {
                columns: {
                    classnamecn: true,
                },
            },
            classroom: {
                columns: {
                    roomid: true,
                    roomno: true,
                },
            },
            classtime: {
                columns: {
                    period: true,
                },
            },
        },
        orderBy: (arrangement, { desc }) => desc(arrangement.seasonid),
    });

    const seasons = await db.query.seasons.findMany({
        columns: {
            seasonid: true,
            seasonnamecn: true,
        },
    });

    const seasonMap = new Map(seasons.map((season) => [season.seasonid, season.seasonnamecn]));

    if (!classesToTeach) {
        return <div>No active class in {seasonMap.get(year)}</div>;
    }

    return (
        <div className="container mx-auto flex flex-col">
            {classesToTeach.map(async (c) => {
                const students = await db.query.classregistration.findMany({
                    columns: {
                        regid: true,
                        studentid: true,
                        familyid: true,
                        seasonid: true,
                        statusid: true,
                    },
                    where: (reg, { and, eq, or }) =>
                        and(
                            eq(reg.classid, c.classid),
                            eq(reg.isdropspring, false),
                            eq(reg.seasonid, c.seasonid),
                            or(
                                eq(reg.statusid, REGSTATUS_REGISTERED),
                                eq(reg.statusid, REGSTATUS_SUBMITTED)
                            )
                        ),
                    with: {
                        student: {
                            columns: {
                                namecn: true,
                                namefirsten: true,
                                namelasten: true,
                                gender: true,
                                dob: true,
                            },
                            with: {
                                family: {
                                    columns: {
                                        fathernamecn: true,
                                        mothernamecn: true,
                                        fatherfirsten: true,
                                        fatherlasten: true,
                                        motherfirsten: true,
                                        motherlasten: true,
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
                            },
                        },
                    },
                });

                const flatstudents: teacherClassStudentView[] = students.map((s) => {
                    return {
                        student: `${s.student.namefirsten} ${s.student.namelasten} ${s.student.namecn}`,
                        gender: `${s.student.gender ? s.student.gender[0] : "N/A"}`,
                        age: Math.floor(
                            new Date().getFullYear() - new Date(s.student.dob).getFullYear() + 1
                        ),
                        familyid: s.familyid,
                        father: `${s.student.family?.fatherfirsten} ${s.student.family?.fatherlasten} ${s.student.family?.fathernamecn}`,
                        mother: `${s.student.family?.motherfirsten} ${s.student.family?.motherlasten} ${s.student.family?.mothernamecn}`,
                        email: s.student.family?.user?.email || "N/A",
                        phone: s.student.family?.user?.phone || "N/A",
                        status: `${regStatusMap[s.statusid as 1 | 2 | 3 | 4 | 5]}`,
                    };
                });

                return (
                    <ClassCardWithPrint
                        key={c.arrangeid}
                        arrangeid={c.arrangeid}
                        classnamecn={c.class.classnamecn}
                        roomno={c.classroom.roomno}
                        period={c.classtime.period}
                        teachernamecn={teacher.namecn}
                        teacherphone={teacher.user?.phone || "N/A"}
                        studentCount={flatstudents.length}
                        allClassStudent={flatstudents}
                    />
                );
            })}
        </div>
    );
}
