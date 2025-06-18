import { pgTable, serial, integer, varchar, text, bigint, timestamp, unique, smallint, boolean, foreignKey, numeric, char, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { userRole } from "./db_types"



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

export const sessions = pgTable("sessions", {
	id: serial().primaryKey().notNull(),
	userId: integer().notNull(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	sessionToken: varchar({ length: 255 }).notNull(),
});

export const adminrole = pgTable("adminrole", {
	roleid: smallint().primaryKey().notNull(),
	rolename: varchar({ length: 50 }).notNull(),
	rolefullnameeng: varchar({ length: 100 }).notNull(),
	rolefullnamecn: varchar({ length: 100 }).notNull(),
	notes: varchar({ length: 250 }),
}, (table) => [
	unique("adminrole_rolename_unique").on(table.rolename),
	unique("adminrole_rolefullnameeng_unique").on(table.rolefullnameeng),
	unique("adminrole_rolefullnamecn_unique").on(table.rolefullnamecn),
]);

export const errorlog = pgTable("errorlog", {
	id: integer().primaryKey().notNull(),
	userid: varchar({ length: 100 }),
	errortype: varchar({ length: 50 }),
	errormessage: varchar({ length: 2000 }),
	logmessage: varchar({ length: 255 }),
	errorpage: varchar({ length: 255 }),
	stacktrace: varchar({ length: 200 }),
	querystringdata: varchar({ length: 255 }),
	useragent: varchar({ length: 255 }),
	machinename: varchar({ length: 50 }),
	errordate: timestamp({ precision: 3, mode: 'string' }),
});

export const users = pgTable("users", {
	id: text().default(sql`gen_random_uuid()`).primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	emailVerified: timestamp({ withTimezone: true, mode: 'string' }),
	image: text(),
	roles: userRole().array().notNull(), // Changed from single role to array of roles
	username: varchar({ length: 50 }).notNull(),
	password: varchar({ length: 100 }).notNull(),
	createon: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	lastlogin: timestamp({ withTimezone: true, mode: 'string' }),
	address: varchar({ length: 100 }),
	city: varchar({ length: 50 }),
	state: varchar({ length: 4 }),
	zip: varchar({ length: 10 }),
	phone: varchar({ length: 20 }),
	ischangepwdnext: boolean(),
	status: boolean().default(true).notNull(),
	notes: varchar({ length: 200 }),
}, (table) => [
	unique("users_username_key").on(table.username),
]);

export const family = pgTable("family", {
	familyid: serial().primaryKey().notNull(),
	userid: text().notNull(),
	fatherfirsten: varchar({ length: 50 }),
	fatherlasten: varchar({ length: 50 }),
	fathernamecn: varchar({ length: 50 }),
	motherfirsten: varchar({ length: 50 }),
	motherlasten: varchar({ length: 50 }),
	mothernamecn: varchar({ length: 50 }),
	address2: varchar({ length: 100 }),
	phonealt: varchar({ length: 20 }),
	emailalt: varchar({ length: 100 }),
	lastmodify: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	notes: varchar({ length: 300 }),
}, (table) => [
	foreignKey({
			columns: [table.userid],
			foreignColumns: [users.id],
			name: "family_user_userid_fkey"
		}).onDelete("cascade"),
]);

export const adminuser = pgTable("adminuser", {
	adminid: serial().primaryKey().notNull(),
	userid: text().notNull(),
	roleid: integer().notNull(),
	namecn: varchar({ length: 50 }).notNull(),
	namelasten: varchar({ length: 50 }).notNull(),
	namefirsten: varchar({ length: 50 }).notNull(),
	address2: varchar({ length: 100 }),
	familyid: integer(),
	createby: varchar({ length: 50 }).notNull(),
	updateby: varchar({ length: 50 }).notNull(),
	updateon: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	ischangepwdnext: boolean().default(false).notNull(),
	status: boolean().default(true).notNull(),
	notes: varchar({ length: 300 }),
}, (table) => [
	foreignKey({
			columns: [table.userid],
			foreignColumns: [users.id],
			name: "admin_user_userid_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roleid],
			foreignColumns: [adminrole.roleid],
			name: "admin_user_roleid_fkey"
		}),
	foreignKey({
			columns: [table.familyid],
			foreignColumns: [family.familyid],
			name: "admin_user_familyid_fkey"
		}),
]);

export const paypalrecord = pgTable("paypalrecord", {
	pid: integer().primaryKey().notNull(),
	regnum: integer().notNull(),
	paidamount: numeric().notNull(),
	transfee: numeric(),
	paypalstatus: varchar({ length: 250 }),
	counterpartystatus: varchar({ length: 250 }),
	transactionid: varchar({ length: 50 }),
	paiddate: timestamp({ precision: 3, mode: 'string' }).notNull(),
	isprocess: boolean(),
	iscurrent: boolean(),
	updateby: varchar({ length: 50 }),
	updateon: timestamp({ precision: 3, mode: 'string' }),
	notes: varchar({ length: 250 }),
});

export const paypalrecordImport = pgTable("paypalrecord_import", {
	importid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "paypalrecord_import_importid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	regnum: varchar({ length: 50 }).notNull(),
	transfee: varchar({ length: 50 }).notNull(),
	paidamount: varchar({ length: 50 }).notNull(),
	paypalstatus: varchar({ length: 250 }),
	counterpartystatus: varchar({ length: 250 }),
	transactionid: varchar({ length: 50 }),
	paiddate: varchar({ length: 50 }).notNull(),
	updateby: varchar({ length: 50 }),
});

export const scorecode = pgTable("scorecode", {
	codeid: integer().primaryKey().notNull(),
	codenameeng: varchar({ length: 50 }),
	codenamecn: varchar({ length: 50 }),
});

export const teacher = pgTable("teacher", {
	teacherid: serial().primaryKey().notNull(),
	userid: text().notNull(),
	namecn: varchar({ length: 50 }).notNull(),
	namelasten: varchar({ length: 50 }).notNull(),
	namefirsten: varchar({ length: 50 }).notNull(),
	classid: integer().notNull(),
	address: varchar({ length: 100 }),
	address2: varchar({ length: 100 }),
	familyid: integer().notNull(),
	createby: varchar({ length: 50 }).notNull(),
	updateby: varchar({ length: 50 }).notNull(),
	updateon: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	notes: varchar({ length: 300 }),
}, (table) => [
	foreignKey({
			columns: [table.userid],
			foreignColumns: [users.id],
			name: "teacher_user_userid_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.classid],
			foreignColumns: [classes.classid],
			name: "teacher_user_classid_fkey"
		}),
	foreignKey({
			columns: [table.familyid],
			foreignColumns: [family.familyid],
			name: "teacher_user_familyid_fkey"
		}),
]);

export const seatnum = pgTable("seatnum", {
	seatid: integer().primaryKey().notNull(),
	seatnum: integer().notNull(),
});

export const supports = pgTable("supports", {
	catid: integer().primaryKey().notNull(),
	catnamecn: varchar({ length: 50 }).notNull(),
	catnameeng: varchar({ length: 100 }).notNull(),
	description: varchar({ length: 400 }),
	status: boolean().notNull(),
});

// OLD FAMILY TABLE
// export const family = pgTable("family", {
// 	familyid: integer().primaryKey().notNull(),
// 	username: varchar({ length: 100 }),
// 	password: varchar({ length: 100 }).notNull(),
// 	fatherfirsten: varchar({ length: 50 }),
// 	fatherlasten: varchar({ length: 50 }),
// 	fathernamecn: varchar({ length: 50 }),
// 	motherfirsten: varchar({ length: 50 }),
// 	motherlasten: varchar({ length: 50 }),
// 	mothernamecn: varchar({ length: 50 }),
// 	contact: varchar({ length: 20 }),
// 	address: varchar({ length: 100 }),
// 	address1: varchar({ length: 100 }),
// 	city: varchar({ length: 50 }),
// 	state: varchar({ length: 50 }),
// 	zip: varchar({ length: 20 }),
// 	phone: varchar({ length: 20 }),
// 	officephone: varchar({ length: 50 }),
// 	cellphone: varchar({ length: 50 }),
// 	email: varchar({ length: 100 }),
// 	email2: varchar({ length: 100 }),
// 	createddate: timestamp({ mode: 'string' }),
// 	lastmodify: timestamp({ mode: 'string' }),
// 	lastlogin: timestamp({ mode: 'string' }),
// 	status: boolean().notNull(),
// 	remark: varchar({ length: 200 }),
// 	schoolmember: varchar({ length: 50 }),
// });

// OLD ADMINUSER TABLE
// export const adminuser = pgTable("adminuser", {
// 	userid: integer().primaryKey().notNull(),
// 	username: varchar({ length: 50 }).notNull(),
// 	password: varchar({ length: 100 }).notNull(),
// 	namecn: varchar({ length: 50 }),
// 	firstname: varchar({ length: 50 }),
// 	lastname: varchar({ length: 50 }),
// 	address: varchar({ length: 100 }),
// 	address1: varchar({ length: 100 }),
// 	city: varchar({ length: 50 }),
// 	state: varchar({ length: 4 }),
// 	zip: varchar({ length: 10 }),
// 	email: varchar({ length: 100 }),
// 	phone: varchar({ length: 20 }),
// 	familyid: integer().notNull(),
// 	status: varchar({ length: 50 }).notNull(),
// 	ischangepwdnext: boolean().notNull(),
// 	createby: varchar({ length: 50 }),
// 	createon: timestamp({ mode: 'string' }),
// 	updateby: varchar({ length: 50 }),
// 	updateon: timestamp({ mode: 'string' }).notNull(),
// 	lastlogin: timestamp({ mode: 'string' }).notNull(),
// 	notes: varchar({ length: 2000 }),
// }, (table) => [
// 	foreignKey({
// 			columns: [table.familyid],
// 			foreignColumns: [family.familyid],
// 			name: "adminuser_familyid_family_familyid_fk"
// 		}),
// 	unique("adminuser_username_unique").on(table.username),
// ]);

export const seasons = pgTable("seasons", {
	seasonid: smallint().primaryKey().notNull(),
	seasonnamecn: varchar({ length: 100 }).notNull(),
	seasonnameeng: varchar({ length: 100 }),
	isspring: boolean().notNull(),
	relatedseasonid: integer().notNull(),
	beginseasonid: integer().notNull(),
	haslateregfee: boolean().notNull(),
	haslateregfee4Newfamily: boolean().notNull(),
	hasdutyfee: boolean().notNull(),
	startdate: timestamp({ mode: 'string' }).notNull(),
	enddate: timestamp({ mode: 'string' }).notNull(),
	earlyregdate: timestamp({ mode: 'string' }).notNull(),
	normalregdate: timestamp({ mode: 'string' }).notNull(),
	lateregdate1: timestamp({ mode: 'string' }).notNull(),
	lateregdate2: timestamp({ mode: 'string' }).notNull(),
	closeregdate: timestamp({ mode: 'string' }).notNull(),
	canceldeadline: timestamp({ mode: 'string' }).notNull(),
	hasdeadline: boolean().notNull(),
	status: varchar({ length: 50 }).notNull(),
	open4Register: boolean().notNull(),
	showadmissionnotice: boolean().notNull(),
	showteachername: boolean().notNull(),
	days4Showteachername: smallint().notNull(),
	allownewfamilytoregister: boolean().notNull(),
	date4Newfamilytoregister: timestamp({ mode: 'string' }).notNull(),
	notes: varchar({ length: 6000 }),
	createddate: timestamp({ mode: 'string' }),
	lastmodifieddate: timestamp({ mode: 'string' }),
	updateby: varchar({ length: 50 }),
});

export const arrangement = pgTable("arrangement", {
	arrangeid: integer().primaryKey().notNull(),
	seasonid: smallint().notNull(),
	classid: integer().notNull(),
	teacherid: integer().notNull(),
	roomid: smallint().notNull(),
	timeid: smallint().notNull(),
	seatlimit: smallint(),
	agelimit: smallint(),
	suitableterm: smallint().notNull(),
	waiveregfee: boolean().notNull(),
	activestatus: varchar({ length: 20 }),
	regstatus: varchar({ length: 20 }),
	closeregistration: boolean(),
	notes: varchar({ length: 250 }),
	lastmodify: timestamp({ mode: 'string' }).notNull(),
	updateby: varchar({ length: 50 }).notNull(),
	tuitionW: numeric("tuition_w"),
	specialfeeW: numeric("specialfee_w"),
	bookfeeW: numeric("bookfee_w"),
	tuitionH: numeric("tuition_h"),
	specialfeeH: numeric("specialfee_h"),
	bookfeeH: numeric("bookfee_h"),
}, (table) => [
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "arrangement_seasonid_seasons_seasonid_fk"
		}),
	foreignKey({
			columns: [table.classid],
			foreignColumns: [classes.classid],
			name: "arrangement_classid_classes_classid_fk"
		}),
	foreignKey({
			columns: [table.teacherid],
			foreignColumns: [teacher.teacherid],
			name: "arrangement_teacherid_teacher_teacherid_fk"
		}),
	foreignKey({
			columns: [table.roomid],
			foreignColumns: [classrooms.roomid],
			name: "arrangement_roomid_classrooms_roomid_fk"
		}),
	foreignKey({
			columns: [table.timeid],
			foreignColumns: [classtime.timeid],
			name: "arrangement_timeid_classtime_timeid_fk"
		}),
	foreignKey({
			columns: [table.suitableterm],
			foreignColumns: [suitableterm.termno],
			name: "arrangement_suitableterm_suitableterm_termno_fk"
		}),
]);

