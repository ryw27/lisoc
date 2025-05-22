import { pgTable, smallint, varchar, integer, boolean, timestamp, numeric, bigint, char } from "drizzle-orm/pg-core"



export const adminrole = pgTable("adminrole", {
	roleid: smallint().notNull(),
	rolename: varchar({ length: 50 }).notNull(),
	rolefullnameeng: varchar({ length: 100 }).notNull(),
	rolefullnamecn: varchar({ length: 100 }).notNull(),
	notes: varchar({ length: 250 }),
});

export const adminuser = pgTable("adminuser", {
	userid: integer().notNull(),
	username: varchar({ length: 50 }).notNull(),
	password: varchar({ length: 100 }).notNull(),
	namecn: varchar({ length: 50 }),
	firstname: varchar({ length: 50 }),
	lastname: varchar({ length: 50 }),
	address: varchar({ length: 100 }),
	address1: varchar({ length: 100 }),
	city: varchar({ length: 50 }),
	state: varchar({ length: 4 }),
	zip: varchar({ length: 10 }),
	email: varchar({ length: 100 }),
	phone: varchar({ length: 20 }),
	familyid: integer().notNull(),
	status: varchar({ length: 50 }).notNull(),
	ischangepwdnext: boolean().notNull(),
	createby: varchar({ length: 50 }),
	createon: timestamp({ mode: 'string' }),
	updateby: varchar({ length: 50 }),
	updateon: timestamp({ mode: 'string' }).notNull(),
	lastlogin: timestamp({ mode: 'string' }).notNull(),
	notes: varchar({ length: 2000 }),
});

export const adminuserrole = pgTable("adminuserrole", {
	userid: integer().notNull(),
	roleid: smallint().notNull(),
	createby: varchar({ length: 50 }),
	createdate: timestamp({ mode: 'string' }).notNull(),
	updateby: varchar({ length: 50 }),
	lastupdatedate: timestamp({ mode: 'string' }).notNull(),
});

export const agelist = pgTable("agelist", {
	ageid: smallint().notNull(),
	agelimit: smallint().notNull(),
});

export const agerestriction = pgTable("agerestriction", {
	ageid: smallint().notNull(),
	description: varchar({ length: 100 }),
	minage: smallint(),
	maxage: smallint(),
	status: boolean(),
});

export const arrangement = pgTable("arrangement", {
	arrangeid: integer().notNull(),
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
});

export const classes = pgTable("classes", {
	classid: integer().notNull(),
	classindex: numeric(),
	ageid: smallint(),
	typeid: smallint().notNull(),
	classno: numeric().notNull(),
	classnamecn: varchar({ length: 50 }).notNull(),
	classupid: integer().notNull(),
	classnameen: varchar({ length: 100 }),
	sizelimits: integer(),
	status: varchar({ length: 20 }),
	description: varchar({ length: 2000 }),
	lastmodify: timestamp({ precision: 3, mode: 'string' }),
	createby: varchar({ length: 100 }).notNull(),
	createon: timestamp({ precision: 3, mode: 'string' }).notNull(),
	updateby: varchar({ length: 100 }).notNull(),
	updateon: timestamp({ precision: 3, mode: 'string' }).notNull(),
});

export const classregistration = pgTable("classregistration", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	regid: bigint({ mode: "number" }).notNull(),
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
});

export const classrooms = pgTable("classrooms", {
	roomid: smallint().notNull(),
	roomno: varchar({ length: 50 }).notNull(),
	roomcapacity: smallint().notNull(),
	status: varchar({ length: 20 }).notNull(),
	notes: varchar({ length: 200 }).notNull(),
});

export const classtype = pgTable("classtype", {
	typeid: smallint().notNull(),
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
});

export const dutyassignment = pgTable("dutyassignment", {
	dutyassignid: integer().notNull(),
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
});

export const dutycommittee = pgTable("dutycommittee", {
	dcid: integer().notNull(),
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
	dutystatusid: smallint().notNull(),
	dutystatuscn: varchar({ length: 50 }),
	dutystatus: varchar({ length: 50 }).notNull(),
	active: boolean().notNull(),
});

