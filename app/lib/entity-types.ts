import * as schema from "@/app/lib/db/schema"
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

// ------------------------------------------------------------------------------
// Possibly overkill
// ------------------------------------------------------------------------------

// Primary key map
// THESE MUST MATCH UP TO THE TABLE NAMES IN THE SCHEMA. THIS IS THE ONE SOURCE OF TRUTH - ANYTHING WRONG HERE BREAKS ALL TYPE CHECKS 
// Const assertion tells typescript that this is a constant object. Refer: https://blog.logrocket.com/complete-guide-const-assertions-typescript/

export const primKeyMap = {
    accounts: "id",
    sessions: "id",
    adminrole: "roleid",
    errorlog: "id",
    users: "id",
    family: "familyid", 
    adminuser: "adminid",
    legacyAdminuser: "userid",
    paypalrecord: "pid",
    scorecode: "codeid",
    teacher: "teacherid",
    legacyTeacher: "teacherid",
    seatnum: "seatid",
    supports: "catid",
    seasons: "seasonid",
    arrangement: "arrangeid",
    classes: "classid",
    agelist: "ageid",
    classrooms: "roomid",
    classtime: "timeid",
    suitableterm: "termno",
    agerestriction: "ageid",
    classtype: "typeid",
    student: "studentid",
    classregistration: "regid",
    regstatus: "regstatusid",
    familybalance: "balanceid",
    dutyassignment: "dutyassignid",
    dutystatus: "dutystatusid",
    parentdutyPb: "pdid",
    familybalancetype: "typeid",
    familybalancestatus: "statusid",
    feedback: "recid",
    feelist: "feelistid", 
    dutycommittee: "dcid",
    regchangerequest: "requestid",
    schoolcalendar: "calid",
    scorefactors: "factorid",
    studentscore: "scoreid",
    scoredetail: "scoredetailid",
    studentscorecomment: "scorecommentid",
    studentscorefactor: "scoreid",
    studentscorerating: "scoreratingid",
    scoreratingfactors: "ratingfactorid",
    scorerating: "ratingid",
    requeststatus: "reqstatusid",
    legacyFamily: "familyid",
    verificationToken: "identifier",
    adminuserrole: "userid"
} as const;

