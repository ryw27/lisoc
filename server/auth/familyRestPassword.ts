"use server";

//import { resetPassSchema } from "@/server/auth/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireRole } from "@/server/auth/actions";

export const familyResetPassword = async (data: {
    email: string;
    oldpassword: string;
    newpassword: string;
}) => {
    try {
        const session = await requireRole(["FAMILY"]);
        // reuse sreset pass schema
        const { email, oldpassword, newpassword } = data;

        // Ensure user is only resetting their own password
        if (session.user.name !== email) {
            throw new Error("Forbidden");
        }

        const userInfo = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.name, email),
        });

        if (!userInfo || !userInfo.emailVerified || !userInfo.roles.includes("FAMILY")) {
            throw new Error("Invalid credentials");
        }

        const encrypedOldPassword = userInfo.password;

        const valid = await bcrypt.compare(oldpassword, encrypedOldPassword);
        if (!valid) {
            throw new Error("Invalid old password");
        }

        const hashedPassword = await bcrypt.hash(newpassword, 10);
        await db.update(users).set({ password: hashedPassword }).where(eq(users.name, email));
        return { ok: true, message: "Password reset successfully" };
    } catch (error) {
        return { ok: false, message: String(error) };
    }
};
