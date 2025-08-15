"use server";
import { db } from "@/lib/db";
import { adminuser, users } from "@/lib/db/schema";
import { safeAction } from "@/lib/safeAction";
import z from "zod/v4";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { UserSchema } from "@/lib/data-view/entity-configs/(people)/users";
import { AdminSchema, AdminUserSchema } from "@/lib/data-view/entity-configs/(people)/adminuser";

export const RegisterAdmin = safeAction(
    AdminUserSchema,
    async (data: z.infer<typeof AdminUserSchema>) => {
        return await db.transaction(async (tx) => {
            // Check if user exists
            const user = await tx.query.users.findFirst({
                where: (u, { eq }) => eq(u.email, data.email)
            });

            if (user) {
                if (user.roles.includes("ADMINUSER")) {
                    throw new Error("This admin already exists");
                }

                const updatedRoles = [...user.roles, "ADMINUSER"];
                const [updatedUser] = await tx
                    .update(users)
                    .set({ roles: updatedRoles as ("ADMINUSER" | "FAMILY" | "TEACHER")[]})
                    .where(eq(users.id, user.id)) 
                    .returning();

                // Strips user fields, leaving only admin fields
                const adminData = AdminSchema.strict().parse(data);
                const [newAdmin] = await tx
                    .insert(adminuser)
                    .values({
                        ...adminData,
                        userid: updatedUser.id,
                    })
                    .returning();

                return { user: updatedUser, admin: newAdmin };
            } else {
                // Hash password securely
                const hashedPassword = await bcrypt.hash(data.password, 10);

                const userData = UserSchema.strict().parse(data);
                const [createdUser] = await tx
                    .insert(users)
                    .values({
                        ...userData,
                        roles: ["ADMINUSER"],
                        password: hashedPassword,
                    })
                    .returning();

                const adminData = AdminSchema.strict().parse(data);
                const [newAdmin] = await tx
                    .insert(adminuser)
                    .values({
                        ...adminData,
                        userid: createdUser.id,
                    })
                    .returning();

                    return { user: createdUser, admin: newAdmin };
            }
        });
    }
)