export const classes = pgTable("classes", {
	classid: serial().primaryKey().notNull(),
	classindex: integer(),
	ageid: smallint(),
	typeid: smallint().notNull(),
	classno: integer().notNull(),
	classnamecn: varchar({ length: 50 }).notNull(),
	classupid: integer().notNull(),
	classnameen: varchar({ length: 100 }),
	sizelimits: integer(),
	status: varchar({ length: 20 }).notNull(),
	description: varchar({ length: 2000 }),
	lastmodify: timestamp({ precision: 3, mode: 'string' }),
	createby: varchar({ length: 100 }).notNull(),
	createon: timestamp({ precision: 3, mode: 'string' }).notNull(),
	updateby: varchar({ length: 100 }).notNull(),
	updateon: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ageid],
			foreignColumns: [agerestriction.ageid],
			name: "classes_ageid_agerestriction_ageid_fk"
		}),
	foreignKey({
			columns: [table.typeid],
			foreignColumns: [classtype.typeid],
			name: "classes_typeid_classtype_typeid_fk"
		}),
	foreignKey({
			columns: [table.classupid],
			foreignColumns: [table.classid],
			name: "classes_classupid_classes_classid_fk"
		}),
	unique("classes_classnamecn_unique").on(table.classnamecn),
]);

// OLD TEACHER TABLE
// export const teacher = pgTable("teacher", {
// 	teacherid: integer().primaryKey().notNull(),
// 	namecn: varchar({ length: 50 }),
// 	username: varchar({ length: 50 }).notNull(),
// 	password: varchar({ length: 100 }).notNull(),
// 	namelasten: varchar({ length: 50 }),
// 	namefirsten: varchar({ length: 50 }),
// 	teacherindex: integer(),
// 	classtypeid: smallint(),
// 	status: varchar({ length: 50 }).notNull(),
// 	ischangepwdnext: boolean(),
// 	address: varchar({ length: 100 }),
// 	address1: varchar({ length: 100 }),
// 	city: varchar({ length: 50 }),
// 	state: varchar({ length: 4 }),
// 	zip: varchar({ length: 10 }),
// 	phone: varchar({ length: 20 }),
// 	email: varchar({ length: 100 }),
// 	subject: varchar({ length: 20 }),
// 	profile: varchar({ length: 2000 }),
// 	familyid: integer(),
// 	createby: varchar({ length: 50 }).notNull(),
// 	createon: timestamp({ mode: 'string' }),
// 	updateby: varchar({ length: 50 }).notNull(),
// 	updateon: timestamp({ mode: 'string' }),
// 	lastlogin: timestamp({ mode: 'string' }),
// }, (table) => [
// 	foreignKey({
// 			columns: [table.classtypeid],
// 			foreignColumns: [classtype.typeid],
// 			name: "teacher_classtypeid_classtype_typeid_fk"
// 		}),
// 	foreignKey({
// 			columns: [table.familyid],
// 			foreignColumns: [family.familyid],
// 			name: "teacher_familyid_family_familyid_fk"
// 		}),
// 	unique("teacher_username_unique").on(table.username),
// ]);

