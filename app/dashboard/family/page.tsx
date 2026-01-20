import UpdateFamilyForm from "@/components/familymanagement/update-family-form";
import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/actions";
import { redirect } from "next/navigation";

export default async function updateFamily() {
    const user = await requireRole(["FAMILY"], { redirect: false });
    if (!user) {
        redirect("/login");
    }

    const familyOfUser = await db.query.family.findFirst({
        where: (family, { eq }) => eq(family.userid, user.user.id)
    });

    if (!familyOfUser) {
        redirect("/login");
    }

    return (
        <UpdateFamilyForm infamily={familyOfUser} />
    )
}