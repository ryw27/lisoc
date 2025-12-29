"use server";
import { getLedgerData } from "./fetch";

export async function getLedgerAction(seasonid: number) {
    const data = getLedgerData(seasonid);
    return data;
}