export const classrooms = pgTable("classrooms", {
	roomid: smallint().primaryKey().notNull(),
	roomno: varchar({ length: 50 }).notNull(),
	roomcapacity: smallint().notNull(),
	status: varchar({ length: 20 }).notNull(),
	notes: varchar({ length: 200 }).notNull(),
});

export const classtime = pgTable("classtime", {
	timeid: smallint().primaryKey().notNull(),
	period: varchar({ length: 20 }).notNull(),
	timebegin: numeric().notNull(),
	timeend: numeric().notNull(),
	istwoperiod: varchar({ length: 20 }),
});

export const suitableterm = pgTable("suitableterm", {
	termno: smallint().primaryKey().notNull(),
	suitableterm: varchar({ length: 30 }),
	suitabletermcn: varchar({ length: 30 }),
	description: varchar({ length: 100 }),
});

export const agerestriction = pgTable("agerestriction", {
	ageid: smallint().primaryKey().notNull(),
	description: varchar({ length: 100 }).notNull(),
	minage: smallint().notNull(),
	maxage: smallint().notNull(),
	status: boolean(),
});

export const classtype = pgTable("classtype", {
	typeid: smallint().primaryKey().notNull(),
	typenameen: varchar({ length: 100 }).notNull(),
	typenamecn: varchar({ length: 100 }).notNull(),
	ageofstudent: varchar({ length: 20 }).notNull(),
	ageid: smallint().notNull(),
	typedescription: varchar({ length: 100 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	ischineseclass: boolean().notNull(),
	sortorder: integer().notNull(),
	isnofee: boolean().notNull(),
	isonline: boolean().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ageid],
			foreignColumns: [agerestriction.ageid],
			name: "classtype_ageid_agerestriction_ageid_fk"
		}),
	unique("classtype_typenameen_unique").on(table.typenameen),
	unique("classtype_typenamecn_unique").on(table.typenamecn),
]);

