import { ColumnDef } from "@tanstack/react-table";
import { InferSelectModel } from "drizzle-orm";
import { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";
import { DefaultSession } from "next-auth";
import { z } from "zod/v4";
import * as schema from "@/lib/db/schema";

// NOTE: CHECK THE PRIMARY KEY MAP AT THE END OF THE FILE.
// THESE MUST MATCH UP TO THE TABLE NAMES IN THE SCHEMA. ADD ANY NEW TABLES, CHANGE THAT.

// 1. Entity Config - Config for any data entity

export interface EntityConfig<T extends Table> {
    table: T; // Postgres table
    tableName: string; // Table name
    formSchema: z.ZodObject; // Form Schema validation
    primaryKey: PKName<T>; // Primary key
    makeInsertExtras?: (user: DefaultSession["user"]) => Extras<T>; // Get insert extra values that can't be chosen, usually createby/createon
    makeUpdateExtras?: (user: DefaultSession["user"]) => Extras<T>; // Same thing, but for update
}

// 2. Table definitions, including tables, column keys, and primaryKeys depending on the large map at the bottom

export type Table = (typeof schema)[keyof typeof schema];
// Union type of all column names for a table. i.e. "classnamecn" | "classnameeng" | "classid" | ...
export type ColKey<T extends Table> = {
    [K in keyof T]: T[K] extends AnyPgColumn ? K : never;
}[keyof T] &
    string;
// Union type of the types of the columns, i.e. (corresponding to top comment): string | string | number
export type ColVal<T extends Table, K extends ColKey<T>> = T[K] extends AnyPgColumn
    ? T[K]["_"]["data"]
    : never;
// Primary key name for a table. i.e. "roleid" | "classid" | ...
export type PKName<T extends Table> = (typeof primKeyMap)[keyof typeof primKeyMap] &
    keyof T["_"]["columns"] &
    keyof T;
// Primary key value type for a table.  i.e. number | string | ...
export type PKVal<T extends Table> =
    // distribute over each concrete N
    T extends AnyPgTable
        ? // look up the row shape of THIS table
          // Parentheses tells compiler to look at the internal type as fully resolved, so it's not treating it as a union type anymore
          InferSelectModel<T>[PKName<T> & // index it with THIS table's PK literal
              keyof InferSelectModel<T> /* safety &'ing two different things produces never, make sure PKName is a key of the table */]
        : never;
// Extra Fields. Partial wrap around insert. Nice
export type Extras<T extends Table> = { [K in ColKey<T>]?: ColVal<T, K> };

// 3. Filter types

// Parsed filters only, not including page, pageSize, sortBy, sortOrder, match
export type ParsedFilter = {
    field: string; // The column that is being filtered
    op: "eq" | "lt" | "gt" | "gte" | "lte"; // Operation on column
    value: z.infer<typeof primitive>; // Correctly coerce value into the correct JS type
};
// Helper zod to turn all query paramaters into the correct type
export const primitive = z.union([
    z.enum(["Active", "Inactive"]),
    z.coerce.number(),
    z.coerce.date(),
    z.string(),
]);
// All potential parameters for some action on data table
export type parsedParams = {
    page: number;
    pageSize: number;
    sortBy: string | undefined;
    sortOrder: "asc" | "desc" | undefined;
    match: "all" | "any";
    query: ParsedFilter[];
};
// General search params when they come in from the URL
export type SearchParams = {
    page: string | undefined;
    pageSizes: string | undefined;
    sortBy: string | undefined;
    sortOrder: "asc" | "desc" | undefined;
    match: "any" | "all" | undefined;
    [key: string]: string | undefined; // Additional query parameters
};

// 4. Column definition types.

// All filter types and kinds of columns
export type filterTypes =
    | { type: "text"; mode: ["="] }
    | { type: "enum"; mode: ["=", "≠"]; options: readonly string[] }
    | { type: "number"; mode: ["=", "≠", ">", "<", ">=", "<=", "between"] }
    | {
          type: "date";
          mode: ["in the last", "=", "between", ">=", "<="];
          options: ["hours", "days", "months", "years"];
      };
// Meta information for each ColumnDef.
export interface ColumnMetaFilter {
    filter?: filterTypes;
    label?: string;
}
// Extending ColumnDef to get nice auto complete
export type FilterableColumn<TData> = ColumnDef<TData> & {
    meta: ColumnMetaFilter;
};

// 5. Form field types for adding, editing forms.

// How select options to be paseed down should be shaped
export type FormSelectOptions = {
    val: number | string;
    labelen: string;
    labelcn: string;
};
// Base interface for common properties of form inputs
interface BaseFormField {
    name: string;
    label: string;
    placeholder?: string;
    defaultValue?: string;
    required?: boolean;
    width?: "full" | "half" | "third" | "quarter";
}
// Extra information on fields
export type FormField =
    | (BaseFormField & {
          type: "text";
      })
    | (BaseFormField & {
          type: "date";
      })
    | (BaseFormField & {
          type: "password";
      })
    | (BaseFormField & {
          type: "number";
          min?: number;
          max?: number;
          step?: number;
      })
    | (BaseFormField & {
          type: "textarea";
          rows?: number;
      })
    | (BaseFormField & {
          type: "select";
          options: FormSelectOptions[]; // Required for select fields
          multiple?: boolean;
      });
// Allows to break down each form into sections, looks nicer too
export type FormSections = {
    section: string;
    sectionFields: FormField[];
};

// 6. Maps - Probably overkill

// Primary key map
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
    adminuserrole: "userid",
    registration_drafts: "email",
    menu: "menuid",
    paypalStatus: "id",
    paypalrecordImport: "id",
    tempclass: "classno",
} as const;

