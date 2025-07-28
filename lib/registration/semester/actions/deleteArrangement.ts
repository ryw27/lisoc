import { db } from "@/lib/db";
import { 
    classregistration, 
    arrangement 
} from "@/lib/db/schema";
import { uiClasses } from "../../types";
import { eq, and } from "drizzle-orm";


// TODO: Change based on new format
export async function deleteArrangement(classData: uiClasses) {
    return await db.transaction(async (tx) => {
        if (typeof classData.arrangeid !== "number" || isNaN(classData.arrangeid)) {
            throw new Error("Update data does not contain a valid arrange ID identifier");
        }

        // Delete any related registrations
        await tx
            .delete(classregistration)
            .where(and(
                eq(classregistration.classid, classData.classid),
                eq(classregistration.seasonid, classData.seasonid)
            ));

        // Then delete the arrangement
        const deleted = await tx
            .delete(arrangement)
            .where(and(
                eq(arrangement.arrangeid, classData.arrangeid),
                eq(arrangement.seasonid, classData.seasonid)
            ))
            .returning();

        if (!deleted.length) {
            throw new Error("Failed to delete class arrangement");
        }

        
        return deleted[0];
    });
}