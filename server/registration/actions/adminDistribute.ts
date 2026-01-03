"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classregistration } from "@/lib/db/schema";
import { toESTString } from "@/lib/utils";
import { fullRegClass } from "@/types/registration.types";
import { Transaction } from "@/types/server.types";

// Checks if the target class (toarrangeid, toclassid) has capacity for another student.
export async function checkCapacity(
    tx: Transaction,
    seasonid: number,
    student: { studentid: number; toarrangeid: number; toclassid: number }
): Promise<boolean> {
    // Count current registrations for this class/arrangement/season
    const registrations = await tx.query.classregistration.findMany({
        where: (cr, { and, eq }) =>
            and(
                eq(cr.seasonid, seasonid),
                eq(cr.arrangeid, student.toarrangeid),
                eq(cr.classid, student.toclassid)
            ),
        columns: { regid: true },
    });

    // Get the seat limit for this arrangement/class
    const arrangement = await tx.query.arrangement.findFirst({
        where: (arr, { and, or, eq }) =>
            or(
                eq(arr.arrangeid, student.toarrangeid),
                and(eq(arr.classid, student.toclassid), eq(arr.seasonid, seasonid))
            ),
        columns: { seatlimit: true, isregclass: true },
    });

    if (!arrangement) {
        throw new Error("Clas to transfer into not found");
    }

    if (arrangement.isregclass) {
        throw new Error("Invalid distribution class");
    }

    if (!arrangement || arrangement.seatlimit == null || arrangement.seatlimit === 0) {
        // If no seat limit is set, treat as unlimited
        return true;
    }

    return registrations.length < arrangement.seatlimit;
}

// Update class registrations from regclass to actual classroom
export async function adminDistribute(
    data: fullRegClass,
    moved: { studentid: number; toarrangeid: number; toclassid: number }[]
) {
    await db.transaction(async (tx) => {
        for (const student of moved) {
            if (!(await checkCapacity(tx, data.arrinfo.seasonid, student))) {
                throw new Error("Target class is at capacity");
            }
            await tx
                .update(classregistration)
                .set({
                    arrangeid: student.toarrangeid,
                    classid: student.toclassid,
                    lastmodify: toESTString(new Date()),
                })
                .where(
                    and(
                        eq(classregistration.studentid, student.studentid),
                        //  eq(classregistration.classid, student.toclassid),
                        eq(classregistration.seasonid, data.arrinfo.seasonid)
                    )
                );

            /*.where(or(
                  and(
                      eq(classregistration.studentid, student.studentid), 
                      eq(classregistration.classid, student.toclassid),
                      eq(classregistration.seasonid, data.arrinfo.seasonid)
                  ),
                  eq(classregistration.arrangeid, data.arrinfo.arrangeid as number) // Should be in registrations. If not, this is the wrong function
              ))*/
        }
    });
}
