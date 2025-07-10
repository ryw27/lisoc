import { relations } from "drizzle-orm/relations";
import { users, family, teacher, adminuser, classtype, classes, arrangement, legacyTeacher, classrooms, seasons, classtime, agerestriction, classregistration, legacyFamily, regstatus, student, dutyassignment, dutystatus, familybalance, familybalancestatus, familybalancetype, parentdutyPb, schoolcalendar, studentscore, scorefactors, studentscorefactor, legacyAdminuser, studentscorecomment, studentscorerating, scoreratingfactors, scorerating, regchangerequest, requeststatus, adminuserrole, adminrole } from "../../app/lib/db/schema";

export const familyRelations = relations(family, ({one, many}) => ({
	user: one(users, {
		fields: [family.userid],
		references: [users.id]
	}),
	classregistrations: many(classregistration),
	dutyassignments: many(dutyassignment),
	familybalances: many(familybalance),
	students: many(student),
	regchangerequests: many(regchangerequest),
}));

export const usersRelations = relations(users, ({many}) => ({
	families: many(family),
	teachers: many(teacher),
	adminusers: many(adminuser),
}));

export const teacherRelations = relations(teacher, ({one, many}) => ({
	user: one(users, {
		fields: [teacher.userid],
		references: [users.id]
	}),
	arrangements: many(arrangement),
}));

export const adminuserRelations = relations(adminuser, ({one, many}) => ({
	user: one(users, {
		fields: [adminuser.userid],
		references: [users.id]
	}),
	adminuserroles: many(adminuserrole),
}));

export const classesRelations = relations(classes, ({one, many}) => ({
	classtype: one(classtype, {
		fields: [classes.typeid],
		references: [classtype.typeid]
	}),
	arrangements: many(arrangement),
	classregistrations: many(classregistration),
	studentscores: many(studentscore),
	studentscorecomments: many(studentscorecomment),
	studentscoreratings: many(studentscorerating),
}));

export const classtypeRelations = relations(classtype, ({one, many}) => ({
	classes: many(classes),
	agerestriction: one(agerestriction, {
		fields: [classtype.ageid],
		references: [agerestriction.ageid]
	}),
}));

export const arrangementRelations = relations(arrangement, ({one}) => ({
	teacher: one(teacher, {
		fields: [arrangement.teacherid],
		references: [teacher.teacherid]
	}),
	legacyTeacher: one(legacyTeacher, {
		fields: [arrangement.teacherid],
		references: [legacyTeacher.teacherid]
	}),
	class: one(classes, {
		fields: [arrangement.classid],
		references: [classes.classid]
	}),
	classroom: one(classrooms, {
		fields: [arrangement.roomid],
		references: [classrooms.roomid]
	}),
	season: one(seasons, {
		fields: [arrangement.seasonid],
		references: [seasons.seasonid]
	}),
	classtime: one(classtime, {
		fields: [arrangement.timeid],
		references: [classtime.timeid]
	}),
}));

export const legacyTeacherRelations = relations(legacyTeacher, ({many}) => ({
	arrangements: many(arrangement),
}));

export const classroomsRelations = relations(classrooms, ({many}) => ({
	arrangements: many(arrangement),
}));

export const seasonsRelations = relations(seasons, ({many}) => ({
	arrangements: many(arrangement),
	classregistrations: many(classregistration),
	dutyassignments: many(dutyassignment),
	familybalances: many(familybalance),
	parentdutyPbs: many(parentdutyPb),
	schoolcalendars: many(schoolcalendar),
	studentscores: many(studentscore),
	studentscorecomments: many(studentscorecomment),
	studentscoreratings: many(studentscorerating),
	regchangerequests: many(regchangerequest),
}));

export const classtimeRelations = relations(classtime, ({many}) => ({
	arrangements: many(arrangement),
}));

export const agerestrictionRelations = relations(agerestriction, ({many}) => ({
	classtypes: many(classtype),
}));

export const classregistrationRelations = relations(classregistration, ({one}) => ({
	family: one(family, {
		fields: [classregistration.familyid],
		references: [family.familyid]
	}),
	legacyFamily: one(legacyFamily, {
		fields: [classregistration.familyid],
		references: [legacyFamily.familyid]
	}),
	class: one(classes, {
		fields: [classregistration.classid],
		references: [classes.classid]
	}),
	season: one(seasons, {
		fields: [classregistration.seasonid],
		references: [seasons.seasonid]
	}),
	regstatus: one(regstatus, {
		fields: [classregistration.statusid],
		references: [regstatus.regstatusid]
	}),
	student: one(student, {
		fields: [classregistration.studentid],
		references: [student.studentid]
	}),
}));