export const student = pgTable("student", {
	studentid: integer().primaryKey().notNull(),
	familyid: integer().notNull(),
	studentno: varchar({ length: 20 }),
	namecn: varchar({ length: 50 }),
	namelasten: varchar({ length: 50 }).notNull(),
	namefirsten: varchar({ length: 50 }).notNull(),
	gender: varchar({ length: 20 }),
	ageof: varchar({ length: 20 }),
	age: integer(),
	dob: timestamp({ precision: 3, mode: 'string' }).notNull(),
	active: boolean().notNull(),
	createddate: timestamp({ mode: 'string' }).notNull(),
	lastmodify: timestamp({ mode: 'string' }).notNull(),
	notes: varchar({ length: 200 }),
	upgradable: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.familyid],
			foreignColumns: [family.familyid],
			name: "student_familyid_family_familyid_fk"
		}),
]);

export const classregistration = pgTable("classregistration", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	regid: bigint({ mode: "number" }).primaryKey().notNull(),
	appliedid: integer(),
	studentid: integer().notNull(),
	arrangeid: integer().notNull(),
	seasonid: smallint(),
	isyearclass: boolean().notNull(),
	classid: integer().notNull(),
	registerdate: timestamp({ mode: 'string' }).notNull(),
	statusid: smallint().notNull(),
	previousstatusid: smallint().notNull(),
	familybalanceid: integer(),
	familyid: integer().notNull(),
	newbalanceid: integer(),
	isdropspring: boolean().notNull(),
	byadmin: boolean(),
	userid: varchar({ length: 100 }),
	lastmodify: timestamp({ mode: 'string' }).notNull(),
	notes: varchar({ length: 500 }),
}, (table) => [
	foreignKey({
			columns: [table.studentid],
			foreignColumns: [student.studentid],
			name: "classregistration_studentid_student_studentid_fk"
		}),
	foreignKey({
			columns: [table.arrangeid],
			foreignColumns: [arrangement.arrangeid],
			name: "classregistration_arrangeid_arrangement_arrangeid_fk"
		}),
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "classregistration_seasonid_seasons_seasonid_fk"
		}),
	foreignKey({
			columns: [table.classid],
			foreignColumns: [classes.classid],
			name: "classregistration_classid_classes_classid_fk"
		}),
	foreignKey({
			columns: [table.statusid],
			foreignColumns: [regstatus.regstatusid],
			name: "classregistration_statusid_regstatus_regstatusid_fk"
		}),
	foreignKey({
			columns: [table.previousstatusid],
			foreignColumns: [regstatus.regstatusid],
			name: "classregistration_previousstatusid_regstatus_regstatusid_fk"
		}),
	foreignKey({
			columns: [table.familybalanceid],
			foreignColumns: [familybalance.balanceid],
			name: "classregistration_familybalanceid_familybalance_balanceid_fk"
		}),
	foreignKey({
			columns: [table.familyid],
			foreignColumns: [family.familyid],
			name: "classregistration_familyid_family_familyid_fk"
		}),
	foreignKey({
			columns: [table.newbalanceid],
			foreignColumns: [familybalance.balanceid],
			name: "classregistration_newbalanceid_familybalance_balanceid_fk"
		}),
]);

