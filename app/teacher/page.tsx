import { db } from "../lib/db";
import { requireRole } from "../lib/auth-lib/auth-actions";
import { redirect } from "next/navigation";

export default async function TeacherPage() {
    const user = await requireRole(["TEACHER"], { redirect: true });
    const teacher = await db.query.teacher.findFirst({
        where: (teacher, { eq }) => eq(teacher.userid, user.user.id!)
    });

    if (!teacher) {
        redirect("/login/teacher")
    }

    const classesToTeach = await db.query.arrangement.findMany({
        where: (arrangement, { eq }) => eq(arrangement.teacherid, teacher.teacherid),
        with: {
            class: {

            },
            classroom: {
                columns: {
                    roomid: true,
                    roomno: true
                }
            }
        }
    });

    if (!classesToTeach) {
        <div>No active semester</div>
    }



    return (
        <div className="flex flex-col container mx-auto">
            {classesToTeach.map(async (c, idx) => {
                // TODO: Fix when adding transferring/dropping
                const students = await db.query.classregistration.findMany({
                    where: (reg, { and, eq }) => and(eq(reg.classid, c.classid), eq(reg.isdropspring, false)),
                    with: {
                        student: {
                            columns: {
                                namecn: true,
                                namefirsten: true,
                                namelasten: true,
                            }
                        }
                    }
                })
                return (
                    <div className="flex flex-col gap-2">
                        <h1 className="font-bold">Class {idx.toString()}</h1>
                        <p>{c.class.classnamecn}</p>
                        <p>{c.classroom.roomno}</p>
                        <h1 className="font-bold">Students</h1>
                        {students.map((s) => {
                            return (
                                <>
                                    <p>
                                        {s.student?.namecn}
                                    </p>
                                    <p>
                                        {s.student?.namefirsten} {s.student?.namelasten}
                                    </p>
                                </>
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )
}