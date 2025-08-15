"use server";
import { db } from "@/lib/db";
import { teacher, users } from "@/lib/db/schema";
import { safeAction } from "@/lib/safeAction";
import z from "zod/v4";
import { TeacherUserSchema, TeacherSchema } from "@/lib/data-view/entity-configs/(people)/teacher";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { UserSchema } from "@/lib/data-view/entity-configs/(people)/users";

export const RegisterTeacher = safeAction(
    TeacherUserSchema,
    async (data: z.infer<typeof TeacherUserSchema>) => {
        return await db.transaction(async (tx) => {
            // Check if user exists
            const user = await tx.query.users.findFirst({
                where: (u, { eq }) => eq(u.email, data.email)
            });

            if (user) {
                if (user.roles.includes("TEACHER")) {
                    throw new Error("This teacher already exists");
                }

                const updatedRoles = [...user.roles, "TEACHER"];
                const [updatedUser] = await tx
                    .update(users)
                    .set({ roles: updatedRoles as ("TEACHER" | "ADMINUSER" | "FAMILY")[]})
                    .where(eq(users.id, user.id)) 
                    .returning();

                const teacherData = TeacherSchema.strict().parse(data);
                const [newTeacher] = await tx
                    .insert(teacher)
                    .values({
                        ...teacherData,
                        userid: updatedUser.id,
                        profile: ""
                    })
                    .returning();

                return { user: updatedUser, teacher: newTeacher };
            } else {
                // Hash password securely
                const hashedPassword = await bcrypt.hash(data.password, 10);

                const userData = UserSchema.strict().parse(data);
                const [createdUser] = await tx
                    .insert(users)
                    .values({
                        ...userData,
                        roles: ["TEACHER"],
                        password: hashedPassword,
                    })
                    .returning();

                const teacherData = TeacherSchema.strict().parse(data);
                const [newTeacher] = await tx
                    .insert(teacher)
                    .values({
                        ...teacherData,
                        profile: "",
                        userid: createdUser.id,
                    })
                    .returning();

                return { user: createdUser, teacher: newTeacher };
            }
        });
    }
)