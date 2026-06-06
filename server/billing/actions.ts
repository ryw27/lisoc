"use server";

import { requireRole } from "@/server/auth/actions";
import { getLedgerData } from "./data";

export async function getLedgerAction(seasonid: number) {
    await requireRole(["ADMIN"]);
    const data = getLedgerData(seasonid);
    return data;
}
