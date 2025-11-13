import { pgTable, unique, uuid, varchar, timestamp, text, foreignKey, integer, boolean, index, smallint, serial, bigint, numeric, char, uniqueIndex, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { userRoles } from "./db-types"


export const registration_drafts = pgTable("registration_drafts", {
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 50 }).notNull(),
	password: varchar({ length: 100 }).notNull(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP + INTERVAL '72 hours'`).notNull(),
}, (table) => [
	primaryKey({ columns: [table.email, table.name] }),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 50 }),
	email: varchar({ length: 255 }).notNull(),
	emailVerified: timestamp({ withTimezone: true, mode: 'string' }),
	image: text(),
	password: varchar({ length: 100 }).notNull(),
	createon: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updateon: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	lastlogin: timestamp({ withTimezone: true, mode: 'string' }),
	roles: userRoles().array().notNull(),
	address: varchar({ length: 100 }),
	city: varchar({ length: 50 }),
	state: varchar({ length: 4 }),
	zip: varchar({ length: 10 }),
	phone: varchar({ length: 20 }),
}, (table) => [
	unique("users_name_key").on(table.name),
	unique("users_email_key").on(table.email),
]);

export const family = pgTable("family", {
	familyid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "family_familyid_seq1", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	fatherfirsten: varchar({ length: 50 }),
	fatherlasten: varchar({ length: 50 }),
	fathernamecn: varchar({ length: 50 }),
	motherfirsten: varchar({ length: 50 }),
	motherlasten: varchar({ length: 50 }),
	mothernamecn: varchar({ length: 50 }),
	contact: varchar({ length: 20 }),
	address1: varchar({ length: 100 }),
	officephone: varchar({ length: 50 }),
	cellphone: varchar({ length: 50 }),
	email2: varchar({ length: 100 }),
	status: boolean().default(true).notNull(),
	remark: varchar({ length: 200 }),
	schoolmember: varchar({ length: 50 }),
	userid: uuid(),
}, (table) => [
	foreignKey({
			columns: [table.userid],
			foreignColumns: [users.id],
			name: "family_userid_fkey"
		}),
]);

export const teacher = pgTable("teacher", {
	teacherid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "teacher_teacherid_seq1", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	namecn: varchar({ length: 50 }).notNull(),
	namelasten: varchar({ length: 50 }).notNull(),
	namefirsten: varchar({ length: 50 }).notNull(),
	teacherindex: integer(),
	classtypeid: smallint(),
	status: varchar({ length: 50 }).default('Active').notNull(),
	ischangepwdnext: boolean().default(true),
	address1: varchar({ length: 100 }),
	subject: varchar({ length: 20 }),
	profile: varchar({ length: 2000 }).notNull(),
	createby: varchar({ length: 50 }).default('').notNull(),
	updateby: varchar({ length: 50 }).default('').notNull(),
	userid: uuid(),
}, (table) => [
	index("teacher_teacherid_idx").using("btree", table.teacherid.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userid],
			foreignColumns: [users.id],
			name: "teacher_userid_fkey"
		}),
]);

export const adminuser = pgTable("adminuser", {
	adminid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "adminuser_userid_seq1", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	namecn: varchar({ length: 50 }).notNull(),
	firstname: varchar({ length: 50 }).notNull(),
	lastname: varchar({ length: 50 }).notNull(),
	address1: varchar({ length: 100 }).notNull(),
	status: varchar({ length: 50 }).notNull(),
	ischangepwdnext: boolean().default(false).notNull(),
	createby: varchar({ length: 50 }).default('').notNull(),
	updateby: varchar({ length: 50 }).default('').notNull(),
	notes: varchar({ length: 2000 }).default('').notNull(),
	userid: uuid(),
}, (table) => [
	foreignKey({
			columns: [table.userid],
			foreignColumns: [users.id],
			name: "adminuser_userid_fkey"
		}),
]);

export const legacyAdminuser = pgTable("legacy_adminuser", {
	userid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "legacy_adminuser_userid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	username: varchar({ length: 50 }).notNull(),
	password: varchar({ length: 100 }).notNull(),
	namecn: varchar({ length: 50 }).notNull(),
	firstname: varchar({ length: 50 }).notNull(),
	lastname: varchar({ length: 50 }).notNull(),
	address: varchar({ length: 100 }).default('').notNull(),
	address1: varchar({ length: 100 }).notNull(),
	city: varchar({ length: 50 }).default('').notNull(),
	state: varchar({ length: 4 }).default('').notNull(),
	zip: varchar({ length: 10 }).default('').notNull(),
	email: varchar({ length: 100 }).notNull(),
	phone: varchar({ length: 20 }).notNull(),
	familyid: integer().default(0).notNull(),
	status: varchar({ length: 50 }).notNull(),
	ischangepwdnext: boolean().default(false).notNull(),
	createby: varchar({ length: 50 }).default('').notNull(),
	createon: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updateby: varchar({ length: 50 }).default('').notNull(),
	updateon: timestamp({ mode: 'string' }).defaultNow().notNull(),
	lastlogin: timestamp({ mode: 'string' }).defaultNow().notNull(),
	notes: varchar({ length: 2000 }).default('').notNull(),
});

export const accounts = pgTable("accounts", {
	id: serial().primaryKey().notNull(),
	userId: integer().notNull(),
	type: varchar({ length: 255 }).notNull(),
	provider: varchar({ length: 255 }).notNull(),
	providerAccountId: varchar({ length: 255 }).notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	expiresAt: bigint("expires_at", { mode: "number" }),
	idToken: text("id_token"),
	scope: text(),
	sessionState: text("session_state"),
	tokenType: text("token_type"),
});

export const classes = pgTable("classes", {
	classid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "classes_classid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	classindex: numeric({ precision: 9, scale:  2 }).default('500'),
	ageid: smallint().default(0),
	typeid: smallint().notNull(),
	gradeclassid: integer(),
	classno: numeric({ precision: 8, scale:  0 }).default("0").notNull(),
	classnamecn: varchar({ length: 50 }).notNull(),
	classupid: integer().notNull(),
	classnameen: varchar({ length: 100 }).notNull(),
	sizelimits: integer(),
	status: varchar({ length: 20 }).notNull(),
	description: text(),
	lastmodify: timestamp({ precision: 3, mode: 'string' }).defaultNow(),
	createby: varchar({ length: 100 }).default('').notNull(),
	createon: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	updateby: varchar({ length: 100 }).default('').notNull(),
	updateon: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.typeid],
			foreignColumns: [classtype.typeid],
			name: "fk_classes_classtype"
		}),
	foreignKey({
		columns: [table.gradeclassid],
		foreignColumns: [table.classid],
		name: "fk_classes_classid"
	})
]);

export const agelist = pgTable("agelist", {
	ageid: smallint().primaryKey().generatedAlwaysAsIdentity({ name: "agelist_ageid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 32767, cache: 1 }),
	agelimit: smallint().default(4).notNull(),
});

export const classrooms = pgTable("classrooms", {
	roomid: smallint().primaryKey().generatedAlwaysAsIdentity({ name: "classrooms_roomid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 32767, cache: 1 }),
	roomno: varchar({ length: 50 }).notNull(),
	roomcapacity: smallint().default(25).notNull(),
	status: varchar({ length: 20 }).default('Active').notNull(),
	notes: varchar({ length: 200 }).default('').notNull(),
}, (table) => [
	index("roomid").using("btree", table.roomid.asc().nullsLast().op("int2_ops")),
]);

export const agerestriction = pgTable("agerestriction", {
	ageid: smallint().primaryKey().generatedAlwaysAsIdentity({ name: "agerestriction_ageid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 32767, cache: 1 }),
	description: varchar({ length: 100 }),
	minage: smallint(),
	maxage: smallint(),
	status: boolean(),
});

export const dutycommittee = pgTable("dutycommittee", {
	dcid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "dutycommittee_dcid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	committeenamecn: varchar({ length: 200 }),
	committeenameeng: varchar({ length: 200 }),
	numofseats: integer().default(0).notNull(),
	descriptioncn: varchar({ length: 2000 }),
	descriptioneng: varchar({ length: 2000 }),
	url: varchar({ length: 200 }),
	sortorder: integer().default(100).notNull(),
	isforadminonly: boolean().notNull(),
	openstatus: boolean().notNull(),
	createdate: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	lastupdatedate: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	lastupdateby: varchar({ length: 50 }),
});

export const adminrole = pgTable("adminrole", {
	roleid: smallint().primaryKey().generatedAlwaysAsIdentity({ name: "adminrole_roleid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 32767, cache: 1 }),
	rolename: varchar({ length: 50 }).notNull(),
	rolefullnameeng: varchar({ length: 100 }).default('').notNull(),
	rolefullnamecn: varchar({ length: 100 }).default('').notNull(),
	notes: varchar({ length: 250 }).default('').notNull(),
});

export const arrangement = pgTable("arrangement", {
	arrangeid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "arrangement_arrangeid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	seasonid: smallint().notNull(),
	classid: integer().notNull(),
	teacherid: integer().default(1).notNull(),
	roomid: smallint().default(1).notNull(),
	timeid: smallint().notNull(),
	seatlimit: smallint().default(25),
	agelimit: smallint().default(4),
	suitableterm: smallint().default(1).notNull(),
	waiveregfee: boolean().default(false).notNull(),
	activestatus: varchar({ length: 20 }).default('Active').notNull(),
	regstatus: varchar({ length: 20 }).default('Open').notNull(),
	closeregistration: boolean().default(false).notNull(),
	notes: varchar({ length: 250 }).default(''),
	lastmodify: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updateby: varchar({ length: 50 }).default('').notNull(),
	tuitionW: numeric("tuition_w", { precision: 9, scale:  2 }).default('0'),
	specialfeeW: numeric("specialfee_w", { precision: 9, scale:  2 }).default('0'),
	bookfeeW: numeric("bookfee_w", { precision: 9, scale:  2 }).default('0'),
	tuitionH: numeric("tuition_h", { precision: 9, scale:  2 }).default('0'),
	specialfeeH: numeric("specialfee_h", { precision: 9, scale:  2 }).default('0'),
	bookfeeH: numeric("bookfee_h", { precision: 9, scale:  2 }).default('0'),
	isregclass: boolean().notNull().default(false),
}, (table) => [
	foreignKey({
			columns: [table.teacherid],
			foreignColumns: [teacher.teacherid],
			name: "fk_arrangement_teacher"
		}),
	// foreignKey({
	// 		columns: [table.teacherid],
	// 		foreignColumns: [legacyTeacher.teacherid],
	// 		name: "legacy_fk_arrangement_teacher"
	// 	}),
	foreignKey({
			columns: [table.classid],
			foreignColumns: [classes.classid],
			name: "fk_arrangement_classes"
		}),
	foreignKey({
			columns: [table.roomid],
			foreignColumns: [classrooms.roomid],
			name: "fk_arrangement_classrooms"
		}),
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "fk_arrangement_seasons"
		}),
	foreignKey({
			columns: [table.timeid],
			foreignColumns: [classtime.timeid],
			name: "fk_arrangement_sessions"
		}),
	foreignKey({
		columns: [table.suitableterm],
		foreignColumns: [suitableterm.termno],
		name: "fk_arrangement_termno"
	})
]);

export const classtime = pgTable("classtime", {
	timeid: smallint().primaryKey().generatedAlwaysAsIdentity({ name: "sessions_timeid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 32767, cache: 1 }),
	period: varchar({ length: 20 }).notNull(),
	timebegin: numeric({ precision: 5, scale:  2 }).default('0').notNull(),
	timeend: numeric({ precision: 5, scale:  2 }).default('0').notNull(),
	istwoperiod: varchar({ length: 20 }),
}, (table) => [
	index("itmeid").using("btree", table.timeid.asc().nullsLast().op("int2_ops")),
]);

export const classtype = pgTable("classtype", {
	typeid: smallint().primaryKey().generatedAlwaysAsIdentity({ name: "classtype_typeid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 32767, cache: 1 }),
	typenameen: varchar({ length: 100 }).notNull(),
	typenamecn: varchar({ length: 100 }).notNull(),
	ageofstudent: varchar({ length: 20 }),
	ageid: smallint().notNull(),
	typedescription: varchar({ length: 100 }).default('').notNull(),
	status: varchar({ length: 20 }).default('Active').notNull(),
	ischineseclass: boolean().default(false).notNull(),
	sortorder: integer().default(0).notNull(),
	isnofee: boolean().default(false).notNull(),
	isonline: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ageid],
			foreignColumns: [agerestriction.ageid],
			name: "fk_classtype_agerestriction"
		}),
]);

export const classregistration = pgTable("classregistration", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	regid: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "classregistration_regid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	appliedid: integer().default(0),
	studentid: integer().notNull(),
	arrangeid: integer().default(0).notNull(),
	seasonid: smallint().notNull(),
	isyearclass: boolean().default(false).notNull(),
	classid: integer().notNull(),
	registerdate: timestamp({ mode: 'string' }).defaultNow().notNull(),
	statusid: smallint().default(1).notNull(),
	previousstatusid: smallint().default(0).notNull(),
	familybalanceid: integer().default(0),
	familyid: integer().default(0).notNull(),
	newbalanceid: integer().default(0),
	isdropspring: boolean().default(false).notNull(),
	byadmin: boolean().default(false),
	userid: varchar({ length: 100 }).default('0'),
	lastmodify: timestamp({ mode: 'string' }).default('1900-01-01 00:00:00').notNull(),
	notes: varchar({ length: 500 }),
}, (table) => [
	foreignKey({
			columns: [table.familyid],
			foreignColumns: [family.familyid],
			name: "fk_classregistration_familyid"
		}),
	// foreignKey({
	// 		columns: [table.familyid],
	// 		foreignColumns: [legacyFamily.familyid],
	// 		name: "legacy_fk_classregistration_familyid"
	// 	}),
	foreignKey({
			columns: [table.classid],
			foreignColumns: [classes.classid],
			name: "fk_classregistration_classes"
		}),
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "fk_classregistration_seasonid"
		}),
	foreignKey({
			columns: [table.statusid],
			foreignColumns: [regstatus.regstatusid],
			name: "fk_classregistration_statusid"
		}),
	foreignKey({
			columns: [table.studentid],
			foreignColumns: [student.studentid],
			name: "fk_classregistration_student"
		}),
]);

export const dutystatus = pgTable("dutystatus", {
	dutystatusid: smallint().primaryKey().generatedAlwaysAsIdentity({ name: "dutystatus_dutystatusid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 32767, cache: 1 }),
	dutystatuscn: varchar({ length: 50 }).default('').notNull(),
	dutystatus: varchar({ length: 50 }).notNull(),
	active: boolean().notNull(),
});

export const dutyassignment = pgTable("dutyassignment", {
	dutyassignid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "dutyassignment_dutyassignid_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	familyid: integer().notNull(),
	studentid: integer().default(0),
	seasonid: smallint(),
	dutydate: timestamp({ mode: 'string' }).notNull(),
	dutystatus: smallint().default(1).notNull(),
	createddate: timestamp({ mode: 'string' }).notNull(),
	lastmodify: timestamp({ mode: 'string' }).notNull(),
	note: varchar({ length: 150 }),
	pdid: integer().default(0),
	ischarged: boolean(),
}, (table) => [
	index("dutyassignid").using("btree", table.dutyassignid.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.familyid],
			foreignColumns: [family.familyid],
			name: "fk_dutyassignment_familyid"
		}),
	// foreignKey({
	// 		columns: [table.familyid],
	// 		foreignColumns: [legacyFamily.familyid],
	// 		name: "legacy_fk_dutyassignment_familyid"
	// 	}),
	foreignKey({
			columns: [table.dutystatus],
			foreignColumns: [dutystatus.dutystatusid],
			name: "fk_dutyassignment_dutystatusid"
		}),
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "fk_dutyassignment_seasonid"
		}),
	foreignKey({
			columns: [table.studentid],
			foreignColumns: [student.studentid],
			name: "fk_dutyassignment_student"
		}),
]);

export const errorlog = pgTable("errorlog", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "errorlog_id_seq", startWith: 1000, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	userid: varchar({ length: 100 }),
	errortype: varchar({ length: 50 }),
	errormessage: text(),
	logmessage: varchar({ length: 255 }),
	errorpage: varchar({ length: 255 }),
	stacktrace: text(),
	querystringdata: varchar({ length: 255 }),
	useragent: varchar({ length: 255 }),
	machinename: varchar({ length: 50 }),
	errordate: timestamp({ precision: 3, mode: 'string' }).defaultNow(),
});

export const regstatus = pgTable("regstatus", {
	regstatusid: smallint().primaryKey().generatedAlwaysAsIdentity({ name: "regstatus_regstatusid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 32767, cache: 1 }),
	regstatus: varchar({ length: 50 }),
	status: varchar({ length: 100 }),
}, (table) => [
	index("regstatusid").using("btree", table.regstatusid.asc().nullsLast().op("int2_ops")),
]);

export const familybalancestatus = pgTable("familybalancestatus", {
	statusid: smallint().primaryKey().generatedAlwaysAsIdentity({ name: "familybalancestatus_statusid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 32767, cache: 1 }),
	statusen: varchar({ length: 60 }),
	statuscn: varchar({ length: 60 }),
});

export const feedback = pgTable("feedback", {
	recid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "feedback_recid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	familyid: integer(),
	name: varchar({ length: 100 }),
	phone: char({ length: 15 }),
	email: varchar({ length: 100 }),
	comment: text(),
	postdate: timestamp({ mode: 'string' }),
	followup: varchar({ length: 250 }),
});

export const feelist = pgTable("feelist", {
	feelistid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "feelist_feelistid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	seasonid: integer().default(0).notNull(),
	feeid: integer().notNull(),
	feename: varchar({ length: 50 }),
	feenameen: varchar({ length: 50 }),
	feeamount: numeric({ precision: 9, scale:  2 }).default('0'),
	notes: varchar({ length: 250 }),
});

export const menu = pgTable("menu", {
	menuid: integer(),
	menunameen: varchar({ length: 50 }),
	menunamecn: varchar({ length: 50 }),
	menuurlen: varchar({ length: 50 }),
	menuurlcn: varchar({ length: 50 }),
	menuorder: integer(),
	parentid: integer(),
	isactive: integer(),
	isinmainpage: integer(),
	datatype: varchar({ length: 20 }),
	remarks: varchar({ length: 200 }),
});

export const paypalStatus = pgTable("paypal_status", {
	timestamp: timestamp({ precision: 3, mode: 'string' }).notNull(),
	parentname: varchar({ length: 50 }).notNull(),
	email: varchar({ length: 50 }),
	phone: varchar({ length: 30 }),
	tranactionid: varchar({ length: 100 }).notNull(),
	status: varchar({ length: 30 }).notNull(),
	regid: varchar({ length: 30 }).notNull(),
	currency: varchar({ length: 10 }),
	gross: numeric({ precision: 10, scale:  2 }).notNull(),
	fee: numeric({ precision: 10, scale:  2 }).notNull(),
	net: numeric({ precision: 10, scale:  2 }).notNull(),
}, (table) => [
	uniqueIndex("payapl_status_idx").using("btree", table.tranactionid.asc().nullsLast().op("text_ops")),
]);

export const paypalrecord = pgTable("paypalrecord", {
	pid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "paypalrecord_pid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	regnum: integer().default(0).notNull(),
	paidamount: numeric({ precision: 7, scale:  2 }).default('0').notNull(),
	transfee: numeric({ precision: 7, scale:  2 }),
	paypalstatus: varchar({ length: 250 }),
	counterpartystatus: varchar({ length: 250 }),
	transactionid: varchar({ length: 50 }),
	paiddate: timestamp({ precision: 3, mode: 'string' }).notNull(),
	isprocess: boolean().default(false),
	iscurrent: boolean().default(false),
	updateby: varchar({ length: 50 }),
	updateon: timestamp({ precision: 3, mode: 'string' }).defaultNow(),
	notes: varchar({ length: 250 }),
});

export const paypalrecordImport = pgTable("paypalrecord_import", {
	regnum: varchar({ length: 50 }).notNull(),
	transfee: varchar({ length: 50 }).notNull(),
	paidamount: varchar({ length: 50 }).notNull(),
	paypalstatus: varchar({ length: 250 }),
	counterpartystatus: varchar({ length: 250 }),
	transactionid: varchar({ length: 50 }),
	paiddate: varchar({ length: 50 }).notNull(),
	updateby: varchar({ length: 50 }),
});

export const familybalance = pgTable("familybalance", {
	balanceid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "familybalance_balanceid_seq", startWith: 10000, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	appliedid: integer().default(0).notNull(),
	appliedregid: integer().default(0).notNull(),
	seasonid: smallint().default(0).notNull(),
	familyid: integer().notNull(),
	yearclass: smallint().default(0).notNull(),
	yearclass4child: smallint().default(0).notNull(),
	semesterclass: smallint().default(0).notNull(),
	semesterclass4child: smallint().default(0).notNull(),
	childnum: smallint().default(0).notNull(),
	childnumRegfee: smallint("childnum_regfee").default(0).notNull(),
	studentnum: smallint().default(0).notNull(),
	regfee: numeric({ precision: 9, scale:  2 }).default('0'),
	earlyregdiscount: numeric({ precision: 9, scale:  2 }).default('0'),
	lateregfee: numeric({ precision: 9, scale:  2 }).default('0'),
	extrafee4newfamily: numeric({ precision: 9, scale:  2 }).default('0'),
	managementfee: numeric({ precision: 9, scale:  2 }).default('0'),
	dutyfee: numeric({ precision: 9, scale:  2 }).default('0'),
	cleaningfee: numeric({ precision: 9, scale:  2 }).default('0'),
	otherfee: numeric({ precision: 9, scale:  2 }).default('0'),
	tuition: numeric({ precision: 9, scale:  2 }).default('0'),
	totalamount: numeric({ precision: 9, scale:  2 }).default('0').notNull(),
	typeid: smallint().default(2).notNull(),
	statusid: smallint().default(2).notNull(),
	checkno: varchar({ length: 50 }),
	transactionno: varchar({ length: 20 }),
	isonlinepayment: boolean().default(false),
	registerdate: timestamp({ mode: 'string' }).defaultNow().notNull(),
	lastmodify: timestamp({ mode: 'string' }).defaultNow().notNull(),
	paiddate: timestamp({ mode: 'string' }).default('1900-01-01 00:00:00').notNull(),
	reference: varchar({ length: 50 }),
	notes: varchar({ length: 250 }),
	userid: varchar({ length: 100 }).default('app'),
	groupdiscount: numeric({ precision: 9, scale:  2 }).default('0'),
	processfee: numeric({ precision: 9, scale:  2 }).default('0'),
}, (table) => [
	foreignKey({
			columns: [table.familyid],
			foreignColumns: [family.familyid],
			name: "fk_familybalance_familyid"
		}),
	// foreignKey({
	// 		columns: [table.familyid],
	// 		foreignColumns: [legacyFamily.familyid],
	// 		name: "legacy_fk_familybalance_familyid"
	// 	}),
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "fk_familybalance_seasonid"
		}),
	foreignKey({
			columns: [table.statusid],
			foreignColumns: [familybalancestatus.statusid],
			name: "fk_familybalance_statusid"
		}),
	foreignKey({
			columns: [table.typeid],
			foreignColumns: [familybalancetype.typeid],
			name: "fk_familybalance_typeid"
		}),
]);

export const scorecode = pgTable("scorecode", {
	codeid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "scorecode_codeid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	codenameeng: varchar({ length: 50 }),
	codenamecn: varchar({ length: 50 }),
});

export const requeststatus = pgTable("requeststatus", {
	reqstatusid: smallint().primaryKey().generatedAlwaysAsIdentity({ name: "requeststatus_reqstatusid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 32767, cache: 1 }),
	reqstatus: varchar({ length: 50 }),
	reqstatuscn: varchar({ length: 50 }),
});

export const familybalancetype = pgTable("familybalancetype", {
	typeid: smallint().primaryKey().generatedAlwaysAsIdentity({ name: "familybalancetype_typeid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 32767, cache: 1 }),
	typenameen: varchar({ length: 60 }),
	typenamecn: varchar({ length: 60 }),
	isminusvalue: boolean().default(false).notNull(),
	isshow: boolean().default(true).notNull(),
});

export const parentdutyPb = pgTable("parentduty_pb", {
	pdid: integer().generatedAlwaysAsIdentity({ name: "parentduty_pb_pdid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	familyid: integer().default(0).notNull(),
	studentid: integer().default(0).notNull(),
	committeeid: integer().default(0).notNull(),
	seasonid: integer().notNull(),
	selecteddutydate: timestamp({ precision: 3, mode: 'string' }),
	ischangebyadmin: boolean().default(false).notNull(),
	scheduleddutydate: timestamp({ precision: 3, mode: 'string' }).default('1900-01-01 00:00:00').notNull(),
	previouscommitteeid: integer().default(0).notNull(),
	regdate: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	lastupdated: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "fk_parentdutypb_seasonid"
		}),
]);

export const schoolcalendar = pgTable("schoolcalendar", {
	calid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "schoolcalendar_calid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	seasonid: smallint().notNull(),
	schooldate: timestamp({ precision: 3, mode: 'string' }),
	alternatename: varchar({ length: 200 }),
	description: varchar({ length: 2000 }),
	fontcolor: varchar({ length: 30 }).default('black').notNull(),
	backgroundcolor: varchar({ length: 30 }).default('white').notNull(),
	isbold: boolean().default(false).notNull(),
	active: boolean().default(true).notNull(),
	createby: varchar({ length: 100 }).default('').notNull(),
	createon: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	updateby: varchar({ length: 100 }).default('').notNull(),
	updateon: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "fk_schoolcalendar_seasonid"
		}),
]);

export const scoredetail = pgTable("scoredetail", {
	scoredetailid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "scoredetail_scoredetailid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	scoreid: integer().notNull(),
	score: numeric({ precision: 7, scale:  2 }).default('0.0').notNull(),
	active: boolean().notNull(),
	createby: integer().notNull(),
	isteacher4Createby: boolean().notNull(),
	dateforscore: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	createon: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	updateby: integer().notNull(),
	isteacher4Updateby: boolean().notNull(),
	updateon: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
});

export const studentscore = pgTable("studentscore", {
	scoreid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "studentscore_scoreid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	studentid: integer().notNull(),
	seasonid: smallint().notNull(),
	classid: integer().notNull(),
	factorid: integer().notNull(),
	islock: boolean().notNull(),
	lockby: integer(),
	lastlockupdateon: timestamp({ precision: 3, mode: 'string' }),
	ispublish: boolean().default(false).notNull(),
	lastpublishupdateon: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.classid],
			foreignColumns: [classes.classid],
			name: "fk_studentscore_classid"
		}),
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "fk_studentscore_seasonid"
		}),
]);

export const scorerating = pgTable("scorerating", {
	ratingid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "scorerating_ratingid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	sequenceindex: numeric({ precision: 7, scale:  2 }).default('0').notNull(),
	ratingnamecn: varchar({ length: 200 }).default('').notNull(),
	ratingnameeng: varchar({ length: 300 }).default('').notNull(),
	active: boolean().default(true).notNull(),
});

export const seatnum = pgTable("seatnum", {
	seatid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "seatnum_seatid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	seatnum: integer().default(0).notNull(),
});

export const sessions = pgTable("sessions", {
	id: serial().primaryKey().notNull(),
	userId: integer().notNull(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	sessionToken: varchar({ length: 255 }).notNull(),
});

export const studentscorefactor = pgTable("studentscorefactor", {
	scorefactorid: integer().generatedAlwaysAsIdentity({ name: "studentscorefactor_scorefactorid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	scoreid: integer().primaryKey().notNull(),
	factorid: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.factorid],
			foreignColumns: [scorefactors.factorid],
			name: "fk_studentscorefactor_factorid"
		}),
	foreignKey({
			columns: [table.scoreid],
			foreignColumns: [studentscore.scoreid],
			name: "fk_studentscorefactor_scoreid"
		}),
]);

export const suitableterm = pgTable("suitableterm", {
	termno: smallint().primaryKey().notNull(),
	suitableterm: varchar({ length: 30 }),
	suitabletermcn: varchar({ length: 30 }),
	description: varchar({ length: 100 }),
});

export const supports = pgTable("supports", {
	catid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "supports_catid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	catnamecn: varchar({ length: 50 }).default('').notNull(),
	catnameeng: varchar({ length: 100 }).default('').notNull(),
	description: varchar({ length: 400 }).default('').notNull(),
	status: boolean().default(true).notNull(),
});

export const student = pgTable("student", {
	studentid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "student_studentid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	familyid: integer().notNull(),
	studentno: varchar({ length: 20 }),
	namecn: varchar({ length: 50 }).notNull(),
	namelasten: varchar({ length: 50 }).notNull(),
	namefirsten: varchar({ length: 50 }).notNull(),
	gender: varchar({ length: 20 }),
	ageof: varchar({ length: 20 }),
	age: integer(),
	dob: timestamp({ precision: 3, mode: 'string' }).default('1900-01-01 00:00:00').notNull(),
	active: boolean().default(false).notNull(),
	createddate: timestamp({ mode: 'string' }).default('1900-01-01 00:00:00').notNull(),
	lastmodify: timestamp({ mode: 'string' }).default('1900-01-01 00:00:00').notNull(),
	notes: varchar({ length: 200 }).default('').notNull(),
	upgradable: integer().default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.familyid],
			foreignColumns: [family.familyid],
			name: "fk_student_familyid"
		}),
	// foreignKey({
	// 		columns: [table.familyid],
	// 		foreignColumns: [legacyFamily.familyid],
	// 		name: "legacy_fk_student_familyid"
	// 	}),
]);

export const seasons = pgTable("seasons", {
	seasonid: smallint().primaryKey().generatedAlwaysAsIdentity({ name: "seasons_seasonid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 32767, cache: 1 }),
	seasonnamecn: varchar({ length: 100 }).notNull(),
	seasonnameeng: varchar({ length: 100 }).notNull(),
	isspring: boolean().default(false).notNull(),
	relatedseasonid: integer().default(0).notNull(),
	beginseasonid: integer().default(0).notNull(),
	haslateregfee: boolean().default(true).notNull(),
	haslateregfee4newfamily: boolean().default(true).notNull(),
	hasdutyfee: boolean().default(true).notNull(),
	startdate: timestamp({ mode: 'string' }).default('1900-01-01 00:00:00').notNull(),
	enddate: timestamp({ mode: 'string' }).default('1900-01-01 00:00:00').notNull(),
	earlyregdate: timestamp({ mode: 'string' }).default('1900-01-01 00:00:00').notNull(),
	normalregdate: timestamp({ mode: 'string' }).default('1900-01-01 00:00:00').notNull(),
	lateregdate1: timestamp({ mode: 'string' }).default('1900-01-01 00:00:00').notNull(),
	lateregdate2: timestamp({ mode: 'string' }).default('1900-01-01 00:00:00').notNull(),
	closeregdate: timestamp({ mode: 'string' }).default('1900-01-01 00:00:00').notNull(),
	canceldeadline: timestamp({ mode: 'string' }).default('1900-01-01 00:00:00').notNull(),
	hasdeadline: boolean().default(true).notNull(),
	status: varchar({ length: 50 }).default('Inactive').notNull(),
	open4register: boolean().default(false).notNull(),
	showadmissionnotice: boolean().default(false).notNull(),
	showteachername: boolean().default(true).notNull(),
	days4showteachername: smallint().default(0).notNull(),
	allownewfamilytoregister: boolean().default(true).notNull(),
	date4newfamilytoregister: timestamp({ mode: 'string' }).default('1900-01-01 00:00:00').notNull(),
	notes: text().default(''),
	createddate: timestamp({ mode: 'string' }).default('1900-01-01 00:00:00'),
	lastmodifieddate: timestamp({ mode: 'string' }).defaultNow(),
	updateby: varchar({ length: 50 }).default('').notNull(),
});

export const scorefactors = pgTable("scorefactors", {
	factorid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "scorefactors_factorid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	factorsequenceindex: numeric({ precision: 7, scale:  2 }).default('0').notNull(),
	factornamecn: varchar({ length: 300 }).notNull(),
	factornamecnshort: varchar({ length: 100 }).notNull(),
	factornameen: varchar({ length: 300 }).notNull(),
	factornameenshort: varchar({ length: 100 }).notNull(),
	maxallowedrecord: integer().default(0).notNull(),
	weighting: numeric({ precision: 3, scale:  2 }).default('0').notNull(),
	active: boolean().default(false).notNull(),
	istext: boolean().default(false).notNull(),
	description: text(),
	createby: integer().notNull(),
	createon: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	updateby: integer().notNull(),
	updateon: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
})
// }, (table) => [
// 	// foreignKey({
// 	// 		columns: [table.createby],
// 	// 		foreignColumns: [legacyAdminuser.userid],
// 	// 		name: "legacy_fk_scorefactors_createby"
// 	// 	}),
// 	// foreignKey({
// 	// 		columns: [table.updateby],
// 	// 		foreignColumns: [legacyAdminuser.userid],
// 	// 		name: "legacy_fk_scorefactors_updateby"
// 	// 	}),
// ]);

export const studentscorecomment = pgTable("studentscorecomment", {
	scorecommentid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "studentscorecomment_scorecommentid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	studentid: integer().notNull(),
	seasonid: smallint().notNull(),
	classid: integer().notNull(),
	teachercomment: varchar({ length: 2000 }),
	othercomment: varchar({ length: 2000 }),
	islock: boolean().default(false).notNull(),
	lockby: integer().default(0).notNull(),
	lockon: timestamp({ precision: 3, mode: 'string' }).defaultNow(),
	updateby: integer().default(0).notNull(),
	updateon: timestamp({ precision: 3, mode: 'string' }).defaultNow(),
	scoreid: integer(),
}, (table) => [
	foreignKey({
			columns: [table.classid],
			foreignColumns: [classes.classid],
			name: "fk_studentscorecomment_classid"
		}),
	foreignKey({
			columns: [table.scoreid],
			foreignColumns: [studentscore.scoreid],
			name: "fk_studentscorecomment_scoreid"
		}),
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "fk_studentscorecomment_seasonid"
		}),
	foreignKey({
			columns: [table.studentid],
			foreignColumns: [student.studentid],
			name: "fk_studentscorecomment_studentid"
		}),
]);

export const studentscorerating = pgTable("studentscorerating", {
	scoreratingid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "studentscorerating_scoreratingid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	studentid: integer().notNull(),
	seasonid: smallint().notNull(),
	classid: integer().notNull(),
	ratingfactorid: integer().notNull(),
	ratingid: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.classid],
			foreignColumns: [classes.classid],
			name: "fk_studentscorerating_classid"
		}),
	foreignKey({
			columns: [table.ratingfactorid],
			foreignColumns: [scoreratingfactors.ratingfactorid],
			name: "fk_studentscorerating_ratingfactorid"
		}),
	foreignKey({
			columns: [table.ratingid],
			foreignColumns: [scorerating.ratingid],
			name: "fk_studentscorerating_ratingid"
		}),
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "fk_studentscorerating_seasonid"
		}),
	foreignKey({
			columns: [table.studentid],
			foreignColumns: [student.studentid],
			name: "fk_studentscorerating_studentid"
		}),
]);

export const scoreratingfactors = pgTable("scoreratingfactors", {
	ratingfactorid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "scoreratingfactors_ratingfactorid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	sequenceindex: numeric({ precision: 7, scale:  2 }).default('0').notNull(),
	ratingfactornamecn: varchar({ length: 200 }).default('').notNull(),
	ratingfactornameeng: varchar({ length: 300 }).default('').notNull(),
	active: boolean().default(true).notNull(),
	description: varchar({ length: 800 }),
});

export const legacyTeacher = pgTable("legacy_teacher", {
	teacherid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "legacy_teacher_teacherid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	namecn: varchar({ length: 50 }),
	username: varchar({ length: 50 }),
	password: varchar({ length: 100 }),
	namelasten: varchar({ length: 50 }),
	namefirsten: varchar({ length: 50 }),
	teacherindex: integer(),
	classtypeid: smallint(),
	status: varchar({ length: 50 }).default('Active').notNull(),
	ischangepwdnext: boolean().default(true),
	address: varchar({ length: 100 }),
	address1: varchar({ length: 100 }),
	city: varchar({ length: 50 }),
	state: varchar({ length: 4 }),
	zip: varchar({ length: 10 }),
	phone: varchar({ length: 20 }).notNull(),
	email: varchar({ length: 100 }),
	subject: varchar({ length: 20 }),
	profile: varchar({ length: 2000 }).notNull(),
	familyid: integer().default(0),
	createby: varchar({ length: 50 }).default('').notNull(),
	createon: timestamp({ mode: 'string' }).defaultNow(),
	updateby: varchar({ length: 50 }).default('').notNull(),
	updateon: timestamp({ mode: 'string' }),
	lastlogin: timestamp({ mode: 'string' }),
}, (table) => [
	index("Teacher ID").using("btree", table.teacherid.asc().nullsLast().op("int4_ops")),
	index("familyid").using("btree", table.familyid.asc().nullsLast().op("int4_ops")),
]);

export const tempclass = pgTable("tempclass", {
	classnamecn: varchar({ length: 255 }),
	classnameen: varchar({ length: 255 }),
	classindex: numeric({ precision: 7, scale:  2 }),
	typeid: integer(),
	classno: integer(),
	status: varchar({ length: 255 }),
	description: varchar({ length: 255 }),
	createby: varchar({ length: 255 }),
	seasonid: integer(),
	teacherid: integer(),
	roomid: integer(),
	timeid: integer(),
	seatlimit: integer(),
	agelimit: integer(),
	suitableterm: integer(),
	waiveregfee: integer(),
	activestatus: varchar({ length: 255 }),
	regstatus: varchar({ length: 255 }),
	closeregistration: integer(),
	notes: varchar({ length: 255 }),
	updateby: varchar({ length: 255 }),
	tuitionW: numeric("tuition_w", { precision: 7, scale:  2 }),
	specialfeeW: numeric("specialfee_w", { precision: 7, scale:  2 }),
	bookfeeW: numeric("bookfee_w", { precision: 7, scale:  2 }),
	tuitionH: numeric("tuition_h", { precision: 7, scale:  2 }),
	specialfeeH: numeric("specialfee_h", { precision: 7, scale:  2 }),
	bookfeeH: numeric("bookfee_h", { precision: 7, scale:  2 }),
	isprocess: integer(),
});

export const regchangerequest = pgTable("regchangerequest", {
	requestid: integer().generatedAlwaysAsIdentity({ name: "regchangerequest_requestid_seq", startWith: 10000, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	regid: bigint({ mode: "number" }).notNull(),
	appliedid: integer(),
	studentid: integer().default(0).notNull(),
	seasonid: smallint(),
	isyearclass: boolean().notNull(),
	relatedseasonid: smallint(),
	classid: integer().default(0).notNull(),
	registerdate: timestamp({ mode: 'string' }),
	oriregstatusid: smallint().default(0).notNull(),
	regstatusid: smallint().default(0).notNull(),
	reqstatusid: smallint().default(1).notNull(),
	familybalanceid: integer().default(0),
	familyid: integer(),
	otherfee: numeric({ precision: 7, scale:  2 }),
	newbalanceid: integer(),
	submitdate: timestamp({ precision: 3, mode: 'string' }),
	processdate: timestamp({ precision: 3, mode: 'string' }),
	lastmodify: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	notes: varchar({ length: 500 }).default(''),
	adminmemo: varchar({ length: 500 }).default(''),
	adminuserid: varchar({ length: 50 }).default(''),
}, (table) => [
	foreignKey({
			columns: [table.familyid],
			foreignColumns: [family.familyid],
			name: "fk_regchangerequest_familyid"
		}),
	// foreignKey({
	// 		columns: [table.familyid],
	// 		foreignColumns: [legacyFamily.familyid],
	// 		name: "legacy_fk_regchangerequest_familyid"
	// 	}),
	foreignKey({
			columns: [table.reqstatusid],
			foreignColumns: [requeststatus.reqstatusid],
			name: "fk_classregtransfer_requeststatus"
		}),
	foreignKey({
			columns: [table.oriregstatusid],
			foreignColumns: [regstatus.regstatusid],
			name: "fk_regchangerequest_oriregstatusid"
		}),
	foreignKey({
			columns: [table.regstatusid],
			foreignColumns: [regstatus.regstatusid],
			name: "fk_regchangerequest_regstatusid"
		}),
	foreignKey({
			columns: [table.reqstatusid],
			foreignColumns: [requeststatus.reqstatusid],
			name: "fk_regchangerequest_requeststatus"
		}),
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "fk_regchangerequest_seasonid"
		}),
	foreignKey({
			columns: [table.studentid],
			foreignColumns: [student.studentid],
			name: "fk_regchangerequest_studentid"
		}),
]);

export const legacyFamily = pgTable("legacy_family", {
	familyid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "legacy_family_familyid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	username: varchar({ length: 100 }),
	password: varchar({ length: 100 }).notNull(),
	fatherfirsten: varchar({ length: 50 }),
	fatherlasten: varchar({ length: 50 }),
	fathernamecn: varchar({ length: 50 }),
	motherfirsten: varchar({ length: 50 }),
	motherlasten: varchar({ length: 50 }),
	mothernamecn: varchar({ length: 50 }),
	contact: varchar({ length: 20 }),
	address: varchar({ length: 100 }),
	address1: varchar({ length: 100 }),
	city: varchar({ length: 50 }),
	state: varchar({ length: 50 }),
	zip: varchar({ length: 20 }),
	phone: varchar({ length: 20 }),
	officephone: varchar({ length: 50 }),
	cellphone: varchar({ length: 50 }),
	email: varchar({ length: 100 }),
	email2: varchar({ length: 100 }),
	createddate: timestamp({ mode: 'string' }),
	lastmodify: timestamp({ mode: 'string' }).defaultNow(),
	lastlogin: timestamp({ mode: 'string' }),
	status: boolean().default(true).notNull(),
	remark: varchar({ length: 200 }),
	schoolmember: varchar({ length: 50 }),
});

export const verificationToken = pgTable("verification_token", {
	identifier: text().notNull(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	token: text().notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verification_token_pkey"}),
]);

export const adminuserrole = pgTable("adminuserrole", {
	userid: integer().notNull(),
	roleid: smallint().notNull(),
	createby: varchar({ length: 50 }).default('').notNull(),
	createdate: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updateby: varchar({ length: 50 }).default('').notNull(),
	lastupdatedate: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userid],
			foreignColumns: [adminuser.adminid],
			name: "fk_adminuserrole_adminuser"
		}),
	// foreignKey({
	// 		columns: [table.userid],
	// 		foreignColumns: [legacyAdminuser.userid],
	// 		name: "legacy_fk_adminuserrole_adminuser"
	// 	}),
	foreignKey({
			columns: [table.roleid],
			foreignColumns: [adminrole.roleid],
			name: "fk_adminuserrole_adminrole"
		}),
	primaryKey({ columns: [table.userid, table.roleid], name: "pk_adminuserrole"}),
]);
