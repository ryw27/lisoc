import { requireRole } from "@/app/lib/auth-lib/auth-actions";
import CreateStudentForm from "./create-student-form";
import { redirect } from "next/navigation";
import { db } from "@/app/lib/db";

export default async function CreateStudent() {
    const user = await requireRole(["FAMILY"], { redirect: false });
    if (!user) {
        redirect("/login");
    }

    const familyOfUser = await db.query.family.findFirst({
        where: (family, { eq }) => eq(family.userid, user.user.userid)
    });

    if (!familyOfUser) {
        redirect("/login");
    }

    return (
        <CreateStudentForm familyid={familyOfUser.familyid} />
    )
}