"use server";
import { db } from "@/lib/db";
import { student } from "@/lib/db/schema";
import { z } from "zod/v4";
import { toESTString } from "@/lib/utils";
import { studentSchema } from "../validation";
import { requireRole } from "@/lib/auth";
import { InferInsertModel } from "drizzle-orm";


export async function createStudent(data: z.infer<typeof studentSchema>, familyid: number) {
    const parsed = studentSchema.parse(data);
    await requireRole(["FAMILY"]);

    return await db.transaction(async (tx) => {
        const family = await tx.query.family.findFirst({
            where: (family, { eq }) => eq(family.familyid, familyid)
        });
        if (!family) {
            throw new Error("Family not found");
        }

        const curStudents = await tx.query.student.findMany({
            where: (student, { eq }) => eq(student.familyid, family.familyid)
        });

        const newStudentNo = curStudents.length + 1;

        const newStudent = {
            familyid: familyid,
            studentno: newStudentNo.toString(),
            namecn: parsed.namecn ?? "",
            namelasten: parsed.namelasten ?? "",
            namefirsten: parsed.namefirsten ?? "",
            gender: parsed.gender ?? "",
            ageof: parsed.age.toString(),
            age: parsed.age,
            dob: toESTString(parsed.dob),
            active: parsed.active,
            createddate: toESTString(new Date()),
            lastmodify: toESTString(new Date()),
            notes: parsed.notes ?? "",
            upgradable: 0,
        } satisfies InferInsertModel<typeof student>;

        const [inserted] = await tx
            .insert(student)
            .values(newStudent)
            .returning();
        return inserted;
    })
}




