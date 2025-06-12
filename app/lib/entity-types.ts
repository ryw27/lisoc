import * as schema from "@/app/lib/db/schema";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

// ------------------------------------------------------------------------------
// Probably overkill but why not. AI generated the two maps.
// ------------------------------------------------------------------------------


// Primary key map
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


// Do the same for foreign key maps. This is all for strict compile-time type safety!! YEAH 
export const fkMap = {
  adminrole: {},
  family: {},
  adminuser: {
    familyid: { table: "family", column: "familyid" },
  },
  adminuserrole: {
    roleid: { table: "adminrole", column: "roleid" },
    userid: { table: "adminuser", column: "userid" },
  },
  agerestriction: {},
  agelist: {
    ageid: { table: "agelist", column: "ageid" },
  },
  seasons: {
    seasonid: { table: "seasons", column: "seasonid" },
  },
  classtype: {
    typeid: { table: "classtype", column: "typeid" },
  },
  classes: {
    teacherid: { table: "teacher", column: "teacherid" },
    roomid: { table: "classrooms", column: "roomid" },
    timeid: { table: "sessions", column: "timeid" },
    typeid: { table: "classtype", column: "typeid" },
    ageid: { table: "agerestriction", column: "ageid" },
    seasonid: { table: "seasons", column: "seasonid" },
  },
  teacher: {
    familyid: { table: "family", column: "familyid" },
  },
  classrooms: {},
  sessions: {},
  suitableterm: {},
  arrangement: {
    seasonid: { table: "seasons", column: "seasonid" },
  },
  student: {
    familyid: { table: "family", column: "familyid" },
  },
  regstatus: {},
  familybalancestatus: {},
  familybalancetype: {},
  classregistration: {
    classid: { table: "classes", column: "classid" },
    studentid: { table: "student", column: "studentid" },
    regstatusid: { table: "regstatus", column: "regstatusid" },
  },
  familybalance: {
    familyid: { table: "family", column: "familyid" },
    seasonid: { table: "seasons", column: "seasonid" },
    statusid: { table: "familybalancestatus", column: "statusid" },
    typeid: { table: "familybalancetype", column: "typeid" },
  },
  familybalanceSave: {},
  dutycommittee: {},
  dutystatus: {},
  dutyassignment: {
    dcid: { table: "dutycommittee", column: "dcid" },
    dutystatusid: { table: "dutystatus", column: "dutystatusid" },
  },
  parentdutyPb: {},
  errorlog: {},
  feedback: {
    studentid: { table: "student", column: "studentid" },
  },
  feelist: {},
  menu: {},
  paypalrecord: {},
  paypalrecordImport: {},
  requeststatus: {},
  regchangerequest: {
    regid: { table: "classregistration", column: "regid" },
    reqstatusid: { table: "requeststatus", column: "reqstatusid" },
  },
  schoolcalendar: {},
  scorecode: {},
  scorefactors: {},
  studentscore: {
    studentid: { table: "student", column: "studentid" },
    codeid: { table: "scorecode", column: "codeid" },
  },
  scoredetail: {
    scoreid: { table: "studentscore", column: "scoreid" },
    factorid: { table: "scorefactors", column: "factorid" },
  },
  scorerating: {},
  scoreratingfactors: {
    ratingid: { table: "scorerating", column: "ratingid" },
    factorid: { table: "scorefactors", column: "factorid" },
  },
  studentscorecomment: {
    scoreid: { table: "studentscore", column: "scoreid" },
  },
  studentscorefactor: {
    scoreid: { table: "studentscore", column: "scoreid" },
    factorid: { table: "scorefactors", column: "factorid" },
  },
  studentscorerating: {
    scoreid: { table: "studentscore", column: "scoreid" },
    ratingid: { table: "scorerating", column: "ratingid" },
  },
  seatnum: {
    classid: { table: "classes", column: "classid" },
  },
  supports: {},
  tempclass: {
    classid: { table: "classes", column: "classid" },
  }
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
export type ColKey<N extends TableName> = { [K in keyof Table<N>]: Table<N>[K] extends AnyPgColumn ? K : never }[keyof Table<N>] & string;
// Union type of the types of the columns, i.e. (corresponding to top comment): string | string | number
export type ColVal<N extends TableName, K extends ColKey<N>> = Table<N>[K]


// Primary key name for a table. i.e. "roleid" | "classid" | ... 
export type PKName<N extends TableName> = (typeof primKeyMap)[N];

// Primary key value type for a table.  i.e. number | string | ...

export type PKVal<N extends TableName> =
  // distribute over each concrete N
  N extends TableName
    ? (
        // look up the row shape of THIS table
        // Parentheses tells compiler to look at the internal type as fully resolved, so it's not treating it as a union type anymore
        InferSelectModel<Table<N>>
        // index it with THIS table's PK literal
      )[PKName<N> &
        keyof InferSelectModel<Table<N>> /* safety &'ing two different things produces never, make sure PKName is a key of the table */]
    : never;

// Names of Foreign keys on a table
export type FKCol<N extends TableName> = keyof typeof fkMap[N] & string;

// I'm pretty sure it's always number but whatever lol
export type FKVal<N extends keyof typeof fkMap, K extends FKCol<N>> = typeof fkMap[N][K];

      
