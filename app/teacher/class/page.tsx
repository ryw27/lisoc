import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function ClassPage() {
    const user = await requireRole(["TEACHER"]);

    const teacherRow = await db.query.teacher.findFirst({
        where: (teacher, { eq }) => eq(teacher.userid, user.user.id)
    });

    if (!teacherRow) {
        redirect("/forbidden");
    }

    const classes = await db.query.arrangement.findMany({
        where: (arrangement, { eq }) => eq(arrangement.teacherid, teacherRow.teacherid),
        with: {
            class: {
                columns: {
                    classid: true,
                    classnamecn: true
                }
            },
            classroom: {
                columns: {
                    roomid: true,
                    roomno: true
                }
            }
        }
    });

    return (
        <div>
            <h1 className="text-2xl font-bold">Class Page</h1>
            <div>
                {classes.map((c) => (
                    <div key={c.arrangeid}>
                        <h2>{c.class.classnamecn}</h2>
                        <p>{c.classroom.roomno}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}