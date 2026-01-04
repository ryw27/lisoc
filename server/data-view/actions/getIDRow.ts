import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireRole } from "@/server/auth/actions";
import { getEntityConfig, Registry } from "../registry";

const USER_JOIN_TABLES = ["adminuser", "teacher", "family"] as const;
type UserJoinEntity = (typeof USER_JOIN_TABLES)[number];
function isUserJoinEntity(entity: keyof Registry): entity is UserJoinEntity {
    return (USER_JOIN_TABLES as readonly string[]).includes(entity as string);
}

export default getIDRow;

export async function getIDRow(entity: keyof Registry, rawId: number) {
    try {
        await requireRole(["ADMIN"]);
        const { table, primaryKey } = getEntityConfig(entity);

        // Use Number.isFinite for type safety, as zod is not imported and rawId is already a number
        const id = Number.isFinite(rawId) ? rawId : NaN;
        if (!Number.isFinite(id)) {
            throw new Error("Invalid ID provided");
        }

        let row = null;
        if (isUserJoinEntity(entity)) {
            [row] = await db
                .select()
                .from(table)
                // @ts-expect-error No idea how to fix
                .where(eq(table[primaryKey], id))
                .leftJoin(
                    users,
                    eq(table["userid" as keyof (typeof table)["$inferSelect"]], users.id)
                );
            row = {
                ...row,
                ...row.users,
            };
        } else {
            [row] = await db
                .select()
                .from(table)
                // @ts-expect-error No idea how to fix
                .where(eq(table[primaryKey], id));
        }

        if (!row) {
            throw new Error("Could not find corresponding row");
        }

        return { ok: true, data: row };
    } catch (error) {
        console.error("getIDRow error", error);
        const message =
            error instanceof Error ? error.message : "Server error. Please try again later.";
        return { ok: false, message: message };
    }
}