export const regstatus = pgTable("regstatus", {
	regstatusid: smallint().primaryKey().notNull(),
	regstatus: varchar({ length: 50 }),
	status: varchar({ length: 100 }),
});

export const familybalance = pgTable("familybalance", {
	balanceid: integer().primaryKey().notNull(),
	appliedid: integer().notNull(),
	appliedregid: integer().notNull(),
	seasonid: smallint().notNull(),
	familyid: integer().notNull(),
	yearclass: smallint().notNull(),
	yearclass4Child: smallint().notNull(),
	semesterclass: smallint().notNull(),
	semesterclass4Child: smallint().notNull(),
	childnum: smallint().notNull(),
	childnumRegfee: smallint("childnum_regfee").notNull(),
	studentnum: smallint().notNull(),
	regfee: numeric(),
	earlyregdiscount: numeric(),
	lateregfee: numeric(),
	extrafee4Newfamily: numeric(),
	managementfee: numeric(),
	dutyfee: numeric(),
	cleaningfee: numeric(),
	otherfee: numeric(),
	tuition: numeric(),
	totalamount: numeric(),
	typeid: smallint().notNull(),
	statusid: smallint().notNull(),
	checkno: varchar({ length: 50 }),
	transactionno: varchar({ length: 20 }),
	isonlinepayment: boolean(),
	registerdate: timestamp({ mode: 'string' }).notNull(),
	lastmodify: timestamp({ mode: 'string' }).notNull(),
	paiddate: timestamp({ mode: 'string' }).notNull(),
	reference: varchar({ length: 50 }),
	notes: varchar({ length: 250 }),
	userid: varchar({ length: 100 }),
	groupdiscount: numeric(),
	processfee: numeric(),
}, (table) => [
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "familybalance_seasonid_seasons_seasonid_fk"
		}),
	foreignKey({
			columns: [table.familyid],
			foreignColumns: [family.familyid],
			name: "familybalance_familyid_family_familyid_fk"
		}),
	foreignKey({
			columns: [table.typeid],
			foreignColumns: [familybalancetype.typeid],
			name: "familybalance_typeid_familybalancetype_typeid_fk"
		}),
	foreignKey({
			columns: [table.statusid],
			foreignColumns: [familybalancestatus.statusid],
			name: "familybalance_statusid_familybalancestatus_statusid_fk"
		}),
]);

export const dutyassignment = pgTable("dutyassignment", {
	dutyassignid: integer().primaryKey().notNull(),
	familyid: integer().notNull(),
	studentid: integer(),
	seasonid: smallint(),
	dutydate: timestamp({ mode: 'string' }).notNull(),
	dutystatus: smallint().notNull(),
	createddate: timestamp({ mode: 'string' }).notNull(),
	lastmodify: timestamp({ mode: 'string' }).notNull(),
	note: varchar({ length: 150 }),
	pdid: integer(),
	ischarged: boolean(),
}, (table) => [
	foreignKey({
			columns: [table.familyid],
			foreignColumns: [family.familyid],
			name: "dutyassignment_familyid_family_familyid_fk"
		}),
	foreignKey({
			columns: [table.studentid],
			foreignColumns: [student.studentid],
			name: "dutyassignment_studentid_student_studentid_fk"
		}),
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "dutyassignment_seasonid_seasons_seasonid_fk"
		}),
	foreignKey({
			columns: [table.dutystatus],
			foreignColumns: [dutystatus.dutystatusid],
			name: "dutyassignment_dutystatus_dutystatus_dutystatusid_fk"
		}),
	foreignKey({
			columns: [table.pdid],
			foreignColumns: [parentdutyPb.pdid],
			name: "dutyassignment_pdid_parentduty_pb_pdid_fk"
		}),
]);

export const dutystatus = pgTable("dutystatus", {
	dutystatusid: smallint().primaryKey().notNull(),
	dutystatuscn: varchar({ length: 50 }),
	dutystatus: varchar({ length: 50 }).notNull(),
	active: boolean().notNull(),
});

export const parentdutyPb = pgTable("parentduty_pb", {
	pdid: integer().primaryKey().notNull(),
	familyid: integer().notNull(),
	studentid: integer().notNull(),
	committeeid: integer().notNull(),
	seasonid: integer().notNull(),
	selecteddutydate: timestamp({ precision: 3, mode: 'string' }),
	ischangebyadmin: boolean().notNull(),
	scheduleddutydate: timestamp({ precision: 3, mode: 'string' }).notNull(),
	previouscommitteeid: integer().notNull(),
	regdate: timestamp({ precision: 3, mode: 'string' }).notNull(),
	lastupdated: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.familyid],
			foreignColumns: [family.familyid],
			name: "parentduty_pb_familyid_family_familyid_fk"
		}),
	foreignKey({
			columns: [table.studentid],
			foreignColumns: [student.studentid],
			name: "parentduty_pb_studentid_student_studentid_fk"
		}),
	foreignKey({
			columns: [table.committeeid],
			foreignColumns: [dutycommittee.dcid],
			name: "parentduty_pb_committeeid_dutycommittee_dcid_fk"
		}),
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "parentduty_pb_seasonid_seasons_seasonid_fk"
		}),
]);

