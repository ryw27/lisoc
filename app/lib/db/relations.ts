import { relations } from "drizzle-orm/relations";
import { users, family, adminuser, adminrole, teacher, classes, seasons, arrangement, classrooms, classtime, suitableterm, agerestriction, classtype, student, classregistration, regstatus, familybalance, familybalancetype, familybalancestatus, dutyassignment, dutystatus, parentdutyPb, dutycommittee, familybalanceSave, feedback, feelist, regchangerequest, requeststatus, schoolcalendar, studentscore, scorefactors, scoredetail, studentscorecomment, studentscorefactor, studentscorerating, scoreratingfactors, scorerating, tempclass } from "./schema";

export const familyRelations = relations(family, ({one, many}) => ({
	user: one(users, {
		fields: [family.userid],
		references: [users.id]
	}),
	adminUsers: many(adminuser),
	teacherUsers: many(teacher),
}));

export const usersRelations = relations(users, ({many}) => ({
	familyUsers: many(family),
	adminUsers: many(adminuser),
	teacherUsers: many(teacher),
}));

export const adminuserRelations = relations(adminuser, ({one}) => ({
	user: one(users, {
		fields: [adminuser.userid],
		references: [users.id]
	}),
	adminrole: one(adminrole, {
		fields: [adminuser.roleid],
		references: [adminrole.roleid]
	}),
	family: one(family, {
		fields: [adminuser.familyid],
		references: [family.familyid]
	}),
}));

export const adminroleRelations = relations(adminrole, ({many}) => ({
	adminUsers: many(adminuser),
}));

export const teacherRelations = relations(teacher, ({one}) => ({
	user: one(users, {
		fields: [teacher.userid],
		references: [users.id]
	}),
	class: one(classes, {
		fields: [teacher.classid],
		references: [classes.classid]
	}),
	family: one(family, {
		fields: [teacher.familyid],
		references: [family.familyid]
	}),
}));

export const classesRelations = relations(classes, ({one, many}) => ({
	teacherUsers: many(teacher),
	arrangements: many(arrangement),
	agerestriction: one(agerestriction, {
		fields: [classes.ageid],
		references: [agerestriction.ageid]
	}),
	classtype: one(classtype, {
		fields: [classes.typeid],
		references: [classtype.typeid]
	}),
	class: one(classes, {
		fields: [classes.classupid],
		references: [classes.classid],
		relationName: "classes_classupid_classes_classid"
	}),
	classes: many(classes, {
		relationName: "classes_classupid_classes_classid"
	}),
	classregistrations: many(classregistration),
	regchangerequests: many(regchangerequest),
	studentscores: many(studentscore),
	studentscorecomments: many(studentscorecomment),
	studentscoreratings: many(studentscorerating),
}));

// export const adminuserRelations = relations(adminuser, ({one}) => ({
// 	family: one(family, {
// 		fields: [adminuser.familyid],
// 		references: [family.familyid]
// 	}),
// }));

// export const familyRelations2 = relations(family, ({many}) => ({
// 	adminusers: many(adminuser),
// 	teachers: many(teacher),
// 	students: many(student),
// 	classregistrations: many(classregistration),
// 	familybalances: many(familybalance),
// 	dutyassignments: many(dutyassignment),
// 	parentdutyPbs: many(parentdutyPb),
// 	familybalanceSaves: many(familybalanceSave),
// 	feedbacks: many(feedback),
// 	regchangerequests: many(regchangerequest),
// }));

export const arrangementRelations = relations(arrangement, ({one, many}) => ({
	season: one(seasons, {
		fields: [arrangement.seasonid],
		references: [seasons.seasonid]
	}),
	class: one(classes, {
		fields: [arrangement.classid],
		references: [classes.classid]
	}),
	teacher: one(teacher, {
		fields: [arrangement.teacherid],
		references: [teacher.teacherid]
	}),
	classroom: one(classrooms, {
		fields: [arrangement.roomid],
		references: [classrooms.roomid]
	}),
	classtime: one(classtime, {
		fields: [arrangement.timeid],
		references: [classtime.timeid]
	}),
	suitableterm: one(suitableterm, {
		fields: [arrangement.suitableterm],
		references: [suitableterm.termno]
	}),
	classregistrations: many(classregistration),
}));

