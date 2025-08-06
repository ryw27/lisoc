"use server";
import z from "zod/v4";
import { safeAction } from "@/lib/safeAction";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { feedback } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { toESTString } from "@/lib/utils";
import { revalidatePath } from "next/cache";


const markFeedbackDoneSchema = z.object({
    recid: z.coerce.number().min(1)
})
export const markFeedbackDone = safeAction(
    markFeedbackDoneSchema,
    async function(data: z.infer<typeof markFeedbackDoneSchema>) {
        // Already parsed by safeAction
        const user = await requireRole(["ADMIN"]);
        await db.transaction(async (tx) => {
            const feedbackRow = await tx.query.feedback.findFirst({
                where: (f, { eq }) => eq(f.recid, data.recid)
            });
            if (!feedbackRow) {
                throw new Error("Could not find feedback row")
            }

            const nowFormatted = toESTString(new Date()).split("T")[0];
            await tx
                .update(feedback)
                .set({
                    followup: `marked done on ${nowFormatted} by ${user.user.name}`
                })
                .where(eq(feedback.recid, data.recid));
            revalidatePath("/admin/management/feedback");
        })
    }
)