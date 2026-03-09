"use server";

import { db } from "@/lib/db";
import { teacher, users } from "@/lib/db/schema";
import { teacherUpdateSchema } from "@/server/auth/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";


export async function updateTeacher(teacherData: z.infer<typeof teacherUpdateSchema>, userid: string) {

    await db.transaction(async (tx) =>{
        await tx.update(teacher)
        .set({
            namecn: teacherData.namecn,
            namelasten: teacherData.namelasten,
            namefirsten: teacherData.namefirsten,
            address1: teacherData.address,
        })
        .where(eq(teacher.userid, userid));

        await tx.update(users)
        .set({
            phone: teacherData.phone,
            email: teacherData.email,
            name: teacherData.email,
        })
        .where(eq(users.id, userid));
    }) 
}