// Do the same for foreign key maps. This is all for strict compile-time type safety!! YEAH 
export const fkMap = {
  accounts: {},
  sessions: {},
  adminrole: {},
  errorlog: {},
  users: {},
  family: {
    userid: { table: "users", column: "id" },
  },
  adminuser: {
    userid: { table: "users", column: "id" },
  },
  legacyAdminuser: {},
  paypalrecord: {},
  scorecode: {},
  teacher: {
    userid: { table: "users", column: "id" },
  },
  legacyTeacher: {},
  seatnum: {},
  supports: {},
  seasons: {},
  arrangement: {
    seasonid: { table: "seasons", column: "seasonid" },
    classid: { table: "classes", column: "classid" },
    teacherid: { table: "teacher", column: "teacherid" },
    roomid: { table: "classrooms", column: "roomid" },
    timeid: { table: "classtime", column: "timeid" },
  },
  classes: {
    ageid: { table: "agerestriction", column: "ageid" },
    typeid: { table: "classtype", column: "typeid" },
    classupid: { table: "classes", column: "classid" },
  },
  agelist: {},
  classrooms: {},
  classtime: {},
  suitableterm: {},
  agerestriction: {},
  classtype: {
    ageid: { table: "agerestriction", column: "ageid" },
  },
  student: {
    familyid: { table: "family", column: "familyid" },
  },
  classregistration: {
    studentid: { table: "student", column: "studentid" },
    arrangeid: { table: "arrangement", column: "arrangeid" },
    seasonid: { table: "seasons", column: "seasonid" },
    classid: { table: "classes", column: "classid" },
    statusid: { table: "regstatus", column: "regstatusid" },
    previousstatusid: { table: "regstatus", column: "regstatusid" },
    familybalanceid: { table: "familybalance", column: "balanceid" },
    familyid: { table: "family", column: "familyid" },
    newbalanceid: { table: "familybalance", column: "balanceid" },
  },
  regstatus: {},
  familybalance: {
    seasonid: { table: "seasons", column: "seasonid" },
    familyid: { table: "family", column: "familyid" },
    typeid: { table: "familybalancetype", column: "typeid" },
    statusid: { table: "familybalancestatus", column: "statusid" },
  },
  dutyassignment: {
    familyid: { table: "family", column: "familyid" },
    studentid: { table: "student", column: "studentid" },
    seasonid: { table: "seasons", column: "seasonid" },
    dutystatus: { table: "dutystatus", column: "dutystatusid" },
    pdid: { table: "parentdutyPb", column: "pdid" },
  },
  dutystatus: {},
  parentdutyPb: {
    familyid: { table: "family", column: "familyid" },
    studentid: { table: "student", column: "studentid" },
    committeeid: { table: "dutycommittee", column: "dcid" },
    seasonid: { table: "seasons", column: "seasonid" },
  },
  familybalancetype: {},
  familybalancestatus: {},
  feedback: {
    familyid: { table: "family", column: "familyid" },
  },
  feelist: {
    seasonid: { table: "seasons", column: "seasonid" },
  },
  dutycommittee: {},
  regchangerequest: {
    regid: { table: "classregistration", column: "regid" },
    studentid: { table: "student", column: "studentid" },
    seasonid: { table: "seasons", column: "seasonid" },
    relatedseasonid: { table: "seasons", column: "seasonid" },
    classid: { table: "classes", column: "classid" },
    oriregstatusid: { table: "regstatus", column: "regstatusid" },
    regstatusid: { table: "regstatus", column: "regstatusid" },
    familybalanceid: { table: "familybalance", column: "balanceid" },
    familyid: { table: "family", column: "familyid" },
    newbalanceid: { table: "familybalance", column: "balanceid" },
  },
  schoolcalendar: {
    seasonid: { table: "seasons", column: "seasonid" },
  },
  scorefactors: {},
  studentscore: {
    studentid: { table: "student", column: "studentid" },
    seasonid: { table: "seasons", column: "seasonid" },
    classid: { table: "classes", column: "classid" },
    factorid: { table: "scorefactors", column: "factorid" },
  },
  scoredetail: {
    scoreid: { table: "studentscore", column: "scoreid" },
  },
  studentscorecomment: {
    studentid: { table: "student", column: "studentid" },
    seasonid: { table: "seasons", column: "seasonid" },
    classid: { table: "classes", column: "classid" },
    scoreid: { table: "studentscore", column: "scoreid" },
  },
  studentscorefactor: {
    scoreid: { table: "studentscore", column: "scoreid" },
    factorid: { table: "scorefactors", column: "factorid" },
  },
  studentscorerating: {
    studentid: { table: "student", column: "studentid" },
    seasonid: { table: "seasons", column: "seasonid" },
    classid: { table: "classes", column: "classid" },
    ratingfactorid: { table: "scoreratingfactors", column: "ratingfactorid" },
    ratingid: { table: "scorerating", column: "ratingid" },
  },
  scoreratingfactors: {},
  scorerating: {},
  requeststatus: {},
  legacyFamily: {},
  verificationToken: {},
  adminuserrole: {
    userid: { table: "adminuser", column: "adminid" },
    roleid: { table: "adminrole", column: "roleid" },
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

// Filter out non-table exports (like enums) and only include tables that have primary keys
type SchemaTableNames = {
  [K in keyof typeof schema]: (typeof schema)[K] extends { _: any; $inferSelect: any } ? K : never;
}[keyof typeof schema];

export type TableName = SchemaTableNames & keyof typeof primKeyMap; // Names of tables that have primary keys defined
export type Table<N extends TableName> = (typeof schema)[N]; // Concrete table type, PgTableWithColumns<Class>, PgTableWithColumns<AdminRole>, etc.

// Union type of all column names for a table. i.e. "classnamecn" | "classnameeng" | "classid" | ...
export type ColKey<N extends TableName, T extends Table<N>> = { [K in keyof T]: T[K] extends AnyPgColumn ? K : never }[keyof T] & string;
// Union type of the types of the columns, i.e. (corresponding to top comment): string | string | number
export type ColVal<N extends TableName, T extends Table<N>, K extends ColKey<N, T>> = (T[K] extends AnyPgColumn ? T[K]["_"]["data"] : never)
// export type ColVal<N extends TableName, T extends Table<N>, K extends ColKey<N, T>> = K extends keyof T["$inferSelect"] ? T["$inferSelect"][K] : never;


// Primary key name for a table. i.e. "roleid" | "classid" | ... 
export type PKName<N extends TableName, T extends Table<N>> = (typeof primKeyMap)[N] & keyof T;

// Primary key value type for a table.  i.e. number | string | ...

export type PKVal<N extends TableName> =
  // distribute over each concrete N
  N extends TableName
    ? (
        // look up the row shape of THIS table
        // Parentheses tells compiler to look at the internal type as fully resolved, so it's not treating it as a union type anymore
        InferSelectModel<Table<N>>
        // index it with THIS table's PK literal
      )[PKName<N, Table<N>> &
        keyof InferSelectModel<Table<N>> /* safety &'ing two different things produces never, make sure PKName is a key of the table */]
    : never;

// Names of Foreign keys on a table
export type FKCol<N extends TableName> = keyof (typeof fkMap)[N] & string;

// I'm pretty sure it's always number but whatever lol
export type FKVal<N extends TableName, K extends FKCol<N>> = (typeof fkMap)[N][K];

      
