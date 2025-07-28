import { 
    InferSelectModel,
    InferInsertModel
} from "drizzle-orm";

import {
    seasons,
    arrangement,
    familybalance,
    family
} from "../db/schema"


export type seasonObj = InferSelectModel<typeof seasons>;

export type arrangementObj = InferSelectModel<typeof arrangement>;
export type arrangementInsert = InferInsertModel<typeof arrangement>;

export type familyObj = InferSelectModel<typeof family>;

export type fambalanceObj = InferSelectModel<typeof familybalance>;
export type famBalanceInsert = InferInsertModel<typeof familybalance>;