export const legacyFamilyRelations = relations(legacyFamily, ({many}) => ({
	classregistrations: many(classregistration),
	dutyassignments: many(dutyassignment),
	familybalances: many(familybalance),
	students: many(student),
	regchangerequests: many(regchangerequest),
}));

export const regstatusRelations = relations(regstatus, ({many}) => ({
	classregistrations: many(classregistration),
	regchangerequests_oriregstatusid: many(regchangerequest, {
		relationName: "regchangerequest_oriregstatusid_regstatus_regstatusid"
	}),
	regchangerequests_regstatusid: many(regchangerequest, {
		relationName: "regchangerequest_regstatusid_regstatus_regstatusid"
	}),
}));

export const studentRelations = relations(student, ({one, many}) => ({
	classregistrations: many(classregistration),
	dutyassignments: many(dutyassignment),
	family: one(family, {
		fields: [student.familyid],
		references: [family.familyid]
	}),
	legacyFamily: one(legacyFamily, {
		fields: [student.familyid],
		references: [legacyFamily.familyid]
	}),
	studentscorecomments: many(studentscorecomment),
	studentscoreratings: many(studentscorerating),
	regchangerequests: many(regchangerequest),
}));

export const dutyassignmentRelations = relations(dutyassignment, ({one}) => ({
	family: one(family, {
		fields: [dutyassignment.familyid],
		references: [family.familyid]
	}),
	legacyFamily: one(legacyFamily, {
		fields: [dutyassignment.familyid],
		references: [legacyFamily.familyid]
	}),
	dutystatus: one(dutystatus, {
		fields: [dutyassignment.dutystatus],
		references: [dutystatus.dutystatusid]
	}),
	season: one(seasons, {
		fields: [dutyassignment.seasonid],
		references: [seasons.seasonid]
	}),
	student: one(student, {
		fields: [dutyassignment.studentid],
		references: [student.studentid]
	}),
}));

export const dutystatusRelations = relations(dutystatus, ({many}) => ({
	dutyassignments: many(dutyassignment),
}));

export const familybalanceRelations = relations(familybalance, ({one}) => ({
	family: one(family, {
		fields: [familybalance.familyid],
		references: [family.familyid]
	}),
	legacyFamily: one(legacyFamily, {
		fields: [familybalance.familyid],
		references: [legacyFamily.familyid]
	}),
	season: one(seasons, {
		fields: [familybalance.seasonid],
		references: [seasons.seasonid]
	}),
	familybalancestatus: one(familybalancestatus, {
		fields: [familybalance.statusid],
		references: [familybalancestatus.statusid]
	}),
	familybalancetype: one(familybalancetype, {
		fields: [familybalance.typeid],
		references: [familybalancetype.typeid]
	}),
}));

export const familybalancestatusRelations = relations(familybalancestatus, ({many}) => ({
	familybalances: many(familybalance),
}));

export const familybalancetypeRelations = relations(familybalancetype, ({many}) => ({
	familybalances: many(familybalance),
}));

export const parentdutyPbRelations = relations(parentdutyPb, ({one}) => ({
	season: one(seasons, {
		fields: [parentdutyPb.seasonid],
		references: [seasons.seasonid]
	}),
}));

export const schoolcalendarRelations = relations(schoolcalendar, ({one}) => ({
	season: one(seasons, {
		fields: [schoolcalendar.seasonid],
		references: [seasons.seasonid]
	}),
}));

export const studentscoreRelations = relations(studentscore, ({one, many}) => ({
	class: one(classes, {
		fields: [studentscore.classid],
		references: [classes.classid]
	}),
	season: one(seasons, {
		fields: [studentscore.seasonid],
		references: [seasons.seasonid]
	}),
	studentscorefactors: many(studentscorefactor),
	studentscorecomments: many(studentscorecomment),
}));

export const studentscorefactorRelations = relations(studentscorefactor, ({one}) => ({
	scorefactor: one(scorefactors, {
		fields: [studentscorefactor.factorid],
		references: [scorefactors.factorid]
	}),
	studentscore: one(studentscore, {
		fields: [studentscorefactor.scoreid],
		references: [studentscore.scoreid]
	}),
}));

