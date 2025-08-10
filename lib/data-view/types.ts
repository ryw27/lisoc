import * as schema from "@/lib/db/schema"
import { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { z } from "zod/v4";
import { ColumnDef } from "@tanstack/react-table";

// ------------------------------------------------------------------------------
// Probably overkill
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
    adminuserrole: "userid",
    registration_drafts: "email",
    menu: "menuid",
    paypalStatus: "id",
    paypalrecordImport: "id",
    tempclass: "classno"
} as const;

// Do the same for foreign key maps. This is all for strict compile-time type safety!! YEAH 
// This is basically ridiculous lol. idk how to get it to work anyway

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

// ------------------------------------------------------------------------------
// Table Name types
// ------------------------------------------------------------------------------
// export type TableName = keyof typeof schema; // Names of tables that have primary keys defined
// export type Table<N extends TableName> = (typeof schema)[N]; // Concrete table type, PgTableWithColumns<Class>, PgTableWithColumns<AdminRole>, etc.
export type Table = (typeof schema)[keyof typeof schema]

// Union type of all column names for a table. i.e. "classnamecn" | "classnameeng" | "classid" | ...
export type ColKey<T extends Table> = { [K in keyof T]: T[K] extends AnyPgColumn ? K : never }[keyof T] & string;
// Union type of the types of the columns, i.e. (corresponding to top comment): string | string | number
export type ColVal<T extends Table, K extends ColKey<T>> = (T[K] extends AnyPgColumn ? T[K]["_"]["data"] : never)
// export type ColVal<N extends TableName, T extends Table<N>, K extends ColKey<N, T>> = K extends keyof T["$inferSelect"] ? T["$inferSelect"][K] : never;

// Primary key name for a table. i.e. "roleid" | "classid" | ... 
export type PKName<T extends Table> = (typeof primKeyMap)[keyof typeof primKeyMap] & keyof T["_"]["columns"] & keyof T;

// Primary key value type for a table.  i.e. number | string | ...
export type PKVal<T extends Table> =
  // distribute over each concrete N
  T extends AnyPgTable
    ? (
        // look up the row shape of THIS table
        // Parentheses tells compiler to look at the internal type as fully resolved, so it's not treating it as a union type anymore
        InferSelectModel<T>
        // index it with THIS table's PK literal
      )[PKName<T> &
        keyof InferSelectModel<T> /* safety &'ing two different things produces never, make sure PKName is a key of the table */]
    : never;

// Names of Foreign keys on a table
// export type FKCol<T extends Table> = keyof (typeof fkMap)[
//   // Find the key in fkMap that matches the table name of T
//   {
//     [K in keyof typeof schema]: T extends (typeof schema)[K] ? K : never
//   }[keyof typeof schema]
// ] & string;

// // I'm pretty sure it's always number lol
// export type FKVal<T extends Table, K extends FKCol<T>> = (typeof fkMap)[T][K];



      
export type Extras<T extends Table> = {[K in ColKey<T>]?: ColVal<T,K>};

// Unecesary
// export type creationFields = 'createby' | 'updateby' | 'createon' | 'updateon' | 'lastmodify'

// Unecessary
// export type uniqueCheckFields<T extends Table, FormSchema extends ZodType> = {
// 	tableCol: ColKey<T>;
// 	formCol?: keyof z.infer<FormSchema>;
// 	wantedValue?: string | number;
// }

// Unecessary
// export type enrichField<T extends Table, FormSchema extends ZodType> = {
// 	formField: keyof z.infer<FormSchema>;
// 	lookupTable: keyof typeof fkMap;
// 	lookupField: ColKey<T>; // Column name - will be validated at runtime
// 	returnField: ColKey<T>; // Column name - will be validated at runtime
// }

// // Simple array type for better developer experience
// export type enrichFields<FormSchema extends ZodType> = {
// 	[T in keyof typeof schema]: enrichField<typeof schema[T], FormSchema>
// }[keyof typeof schema]

// ------------------------------------------------------------------------------
// Paramater + filter types
// ------------------------------------------------------------------------------
// Parsed filters only, not including page, pageSize, sortBy, sortOrder, match
export type ParsedFilter = {
    field: string, // The column that is being filtered
    op: 'eq' | 'lt' | 'gt' | 'gte' | 'lte', // Operation on clumn
    value: z.infer<typeof primitive> // Correctly coerce value into the correct JS type
}