export const seasonsRelations = relations(seasons, ({many}) => ({
	arrangements: many(arrangement),
	classregistrations: many(classregistration),
	familybalances: many(familybalance),
	dutyassignments: many(dutyassignment),
	parentdutyPbs: many(parentdutyPb),
	familybalanceSaves: many(familybalanceSave),
	feelists: many(feelist),
	regchangerequests_seasonid: many(regchangerequest, {
		relationName: "regchangerequest_seasonid_seasons_seasonid"
	}),
	regchangerequests_relatedseasonid: many(regchangerequest, {
		relationName: "regchangerequest_relatedseasonid_seasons_seasonid"
	}),
	schoolcalendars: many(schoolcalendar),
	studentscores: many(studentscore),
	studentscorecomments: many(studentscorecomment),
	studentscoreratings: many(studentscorerating),
	tempclasses: many(tempclass),
}));

// export const teacherRelations = relations(teacher, ({one, many}) => ({
// 	arrangements: many(arrangement),
// 	classtype: one(classtype, {
// 		fields: [teacher.classtypeid],
// 		references: [classtype.typeid]
// 	}),
// 	family: one(family, {
// 		fields: [teacher.familyid],
// 		references: [family.familyid]
// 	}),
// 	tempclasses: many(tempclass),
// }));

export const classroomsRelations = relations(classrooms, ({many}) => ({
	arrangements: many(arrangement),
	tempclasses: many(tempclass),
}));

export const classtimeRelations = relations(classtime, ({many}) => ({
	arrangements: many(arrangement),
	tempclasses: many(tempclass),
}));

export const suitabletermRelations = relations(suitableterm, ({many}) => ({
	arrangements: many(arrangement),
	tempclasses: many(tempclass),
}));

export const agerestrictionRelations = relations(agerestriction, ({many}) => ({
	classes: many(classes),
	classtypes: many(classtype),
}));

export const classtypeRelations = relations(classtype, ({one, many}) => ({
	classes: many(classes),
	teachers: many(teacher),
	agerestriction: one(agerestriction, {
		fields: [classtype.ageid],
		references: [agerestriction.ageid]
	}),
	tempclasses: many(tempclass),
}));

export const studentRelations = relations(student, ({one, many}) => ({
	family: one(family, {
		fields: [student.familyid],
		references: [family.familyid]
	}),
	classregistrations: many(classregistration),
	dutyassignments: many(dutyassignment),
	parentdutyPbs: many(parentdutyPb),
	regchangerequests: many(regchangerequest),
	studentscores: many(studentscore),
	studentscorecomments: many(studentscorecomment),
	studentscoreratings: many(studentscorerating),
}));

export const classregistrationRelations = relations(classregistration, ({one, many}) => ({
	student: one(student, {
		fields: [classregistration.studentid],
		references: [student.studentid]
	}),
	arrangement: one(arrangement, {
		fields: [classregistration.arrangeid],
		references: [arrangement.arrangeid]
	}),
	season: one(seasons, {
		fields: [classregistration.seasonid],
		references: [seasons.seasonid]
	}),
	class: one(classes, {
		fields: [classregistration.classid],
		references: [classes.classid]
	}),
	regstatus_statusid: one(regstatus, {
		fields: [classregistration.statusid],
		references: [regstatus.regstatusid],
		relationName: "classregistration_statusid_regstatus_regstatusid"
	}),
	regstatus_previousstatusid: one(regstatus, {
		fields: [classregistration.previousstatusid],
		references: [regstatus.regstatusid],
		relationName: "classregistration_previousstatusid_regstatus_regstatusid"
	}),
	familybalance_familybalanceid: one(familybalance, {
		fields: [classregistration.familybalanceid],
		references: [familybalance.balanceid],
		relationName: "classregistration_familybalanceid_familybalance_balanceid"
	}),
	family: one(family, {
		fields: [classregistration.familyid],
		references: [family.familyid]
	}),
	familybalance_newbalanceid: one(familybalance, {
		fields: [classregistration.newbalanceid],
		references: [familybalance.balanceid],
		relationName: "classregistration_newbalanceid_familybalance_balanceid"
	}),
	regchangerequests: many(regchangerequest),
}));

export const regstatusRelations = relations(regstatus, ({many}) => ({
	classregistrations_statusid: many(classregistration, {
		relationName: "classregistration_statusid_regstatus_regstatusid"
	}),
	classregistrations_previousstatusid: many(classregistration, {
		relationName: "classregistration_previousstatusid_regstatus_regstatusid"
	}),
	regchangerequests_oriregstatusid: many(regchangerequest, {
		relationName: "regchangerequest_oriregstatusid_regstatus_regstatusid"
	}),
	regchangerequests_regstatusid: many(regchangerequest, {
		relationName: "regchangerequest_regstatusid_regstatus_regstatusid"
	}),
}));

