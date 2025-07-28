import { db } from "@/lib/db";
import { student } from "@/lib/db/schema";
import { z } from "zod/v4";
import { toESTString } from "@/lib/utils";
import { studentSchema } from "../validation";


export async function createStudent(data: z.infer<typeof studentSchema>, familyid: number) {
    const parsed = studentSchema.parse(data);

    // Check user role
    // const user = await requireRole(["FAMILY"], { redirect: false });
    // if (!user || new Date(user.expires) >= new Date(Date.now())) {
    //     throw new Error("Expired user session. Please login again");
    // }
    return await db.transaction(async (tx) => {
        const [inserted] = await tx.insert(student).values({
            ...parsed,
            familyid: familyid,
            createddate: toESTString(new Date()),
            lastmodify: toESTString(new Date()),
        }).returning();
        return inserted;
    })
}




