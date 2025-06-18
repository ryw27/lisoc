import { serial, pgTable, smallint, varchar, integer, boolean, timestamp, numeric, bigint, char, primaryKey, foreignKey } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { AnyPgColumn } from "drizzle-orm/pg-core"

// Static table
export const adminrole = pgTable("adminrole", {
	roleid: smallint().notNull().primaryKey(),
	rolename: varchar({ length: 50 }).notNull().unique(),
	rolefullnameeng: varchar({ length: 100 }).notNull().unique(),
	rolefullnamecn: varchar({ length: 100 }).notNull().unique(),
	notes: varchar({ length: 250 }),
});

export const family = pgTable("family", {
	familyid: integer().notNull().primaryKey(),
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
	lastmodify: timestamp({ mode: 'string' }),
	lastlogin: timestamp({ mode: 'string' }),
	status: boolean().notNull(),
	remark: varchar({ length: 200 }),
	schoolmember: varchar({ length: 50 }),
});

// export const adminuser = pgTable("adminuser", {
// 	userid: integer().notNull().primaryKey(),
// 	username: varchar({ length: 50 }).notNull().unique(),
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
// 	familyid: integer().notNull().references(() => family.familyid),
// 	status: varchar({ length: 50 }).notNull(),
// 	ischangepwdnext: boolean().notNull(),
// 	createby: varchar({ length: 50 }),
// 	createon: timestamp({ mode: 'string' }),
// 	updateby: varchar({ length: 50 }),
// 	updateon: timestamp({ mode: 'string' }).notNull(),
// 	lastlogin: timestamp({ mode: 'string' }).notNull(),
// 	notes: varchar({ length: 2000 }),
// });

// Not needed
// export const adminuserrole = pgTable("adminuserrole", {
// 	userid: integer().notNull().references(() => adminuser.userid),
// 	roleid: smallint().notNull().references(() => adminrole.roleid),
// 	createby: varchar({ length: 50 }),
// 	createdate: timestamp({ mode: 'string' }).notNull(),
// 	updateby: varchar({ length: 50 }),
// 	lastupdatedate: timestamp({ mode: 'string' }).notNull(),
// }, (table) => ({
// 	pk: primaryKey({ columns: [table.userid, table.roleid] })
// }));

export const agerestriction = pgTable("agerestriction", {
	ageid: smallint().notNull().primaryKey(),
	description: varchar({ length: 100 }).notNull(),
	minage: smallint().notNull(),
	maxage: smallint().notNull(),
	status: boolean(),
});

// export const agelist = pgTable("agelist", {
// 	ageid: smallint().notNull().references(() => agerestriction.ageid),
// 	agelimit: smallint().notNull(),
// }, (table) => ({
// 	pk: primaryKey({ columns: [table.ageid, table.agelimit] })
// }));

export const seasons = pgTable("seasons", {
	seasonid: smallint().notNull().primaryKey(),
	seasonnamecn: varchar({ length: 100 }).notNull(),
	seasonnameeng: varchar({ length: 100 }),
	isspring: boolean().notNull(),
	relatedseasonid: integer().notNull(),
	beginseasonid: integer().notNull(),
	haslateregfee: boolean().notNull(),
	haslateregfee4newfamily: boolean().notNull(),
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
	open4register: boolean().notNull(),
	showadmissionnotice: boolean().notNull(),
	showteachername: boolean().notNull(),
	days4showteachername: smallint().notNull(),
	allownewfamilytoregister: boolean().notNull(),
	date4newfamilytoregister: timestamp({ mode: 'string' }).notNull(),
	notes: varchar({ length: 6000 }),
	createddate: timestamp({ mode: 'string' }),
	lastmodifieddate: timestamp({ mode: 'string' }),
	updateby: varchar({ length: 50 }),
});

