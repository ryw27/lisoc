import * as schema from "@/app/lib/db/schema";
import { AnyPgColumn } from "drizzle-orm/pg-core";

// Primary key map. 
// THESE MUST MATCH UP TO THE TABLE NAMES IN THE SCHEMA. THIS IS THE ONE SOURCE OF TRUTH - ANYTHING WRONG HERE BREAKS ALL TYPE CHECKS 
// Const assertion tells typescript that this is a constant object. Refer: https://blog.logrocket.com/complete-guide-const-assertions-typescript/

export const primKeyMap = {
    adminrole: "roleid",
    family: "familyid", 
    adminuser: "userid",
    adminuserrole: "userid", // Composite key, using first column as representative
    agerestriction: "ageid",
    agelist: "ageid", // Composite key, using first column as representative
    seasons: "seasonid",
    classtype: "typeid",
    classes: "classid",
    teacher: "teacherid",
    classrooms: "roomid",
    sessions: "timeid",
    suitableterm: "termno",
    arrangement: "arrangeid",
    student: "studentid",
    regstatus: "regstatusid",
    familybalancestatus: "statusid",
    familybalancetype: "typeid",
    classregistration: "regid",
    familybalance: "balanceid",
    familybalanceSave: "balanceid",
    dutycommittee: "dcid",
    dutystatus: "dutystatusid",
    dutyassignment: "dutyassignid",
    parentdutyPb: "pdid",
    errorlog: "id",
    feedback: "recid",
    feelist: "feelistid", 
    menu: "menuid",
    paypalrecord: "pid",
    paypalrecordImport: "importid",
    requeststatus: "reqstatusid",
    regchangerequest: "requestid",
    schoolcalendar: "calid",
    scorecode: "codeid",
    scorefactors: "factorid",
    studentscore: "scoreid",
    scoredetail: "scoredetailid",
    scorerating: "ratingid",
    scoreratingfactors: "ratingfactorid",
    studentscorecomment: "scorecommentid",
    studentscorefactor: "scorefactorid",
    studentscorerating: "scoreratingid",
    seatnum: "seatid",
    supports: "catid",
    tempclass: "tempid"
} as const;

// Note that primKeyMap is a value, not a type, which is why you must use typeof to get the object type:
// typeof primKeyMap produces an object type:
// typeof primKeyMap = {
//     adminrole: "roleid",
//     family: "familyid",
//     class: "classid",
// } as a type, not a value because of const assertion

/* 
    typeof schema produces an object type:
    {
        adminuserrole: PgTableWithColumns<...>,
        classes: PgTableWithColumns<...>,
        teacher: PgTableWithColumns<...>,
        // ... every table you exported
    }
*/

export type TableName = keyof typeof schema; // Names of all tables, "adminrole" | "classes" | ...
export type Table<N extends TableName> = (typeof schema)[N]; // Concrete table type, PgTableWithColumns<Class>, PgTableWithColumns<AdminRole>, etc.

// Union type of all column names for a table. i.e. "classnamecn" | "classnameeng" | "classid" | ...
export type ColumnKey<N extends TableName> = { [K in keyof Table<N>]: Table<N>[K] extends AnyPgColumn ? K : never }[keyof Table<N>] & string;

// Primary key name for a table. i.e. "roleid" | "classid" | ... 
export type PKName<N extends TableName> = (typeof primKeyMap)[N];

// Primary key value type for a table.  i.e. number | string | ...
export type PKVal<N extends TableName> =
  // distribute over each concrete N
  N extends TableName
    ? (
        // look up the row shape of THIS table
        // Parentheses tells compiler to look at the internal type as fully resolved, so it's not treating it as a union type anymore
        Table<N>["$inferSelect"]
        // index it with THIS table's PK literal
      )[PKName<N> &
        keyof Table<N>["$inferSelect"] /* safety & two different things produces never, make sure PKName is a key of the table */]
    : never;


