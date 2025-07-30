import { db } from "@/lib/db";
import { arrangement } from "@/lib/db/schema";
import { z } from "zod/v4";
import { seasonObj, arrangementInsert } from "@/lib/shared/types";
import { eq } from "drizzle-orm";
import { arrangementArraySchema } from "../../validation";
import { arrangementSchema } from "@/lib/shared/validation";
import { getTermVariables } from "../../helpers";
import { toESTString } from "@/lib/utils";
import { revalidatePath } from "next/cache";


// TODO: more efficiency? Not sure if this is updating all that have been edited or just all of them regardless
export async function editArrangement(data: z.infer<typeof arrangementArraySchema>, season: seasonObj) {
    // const user = await requireRole(["ADMIN"]);
    return await db.transaction(async (tx) => {
        const parsedArray = arrangementArraySchema.parse(data);
        // Ensure arrangeid is present and valid. It should since it's an update
        const regClass = arrangementSchema.parse(parsedArray.classrooms[0])
        if (!regClass.arrangeid || regClass.arrangeid === 0) {
            throw new Error("Reg class identifier not found")
        }

        const { seasonid, activestatus, regstatus } = await getTermVariables(regClass, season, tx);
        const regClassObject = {
            ...regClass,
            seasonid: seasonid,
            activestatus: activestatus,
            regstatus: regstatus,
            tuitionW: regClass.tuitionW?.toString() ?? null,
            specialfeeW: regClass.specialfeeW?.toString() ?? null,
            bookfeeW: regClass.bookfeeW?.toString() ?? null,
            tuitionH: regClass.tuitionH?.toString() ?? null,
            specialfeeH: regClass.specialfeeH?.toString() ?? null,
            bookfeeH: regClass.bookfeeH?.toString() ?? null,
            lastmodify: toESTString(new Date()),
            updateby: "testaccount"
        } satisfies arrangementInsert

        await tx
            .update(arrangement)
            .set({
                ...regClassObject
            })
            .where(eq(arrangement.arrangeid, regClass.arrangeid))

        for (let i = 1; i < parsedArray.classrooms.length; i++) {
            const parsedData = arrangementSchema.parse(parsedArray.classrooms[i]);
            // Either update or insert
            if (parsedData.arrangeid) {
                // Updating
                await tx
                    .update(arrangement)
                    .set({
                        ...regClassObject, // Handle changes to regclass
                        isregclass: false, // In case
                        classid: parsedData.classid, // Handle updates to unique cols for consituent classrooms
                        teacherid: parsedData.teacherid,
                        roomid: parsedData.roomid,
                        seatlimit: parsedData.seatlimit
                    })
                    .where(eq(arrangement.arrangeid, parsedData.arrangeid));
            } else {
                await tx
                    .insert(arrangement)
                    .values({
                        ...regClassObject,
                        isregclass: false,
                        classid: parsedData.classid,
                        teacherid: parsedData.teacherid,
                        roomid: parsedData.roomid,
                        seatlimit: parsedData.seatlimit
                    })
            }
        }
        revalidatePath(`/admintest/management/semester`);
    })
}