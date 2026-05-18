"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { eq, InferInsertModel } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { z } from "zod/v4";
import { pgadapter } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes, users } from "@/lib/db/schema";
import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";
import { Transaction } from "@/types/server.types";
import { requireRole } from "@/server/auth/actions";
import { sendAccountSetupEmail } from "@/server/auth/data";
import { getEntityConfig, Registry } from "@/server/data-view/registry";
import { AdminSchema, AdminUserJoined } from "../entity-configs/(people)/adminuser";
import { FamilyJoined } from "../entity-configs/(people)/family";
import { TeacherJoined, TeacherSchema } from "../entity-configs/(people)/teacher";

// Generate a placeholder bcrypt hash that no plaintext can satisfy. Used so
// the NOT NULL `users.password` column has a valid bcrypt-shaped value while
// the user has not yet completed setup. They MUST complete the setup-link
// flow to set a real, login-usable hash.
async function unusableBcryptHash(): Promise<string> {
    const random = randomBytes(48).toString("base64");
    return bcrypt.hash(`unusable:${random}`, 10);
}

const UserInsertTables = ["adminuser", "teacher"];
async function insertUser(
    tx: Transaction,
    data: AdminUserJoined | TeacherJoined | FamilyJoined,
    entity: keyof Registry
) {
    // Determine role based on entity type
    const roleMap = {
        adminuser: "ADMINUSER" as const,
        teacher: "TEACHER" as const,
    };

    const exists = await tx.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, data.email),
    });

    if (exists) {
        const newRole = roleMap[entity as keyof typeof roleMap];
        if (exists.roles.includes(newRole)) {
            throw new Error(`User with ${data.email} already has this role ${entity}`);
        }
        const updatedRoles = [...exists.roles, newRole];
        const [user] = await tx
            .update(users)
            .set({
                roles: updatedRoles,
            })
            .where(eq(users.id, exists.id))
            .returning();
        const newUser = false;
        return { user, newUser };
    }

    // For brand-new admin/teacher accounts we ignore any password the admin
    // typed in the data-view form. Plaintext passwords used to be emailed to
    // the user, which meant a typo'd email address handed full credentials to
    // whoever owned that address. Instead we store an unguessable placeholder
    // hash here; the real password is set by the user through the setup link
    // sent via `sendAccountSetupEmail`.
    const [user] = await tx
        .insert(users)
        .values({
            name: data.name,
            email: data.email,
            password: await unusableBcryptHash(),
            roles: [roleMap[entity as keyof typeof roleMap]],
            address: data.address,
            city: data.city,
            state: data.state,
            zip: data.zip,
            phone: data.phone,
        })
        .returning();
    const newUser = true;
    return { user, newUser };
}

export interface ActionResult {
    ok: boolean;
    message: string;
    id?: string | number;
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
}

export async function insertRow(
    entity: keyof Registry,
    formInput: FormData
): Promise<ActionResult> {
    try {
        const user = await requireRole(["ADMIN"]);
        const { table, primaryKey, formSchema, makeInsertExtras } = getEntityConfig(entity);
        const insertExtras = makeInsertExtras ? makeInsertExtras(user.user) : {};

        const rawObject = Object.fromEntries(formInput.entries());
        const parsed = formSchema.safeParse(rawObject);
        if (!parsed.success) {
            const flat = z.flattenError(parsed.error);
            return {
                ok: false,
                message: "Validation failed. Please correct the highlighted fields.",
                fieldErrors: flat.fieldErrors as Record<string, string[]>,
                formErrors: flat.formErrors,
            };
        }

        const insertData = {
            ...parsed.data,
            ...insertExtras,
        } as InferInsertModel<typeof table>;

        const row = await db.transaction(async (tx) => {
            // For user-related entities, insert user first
            if (UserInsertTables.includes(entity)) {
                const { user, newUser } = await insertUser(
                    tx,
                    parsed.data as unknown as AdminUserJoined | TeacherJoined,
                    entity
                );
                const schemaMap = {
                    adminuser: AdminSchema,
                    teacher: TeacherSchema,
                } as const;

                const schema = schemaMap[entity as keyof typeof schemaMap];
                const result = schema.strip().parse(parsed.data); // Strip the users fields
                // if (result.error) {
                //     const flat = z.flattenError(result.error);
                //     return {
                //         ok: false,
                //         message: "Validation failed. Please correct the highlighted fields.",
                //         fieldErrors: flat.fieldErrors as Record<string, string[]>,
                //         formErrors: flat.formErrors,
                //     };
                // }

                const specificData = result;
                // Add user ID to insert data
                const userInsertData = {
                    ...specificData,
                    userid: user.id,
                    ischangepwdnext: newUser ? true : false,
                } as InferInsertModel<typeof table>;

                const [entityRow] = await tx.insert(table).values(userInsertData).returning();

                // Only send a setup link when this is a fresh user. If the
                // user already existed and we just attached a new role, they
                // already have working credentials.
                if (newUser) {
                    const setupToken = uuid();
                    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
                    await pgadapter.createVerificationToken({
                        identifier: parsed.data.email as string,
                        token: setupToken,
                        expires: new Date(Date.now() + SEVEN_DAYS_MS),
                    });
                    await sendAccountSetupEmail(
                        parsed.data.email as string,
                        setupToken,
                        entity === "adminuser" ? "Admin" : "Teacher"
                    );
                }
                return entityRow;
            } else {
                const [entityRow] = await tx.insert(table).values(insertData).returning();
                return entityRow;
            }
        });

        if (!row) {
            console.error(`Insert failed for ${entity} with row ${row}`);
            return { ok: false, message: "Unknown database error occurred" };
        }

        // Exception placed for self referential columns, only for classes
        const itself = primaryKey === "classid";
        if (itself) {
            await db
                .update(classes)
                .set({
                    // @ts-expect-error No idea how to fix
                    gradeclassid: row.classid,
                })
                // @ts-expect-error No idea how to fix
                .where(eq(classes.classid, row.classid));
        }

        // @ts-expect-error No idea how to fix
        const id = row[primaryKey];

        revalidatePath(`${ADMIN_DATAVIEW_LINK}/${id ?? ""}`);

        return {
            ok: true,
            message: "Created successfully",
            id,
        };
    } catch (error) {
        console.error("insertRow error", error);
        const message =
            error instanceof Error ? error.message : "Server error. Please try again later.";
        return { ok: false, message, formErrors: [message] };
    }
}
