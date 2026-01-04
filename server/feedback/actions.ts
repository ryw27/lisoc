"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import z from "zod/v4";
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import { transporter } from "@/lib/nodemailer";
import { safeAction } from "@/lib/safeAction";
import { toESTString } from "@/lib/utils";
import { requireRole } from "@/server/auth/actions";
import { emailSchema } from "@/server/auth/schema";

const markFeedbackDoneSchema = z.object({
    recid: z.coerce.number().min(1),
});
export const markFeedbackDone = safeAction(
    markFeedbackDoneSchema,
    async function (data: z.infer<typeof markFeedbackDoneSchema>) {
        // Already parsed by safeAction
        const user = await requireRole(["ADMIN"]);
        await db.transaction(async (tx) => {
            const feedbackRow = await tx.query.feedback.findFirst({
                where: (f, { eq }) => eq(f.recid, data.recid),
            });
            if (!feedbackRow) {
                throw new Error("Could not find feedback row");
            }

            const nowFormatted = toESTString(new Date()).split("T")[0];
            await tx
                .update(feedback)
                .set({
                    followup: `marked done on ${nowFormatted} by ${user.user.name}`,
                })
                .where(eq(feedback.recid, data.recid));
            revalidatePath("/admin/management/feedback");
        });
    }
);

async function sendFeedbackMail(
    adminMessage: string,
    feedbackMessage: string,
    emailTo: string,
    name: string | null
) {
    await transporter.sendMail({
        from: "LISOC Registration <regadmin@lisoc.org>",
        to: emailTo,
        subject: `LISOC feedback reply ${name ? `to ${name}` : ""}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #222; background: #f9f9f9; padding: 24px; border-radius: 8px;">
                <h2 style="color: #2d6cdf; margin-bottom: 16px;">LISOC Feedback Response</h2>
                <div style="margin-bottom: 20px;">
                    <span style="color: #888;">In response to your feedback:</span>
                    <blockquote style="margin: 12px 0; padding: 12px 16px; background: #f1f3f6; border-left: 4px solid #2d6cdf; color: #555; font-style: italic;">
                        ${feedbackMessage}
                    </blockquote>
                </div>
                <div style="margin-bottom: 20px;">
                    <span style="color: #888;">Our reply:</span>
                    <div style="margin-top: 8px; padding: 12px 16px; background: #eaf6ea; border-left: 4px solid #4caf50; color: #222;">
                        ${adminMessage}
                    </div>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                <p style="font-size: 13px; color: #888;">
                    If you have further questions, please reply to this email.<br>
                    Thank you for reaching out to LISOC!
                </p>
            </div>
        `,
    });
}

const replyFeedbackSchema = z.object({
    recid: z.coerce.number().min(1),
    adminMessage: z.string().min(1),
});
export const ReplyFeedback = safeAction(replyFeedbackSchema, async (data) => {
    const user = await requireRole(["ADMIN"]);
    const { recid, adminMessage } = replyFeedbackSchema.parse(data);

    await db.transaction(async (tx) => {
        const feedbackRow = await tx.query.feedback.findFirst({
            where: (f, { eq }) => eq(f.recid, recid),
        });
        if (!feedbackRow) {
            throw new Error("Feedback row not found");
        }

        // Require at least one contact method (email preferred)
        if (!feedbackRow.email) {
            throw new Error("No email provided in feedback row");
        }

        if (!feedbackRow.comment) {
            // No original message to reply to; do not send
            return;
        }

        const { email: parsedEmail } = emailSchema.parse({ email: feedbackRow.email });

        await sendFeedbackMail(adminMessage, feedbackRow.comment, parsedEmail, feedbackRow.name);

        const nowFormatted = toESTString(new Date()).split("T")[0];
        await tx
            .update(feedback)
            .set({
                followup: `answered on ${nowFormatted} by ${user.user.name}`,
            })
            .where(eq(feedback.recid, recid));
        revalidatePath("/admin/management/feedback");
    });
});