// Paramaters after proper parsing done
export type parsedParams = {
	page: number,
	pageSize: number,
	sortBy: string | undefined,
	sortOrder: 'asc' | 'desc' | undefined,
	match: 'all' | 'any'
	query: ParsedFilter[]
}

// General search params when they come in from the URL
export type SearchParams = {
    page: string | undefined;
    pageSizes: string | undefined;
    sortBy: string | undefined;
    sortOrder: 'asc' | 'desc' | undefined
    match: 'any' | 'all' | undefined
    [key: string]: string | undefined; // Allow for additional query parameters
}


// Helper zod to turn all query paramaters into the correct type
export const primitive = z.union([
    z.enum(["Active", "Inactive"]),
    z.coerce.number(),
    z.coerce.date(),
    z.string(),
])


// ------------------------------------------------------------
// Column Types
// ------------------------------------------------------------

// Filter type for the data table
export type filterTypes = 
    | {type: 'text'; mode: ['=']}
    | {type: 'enum'; mode: ['=', '≠'], options: readonly string[]}
    | {type: 'number'; mode: ['=', '≠', '>', '<', '>=', '<=', 'between']}
    | {type: 'date'; mode: ['in the last', '=', 'between', '>=', '<='], options: ['hours', 'days', 'months', 'years']}

// Meta filter for the data table
export interface ColumnMetaFilter {
    filter?: filterTypes;
    label?: string;
}

// Filterable column for the data table. Ensure existence of filter field. 
// Use this instead of ColumnDef everywhere.
export type FilterableColumn<TData> = ColumnDef<TData> & {
	meta: ColumnMetaFilter
}




// The only unique things you need for each entity are form schema, header names, main path, and enrich/unique/extras 
// EntityConfig is a generic type that takes a table name and returns an object with the following properties:
// tableName: The name of the table
// primaryKey: The name of the primary key column
// formSchema: The Zod schema for the form
// mainPath: The path to revalidate
// ops: An object encompassing all CRUD operations for the table

export interface EntityConfig<
    T extends Table, 
    FormSchema extends z.ZodObject, 
    DeleteFormSchema extends z.ZodObject,
> {
	table: T,
	formSchema: FormSchema,
    deleteFormSchema: DeleteFormSchema,
	columns: FilterableColumn<InferSelectModel<T>>[],
	// ops: {
		// allRows: () => Promise<InferSelectModel<T>[]>;
		// idRow: (id: PKVal<T>) => Promise<InferSelectModel<T>>;
		// pageRows: (opts: parsedParams) => Promise<{ rows: InferSelectModel<T>[]; totalCount: number }>;
	// 	insertRow: (formData: z.infer<FormSchema>) => Promise<void>;
	// 	updateRow: (id: PKVal<T>, formData: z.infer<FormSchema>) => Promise<void>;
	// 	deleteRows: (id: z.infer<DeleteFormSchema>) => Promise<InferSelectModel<T>[]>;
	// }
}
// export interface EntityConfig<T extends Table> {
//     table: T; // The table object, i.e. classes, adminrole, etc.
//     tableName: keyof typeof schema; // The name of the table, i.e. classes, adminrole, etc.
//     primaryKey: PKName<T>; // The name of the primary key column, i.e. classid, roleid, etc.
//     formSchema: ZodType; // The Zod schema for the form, used for editing, adding, and updating
//     mainPath: string; // The path to revalidate, used for revalidating the page after a mutation
//     columns: FilterableColumn<InferSelectModel<T>>[]; // The column definitions for the table, used for the table headers and filtering
//     ops: {
//         allRows: () => Promise<InferSelectModel<T>[]>; // Get all rows from the table
//         idRow: (id: PKVal<T>) => Promise<InferSelectModel<T>>; // Get a row from the table by its primary key
//         pageRows: (opts: parsedParams) => Promise<{ rows: InferSelectModel<T>[]; totalCount: number }>; // Get rows from the table with pagination
//         insertRow: (formData: FormData) => Promise<void>; // Insert a new row into the table
//         updateRow: (id: PKVal<T>, formData: FormData) => Promise<void>; // Update a row in the table
//         deleteRows: (id: PKVal<T>[]) => Promise<InferSelectModel<T>[]>; // Delete a row from the table
//     }
// }