export const familybalancetype = pgTable("familybalancetype", {
	typeid: smallint().primaryKey().notNull(),
	typenameen: varchar({ length: 60 }),
	typenamecn: varchar({ length: 60 }),
	isminusvalue: boolean().notNull(),
	isshow: boolean().notNull(),
});

export const familybalancestatus = pgTable("familybalancestatus", {
	statusid: smallint().primaryKey().notNull(),
	statusen: varchar({ length: 60 }),
	statuscn: varchar({ length: 60 }),
});

export const familybalanceSave = pgTable("familybalance_save", {
	balanceid: integer().primaryKey().notNull(),
	appliedid: integer().notNull(),
	appliedregid: integer().notNull(),
	seasonid: smallint().notNull(),
	familyid: integer().notNull(),
	yearclass: smallint().notNull(),
	yearclass4Child: smallint().notNull(),
	semesterclass: smallint().notNull(),
	semesterclass4Child: smallint().notNull(),
	childnum: smallint().notNull(),
	childnumRegfee: smallint("childnum_regfee").notNull(),
	studentnum: smallint().notNull(),
	regfee: numeric().notNull(),
	earlyregdiscount: numeric().notNull(),
	lateregfee: numeric().notNull(),
	extrafee4Newfamily: numeric().notNull(),
	managementfee: numeric().notNull(),
	dutyfee: numeric().notNull(),
	cleaningfee: numeric().notNull(),
	otherfee: numeric().notNull(),
	tuition: numeric().notNull(),
	totalamount: numeric().notNull(),
	typeid: smallint().notNull(),
	statusid: smallint().notNull(),
	checkno: varchar({ length: 50 }),
	transactionno: varchar({ length: 20 }),
	isonlinepayment: boolean(),
	registerdate: timestamp({ mode: 'string' }).notNull(),
	lastmodify: timestamp({ mode: 'string' }).notNull(),
	paiddate: timestamp({ mode: 'string' }).notNull(),
	reference: varchar({ length: 50 }),
	notes: varchar({ length: 250 }),
	userid: varchar({ length: 100 }),
}, (table) => [
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "familybalance_save_seasonid_seasons_seasonid_fk"
		}),
	foreignKey({
			columns: [table.familyid],
			foreignColumns: [family.familyid],
			name: "familybalance_save_familyid_family_familyid_fk"
		}),
	foreignKey({
			columns: [table.typeid],
			foreignColumns: [familybalancetype.typeid],
			name: "familybalance_save_typeid_familybalancetype_typeid_fk"
		}),
	foreignKey({
			columns: [table.statusid],
			foreignColumns: [familybalancestatus.statusid],
			name: "familybalance_save_statusid_familybalancestatus_statusid_fk"
		}),
]);

export const feedback = pgTable("feedback", {
	recid: integer().primaryKey().notNull(),
	familyid: integer(),
	name: varchar({ length: 100 }),
	phone: char({ length: 15 }),
	email: varchar({ length: 100 }),
	comment: varchar({ length: 2000 }),
	postdate: timestamp({ mode: 'string' }),
	followup: varchar({ length: 250 }),
}, (table) => [
	foreignKey({
			columns: [table.familyid],
			foreignColumns: [family.familyid],
			name: "feedback_familyid_family_familyid_fk"
		}),
]);

export const feelist = pgTable("feelist", {
	feelistid: integer().primaryKey().notNull(),
	seasonid: integer().notNull(),
	feeid: integer().notNull(),
	feename: varchar({ length: 50 }),
	feenameen: varchar({ length: 50 }),
	feeamount: numeric(),
	notes: varchar({ length: 250 }),
}, (table) => [
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "feelist_seasonid_seasons_seasonid_fk"
		}),
]);

export const dutycommittee = pgTable("dutycommittee", {
	dcid: integer().primaryKey().notNull(),
	committeenamecn: varchar({ length: 200 }),
	committeenameeng: varchar({ length: 200 }),
	numofseats: integer().notNull(),
	descriptioncn: varchar({ length: 2000 }),
	descriptioneng: varchar({ length: 2000 }),
	url: varchar({ length: 200 }),
	sortorder: integer().notNull(),
	isforadminonly: boolean().notNull(),
	openstatus: boolean().notNull(),
	createdate: timestamp({ precision: 3, mode: 'string' }).notNull(),
	lastupdatedate: timestamp({ precision: 3, mode: 'string' }).notNull(),
	lastupdateby: varchar({ length: 50 }),
});