export const familybalanceRelations = relations(familybalance, ({one, many}) => ({
	classregistrations_familybalanceid: many(classregistration, {
		relationName: "classregistration_familybalanceid_familybalance_balanceid"
	}),
	classregistrations_newbalanceid: many(classregistration, {
		relationName: "classregistration_newbalanceid_familybalance_balanceid"
	}),
	season: one(seasons, {
		fields: [familybalance.seasonid],
		references: [seasons.seasonid]
	}),
	family: one(family, {
		fields: [familybalance.familyid],
		references: [family.familyid]
	}),
	familybalancetype: one(familybalancetype, {
		fields: [familybalance.typeid],
		references: [familybalancetype.typeid]
	}),
	familybalancestatus: one(familybalancestatus, {
		fields: [familybalance.statusid],
		references: [familybalancestatus.statusid]
	}),
	regchangerequests_familybalanceid: many(regchangerequest, {
		relationName: "regchangerequest_familybalanceid_familybalance_balanceid"
	}),
	regchangerequests_newbalanceid: many(regchangerequest, {
		relationName: "regchangerequest_newbalanceid_familybalance_balanceid"
	}),
}));

export const familybalancetypeRelations = relations(familybalancetype, ({many}) => ({
	familybalances: many(familybalance),
	familybalanceSaves: many(familybalanceSave),
}));

export const familybalancestatusRelations = relations(familybalancestatus, ({many}) => ({
	familybalances: many(familybalance),
	familybalanceSaves: many(familybalanceSave),
}));

export const dutyassignmentRelations = relations(dutyassignment, ({one}) => ({
	family: one(family, {
		fields: [dutyassignment.familyid],
		references: [family.familyid]
	}),
	student: one(student, {
		fields: [dutyassignment.studentid],
		references: [student.studentid]
	}),
	season: one(seasons, {
		fields: [dutyassignment.seasonid],
		references: [seasons.seasonid]
	}),
	dutystatus: one(dutystatus, {
		fields: [dutyassignment.dutystatus],
		references: [dutystatus.dutystatusid]
	}),
	parentdutyPb: one(parentdutyPb, {
		fields: [dutyassignment.pdid],
		references: [parentdutyPb.pdid]
	}),
}));

export const dutystatusRelations = relations(dutystatus, ({many}) => ({
	dutyassignments: many(dutyassignment),
}));

export const parentdutyPbRelations = relations(parentdutyPb, ({one, many}) => ({
	dutyassignments: many(dutyassignment),
	family: one(family, {
		fields: [parentdutyPb.familyid],
		references: [family.familyid]
	}),
	student: one(student, {
		fields: [parentdutyPb.studentid],
		references: [student.studentid]
	}),
	dutycommittee: one(dutycommittee, {
		fields: [parentdutyPb.committeeid],
		references: [dutycommittee.dcid]
	}),
	season: one(seasons, {
		fields: [parentdutyPb.seasonid],
		references: [seasons.seasonid]
	}),
}));

export const dutycommitteeRelations = relations(dutycommittee, ({many}) => ({
	parentdutyPbs: many(parentdutyPb),
}));

export const familybalanceSaveRelations = relations(familybalanceSave, ({one}) => ({
	season: one(seasons, {
		fields: [familybalanceSave.seasonid],
		references: [seasons.seasonid]
	}),
	family: one(family, {
		fields: [familybalanceSave.familyid],
		references: [family.familyid]
	}),
	familybalancetype: one(familybalancetype, {
		fields: [familybalanceSave.typeid],
		references: [familybalancetype.typeid]
	}),
	familybalancestatus: one(familybalancestatus, {
		fields: [familybalanceSave.statusid],
		references: [familybalancestatus.statusid]
	}),
}));

export const feedbackRelations = relations(feedback, ({one}) => ({
	family: one(family, {
		fields: [feedback.familyid],
		references: [family.familyid]
	}),
}));

export const feelistRelations = relations(feelist, ({one}) => ({
	season: one(seasons, {
		fields: [feelist.seasonid],
		references: [seasons.seasonid]
	}),
}));

