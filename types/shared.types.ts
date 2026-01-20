import { arrangement, classregistration, family, familybalance, seasons } from "@/lib/db/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

// TODO: Shared types

// All types of fees
export type balanceFees = {
    childnumRegfee: number;
    regfee: number;
    earlyregdiscount: number;
    lateregfee: number;
    extrafee4newfamily: number;
    managementfee: number;
    dutyfee: number;
    cleaningfee: number;
    otherfee: number;
    tuition: number;
    groupdiscount: number;
    processfee: number;
    totalamount: number;
};

// Season
export type seasonObj = InferSelectModel<typeof seasons>;

// Arrangement
export type arrangementObj = InferSelectModel<typeof arrangement>;
export type arrangementInsert = InferInsertModel<typeof arrangement>;

// Family
export type familyObj = InferSelectModel<typeof family>;

// Class Reg
export type classRegObj = InferSelectModel<typeof classregistration>;

// Family balance
export type fambalanceObj = InferSelectModel<typeof familybalance>;
export type famBalanceInsert = InferInsertModel<typeof familybalance>;

// TODO: Check this type, make sure it's extendable and reusable
// export type uiClasses = z.infer<typeof arrangementSchema>;
export type uiClasses = {
    arrangeid?: number;
    seasonid: number;
    classid: number;
    teacherid: number;
    roomid: number;
    timeid: number;
    seatlimit: number | null;
    agelimit: number | null;
    suitableterm: number;
    term?: "SPRING" | "FALL";
    waiveregfee: boolean;
    closeregistration: boolean;
    tuitionW: string | null; // Numeric, or float, needs string
    specialfeeW: string | null;
    bookfeeW: string | null;
    tuitionH: string | null;
    specialfeeH: string | null;
    bookfeeH: string | null;
    isregclass: boolean;
    notes: string | null;
};

export type uiClassKey = {
    classkey: number;
};

export type uiClasses2 = uiClasses & uiClassKey;

export type arrangeClasses = {
    arrangeid: number;
    seasonid: number;
    classid: number;
    typeid: number;
    classno: number;
    classnamecn: string;
    description: string | null;
};

export type term = "year" | "fall" | "spring" | "any";

// Common views for dropdowns and data fetches
type teacherJoin = { teacherid: number; namecn: string; namelasten: string; namefirsten: string };
export type classJoin = {
    classid: number;
    classno: string;
    classnamecn: string;
    classnameen: string;
    typeid: number;
    description: string | null;
};
// type seasonJoin = { seasonid: number, seasonnamecn: string, seasonnameeng: string }
type roomJoin = { roomid: number; roomno: string };
type timeJoin = { timeid: number; period: string | null };
type termJoin = { termno: number; suitableterm: string | null; suitabletermcn: string | null };

export type selectOptions = {
    teachers: teacherJoin[];
    classes: classJoin[];
    rooms: roomJoin[];
    times: timeJoin[];
    terms: termJoin[];
};

export type IdMaps = {
    teacherMap: Record<number, teacherJoin[][number]>;
    classMap: Record<number, classJoin[][number]>;
    roomMap: Record<number, roomJoin[][number]>;
    timeMap: Record<number, timeJoin[][number]>;
    termMap: Record<number, termJoin[][number]>;
};

export type balanceTypes = {
    balanceid: number;
    regdate: string;
    semester: string;
    amount: number;
    check_no: string;
    paiddate: string;
    note: string;
};

