import { 
    InferSelectModel,
    InferInsertModel
} from "drizzle-orm";

import {
    seasons,
    arrangement,
    familybalance,
    family,
    classregistration
} from "../db/schema"

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
}


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

