"use server";
import { db } from "@/lib/db";
import { arrangement } from "@/lib/db/schema";
import { z } from "zod/v4";
import { seasonObj } from "@/lib/shared/types";
import { arrangementArraySchema } from "../../validation";
import { arrangementSchema } from "@/lib/shared/validation";
import { getTermVariables } from "../../helpers";
import { toESTString, UNKNOWN_CLASSROOMID, UNKNOWN_TEACHERID } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";

// Create new regclas with constituent classrooms
export async function createArrangement(data: z.infer<typeof arrangementArraySchema>, season: seasonObj) {
    // 1. Auth Check 
    const user = await requireRole(["ADMIN"], { redirect: true });

    // 2. Parse data
    const parsedArray = arrangementArraySchema.parse(data);
    
    // 3. Begin transaction
    return await db.transaction(async (tx) => {
        // 5. Get reg class values
        const regclass = arrangementSchema.parse(parsedArray.classrooms[0])
        const { seasonid, activestatus, regstatus } = await getTermVariables(regclass, season, tx);
        const regClassValues = {
            seasonid: seasonid,
            classid: regclass.classid,
            teacherid: UNKNOWN_TEACHERID,
            roomid: UNKNOWN_CLASSROOMID,
            timeid: regclass.timeid,
            agelimit: regclass.agelimit,
            suitableterm: regclass.suitableterm,
            waiveregfee: regclass.waiveregfee,
            activestatus: activestatus,
            regstatus: regstatus,
            closeregistration: regclass.closeregistration,
            tuitionW: regclass.tuitionW.toString(),
            bookfeeW: regclass.bookfeeW.toString(),
            specialfeeW: regclass.specialfeeW.toString(),
            tuitionH: regclass.tuitionH.toString(),
            bookfeeH: regclass.bookfeeH.toString(),
            specialfeeH: regclass.specialfeeH.toString(),
            notes: regclass.notes ?? "",
            lastmodify: toESTString(new Date()),
            isregclass: true,
            updateby: user.user.name ?? user.user.email ?? user.user.id
        }

        // 6. Insert reg class
        await tx
            .insert(arrangement)
            .values({
                ...regClassValues,
            })

        // 7. Loop through constituent classrooms
        for (let i = 1; i < parsedArray.classrooms.length; i++) {
            // 8. Parse 
            const parsedData = arrangementSchema.parse(parsedArray.classrooms[i]); 
            // 9. Insert
            // Remember that the only unique fields of classrooms are classid, teacherid, roomid, seatlimit, and notes
            await tx
                .insert(arrangement)
                .values({
                    ...regClassValues,
                    classid: parsedData.classid,
                    teacherid: parsedData.teacherid,
                    roomid: parsedData.roomid,
                    seatlimit: parsedData.seatlimit,
                    notes: parsedData.notes ?? "",
                    isregclass: false,
                })
        }

        // 10. Revalidate
        revalidatePath(`/admin/management/semester`);
        revalidatePath("/dashboard/register");
    })
}