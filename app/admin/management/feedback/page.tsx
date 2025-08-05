import FeedbackTable from "@/components/feedback/feedback-table"
import { db } from "@/lib/db"
export default async function FeedbackPage() {
    const allFeedback = await db.query.feedback.findMany()


    return (
        <FeedbackTable allFeedback={allFeedback} />
    )    
}