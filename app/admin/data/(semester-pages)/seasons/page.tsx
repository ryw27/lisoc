import { inArray, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import { familybalance } from "@/lib/db/schema";
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
    const seasonIds = [activeYear.seasonid, fall_season.seasonid, spring_season.seasonid];

    // One grouped query: each family's academic-year balance (year + fall + spring rows summed).
    // Families appear on several rows, so this is joined in memory rather than per row.
    const balanceRows = await db
        .select({
            familyid: familybalance.familyid,
            balance: sum(familybalance.totalamount).mapWith(Number),
        })
        .from(familybalance)
        .where(inArray(familybalance.seasonid, seasonIds))
        .groupBy(familybalance.familyid);
    const balanceByFamily = new Map(balanceRows.map((r) => [r.familyid, r.balance ?? 0]));

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
                    classno: true,
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
                classno: Number(obj.class.classno),
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
                classno: number | null;
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
                        dob: true,
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
                classno: null,
                seasonnamecn: "N/A",
                teacherid: 0,
                teachernamecn: "N/A",
            };

            return {
                studentid: reg.student.studentid,
                familyid: reg.family.familyid,
                balance: balanceByFamily.get(reg.family.familyid) ?? 0,
                regid: reg.regid,
                studentnameen: `${reg.student.namefirsten} ${reg.student.namelasten}`,
                studentnamecn: reg.student.namecn,
                // dob comes back as "YYYY-MM-DDTHH:mm:ss" (or space-separated); keep just the date
                dob: reg.student.dob.startsWith("1900-01-01")
                    ? "N/A"
                    : reg.student.dob.slice(0, 10),
                gender: reg.student.gender ?? "N/A",

                arrangeid: classInfo.arrangeid,
                classnamecn: classInfo.classnamecn ?? "N/A",
                classno: classInfo.classno,
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
