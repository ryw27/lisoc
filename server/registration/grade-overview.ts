// Read-only view of every class in one grade for the admin home page.
// Not a "use server" module: called through the admin-guarded action in
// actions/gradeOverview.ts.
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
    arrangement,
    classes,
    classregistration,
    classrooms,
    student,
    teacher,
} from "@/lib/db/schema";
import {
    REGSTATUS_DROPOUT,
    REGSTATUS_DROPOUT_SPRING,
    REGSTATUS_REGISTERED,
    REGSTATUS_SUBMITTED,
} from "@/lib/utils";

export type GradeStudent = {
    regid: number;
    studentid: number;
    familyid: number;
    namecn: string | null;
    namefirsten: string | null;
    namelasten: string | null;
    gender: string | null;
    status: string;
    registerdate: string;
    notes: string | null;
};

export type GradeClass = {
    arrangeid: number;
    seasonid: number;
    classid: number;
    classnamecn: string;
    teacher: string | null;
    roomno: string | null;
    seatlimit: number | null;
    students: GradeStudent[];
};

export type GradeOverview = {
    grade: number;
    classes: GradeClass[];
    dropped: (GradeStudent & { classnamecn: string })[];
};

const REG_STATUS_NAMES: Record<number, string> = {
    [REGSTATUS_SUBMITTED]: "Submitted",
    [REGSTATUS_REGISTERED]: "Registered",
    [REGSTATUS_DROPOUT]: "Dropout",
    [REGSTATUS_DROPOUT_SPRING]: "Dropout Spring",
};

/**
 * Classes of one grade arranged in the given seasons, with their active students
 * (submitted/registered) and a combined list of dropped students. Same grouping as
 * the semester management page, which also leaves transferred rows out.
 */
export async function getGradeOverview(grade: number, seasonids: number[]): Promise<GradeOverview> {
    const arrangements = await db
        .select({
            arrangeid: arrangement.arrangeid,
            seasonid: arrangement.seasonid,
            classid: arrangement.classid,
            classnamecn: classes.classnamecn,
            teacher: teacher.namecn,
            roomno: classrooms.roomno,
            seatlimit: arrangement.seatlimit,
        })
        .from(arrangement)
        .innerJoin(classes, eq(arrangement.classid, classes.classid))
        .leftJoin(teacher, eq(arrangement.teacherid, teacher.teacherid))
        .leftJoin(classrooms, eq(arrangement.roomid, classrooms.roomid))
        .where(and(inArray(arrangement.seasonid, seasonids), eq(classes.classno, String(grade))))
        .orderBy(asc(classes.typeid), asc(arrangement.arrangeid));

    if (arrangements.length === 0) return { grade, classes: [], dropped: [] };

    const regs = await db
        .select({
            regid: classregistration.regid,
            classid: classregistration.classid,
            seasonid: classregistration.seasonid,
            studentid: classregistration.studentid,
            familyid: classregistration.familyid,
            statusid: classregistration.statusid,
            registerdate: classregistration.registerdate,
            notes: classregistration.notes,
            namecn: student.namecn,
            namefirsten: student.namefirsten,
            namelasten: student.namelasten,
            gender: student.gender,
        })
        .from(classregistration)
        .innerJoin(student, eq(classregistration.studentid, student.studentid))
        .where(
            and(
                inArray(classregistration.seasonid, seasonids),
                inArray(
                    classregistration.classid,
                    arrangements.map((a) => a.classid)
                ),
                inArray(classregistration.statusid, [
                    REGSTATUS_SUBMITTED,
                    REGSTATUS_REGISTERED,
                    REGSTATUS_DROPOUT,
                    REGSTATUS_DROPOUT_SPRING,
                ])
            )
        )
        .orderBy(asc(student.namelasten), asc(student.namefirsten));

    const classKey = (classid: number, seasonid: number) => `${classid}-${seasonid}`;
    const byClass = new Map<string, GradeClass>(
        arrangements.map((a) => [
            classKey(a.classid, a.seasonid),
            { ...a, classnamecn: a.classnamecn ?? `Class ${a.classid}`, students: [] },
        ])
    );

    const dropped: GradeOverview["dropped"] = [];
    for (const r of regs) {
        const cls = byClass.get(classKey(r.classid, r.seasonid));
        if (!cls) continue;
        const view: GradeStudent = {
            regid: r.regid,
            studentid: r.studentid,
            familyid: r.familyid,
            namecn: r.namecn,
            namefirsten: r.namefirsten,
            namelasten: r.namelasten,
            gender: r.gender,
            status: REG_STATUS_NAMES[r.statusid] ?? String(r.statusid),
            registerdate: r.registerdate,
            notes: r.notes,
        };
        if (r.statusid === REGSTATUS_DROPOUT || r.statusid === REGSTATUS_DROPOUT_SPRING) {
            dropped.push({ ...view, classnamecn: cls.classnamecn });
        } else {
            cls.students.push(view);
        }
    }

    return { grade, classes: Array.from(byClass.values()), dropped };
}
