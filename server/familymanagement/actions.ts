"use server";

import { eq, InferInsertModel, InferSelectModel } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { family, familybalance, feedback, student } from "@/lib/db/schema";
import { toESTString } from "@/lib/utils";
import { type threeSeasons } from "@/types/seasons.types";
import { type balanceFees, type familyObj } from "@/types/shared.types";
import { requireRole } from "@/server/auth/actions";
import { familySchema } from "@/server/auth/schema";
import { feedbackSchema, studentSchema } from "./validation";

function calculateTerm(balances: InferSelectModel<typeof familybalance>[]): balanceFees {
    const totals: balanceFees = {
        childnumRegfee: 0,
        regfee: 0,
        earlyregdiscount: 0,
        lateregfee: 0,
        extrafee4newfamily: 0,
        managementfee: 0,
        dutyfee: 0,
        cleaningfee: 0,
        otherfee: 0,
        tuition: 0,
        groupdiscount: 0,
        processfee: 0,
        totalamount: 0,
    };
    for (const bal of balances) {
        totals.childnumRegfee += Number(bal.childnumRegfee ?? 0);
        totals.regfee += Number(bal.regfee ?? 0);
        totals.earlyregdiscount += Number(bal.earlyregdiscount ?? 0);
        totals.lateregfee += Number(bal.lateregfee ?? 0);
        totals.extrafee4newfamily += Number(bal.extrafee4newfamily ?? 0);
        totals.managementfee += Number(bal.managementfee ?? 0);
        totals.dutyfee += Number(bal.dutyfee ?? 0);
        totals.cleaningfee += Number(bal.cleaningfee ?? 0);
        totals.otherfee += Number(bal.otherfee ?? 0);
        totals.tuition += Number(bal.tuition ?? 0);
        totals.groupdiscount += Number(bal.groupdiscount ?? 0);
        totals.processfee += Number(bal.processfee ?? 0);
        totals.totalamount += Number(bal.totalamount ?? 0);
    }

    return totals;
}

export async function calculateBalance(family: familyObj, seasons: threeSeasons) {
    return await db.transaction(async (tx) => {
        const yearBalances = await tx.query.familybalance.findMany({
            where: (bal, { and, eq }) =>
                and(eq(bal.familyid, family.familyid), eq(bal.seasonid, seasons.year.seasonid)),
        });

        const yearPrices = calculateTerm(yearBalances);

        const fallBalances = await tx.query.familybalance.findMany({
            where: (bal, { and, eq }) =>
                and(eq(bal.familyid, family.familyid), eq(bal.seasonid, seasons.fall.seasonid)),
        });

        const fallPrices = calculateTerm(fallBalances);

        const springBalances = await tx.query.familybalance.findMany({
            where: (bal, { and, eq }) =>
                and(eq(bal.familyid, family.familyid), eq(bal.seasonid, seasons.spring.seasonid)),
        });

        const springPrices = calculateTerm(springBalances);

        return { yearPrices: yearPrices, fallPrices: fallPrices, springPrices: springPrices };
    });
}

export async function createStudent(
    data: z.infer<typeof studentSchema>,
    familyid: number,
    studentid: number
) {
    const parsed = studentSchema.parse(data);
    await requireRole(["FAMILY"]);

    return await db.transaction(async (tx) => {
        const family = await tx.query.family.findFirst({
            where: (family, { eq }) => eq(family.familyid, familyid),
        });
        if (!family) {
            throw new Error("Family not found");
        }

        const curStudents = await tx.query.student.findMany({
            where: (student, { eq }) => eq(student.familyid, family.familyid),
        });

        const newStudentNo = curStudents.length + 1;

        if (studentid == -1) {
            const newStudent = {
                familyid: familyid,
                studentno: newStudentNo.toString(),
                namecn: parsed.namecn ?? "",
                namelasten: parsed.namelasten ?? "",
                namefirsten: parsed.namefirsten ?? "",
                gender: parsed.gender ?? "",
                ageof: "Child",
                age: null,
                dob: toESTString(parsed.dob),
                active: parsed.active,
                createddate: toESTString(new Date()),
                lastmodify: toESTString(new Date()),
                notes: parsed.notes ?? "",
                upgradable: 0,
            } satisfies InferInsertModel<typeof student>;

            const [inserted] = await tx.insert(student).values(newStudent).returning();
            return inserted;
        } else {
            const existingStudents = curStudents.filter((s) => s.studentid === studentid);
            if (existingStudents.length === 0) {
                throw new Error("Student to update not found");
            }

            const updatedStudent = {
                namecn: parsed.namecn ?? "",
                namelasten: parsed.namelasten ?? "",
                namefirsten: parsed.namefirsten ?? "",
                dob: toESTString(parsed.dob),
                gender: parsed.gender ?? "",
                active: parsed.active,
                lastmodify: toESTString(new Date()),
                notes: parsed.notes ?? "",
            };

            await tx.update(student).set(updatedStudent).where(eq(student.studentid, studentid));

            const [updated] = await tx.query.student.findMany({
                where: (s, { eq }) => eq(s.studentid, studentid),
            });

            return updated;
        }
    });
}

export async function getFammilyStudent(
    familyid: number
): Promise<InferSelectModel<typeof student>[]> {
    return await db.query.student.findMany({
        where: (s, { eq }) => eq(s.familyid, familyid),
    });
}

export async function removeStudent(studentid: number) {
    const students = await db.query.student.findMany({
        where: (s, { eq }) => eq(s.studentid, studentid),
    });

    if (students.length === 0) {
        throw new Error("Student not found");
    }

    const studentToDelete = students[0];

    // Check for existing registrations
    const registrations = await db.query.classregistration.findMany({
        where: (cr, { eq }) => eq(cr.studentid, studentToDelete.studentid),
    });

    if (registrations.length > 0) {
        throw new Error(
            "Cannot delete student with registration history 系统无法删除有注册记录的学生"
        );
    }

    // If no registrations, proceed to delete
    await db.delete(student).where(eq(student.studentid, studentToDelete.studentid));
}

export async function updateFamily(familyData: z.infer<typeof familySchema>, familyid: number) {
    await db
        .update(family)
        .set({
            mothernamecn: familyData.mothernamecn,
            motherfirsten: familyData.motherfirsten,
            motherlasten: familyData.motherlasten,
            fathernamecn: familyData.fathernamecn,
            fatherfirsten: familyData.fatherfirsten,
            fatherlasten: familyData.fatherlasten,
            address1: familyData.address,
            officephone: familyData.phone,
            cellphone: familyData.phonealt,
            email2: familyData.emailalt,
        })
        .where(eq(family.familyid, familyid));
}

export async function SubmitFeedback(
    incomingData: z.infer<typeof feedbackSchema>,
    familyid: number
) {
    await requireRole(["FAMILY"]);
    const parsedData = feedbackSchema.parse(incomingData);
    await db.transaction(async (tx) => {
        await tx.insert(feedback).values({
            ...Object.fromEntries(Object.entries(parsedData).filter(([key]) => key !== "website")),
            familyid: familyid,
            postdate: toESTString(new Date()),
        });
    });
}
