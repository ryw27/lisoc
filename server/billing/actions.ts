"use server";

import { getLedgerData } from "./data";

export async function getLedgerAction(seasonid: number) {
    const data = getLedgerData(seasonid);
    return data;
}
