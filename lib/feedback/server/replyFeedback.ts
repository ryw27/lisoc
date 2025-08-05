import { db } from "@/lib/db"
import { feedback } from "@/lib/db/schema";
import { emailSchema } from "@/lib/auth/validation";
import { transporter } from "@/lib/nodemailer";
import { toESTString } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";

async function sendFeedbackMail(adminMessage: string, feedbackMessage: string, emailTo: string, name: string | null) {
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
        `
    })
}
export default async function ReplyFeedback(recid: number, adminMessage: string) {
    const user = await requireRole(["ADMIN"]);
    await db.transaction(async (tx) => {
        // 1. Check feedback row
        const feedbackRow = await tx.query.feedback.findFirst({
            where: (f, { eq }) => eq(f.recid, recid)
        });
        if (!feedbackRow) {
            throw new Error("Feedback row not found");
        }

        // 2. Check if there is no given contact info
        // TODO: How to handle db errors like message too long automatically?
        if (!feedbackRow.email || !feedbackRow.phone) {
            throw new Error("No contact information provided in feedback row");
        }

        // 3. Check if there is a message
        if (!feedbackRow.comment) {
            // just ignore
            return ;
        }

        // 4. Parse email
        const { email: parsedEmail } = emailSchema.parse(feedback.email);

        // 5. Send mail
        // TODO: Set up text? Might not be worth the hassle. For now, enforce email
        await sendFeedbackMail(adminMessage, feedbackRow.comment, parsedEmail, feedbackRow.name);

        // 6. Mark as done
        const nowFormatted = toESTString(new Date()).split("T")[0];
        console.log(nowFormatted);

        await tx
            .update(feedback)
            .set({
                followup: `answered on ${nowFormatted} by ${user.user.name}`
            })
            .where(eq(feedback.recid, recid))

    })
}