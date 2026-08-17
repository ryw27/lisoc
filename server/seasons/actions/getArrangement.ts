"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/actions";
import { type uiClasses } from "@/types/shared.types";
import { getArrangementById } from "../data";

export async function getArrangement(arrangeid: number): Promise<uiClasses> {
    await requireRole(["ADMIN"], { redirect: false });

    const row = await getArrangementById(arrangeid, db);
    if (!row) {
        throw new Error(`Arrangement ${arrangeid} not found`);
    }
    return row;
}