export const regchangerequestRelations = relations(regchangerequest, ({one}) => ({
	classregistration: one(classregistration, {
		fields: [regchangerequest.regid],
		references: [classregistration.regid]
	}),
	student: one(student, {
		fields: [regchangerequest.studentid],
		references: [student.studentid]
	}),
	season_seasonid: one(seasons, {
		fields: [regchangerequest.seasonid],
		references: [seasons.seasonid],
		relationName: "regchangerequest_seasonid_seasons_seasonid"
	}),
	season_relatedseasonid: one(seasons, {
		fields: [regchangerequest.relatedseasonid],
		references: [seasons.seasonid],
		relationName: "regchangerequest_relatedseasonid_seasons_seasonid"
	}),
	class: one(classes, {
		fields: [regchangerequest.classid],
		references: [classes.classid]
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
	requeststatus: one(requeststatus, {
		fields: [regchangerequest.reqstatusid],
		references: [requeststatus.reqstatusid]
	}),
	familybalance_familybalanceid: one(familybalance, {
		fields: [regchangerequest.familybalanceid],
		references: [familybalance.balanceid],
		relationName: "regchangerequest_familybalanceid_familybalance_balanceid"
	}),
	family: one(family, {
		fields: [regchangerequest.familyid],
		references: [family.familyid]
	}),
	familybalance_newbalanceid: one(familybalance, {
		fields: [regchangerequest.newbalanceid],
		references: [familybalance.balanceid],
		relationName: "regchangerequest_newbalanceid_familybalance_balanceid"
	}),
}));

export const requeststatusRelations = relations(requeststatus, ({many}) => ({
	regchangerequests: many(regchangerequest),
}));

export const schoolcalendarRelations = relations(schoolcalendar, ({one}) => ({
	season: one(seasons, {
		fields: [schoolcalendar.seasonid],
		references: [seasons.seasonid]
	}),
}));

export const studentscoreRelations = relations(studentscore, ({one, many}) => ({
	student: one(student, {
		fields: [studentscore.studentid],
		references: [student.studentid]
	}),
	season: one(seasons, {
		fields: [studentscore.seasonid],
		references: [seasons.seasonid]
	}),
	class: one(classes, {
		fields: [studentscore.classid],
		references: [classes.classid]
	}),
	scorefactor: one(scorefactors, {
		fields: [studentscore.factorid],
		references: [scorefactors.factorid]
	}),
	scoredetails: many(scoredetail),
	studentscorecomments: many(studentscorecomment),
	studentscorefactors: many(studentscorefactor),
}));

export const scorefactorsRelations = relations(scorefactors, ({many}) => ({
	studentscores: many(studentscore),
	studentscorefactors: many(studentscorefactor),
}));

export const scoredetailRelations = relations(scoredetail, ({one}) => ({
	studentscore: one(studentscore, {
		fields: [scoredetail.scoreid],
		references: [studentscore.scoreid]
	}),
}));

export const studentscorecommentRelations = relations(studentscorecomment, ({one}) => ({
	student: one(student, {
		fields: [studentscorecomment.studentid],
		references: [student.studentid]
	}),
	season: one(seasons, {
		fields: [studentscorecomment.seasonid],
		references: [seasons.seasonid]
	}),
	class: one(classes, {
		fields: [studentscorecomment.classid],
		references: [classes.classid]
	}),
	studentscore: one(studentscore, {
		fields: [studentscorecomment.scoreid],
		references: [studentscore.scoreid]
	}),
}));

export const studentscorefactorRelations = relations(studentscorefactor, ({one}) => ({
	studentscore: one(studentscore, {
		fields: [studentscorefactor.scoreid],
		references: [studentscore.scoreid]
	}),
	scorefactor: one(scorefactors, {
		fields: [studentscorefactor.factorid],
		references: [scorefactors.factorid]
	}),
}));

export const studentscoreratingRelations = relations(studentscorerating, ({one}) => ({
	student: one(student, {
		fields: [studentscorerating.studentid],
		references: [student.studentid]
	}),
	season: one(seasons, {
		fields: [studentscorerating.seasonid],
		references: [seasons.seasonid]
	}),
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
}));

export const scoreratingfactorsRelations = relations(scoreratingfactors, ({many}) => ({
	studentscoreratings: many(studentscorerating),
}));

export const scoreratingRelations = relations(scorerating, ({many}) => ({
	studentscoreratings: many(studentscorerating),
}));

export const tempclassRelations = relations(tempclass, ({one}) => ({
	classtype: one(classtype, {
		fields: [tempclass.typeid],
		references: [classtype.typeid]
	}),
	season: one(seasons, {
		fields: [tempclass.seasonid],
		references: [seasons.seasonid]
	}),
	teacher: one(teacher, {
		fields: [tempclass.teacherid],
		references: [teacher.teacherid]
	}),
	classroom: one(classrooms, {
		fields: [tempclass.roomid],
		references: [classrooms.roomid]
	}),
	classtime: one(classtime, {
		fields: [tempclass.timeid],
		references: [classtime.timeid]
	}),
	suitableterm: one(suitableterm, {
		fields: [tempclass.suitableterm],
		references: [suitableterm.termno]
	}),
}));