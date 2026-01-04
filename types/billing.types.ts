import { InferSelectModel } from "drizzle-orm";
import { familybalance } from "@/lib/db/schema";

export type billingJoin = Omit<InferSelectModel<typeof familybalance>, "family"> & {
    family: {
        familyid: number;
        fatherlasten: string | null;
        fatherfirsten: string | null;
        motherlasten: string | null;
        motherfirsten: string | null;
        fathernamecn: string | null;
        mothernamecn: string | null;
        students: {
            namecn: string;
            namefirsten: string;
            namelasten: string;
        }[];
    };
    familybalancetype: {
        typenameen: string | null;
    };
};

export type FamilyRow = {
    fid: number; // family id
    family: string; // family name
    students: { namecn: string; namefirsten: string; namelasten: string }[]; // students

    billed: number; // how much they are billed this sem
    paid: number; // how much they paid
    status: "paid" | "unpaid" | "partial" | "overdue"; // status

    lastActive: string;
    lastActivity: BillingRow[];
};

export type BillingRow = {
    tid: number; // transaction id
    date: string; // date
    family: string; //  family name
    familyid: number;
    desc: string; // what payment this is
    amount: number; // amount
    // type: string // check, online
};

export type BillingSummary = {
    billed: number;
    collected: number;
    outstanding: number;
    progress: number;
};
