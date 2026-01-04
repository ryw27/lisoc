import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/actions";
import FamilyFeedbackForm from "@/components/feedback/family-feedback-form";

export default async function ContactPage() {
    const user = await requireRole(["FAMILY"]);

    const userRow = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, user.user.id),
        with: {
            families: {
                columns: {
                    familyid: true,
                },
            },
        },
    });
    if (!userRow) {
        throw new Error("User not found in database");
    }
    if (!userRow.families) {
        throw new Error("Family account not found");
    }

    const defaults = {
        name: userRow.name || "",
        email: userRow.email || "",
        phone: userRow.phone || "",
        subject: "Comment and Feedback",
    };

    return <FamilyFeedbackForm defaults={defaults} familyid={userRow.families.familyid} />;
}
