import { db } from "@/lib/db";
import { arrangement } from "@/lib/db/schema";
import { z } from "zod/v4";
import { 
    seasonObj, 
    arrangementInsert 
} from "../../types";
import { eq } from "drizzle-orm";
import { arrangementArraySchema } from "../../validation";
import { arrangementSchema } from "@/lib/shared/validation";
import { getTermVariables } from "../helpers";
import { toESTString } from "@/lib/utils";
import { revalidatePath } from "next/cache";


// TODO: Check this 
export async function editArrangement(data: z.infer<typeof arrangementArraySchema>, season: seasonObj) {
    // const user = await requireRole(["ADMIN"]);
    return await db.transaction(async (tx) => {
        const parsedArray = arrangementArraySchema.parse(data);
        // Ensure arrangeid is present and valid. It should since it's an update
        const { seasonid, activestatus, regstatus } = await getTermVariables(parsedArray.classrooms[0], season, tx);
        const regClassObject = {
            ...parsedArray.classrooms[0],
            seasonid: seasonid,
            activestatus: activestatus,
            regstatus: regstatus,
            tuitionW: parsedArray.classrooms[0].tuitionW?.toString() ?? null,
            specialfeeW: parsedArray.classrooms[0].specialfeeW?.toString() ?? null,
            bookfeeW: parsedArray.classrooms[0].bookfeeW?.toString() ?? null,
            tuitionH: parsedArray.classrooms[0].tuitionH?.toString() ?? null,
            specialfeeH: parsedArray.classrooms[0].specialfeeH?.toString() ?? null,
            bookfeeH: parsedArray.classrooms[0].bookfeeH?.toString() ?? null,
            lastmodify: toESTString(new Date()),
            updateby: "testaccount"
        } satisfies arrangementInsert

        for (const data of parsedArray.classrooms) {
            const parsedData = arrangementSchema.parse(data);
            if (parsedData.isregclass) {
                if (typeof parsedData.arrangeid !== "number" || isNaN(parsedData.arrangeid)) {
                    throw new Error("Update data does not contain a valid arrange ID identifier");
                }
                const { arrangeid, ...updateData } = regClassObject;
                //const updated = 
                await tx
                    .update(arrangement)
                    .set({
                        ...updateData
                    })
                    .where(eq(arrangement.arrangeid, parsedData.arrangeid))
                    .returning();
            } else {
                // Either updating or adding
                if (parsedData.arrangeid) {
                    // Update
                    const { arrangeid, ...updateData } = regClassObject;
                    const updated = await tx
                        .update(arrangement)
                        .set({
                            ...updateData, // Handles update to the three important columns for non reg classes
                            isregclass: false,
                            classid: parsedData.classid,
                            teacherid: parsedData.teacherid,
                            roomid: parsedData.roomid,
                            seatlimit: parsedData.seatlimit
                        })
                        .where(eq(arrangement.arrangeid, parsedData.arrangeid));
                } else {
                    const { arrangeid, ...updateData } = regClassObject;
                    await tx
                        .insert(arrangement)
                        .values({
                            ...updateData,
                            isregclass: false,
                            classid: parsedData.classid,
                            teacherid: parsedData.teacherid,
                            roomid: parsedData.roomid,
                            seatlimit: parsedData.seatlimit
                        })
                }
            }
        }

        revalidatePath(`/admintest/management/semester`);
    })
}