"use server";
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import { toESTString } from "@/lib/utils";
import { z } from "zod/v4";
import { feedbackSchema } from "../validation";
import { requireRole } from "@/lib/auth";




export default async function SubmitFeedback(incomingData: z.infer<typeof feedbackSchema>, familyid: number) {
    await requireRole(["FAMILY"]);
    const parsedData = feedbackSchema.parse(incomingData);
    await db.transaction(async (tx) => {
        await tx
            .insert(feedback)        
            .values({
                ...Object.fromEntries(
                  Object.entries(parsedData).filter(([key]) => key !== "website")
                ),
                familyid: familyid,
                postdate: toESTString(new Date())
            })
    }) 
}