"use server";

import { and, eq, inArray } from "drizzle-orm";
import { formatInTimeZone } from "date-fns-tz";
import { db } from "@/lib/db";
import { dutyassignment } from "@/lib/db/schema";
import { safeAction } from "@/lib/safeAction";
import { type dbClient } from "@/types/server.types";
import { requireRole } from "@/server/auth/actions";
import {
    autoDistributeSchema,
    confirmDutySchema,
    deleteDutyAssignmentSchema,
    updateDutyAssignmentSchema,
} from "@/server/duty/schema";

const DUTY_STATUS_ASSIGNED = 1;

/** `createddate` / `lastmodify` are NOT NULL with no default, so stamp them here. */
function nowStamp() {
    return formatInTimeZone(new Date(), "America/New_York", "yyyy-MM-dd HH:mm:ss");
}

interface DutyStudent {
    familyid: number;
    studentid: number;
}

function dutyRowValues(seasonid: number, dutydate: string, student: DutyStudent) {
    const now = nowStamp();
    return {
        familyid: student.familyid,
        studentid: student.studentid,
        seasonid,
        dutydate: `${dutydate} 00:00:00`,
        dutystatus: DUTY_STATUS_ASSIGNED,
        createddate: now,
        lastmodify: now,
        note: null,
        pdid: 0,
        ischarged: false,
    };
}

async function hasDuty(tx: dbClient, seasonid: number, student: DutyStudent) {
    const existing = await tx.query.dutyassignment.findFirst({
        where: (da, { and, eq }) =>
            and(
                eq(da.seasonid, seasonid),
                eq(da.familyid, student.familyid),
                eq(da.studentid, student.studentid)
            ),
    });
    return Boolean(existing);
}

/** One entry per student that could not be written. */
export interface DutyFailure extends DutyStudent {
    reason: string;
}

/**
 * Writes one `dutyassignment` row per assigned student for the chosen duty date.
 * Students already holding a duty row for the season are skipped, so a stale page
 * can't create a duplicate assignment.
 */
export const confirmDutyAssignments = safeAction(
    confirmDutySchema,
    async ({ seasonid, dutydate, rows }) => {
        await requireRole(["ADMIN"], { redirect: false });

        return await db.transaction(async (tx) => {
            const existing = await tx
                .select({
                    familyid: dutyassignment.familyid,
                    studentid: dutyassignment.studentid,
                })
                .from(dutyassignment)
                .where(
                    and(
                        eq(dutyassignment.seasonid, seasonid),
                        inArray(
                            dutyassignment.studentid,
                            rows.map((row) => row.studentid)
                        )
                    )
                );

            const taken = new Set(existing.map((row) => `${row.familyid}-${row.studentid}`));
            const toInsert = rows.filter((row) => !taken.has(`${row.familyid}-${row.studentid}`));

            if (toInsert.length === 0) {
                throw new Error("These students already have a duty assignment this season");
            }

            await tx
                .insert(dutyassignment)
                .values(toInsert.map((row) => dutyRowValues(seasonid, dutydate, row)));

            return { inserted: toInsert.length, skipped: rows.length - toInsert.length };
        });
    }
);

/**
 * Spreads every student in the available list evenly across the kept duty dates, round-robin.
 * Each student is written in its own transaction so one failure doesn't stop the rest — the
 * students that failed simply stay in the available list.
 */
export const autoDistributeDuty = safeAction(
    autoDistributeSchema,
    async ({ seasonid, dutydates, rows }) => {
        await requireRole(["ADMIN"], { redirect: false });

        // The available list is one row per class registration; duty is one row per student.
        const students = [...new Map(rows.map((row) => [`${row.familyid}-${row.studentid}`, row]))]
            .map(([, row]) => row)
            .sort((a, b) => a.familyid - b.familyid || a.studentid - b.studentid);

        let inserted = 0;
        const failed: DutyFailure[] = [];

        for (const [index, student] of students.entries()) {
            const dutydate = dutydates[index % dutydates.length];
            try {
                await db.transaction(async (tx) => {
                    if (await hasDuty(tx, seasonid, student)) {
                        throw new Error("Already has a duty assignment this season");
                    }
                    await tx
                        .insert(dutyassignment)
                        .values(dutyRowValues(seasonid, dutydate, student));
                });
                inserted++;
            } catch (error) {
                failed.push({
                    ...student,
                    reason: error instanceof Error ? error.message : "Insert failed",
                });
            }
        }

        return { inserted, failed };
    }
);

/** Updates the two editable columns of one duty assignment row. */
export const updateDutyAssignment = safeAction(
    updateDutyAssignmentSchema,
    async ({ dutyassignid, dutystatus, note }) => {
        await requireRole(["ADMIN"], { redirect: false });

        const [updated] = await db
            .update(dutyassignment)
            .set({ dutystatus, note: note?.trim() ? note.trim() : null, lastmodify: nowStamp() })
            .where(eq(dutyassignment.dutyassignid, dutyassignid))
            .returning({ dutyassignid: dutyassignment.dutyassignid });

        if (!updated) {
            throw new Error(`Duty assignment ${dutyassignid} no longer exists`);
        }

        return { dutyassignid: updated.dutyassignid };
    }
);

/**
 * Removes one duty assignment. The student returns to the arrange page's available list,
 * which only excludes students that still have a `dutyassignment` row.
 */
export const deleteDutyAssignment = safeAction(
    deleteDutyAssignmentSchema,
    async ({ dutyassignid }) => {
        await requireRole(["ADMIN"], { redirect: false });

        const [deleted] = await db
            .delete(dutyassignment)
            .where(eq(dutyassignment.dutyassignid, dutyassignid))
            .returning({ dutyassignid: dutyassignment.dutyassignid });

        if (!deleted) {
            throw new Error(`Duty assignment ${dutyassignid} no longer exists`);
        }

        return { dutyassignid: deleted.dutyassignid };
    }
);
