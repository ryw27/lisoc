import { getEntityConfig, Registry } from "../registry";
import { requireRole } from "../../auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

export default async function getIDRow(entity: keyof Registry, rawId: number) {
    try {
        await requireRole(["ADMIN"]);
        const { table, primaryKey } = getEntityConfig(entity);

        // Use Number.isFinite for type safety, as zod is not imported and rawId is already a number
        const id = Number.isFinite(rawId) ? rawId : NaN;
        if (!Number.isFinite(id)) {
            throw new Error("Invalid ID provided");
        }

        const [row] = await db
            .select()
            .from(table)
            .where(eq(table[primaryKey], id))

        if (!row) {
            throw new Error("Could not find corresponding row")
        }

        return { ok: true, data: row } 
    } catch (error) {
		console.error("getIDRow error", error);
		const message = error instanceof Error ? error.message : "Server error. Please try again later.";
		return { ok: false, message: message };
    }
}