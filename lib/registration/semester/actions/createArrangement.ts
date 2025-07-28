import { db } from "@/lib/db";
import { arrangement } from "@/lib/db/schema";
import { z } from "zod/v4";
import { seasonObj } from "../../types";
import { arrangementArraySchema } from "../../validation";
import { arrangementSchema } from "@/lib/shared/validation";
import { getTermVariables } from "../helpers";
import { toESTString } from "@/lib/utils";
import { revalidatePath } from "next/cache";


export async function createArrangement(data: z.infer<typeof arrangementArraySchema>, season: seasonObj) {
    // TODO: Auth check 
    // const user = await requireRole(["ADMIN"]);

    // Parse data
    const parsedArray = arrangementArraySchema.parse(data);

    return await db.transaction(async (tx) => {
        for (const data of parsedArray.classrooms) {
            const parsedData = arrangementSchema.parse(data);
            const { seasonid, activestatus, regstatus } = await getTermVariables(parsedData, season, tx);
            console.log(parsedData.roomid);

            const inserted = await tx
                .insert(arrangement)
                .values({
                    seasonid: seasonid,
                    classid: parsedData.classid,
                    teacherid: parsedData.teacherid,
                    roomid: parsedData.roomid,
                    timeid: parsedData.timeid,
                    seatlimit: parsedData.seatlimit,
                    agelimit: parsedData.agelimit,
                    suitableterm: parsedData.suitableterm,
                    waiveregfee: parsedData.waiveregfee,
                    activestatus: activestatus,
                    regstatus: regstatus,
                    closeregistration: parsedData.closeregistration,
                    tuitionW: parsedData.tuitionW.toString(),
                    bookfeeW: parsedData.bookfeeW.toString(),
                    specialfeeW: parsedData.specialfeeW.toString(),
                    tuitionH: parsedData.tuitionH.toString(),
                    bookfeeH: parsedData.bookfeeH.toString(),
                    specialfeeH: parsedData.specialfeeH.toString(),
                    notes: parsedData.notes ?? "",
                    lastmodify: toESTString(new Date()),
                    isregclass: true,
                    updateby: "admin"
                })
                .returning();
            return inserted[0];
        }
        revalidatePath(`/admintest/management/semester`);
    })
}