// Static
export const classtype = pgTable("classtype", {
	typeid: smallint().notNull().primaryKey(),
	typenameen: varchar({ length: 100 }).notNull().unique(),
	typenamecn: varchar({ length: 100 }).notNull().unique(),
	ageofstudent: varchar({ length: 20 }).notNull(),
	ageid: smallint().notNull().references(() => agerestriction.ageid),
	typedescription: varchar({ length: 100 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	ischineseclass: boolean().notNull(),
	sortorder: integer().notNull(),
	isnofee: boolean().notNull(),
	isonline: boolean().notNull(),
});

export const classes = pgTable("classes", {
	classid: serial().notNull().primaryKey(),
	classindex: integer(), // TODO: Need this? Don't know what this is
	ageid: smallint().references(() => agerestriction.ageid),
	typeid: smallint().notNull().references(() => classtype.typeid),
	classno: integer().notNull(),
	classnamecn: varchar({ length: 50 }).notNull().unique(),
	classupid: integer().notNull().references((): AnyPgColumn => classes.classid),
	classnameen: varchar({ length: 100 }),
	sizelimits: integer(),
	status: varchar({ length: 20 }).notNull(),
	description: varchar({ length: 2000 }),
	lastmodify: timestamp({ precision: 3, mode: 'string' }),
	createby: varchar({ length: 100 }).notNull(),
	createon: timestamp({ precision: 3, mode: 'string' }).notNull(),
	updateby: varchar({ length: 100 }).notNull(),
	updateon: timestamp({ precision: 3, mode: 'string' }).notNull(),
});

// export const teacher = pgTable("teacher", {
// 	teacherid: integer().notNull().primaryKey(),
// 	namecn: varchar({ length: 50 }),
// 	username: varchar({ length: 50 }).notNull().unique(),
// 	password: varchar({ length: 100 }).notNull(),
// 	namelasten: varchar({ length: 50 }),
// 	namefirsten: varchar({ length: 50 }),
// 	teacherindex: integer(),
// 	classtypeid: smallint().references(() => classtype.typeid),
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
// 	familyid: integer().references(() => family.familyid),
// 	createby: varchar({ length: 50 }).notNull(),
// 	createon: timestamp({ mode: 'string' }),
// 	updateby: varchar({ length: 50 }).notNull(),
// 	updateon: timestamp({ mode: 'string' }),
// 	lastlogin: timestamp({ mode: 'string' }),
// });

export const classrooms = pgTable("classrooms", {
	roomid: smallint().notNull().primaryKey(),
	roomno: varchar({ length: 50 }).notNull(),
	roomcapacity: smallint().notNull(),
	status: varchar({ length: 20 }).notNull(),
	notes: varchar({ length: 200 }).notNull(),
});

// Static Table
export const classtime = pgTable("classtime", {
	timeid: smallint().notNull().primaryKey(),
	period: varchar({ length: 20 }).notNull(),
	timebegin: numeric().notNull(),
	timeend: numeric().notNull(),
	istwoperiod: varchar({ length: 20 }),
});

export const suitableterm = pgTable("suitableterm", {
	termno: smallint().notNull().primaryKey(),
	suitableterm: varchar({ length: 30 }),
	suitabletermcn: varchar({ length: 30 }),
	description: varchar({ length: 100 }),
});

export const arrangement = pgTable("arrangement", {
	arrangeid: integer().notNull().primaryKey(),
	seasonid: smallint().notNull().references(() => seasons.seasonid),
	classid: integer().notNull().references(() => classes.classid),
	teacherid: integer().notNull(), // Redo
	roomid: smallint().notNull().references(() => classrooms.roomid),
	timeid: smallint().notNull().references(() => classtime.timeid),
	seatlimit: smallint(),
	agelimit: smallint(),
	suitableterm: smallint().notNull().references(() => suitableterm.termno),
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
});

export const student = pgTable("student", {
	studentid: integer().notNull().primaryKey(),
	familyid: integer().notNull().references(() => family.familyid),
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
});

export const regstatus = pgTable("regstatus", {
	regstatusid: smallint().notNull().primaryKey(),
	regstatus: varchar({ length: 50 }),
	status: varchar({ length: 100 }),
});

export const familybalancestatus = pgTable("familybalancestatus", {
	statusid: smallint().notNull().primaryKey(),
	statusen: varchar({ length: 60 }),
	statuscn: varchar({ length: 60 }),
});

export const familybalancetype = pgTable("familybalancetype", {
	typeid: smallint().notNull().primaryKey(),
	typenameen: varchar({ length: 60 }),
	typenamecn: varchar({ length: 60 }),
	isminusvalue: boolean().notNull(),
	isshow: boolean().notNull(),
});

export const classregistration = pgTable("classregistration", {
	regid: bigint({ mode: "number" }).notNull().primaryKey(),
	appliedid: integer(),
	studentid: integer().notNull().references(() => student.studentid),
	arrangeid: integer().notNull().references(() => arrangement.arrangeid),
	seasonid: smallint().references(() => seasons.seasonid),
	isyearclass: boolean().notNull(),
	classid: integer().notNull().references(() => classes.classid),
	registerdate: timestamp({ mode: 'string' }).notNull(),
	statusid: smallint().notNull().references(() => regstatus.regstatusid),
	previousstatusid: smallint().notNull().references(() => regstatus.regstatusid),
	familybalanceid: integer().references(() => familybalance.balanceid),
	familyid: integer().notNull().references(() => family.familyid),
	newbalanceid: integer().references(() => familybalance.balanceid),
	isdropspring: boolean().notNull(),
	byadmin: boolean(),
	userid: varchar({ length: 100 }),
	lastmodify: timestamp({ mode: 'string' }).notNull(),
	notes: varchar({ length: 500 }),
});

export const familybalance = pgTable("familybalance", {
	balanceid: integer().notNull().primaryKey(),
	appliedid: integer().notNull(),
	appliedregid: integer().notNull(),
	seasonid: smallint().notNull().references(() => seasons.seasonid),
	familyid: integer().notNull().references(() => family.familyid),
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
	typeid: smallint().notNull().references(() => familybalancetype.typeid),
	statusid: smallint().notNull().references(() => familybalancestatus.statusid),
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
});

export const familybalanceSave = pgTable("familybalance_save", {
	balanceid: integer().notNull().primaryKey(),
	appliedid: integer().notNull(),
	appliedregid: integer().notNull(),
	seasonid: smallint().notNull().references(() => seasons.seasonid),
	familyid: integer().notNull().references(() => family.familyid),
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
	typeid: smallint().notNull().references(() => familybalancetype.typeid),
	statusid: smallint().notNull().references(() => familybalancestatus.statusid),
	checkno: varchar({ length: 50 }),
	transactionno: varchar({ length: 20 }),
	isonlinepayment: boolean(),
	registerdate: timestamp({ mode: 'string' }).notNull(),
	lastmodify: timestamp({ mode: 'string' }).notNull(),
	paiddate: timestamp({ mode: 'string' }).notNull(),
	reference: varchar({ length: 50 }),
	notes: varchar({ length: 250 }),
	userid: varchar({ length: 100 }),
});

export const dutycommittee = pgTable("dutycommittee", {
	dcid: integer().notNull().primaryKey(),
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

export const dutystatus = pgTable("dutystatus", {
	dutystatusid: smallint().notNull().primaryKey(),
	dutystatuscn: varchar({ length: 50 }),
	dutystatus: varchar({ length: 50 }).notNull(),
	active: boolean().notNull(),
});

export const dutyassignment = pgTable("dutyassignment", {
	dutyassignid: integer().notNull().primaryKey(),
	familyid: integer().notNull().references(() => family.familyid),
	studentid: integer().references(() => student.studentid),
	seasonid: smallint().references(() => seasons.seasonid),
	dutydate: timestamp({ mode: 'string' }).notNull(),
	dutystatus: smallint().notNull().references(() => dutystatus.dutystatusid),
	createddate: timestamp({ mode: 'string' }).notNull(),
	lastmodify: timestamp({ mode: 'string' }).notNull(),
	note: varchar({ length: 150 }),
	pdid: integer().references(() => parentdutyPb.pdid),
	ischarged: boolean(),
});

export const parentdutyPb = pgTable("parentduty_pb", {
	pdid: integer().notNull().primaryKey(),
	familyid: integer().notNull().references(() => family.familyid),
	studentid: integer().notNull().references(() => student.studentid),
	committeeid: integer().notNull().references(() => dutycommittee.dcid),
	seasonid: integer().notNull().references(() => seasons.seasonid),
	selecteddutydate: timestamp({ precision: 3, mode: 'string' }),
	ischangebyadmin: boolean().notNull(),
	scheduleddutydate: timestamp({ precision: 3, mode: 'string' }).notNull(),
	previouscommitteeid: integer().notNull(),
	regdate: timestamp({ precision: 3, mode: 'string' }).notNull(),
	lastupdated: timestamp({ precision: 3, mode: 'string' }).notNull(),
});

export const errorlog = pgTable("errorlog", {
	id: integer().notNull().primaryKey(),
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

export const feedback = pgTable("feedback", {
	recid: integer().notNull().primaryKey(),
	familyid: integer().references(() => family.familyid),
	name: varchar({ length: 100 }),
	phone: char({ length: 15 }),
	email: varchar({ length: 100 }),
	comment: varchar({ length: 2000 }),
	postdate: timestamp({ mode: 'string' }),
	followup: varchar({ length: 250 }),
});

export const feelist = pgTable("feelist", {
	feelistid: integer().notNull().primaryKey(),
	seasonid: integer().notNull().references(() => seasons.seasonid),
	feeid: integer().notNull(),
	feename: varchar({ length: 50 }),
	feenameen: varchar({ length: 50 }),
	feeamount: numeric(),
	notes: varchar({ length: 250 }),
});

// Probably not needed
// export const menu = pgTable("menu", {
// 	menuid: integer().primaryKey(),
// 	menunameen: varchar({ length: 50 }),
// 	menunamecn: varchar({ length: 50 }),
// 	menuurlen: varchar({ length: 50 }),
// 	menuurlcn: varchar({ length: 50 }),
// 	menuorder: integer(),
// 	parentid: integer(),
// 	isactive: integer(),
// 	isinmainpage: integer(),
// 	datatype: varchar({ length: 20 }),
// 	remarks: varchar({ length: 200 }),
// }, (table) => ({
// 	parentRef: foreignKey({
// 		columns: [table.parentid],
// 		foreignColumns: [table.menuid],
// 	}),
// }));

export const paypalrecord = pgTable("paypalrecord", {
	pid: integer().notNull().primaryKey(),
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
	importid: integer().notNull().primaryKey(),
	regnum: varchar({ length: 50 }).notNull(),
	transfee: varchar({ length: 50 }).notNull(),
	paidamount: varchar({ length: 50 }).notNull(),
	paypalstatus: varchar({ length: 250 }),
	counterpartystatus: varchar({ length: 250 }),
	transactionid: varchar({ length: 50 }),
	paiddate: varchar({ length: 50 }).notNull(),
	updateby: varchar({ length: 50 }),
});

export const requeststatus = pgTable("requeststatus", {
	reqstatusid: smallint().notNull().primaryKey(),
	reqstatus: varchar({ length: 50 }),
	reqstatuscn: varchar({ length: 50 }),
});

export const regchangerequest = pgTable("regchangerequest", {
	requestid: integer().notNull().primaryKey(),
	regid: bigint({ mode: "number" }).notNull().references(() => classregistration.regid),
	appliedid: integer(),
	studentid: integer().notNull().references(() => student.studentid),
	seasonid: smallint().references(() => seasons.seasonid),
	isyearclass: boolean().notNull(),
	relatedseasonid: smallint().references(() => seasons.seasonid),
	classid: integer().notNull().references(() => classes.classid),
	registerdate: timestamp({ mode: 'string' }),
	oriregstatusid: smallint().notNull().references(() => regstatus.regstatusid),
	regstatusid: smallint().notNull().references(() => regstatus.regstatusid),
	reqstatusid: smallint().notNull().references(() => requeststatus.reqstatusid),
	familybalanceid: integer().references(() => familybalance.balanceid),
	familyid: integer().references(() => family.familyid),
	otherfee: numeric(),
	newbalanceid: integer().references(() => familybalance.balanceid),
	submitdate: timestamp({ precision: 3, mode: 'string' }),
	processdate: timestamp({ precision: 3, mode: 'string' }),
	lastmodify: timestamp({ precision: 3, mode: 'string' }).notNull(),
	notes: varchar({ length: 500 }),
	adminmemo: varchar({ length: 500 }),
	adminuserid: varchar({ length: 50 }),
});

export const schoolcalendar = pgTable("schoolcalendar", {
	calid: integer().notNull().primaryKey(),
	seasonid: smallint().notNull().references(() => seasons.seasonid),
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
});

export const scorecode = pgTable("scorecode", {
	codeid: integer().notNull().primaryKey(),
	codenameeng: varchar({ length: 50 }),
	codenamecn: varchar({ length: 50 }),
});

export const scorefactors = pgTable("scorefactors", {
	factorid: integer().notNull().primaryKey(),
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



// ---------------------------------------------------------------------------------------------------------------------------------------------
//  Everything under here is basically useless right now 
// ---------------------------------------------------------------------------------------------------------------------------------------------


export const studentscore = pgTable("studentscore", {
	scoreid: integer().notNull().primaryKey(),
	studentid: integer().notNull().references(() => student.studentid),
	seasonid: smallint().notNull().references(() => seasons.seasonid),
	classid: integer().notNull().references(() => classes.classid),
	factorid: integer().notNull().references(() => scorefactors.factorid),
	islock: boolean().notNull(),
	lockby: integer(),
	lastlockupdateon: timestamp({ precision: 3, mode: 'string' }),
	ispublish: boolean().notNull(),
	lastpublishupdateon: timestamp({ precision: 3, mode: 'string' }),
});

export const scoredetail = pgTable("scoredetail", {
	scoredetailid: integer().notNull().primaryKey(),
	scoreid: integer().notNull().references(() => studentscore.scoreid),
	score: numeric().notNull(),
	active: boolean().notNull(),
	createby: integer().notNull(),
	isteacher4Createby: boolean().notNull(),
	dateforscore: timestamp({ precision: 3, mode: 'string' }).notNull(),
	createon: timestamp({ precision: 3, mode: 'string' }).notNull(),
	updateby: integer().notNull(),
	isteacher4Updateby: boolean().notNull(),
	updateon: timestamp({ precision: 3, mode: 'string' }).notNull(),
});

export const scorerating = pgTable("scorerating", {
	ratingid: integer().notNull().primaryKey(),
	sequenceindex: numeric().notNull(),
	ratingnamecn: varchar({ length: 200 }).notNull(),
	ratingnameeng: varchar({ length: 300 }).notNull(),
	active: boolean().notNull(),
});

export const scoreratingfactors = pgTable("scoreratingfactors", {
	ratingfactorid: integer().notNull().primaryKey(),
	sequenceindex: numeric().notNull(),
	ratingfactornamecn: varchar({ length: 200 }).notNull(),
	ratingfactornameeng: varchar({ length: 300 }),
	active: boolean().notNull(),
	description: varchar({ length: 800 }),
});

export const studentscorecomment = pgTable("studentscorecomment", {
	scorecommentid: integer().notNull().primaryKey(),
	studentid: integer().notNull().references(() => student.studentid),
	seasonid: smallint().notNull().references(() => seasons.seasonid),
	classid: integer().notNull().references(() => classes.classid),
	teachercomment: varchar({ length: 2000 }),
	othercomment: varchar({ length: 2000 }),
	islock: boolean().notNull(),
	lockby: integer().notNull(),
	lockon: timestamp({ precision: 3, mode: 'string' }),
	updateby: integer().notNull(),
	updateon: timestamp({ precision: 3, mode: 'string' }),
	scoreid: integer().references(() => studentscore.scoreid),
});

export const studentscorefactor = pgTable("studentscorefactor", {
	scorefactorid: integer().notNull().primaryKey(),
	scoreid: integer().notNull().references(() => studentscore.scoreid),
	factorid: integer().notNull().references(() => scorefactors.factorid),
});

export const studentscorerating = pgTable("studentscorerating", {
	scoreratingid: integer().notNull().primaryKey(),
	studentid: integer().notNull().references(() => student.studentid),
	seasonid: smallint().notNull().references(() => seasons.seasonid),
	classid: integer().notNull().references(() => classes.classid),
	ratingfactorid: integer().notNull().references(() => scoreratingfactors.ratingfactorid),
	ratingid: integer().notNull().references(() => scorerating.ratingid),
});

export const seatnum = pgTable("seatnum", {
	seatid: integer().notNull().primaryKey(),
	seatnum: integer().notNull(),
});

export const supports = pgTable("supports", {
	catid: integer().notNull().primaryKey(),
	catnamecn: varchar({ length: 50 }).notNull(),
	catnameeng: varchar({ length: 100 }).notNull(),
	description: varchar({ length: 400 }),
	status: boolean().notNull(),
});

export const tempclass = pgTable("tempclass", {
	tempid: integer().notNull().primaryKey().generatedAlwaysAsIdentity(),
	classnamecn: varchar({ length: 255 }),
	classnameen: varchar({ length: 255 }),
	classindex: numeric(),
	typeid: integer().references(() => classtype.typeid),
	classno: integer(),
	status: varchar({ length: 255 }),
	description: varchar({ length: 255 }),
	createby: varchar({ length: 255 }),
	seasonid: integer().references(() => seasons.seasonid),
	teacherid: integer(), // redo
	roomid: integer().references(() => classrooms.roomid),
	timeid: integer().references(() => classtime.timeid),
	seatlimit: integer(),
	agelimit: integer(),
	suitableterm: integer().references(() => suitableterm.termno),
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
});