export const scorefactorsRelations = relations(scorefactors, ({one, many}) => ({
	studentscorefactors: many(studentscorefactor),
	legacyAdminuser_createby: one(legacyAdminuser, {
		fields: [scorefactors.createby],
		references: [legacyAdminuser.userid],
		relationName: "scorefactors_createby_legacyAdminuser_userid"
	}),
	legacyAdminuser_updateby: one(legacyAdminuser, {
		fields: [scorefactors.updateby],
		references: [legacyAdminuser.userid],
		relationName: "scorefactors_updateby_legacyAdminuser_userid"
	}),
}));

export const legacyAdminuserRelations = relations(legacyAdminuser, ({many}) => ({
	scorefactors_createby: many(scorefactors, {
		relationName: "scorefactors_createby_legacyAdminuser_userid"
	}),
	scorefactors_updateby: many(scorefactors, {
		relationName: "scorefactors_updateby_legacyAdminuser_userid"
	}),
	adminuserroles: many(adminuserrole),
}));

export const studentscorecommentRelations = relations(studentscorecomment, ({one}) => ({
	class: one(classes, {
		fields: [studentscorecomment.classid],
		references: [classes.classid]
	}),
	studentscore: one(studentscore, {
		fields: [studentscorecomment.scoreid],
		references: [studentscore.scoreid]
	}),
	season: one(seasons, {
		fields: [studentscorecomment.seasonid],
		references: [seasons.seasonid]
	}),
	student: one(student, {
		fields: [studentscorecomment.studentid],
		references: [student.studentid]
	}),
}));

export const studentscoreratingRelations = relations(studentscorerating, ({one}) => ({
	class: one(classes, {
		fields: [studentscorerating.classid],
		references: [classes.classid]
	}),
	scoreratingfactor: one(scoreratingfactors, {
		fields: [studentscorerating.ratingfactorid],
		references: [scoreratingfactors.ratingfactorid]
	}),
	scorerating: one(scorerating, {
		fields: [studentscorerating.ratingid],
		references: [scorerating.ratingid]
	}),
	season: one(seasons, {
		fields: [studentscorerating.seasonid],
		references: [seasons.seasonid]
	}),
	student: one(student, {
		fields: [studentscorerating.studentid],
		references: [student.studentid]
	}),
}));

export const scoreratingfactorsRelations = relations(scoreratingfactors, ({many}) => ({
	studentscoreratings: many(studentscorerating),
}));

export const scoreratingRelations = relations(scorerating, ({many}) => ({
	studentscoreratings: many(studentscorerating),
}));

export const regchangerequestRelations = relations(regchangerequest, ({one}) => ({
	family: one(family, {
		fields: [regchangerequest.familyid],
		references: [family.familyid]
	}),
	legacyFamily: one(legacyFamily, {
		fields: [regchangerequest.familyid],
		references: [legacyFamily.familyid]
	}),
	requeststatus_reqstatusid: one(requeststatus, {
		fields: [regchangerequest.reqstatusid],
		references: [requeststatus.reqstatusid],
		relationName: "regchangerequest_reqstatusid_requeststatus_reqstatusid"
	}),
	regstatus_oriregstatusid: one(regstatus, {
		fields: [regchangerequest.oriregstatusid],
		references: [regstatus.regstatusid],
		relationName: "regchangerequest_oriregstatusid_regstatus_regstatusid"
	}),
	regstatus_regstatusid: one(regstatus, {
		fields: [regchangerequest.regstatusid],
		references: [regstatus.regstatusid],
		relationName: "regchangerequest_regstatusid_regstatus_regstatusid"
	}),
	season: one(seasons, {
		fields: [regchangerequest.seasonid],
		references: [seasons.seasonid]
	}),
	student: one(student, {
		fields: [regchangerequest.studentid],
		references: [student.studentid]
	}),
}));

export const requeststatusRelations = relations(requeststatus, ({many}) => ({
	regchangerequests_reqstatusid: many(regchangerequest, {
		relationName: "regchangerequest_reqstatusid_requeststatus_reqstatusid"
	}),
}));

export const adminuserroleRelations = relations(adminuserrole, ({one}) => ({
	adminuser: one(adminuser, {
		fields: [adminuserrole.userid],
		references: [adminuser.adminid]
	}),
	legacyAdminuser: one(legacyAdminuser, {
		fields: [adminuserrole.userid],
		references: [legacyAdminuser.userid]
	}),
	adminrole: one(adminrole, {
		fields: [adminuserrole.roleid],
		references: [adminrole.roleid]
	}),
}));

export const adminroleRelations = relations(adminrole, ({many}) => ({
	adminuserroles: many(adminuserrole),
}));