// Do the same for foreign key maps. This is all for strict compile-time type safety!! YEAH
// This is basically ridiculous lol. not working anyway

// export const fkMap = {
//   accounts: {},
//   sessions: {},
//   adminrole: {},
//   errorlog: {},
//   users: {},
//   family: {
//     userid: { table: "users", column: "id" },
//   },
//   adminuser: {
//     userid: { table: "users", column: "id" },
//   },
//   legacyAdminuser: {},
//   paypalrecord: {},
//   scorecode: {},
//   teacher: {
//     userid: { table: "users", column: "id" },
//   },
//   legacyTeacher: {},
//   seatnum: {},
//   supports: {},
//   seasons: {},
//   arrangement: {
//     seasonid: { table: "seasons", column: "seasonid" },
//     classid: { table: "classes", column: "classid" },
//     teacherid: { table: "teacher", column: "teacherid" },
//     roomid: { table: "classrooms", column: "roomid" },
//     timeid: { table: "classtime", column: "timeid" },
//     suitableterm: { table: "suitableterm", column: "termno" },
//   },
//   classes: {
//     ageid: { table: "agerestriction", column: "ageid" },
//     typeid: { table: "classtype", column: "typeid" },
//     classupid: { table: "classes", column: "classid" },
//   },
//   agelist: {},
//   classrooms: {},
//   classtime: {},
//   suitableterm: {},
//   agerestriction: {},
//   classtype: {
//     ageid: { table: "agerestriction", column: "ageid" },
//   },
//   student: {
//     familyid: { table: "family", column: "familyid" },
//   },
//   classregistration: {
//     studentid: { table: "student", column: "studentid" },
//     seasonid: { table: "seasons", column: "seasonid" },
//     classid: { table: "classes", column: "classid" },
//     statusid: { table: "regstatus", column: "regstatusid" },
//     familyid: { table: "family", column: "familyid" },
//   },
//   regstatus: {},
//   familybalance: {
//     seasonid: { table: "seasons", column: "seasonid" },
//     familyid: { table: "family", column: "familyid" },
//     typeid: { table: "familybalancetype", column: "typeid" },
//     statusid: { table: "familybalancestatus", column: "statusid" },
//   },
//   dutyassignment: {
//     familyid: { table: "family", column: "familyid" },
//     studentid: { table: "student", column: "studentid" },
//     seasonid: { table: "seasons", column: "seasonid" },
//     dutystatus: { table: "dutystatus", column: "dutystatusid" },
//   },
//   dutystatus: {},
//   parentdutyPb: {
//     familyid: { table: "family", column: "familyid" },
//     studentid: { table: "student", column: "studentid" },
//     committeeid: { table: "dutycommittee", column: "dcid" },
//     seasonid: { table: "seasons", column: "seasonid" },
//   },
//   familybalancetype: {},
//   familybalancestatus: {},
//   feedback: {
//     familyid: { table: "family", column: "familyid" },
//   },
//   feelist: {
//     seasonid: { table: "seasons", column: "seasonid" },
//   },
//   dutycommittee: {},
//   regchangerequest: {
//     studentid: { table: "student", column: "studentid" },
//     seasonid: { table: "seasons", column: "seasonid" },
//     oriregstatusid: { table: "regstatus", column: "regstatusid" },
//     regstatusid: { table: "regstatus", column: "regstatusid" },
//     reqstatusid: { table: "requeststatus", column: "reqstatusid" },
//     familyid: { table: "family", column: "familyid" },
//   },
//   schoolcalendar: {
//     seasonid: { table: "seasons", column: "seasonid" },
//   },
//   scorefactors: {},
//   studentscore: {
//     studentid: { table: "student", column: "studentid" },
//     seasonid: { table: "seasons", column: "seasonid" },
//     classid: { table: "classes", column: "classid" },
//     factorid: { table: "scorefactors", column: "factorid" },
//   },
//   scoredetail: {
//     scoreid: { table: "studentscore", column: "scoreid" },
//   },
//   studentscorecomment: {
//     studentid: { table: "student", column: "studentid" },
//     seasonid: { table: "seasons", column: "seasonid" },
//     classid: { table: "classes", column: "classid" },
//     scoreid: { table: "studentscore", column: "scoreid" },
//   },
//   studentscorefactor: {
//     scoreid: { table: "studentscore", column: "scoreid" },
//     factorid: { table: "scorefactors", column: "factorid" },
//   },
//   studentscorerating: {
//     studentid: { table: "student", column: "studentid" },
//     seasonid: { table: "seasons", column: "seasonid" },
//     classid: { table: "classes", column: "classid" },
//     ratingfactorid: { table: "scoreratingfactors", column: "ratingfactorid" },
//     ratingid: { table: "scorerating", column: "ratingid" },
//   },
//   scoreratingfactors: {},
//   scorerating: {},
//   requeststatus: {},
//   legacyFamily: {},
//   verificationToken: {},
//   adminuserrole: {
//     userid: { table: "adminuser", column: "adminid" },
//     roleid: { table: "adminrole", column: "roleid" },
//   },
//   registration_drafts: {},
//   menu: {},
//   paypalStatus: {},
//   paypalrecordImport: {},
//   tempclass: {}
// } as const;
