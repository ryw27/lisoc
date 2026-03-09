import { redirect } from "next/navigation";
import z from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/actions";
import { teacherUpdateSchema } from "@/server/auth/schema";
import UpdateTeacherForm from "@/components/teacher/update-teacher-form";

export default async function updateTeacher() {
    const user = await requireRole(["TEACHER"], { redirect: false });
    if (!user) {
        redirect("/login");
    }

    const teacherOfUser = await db.query.teacher.findFirst({
        where: (teacher, { eq }) => eq(teacher.userid, user.user.id),
        with: {
            user: {},
        },
    });

    if (!teacherOfUser) {
        redirect("/login");
    }

    if (!teacherOfUser.user) {
        redirect("/login");
    }

    const teacher: z.infer<typeof teacherUpdateSchema> = {
        namelasten: teacherOfUser.namelasten ?? "",
        namefirsten: teacherOfUser.namefirsten ?? "",
        namecn: teacherOfUser.namecn ?? "",
        address: teacherOfUser.address1 ?? "",
        phone: teacherOfUser.user ? (teacherOfUser.user.phone ? teacherOfUser.user.phone : "") : "",
        email: teacherOfUser.user ? teacherOfUser.user.email : "",
    };

    return <UpdateTeacherForm inteacher={teacher} userid={teacherOfUser.user.id} />;
}
