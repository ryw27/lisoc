import { db } from "@/lib/db";
import { classregistration } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { toESTString } from "@/lib/utils";
import { fullRegClass } from "@/lib/registration/types";


export async function adminRollback(data: fullRegClass) {
    await db.transaction(async (tx) => {
        if (!data.arrinfo.arrangeid || data.arrinfo.arrangeid === 0) {
            throw new Error("Arrange identifier does not exist in data in rollback.")
        }

        for (const classroom of data.classrooms) {
            // console.log(student, data.arrinfo.arrangeid, data.arrinfo.classid)
            if (!classroom.arrinfo.arrangeid || classroom.arrinfo.arrangeid === 0) {
                throw new Error("Arrange identifier does not exist in classroom in rollback");
            }
            for (const student of classroom.students) {
                await tx
                    .update(classregistration)
                    .set({
                        arrangeid: data.arrinfo.arrangeid,
                        classid: data.arrinfo.classid,
                        lastmodify: toESTString(new Date())
                    })
                    .where(and(
                        eq(classregistration.studentid, student.studentid), 
                        eq(classregistration.seasonid, data.arrinfo.seasonid),
                        eq(classregistration.arrangeid, classroom.arrinfo.arrangeid) 
                    ))
                    .returning()
            }
        }
    })
}