export const regchangerequest = pgTable("regchangerequest", {
	requestid: integer().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	regid: bigint({ mode: "number" }).notNull(),
	appliedid: integer(),
	studentid: integer().notNull(),
	seasonid: smallint(),
	isyearclass: boolean().notNull(),
	relatedseasonid: smallint(),
	classid: integer().notNull(),
	registerdate: timestamp({ mode: 'string' }),
	oriregstatusid: smallint().notNull(),
	regstatusid: smallint().notNull(),
	reqstatusid: smallint().notNull(),
	familybalanceid: integer(),
	familyid: integer(),
	otherfee: numeric(),
	newbalanceid: integer(),
	submitdate: timestamp({ precision: 3, mode: 'string' }),
	processdate: timestamp({ precision: 3, mode: 'string' }),
	lastmodify: timestamp({ precision: 3, mode: 'string' }).notNull(),
	notes: varchar({ length: 500 }),
	adminmemo: varchar({ length: 500 }),
	adminuserid: varchar({ length: 50 }),
}, (table) => [
	foreignKey({
			columns: [table.regid],
			foreignColumns: [classregistration.regid],
			name: "regchangerequest_regid_classregistration_regid_fk"
		}),
	foreignKey({
			columns: [table.studentid],
			foreignColumns: [student.studentid],
			name: "regchangerequest_studentid_student_studentid_fk"
		}),
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "regchangerequest_seasonid_seasons_seasonid_fk"
		}),
	foreignKey({
			columns: [table.relatedseasonid],
			foreignColumns: [seasons.seasonid],
			name: "regchangerequest_relatedseasonid_seasons_seasonid_fk"
		}),
	foreignKey({
			columns: [table.classid],
			foreignColumns: [classes.classid],
			name: "regchangerequest_classid_classes_classid_fk"
		}),
	foreignKey({
			columns: [table.oriregstatusid],
			foreignColumns: [regstatus.regstatusid],
			name: "regchangerequest_oriregstatusid_regstatus_regstatusid_fk"
		}),
	foreignKey({
			columns: [table.regstatusid],
			foreignColumns: [regstatus.regstatusid],
			name: "regchangerequest_regstatusid_regstatus_regstatusid_fk"
		}),
	foreignKey({
			columns: [table.reqstatusid],
			foreignColumns: [requeststatus.reqstatusid],
			name: "regchangerequest_reqstatusid_requeststatus_reqstatusid_fk"
		}),
	foreignKey({
			columns: [table.familybalanceid],
			foreignColumns: [familybalance.balanceid],
			name: "regchangerequest_familybalanceid_familybalance_balanceid_fk"
		}),
	foreignKey({
			columns: [table.familyid],
			foreignColumns: [family.familyid],
			name: "regchangerequest_familyid_family_familyid_fk"
		}),
	foreignKey({
			columns: [table.newbalanceid],
			foreignColumns: [familybalance.balanceid],
			name: "regchangerequest_newbalanceid_familybalance_balanceid_fk"
		}),
]);

export const requeststatus = pgTable("requeststatus", {
	reqstatusid: smallint().primaryKey().notNull(),
	reqstatus: varchar({ length: 50 }),
	reqstatuscn: varchar({ length: 50 }),
});

export const schoolcalendar = pgTable("schoolcalendar", {
	calid: integer().primaryKey().notNull(),
	seasonid: smallint().notNull(),
	schooldate: timestamp({ precision: 3, mode: 'string' }),
	alternatename: varchar({ length: 200 }),
	description: varchar({ length: 2000 }),
	fontcolor: varchar({ length: 30 }).notNull(),
	backgroundcolor: varchar({ length: 30 }).notNull(),
	isbold: boolean().notNull(),
	active: boolean().notNull(),
	createby: varchar({ length: 100 }).notNull(),
	createon: timestamp({ precision: 3, mode: 'string' }).notNull(),
	updateby: varchar({ length: 100 }).notNull(),
	updateon: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "schoolcalendar_seasonid_seasons_seasonid_fk"
		}),
]);

export const studentscore = pgTable("studentscore", {
	scoreid: integer().primaryKey().notNull(),
	studentid: integer().notNull(),
	seasonid: smallint().notNull(),
	classid: integer().notNull(),
	factorid: integer().notNull(),
	islock: boolean().notNull(),
	lockby: integer(),
	lastlockupdateon: timestamp({ precision: 3, mode: 'string' }),
	ispublish: boolean().notNull(),
	lastpublishupdateon: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.studentid],
			foreignColumns: [student.studentid],
			name: "studentscore_studentid_student_studentid_fk"
		}),
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "studentscore_seasonid_seasons_seasonid_fk"
		}),
	foreignKey({
			columns: [table.classid],
			foreignColumns: [classes.classid],
			name: "studentscore_classid_classes_classid_fk"
		}),
	foreignKey({
			columns: [table.factorid],
			foreignColumns: [scorefactors.factorid],
			name: "studentscore_factorid_scorefactors_factorid_fk"
		}),
]);

export const scoredetail = pgTable("scoredetail", {
	scoredetailid: integer().primaryKey().notNull(),
	scoreid: integer().notNull(),
	score: numeric().notNull(),
	active: boolean().notNull(),
	createby: integer().notNull(),
	isteacher4Createby: boolean().notNull(),
	dateforscore: timestamp({ precision: 3, mode: 'string' }).notNull(),
	createon: timestamp({ precision: 3, mode: 'string' }).notNull(),
	updateby: integer().notNull(),
	isteacher4Updateby: boolean().notNull(),
	updateon: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.scoreid],
			foreignColumns: [studentscore.scoreid],
			name: "scoredetail_scoreid_studentscore_scoreid_fk"
		}),
]);

export const scorefactors = pgTable("scorefactors", {
	factorid: integer().primaryKey().notNull(),
	factorsequenceindex: numeric().notNull(),
	factornamecn: varchar({ length: 300 }).notNull(),
	factornamecnshort: varchar({ length: 100 }).notNull(),
	factornameen: varchar({ length: 300 }).notNull(),
	factornameenshort: varchar({ length: 100 }).notNull(),
	maxallowedrecord: integer().notNull(),
	weighting: numeric().notNull(),
	active: boolean().notNull(),
	istext: boolean().notNull(),
	description: varchar({ length: 2000 }),
	createby: integer().notNull(),
	createon: timestamp({ precision: 3, mode: 'string' }).notNull(),
	updateby: integer().notNull(),
	updateon: timestamp({ precision: 3, mode: 'string' }).notNull(),
});

