import { db } from "@/lib/db";
import FeedbackTable from "@/components/feedback/feedback-table";

export default async function FeedbackPage() {
    const allFeedback = await db.query.feedback.findMany();

    return <FeedbackTable allFeedback={allFeedback} />;
}
