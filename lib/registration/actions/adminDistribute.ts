import { db } from "@/lib/db";
import { classregistration } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { toESTString } from "@/lib/utils";
import { fullRegClass } from "@/lib/registration/types";



export async function adminDistribute(data: fullRegClass, moved: { studentid: number, toarrangeid: number, toclassid: number }[]) {
    // Update class registrations from regclass to actual classroom
    await db.transaction(async (tx) => {
        for (const student of moved) {
            await tx
                .update(classregistration)
                .set({
                    arrangeid: student.toarrangeid,
                    classid: student.toclassid,
                    lastmodify: toESTString(new Date())
                })
                .where(and(
                    eq(classregistration.studentid, student.studentid), 
                    eq(classregistration.seasonid, data.arrinfo.seasonid),
                    eq(classregistration.arrangeid, data.arrinfo.arrangeid as number) // Should be in registrations. If not, this is the wrong function
                ))
        }
    })
}