export const studentscorecomment = pgTable("studentscorecomment", {
	scorecommentid: integer().primaryKey().notNull(),
	studentid: integer().notNull(),
	seasonid: smallint().notNull(),
	classid: integer().notNull(),
	teachercomment: varchar({ length: 2000 }),
	othercomment: varchar({ length: 2000 }),
	islock: boolean().notNull(),
	lockby: integer().notNull(),
	lockon: timestamp({ precision: 3, mode: 'string' }),
	updateby: integer().notNull(),
	updateon: timestamp({ precision: 3, mode: 'string' }),
	scoreid: integer(),
}, (table) => [
	foreignKey({
			columns: [table.studentid],
			foreignColumns: [student.studentid],
			name: "studentscorecomment_studentid_student_studentid_fk"
		}),
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "studentscorecomment_seasonid_seasons_seasonid_fk"
		}),
	foreignKey({
			columns: [table.classid],
			foreignColumns: [classes.classid],
			name: "studentscorecomment_classid_classes_classid_fk"
		}),
	foreignKey({
			columns: [table.scoreid],
			foreignColumns: [studentscore.scoreid],
			name: "studentscorecomment_scoreid_studentscore_scoreid_fk"
		}),
]);

export const studentscorefactor = pgTable("studentscorefactor", {
	scorefactorid: integer().primaryKey().notNull(),
	scoreid: integer().notNull(),
	factorid: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.scoreid],
			foreignColumns: [studentscore.scoreid],
			name: "studentscorefactor_scoreid_studentscore_scoreid_fk"
		}),
	foreignKey({
			columns: [table.factorid],
			foreignColumns: [scorefactors.factorid],
			name: "studentscorefactor_factorid_scorefactors_factorid_fk"
		}),
]);

export const studentscorerating = pgTable("studentscorerating", {
	scoreratingid: integer().primaryKey().notNull(),
	studentid: integer().notNull(),
	seasonid: smallint().notNull(),
	classid: integer().notNull(),
	ratingfactorid: integer().notNull(),
	ratingid: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentid],
			foreignColumns: [student.studentid],
			name: "studentscorerating_studentid_student_studentid_fk"
		}),
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "studentscorerating_seasonid_seasons_seasonid_fk"
		}),
	foreignKey({
			columns: [table.classid],
			foreignColumns: [classes.classid],
			name: "studentscorerating_classid_classes_classid_fk"
		}),
	foreignKey({
			columns: [table.ratingfactorid],
			foreignColumns: [scoreratingfactors.ratingfactorid],
			name: "studentscorerating_ratingfactorid_scoreratingfactors_ratingfact"
		}),
	foreignKey({
			columns: [table.ratingid],
			foreignColumns: [scorerating.ratingid],
			name: "studentscorerating_ratingid_scorerating_ratingid_fk"
		}),
]);

export const scoreratingfactors = pgTable("scoreratingfactors", {
	ratingfactorid: integer().primaryKey().notNull(),
	sequenceindex: numeric().notNull(),
	ratingfactornamecn: varchar({ length: 200 }).notNull(),
	ratingfactornameeng: varchar({ length: 300 }),
	active: boolean().notNull(),
	description: varchar({ length: 800 }),
});

export const scorerating = pgTable("scorerating", {
	ratingid: integer().primaryKey().notNull(),
	sequenceindex: numeric().notNull(),
	ratingnamecn: varchar({ length: 200 }).notNull(),
	ratingnameeng: varchar({ length: 300 }).notNull(),
	active: boolean().notNull(),
});

export const tempclass = pgTable("tempclass", {
	tempid: integer().primaryKey().generatedAlwaysAsIdentity({ name: "tempclass_tempid_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	classnamecn: varchar({ length: 255 }),
	classnameen: varchar({ length: 255 }),
	classindex: numeric(),
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
	tuitionW: numeric("tuition_w"),
	specialfeeW: numeric("specialfee_w"),
	bookfeeW: numeric("bookfee_w"),
	tuitionH: numeric("tuition_h"),
	specialfeeH: numeric("specialfee_h"),
	bookfeeH: numeric("bookfee_h"),
	isprocess: integer(),
}, (table) => [
	foreignKey({
			columns: [table.typeid],
			foreignColumns: [classtype.typeid],
			name: "tempclass_typeid_classtype_typeid_fk"
		}),
	foreignKey({
			columns: [table.seasonid],
			foreignColumns: [seasons.seasonid],
			name: "tempclass_seasonid_seasons_seasonid_fk"
		}),
	foreignKey({
			columns: [table.teacherid],
			foreignColumns: [teacher.teacherid],
			name: "tempclass_teacherid_teacher_teacherid_fk"
		}),
	foreignKey({
			columns: [table.roomid],
			foreignColumns: [classrooms.roomid],
			name: "tempclass_roomid_classrooms_roomid_fk"
		}),
	foreignKey({
			columns: [table.timeid],
			foreignColumns: [classtime.timeid],
			name: "tempclass_timeid_classtime_timeid_fk"
		}),
	foreignKey({
			columns: [table.suitableterm],
			foreignColumns: [suitableterm.termno],
			name: "tempclass_suitableterm_suitableterm_termno_fk"
		}),
]);

export const verificationToken = pgTable("verification_token", {
	identifier: text().notNull(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	token: text().notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verification_token_pkey"}),
]);
