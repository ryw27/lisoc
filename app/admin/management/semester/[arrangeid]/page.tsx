import ClassCardWithPrint from "@/components/teacher/class-card-with-print";
import { db } from "@/lib/db";
import { REGSTATUS_REGISTERED, REGSTATUS_SUBMITTED, regStatusMap } from "@/lib/utils";
import { teacherClassStudentView } from "@/types/shared.types";
import { Suspense, type FC } from "react";


interface ArrangeIDPageProps {
    params: Promise<{ arrangeid: string }>;
}

const ClassDetails: FC<{ arrangeid: number }> = async ({ arrangeid }) => {

    const classinfo  = await db.query.arrangement.findFirst({
        where: (arrangement, { eq }) =>
            eq(arrangement.arrangeid, arrangeid),
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
            teacher: {
                columns: {
                    teacherid: true,
                    namecn: true,
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
    });

    if (!classinfo) {
        return <div>Class not found</div>;
    }

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
                eq(reg.classid, classinfo.classid),
                eq(reg.isdropspring, false),
                eq(reg.seasonid, classinfo.seasonid),
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
            key={classinfo.arrangeid}
            arrangeid={String(classinfo.arrangeid)}
            classnamecn={classinfo.class.classnamecn}
            roomno={classinfo.classroom.roomno}
            period={classinfo.classtime.period}
            teachernamecn={classinfo.teacher.namecn}
            teacherphone={classinfo.teacher.user?.phone || "N/A"}
            studentCount={flatstudents.length}
            allClassStudent={flatstudents}
        />
    );

};

export default async function Page({ params }: ArrangeIDPageProps) {
    const { arrangeid } = await params;
    if (!arrangeid) {
        return <div>Class  not found</div>;
    }
    return (
        <Suspense
            fallback={<div className="p-8 text-center text-gray-500">Loading class data...</div>}
        >
            <ClassDetails arrangeid={Number(arrangeid)} />
        </Suspense>
    );
}
