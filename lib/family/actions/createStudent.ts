"use server";
import { db } from "@/lib/db";
import { student } from "@/lib/db/schema";
import { z } from "zod/v4";
import { toESTString } from "@/lib/utils";
import { studentSchema } from "../validation";
import { requireRole } from "@/lib/auth";
import { InferInsertModel,InferSelectModel,eq } from "drizzle-orm";
import { family } from "@/lib/db/schema";
import { familySchema } from '@/lib/auth/validation';


export async function createStudent(data: z.infer<typeof studentSchema>, familyid: number, studentid: number) {
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

        if (studentid == -1 ) {
                const newStudent = {
                familyid: familyid,
                studentno: newStudentNo.toString(),
                namecn: parsed.namecn ?? "",
                namelasten: parsed.namelasten ?? "",
                namefirsten: parsed.namefirsten ?? "",
                gender: parsed.gender ?? "",
                ageof: 'Child',
                age: null,
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

        }
        else {
            
            const existingStudents = curStudents.filter(s => s.studentid === studentid);
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

            await tx
                .update(student)
                .set(updatedStudent)
                .where(eq(student.studentid, studentid));

            const [updated] = await tx.query.student.findMany({
                where: (s, { eq }) => eq(s.studentid, studentid)
            });

            return updated;
        }
    })
}


export async function getFammilyStudent(familyid: number): Promise<InferSelectModel<typeof student>[]> {

    return  await db.query.student.findMany({
        where: (s, { eq }) => eq(s.familyid, familyid)
    });

}


export async function removeStudent(studentid: number)  {

    const students =await db.query.student.findMany({
        where: (s, { eq }) => eq(s.studentid, studentid)
    });

    if (students.length === 0) {
        throw new Error("Student not found");
    }

    const studentToDelete = students[0];

    // Check for existing registrations
    const registrations = await db.query.classregistration.findMany({
        where: (cr, { eq }) => eq(cr.studentid, studentToDelete.studentid)
    });

    if (registrations.length > 0) {
        throw new Error("Cannot delete student with registration history 系统无法删除有注册记录的学生");
    }

    // If no registrations, proceed to delete
    await db
        .delete(student)
        .where(eq(student.studentid, studentToDelete.studentid));   

}


export async function updateFamily(familyData: z.infer<typeof familySchema>,familyid: number)  {

            await db.update(family)
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
                .where(eq(family.familyid,familyid))
             ;

}