export const errorlog = pgTable("errorlog", {
	id: integer().notNull(),
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

export const family = pgTable("family", {
	familyid: integer().notNull(),
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

export const familybalance = pgTable("familybalance", {
	balanceid: integer().notNull(),
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
});

export const familybalanceSave = pgTable("familybalance_save", {
	balanceid: integer().notNull(),
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
});

export const familybalancestatus = pgTable("familybalancestatus", {
	statusid: smallint().notNull(),
	statusen: varchar({ length: 60 }),
	statuscn: varchar({ length: 60 }),
});

export const familybalancetype = pgTable("familybalancetype", {
	typeid: smallint().notNull(),
	typenameen: varchar({ length: 60 }),
	typenamecn: varchar({ length: 60 }),
	isminusvalue: boolean().notNull(),
	isshow: boolean().notNull(),
});

export const feedback = pgTable("feedback", {
	recid: integer().notNull(),
	familyid: integer(),
	name: varchar({ length: 100 }),
	phone: char({ length: 15 }),
	email: varchar({ length: 100 }),
	comment: varchar({ length: 2000 }),
	postdate: timestamp({ mode: 'string' }),
	followup: varchar({ length: 250 }),
});

export const feelist = pgTable("feelist", {
	feelistid: integer().notNull(),
	seasonid: integer().notNull(),
	feeid: integer().notNull(),
	feename: varchar({ length: 50 }),
	feenameen: varchar({ length: 50 }),
	feeamount: numeric(),
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

export const parentdutyPb = pgTable("parentduty_pb", {
	pdid: integer().notNull(),
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
});

export const paypalrecord = pgTable("paypalrecord", {
	pid: integer().notNull(),
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
	regnum: varchar({ length: 50 }).notNull(),
	transfee: varchar({ length: 50 }).notNull(),
	paidamount: varchar({ length: 50 }).notNull(),
	paypalstatus: varchar({ length: 250 }),
	counterpartystatus: varchar({ length: 250 }),
	transactionid: varchar({ length: 50 }),
	paiddate: varchar({ length: 50 }).notNull(),
	updateby: varchar({ length: 50 }),
});

export const regchangerequest = pgTable("regchangerequest", {
	requestid: integer().notNull(),
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
});

export const regstatus = pgTable("regstatus", {
	regstatusid: smallint().notNull(),
	regstatus: varchar({ length: 50 }),
	status: varchar({ length: 100 }),
});

export const requeststatus = pgTable("requeststatus", {
	reqstatusid: smallint().notNull(),
	reqstatus: varchar({ length: 50 }),
	reqstatuscn: varchar({ length: 50 }),
});

export const schoolcalendar = pgTable("schoolcalendar", {
	calid: integer().notNull(),
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
});

export const scorecode = pgTable("scorecode", {
	codeid: integer().notNull(),
	codenameeng: varchar({ length: 50 }),
	codenamecn: varchar({ length: 50 }),
});

export const scoredetail = pgTable("scoredetail", {
	scoredetailid: integer().notNull(),
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
});

export const scorefactors = pgTable("scorefactors", {
	factorid: integer().notNull(),
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

export const scorerating = pgTable("scorerating", {
	ratingid: integer().notNull(),
	sequenceindex: numeric().notNull(),
	ratingnamecn: varchar({ length: 200 }).notNull(),
	ratingnameeng: varchar({ length: 300 }).notNull(),
	active: boolean().notNull(),
});

export const scoreratingfactors = pgTable("scoreratingfactors", {
	ratingfactorid: integer().notNull(),
	sequenceindex: numeric().notNull(),
	ratingfactornamecn: varchar({ length: 200 }).notNull(),
	ratingfactornameeng: varchar({ length: 300 }),
	active: boolean().notNull(),
	description: varchar({ length: 800 }),
});

export const seasons = pgTable("seasons", {
	seasonid: smallint().notNull(),
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

export const seatnum = pgTable("seatnum", {
	seatid: integer().notNull(),
	seatnum: integer().notNull(),
});

export const sessions = pgTable("sessions", {
	timeid: smallint().notNull(),
	period: varchar({ length: 20 }).notNull(),
	timebegin: numeric().notNull(),
	timeend: numeric().notNull(),
	istwoperiod: varchar({ length: 20 }),
});

export const student = pgTable("student", {
	studentid: integer().notNull(),
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
});

export const studentscore = pgTable("studentscore", {
	scoreid: integer().notNull(),
	studentid: integer().notNull(),
	seasonid: smallint().notNull(),
	classid: integer().notNull(),
	factorid: integer().notNull(),
	islock: boolean().notNull(),
	lockby: integer(),
	lastlockupdateon: timestamp({ precision: 3, mode: 'string' }),
	ispublish: boolean().notNull(),
	lastpublishupdateon: timestamp({ precision: 3, mode: 'string' }),
});

export const studentscorecomment = pgTable("studentscorecomment", {
	scorecommentid: integer().notNull(),
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
});

export const studentscorefactor = pgTable("studentscorefactor", {
	scorefactorid: integer().notNull(),
	scoreid: integer().notNull(),
	factorid: integer().notNull(),
});

export const studentscorerating = pgTable("studentscorerating", {
	scoreratingid: integer().notNull(),
	studentid: integer().notNull(),
	seasonid: smallint().notNull(),
	classid: integer().notNull(),
	ratingfactorid: integer().notNull(),
	ratingid: integer().notNull(),
});

export const suitableterm = pgTable("suitableterm", {
	termno: smallint().notNull(),
	suitableterm: varchar({ length: 30 }),
	suitabletermcn: varchar({ length: 30 }),
	description: varchar({ length: 100 }),
});

export const supports = pgTable("supports", {
	catid: integer().notNull(),
	catnamecn: varchar({ length: 50 }).notNull(),
	catnameeng: varchar({ length: 100 }).notNull(),
	description: varchar({ length: 400 }),
	status: boolean().notNull(),
});

export const teacher = pgTable("teacher", {
	teacherid: integer().notNull(),
	namecn: varchar({ length: 50 }),
	username: varchar({ length: 50 }),
	password: varchar({ length: 100 }),
	namelasten: varchar({ length: 50 }),
	namefirsten: varchar({ length: 50 }),
	teacherindex: integer(),
	classtypeid: smallint(),
	status: varchar({ length: 50 }).notNull(),
	ischangepwdnext: boolean(),
	address: varchar({ length: 100 }),
	address1: varchar({ length: 100 }),
	city: varchar({ length: 50 }),
	state: varchar({ length: 4 }),
	zip: varchar({ length: 10 }),
	phone: varchar({ length: 20 }),
	email: varchar({ length: 100 }),
	subject: varchar({ length: 20 }),
	profile: varchar({ length: 2000 }),
	familyid: integer(),
	createby: varchar({ length: 50 }).notNull(),
	createon: timestamp({ mode: 'string' }),
	updateby: varchar({ length: 50 }).notNull(),
	updateon: timestamp({ mode: 'string' }),
	lastlogin: timestamp({ mode: 'string' }),
});

export const tempclass = pgTable("tempclass", {
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
});
