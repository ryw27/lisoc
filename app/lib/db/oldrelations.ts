import { relations } from "drizzle-orm/relations";
import { 
  family, adminuser, adminrole, adminuserrole,
  agerestriction, agelist, seasons, classtype, classes,
  teacher, classrooms, sessions, suitableterm, arrangement,
  student, regstatus, familybalancestatus, familybalancetype,
  classregistration, familybalance, familybalanceSave,
  dutycommittee, dutystatus, dutyassignment, parentdutyPb,
  errorlog, feedback, feelist, menu, paypalrecord,
  paypalrecordImport, requeststatus, regchangerequest,
  schoolcalendar, scorecode, scorefactors, studentscore,
  scoredetail, scorerating, scoreratingfactors,
  studentscorecomment, studentscorefactor, studentscorerating,
  seatnum, supports, tempclass
} from "./schema";

// Core Family Relations
export const familyRelations = relations(family, ({ many, one }) => ({
  adminUsers: many(adminuser),
  students: many(student),
  teachers: many(teacher),
  feedback: many(feedback),
  classRegistrations: many(classregistration),
  familyBalances: many(familybalance),
  familyBalancesSave: many(familybalanceSave),
  dutyAssignments: many(dutyassignment),
  parentDuties: many(parentdutyPb),
  regChangeRequests: many(regchangerequest)
}));

// Admin User Relations
export const adminuserRelations = relations(adminuser, ({ one, many }) => ({
  family: one(family, {
    fields: [adminuser.familyid],
    references: [family.familyid]
  }),
  roles: many(adminuserrole)
}));

export const adminroleRelations = relations(adminrole, ({ many }) => ({
  userRoles: many(adminuserrole)
}));

export const adminuserroleRelations = relations(adminuserrole, ({ one }) => ({
  user: one(adminuser, {
    fields: [adminuserrole.userid],
    references: [adminuser.userid]
  }),
  role: one(adminrole, {
    fields: [adminuserrole.roleid],
    references: [adminrole.roleid]
  })
}));

// Age and Season Relations
export const agerestrictionRelations = relations(agerestriction, ({ many }) => ({
  ageLists: many(agelist),
  classTypes: many(classtype),
  classes: many(classes)
}));

export const agelistRelations = relations(agelist, ({ one }) => ({
  ageRestriction: one(agerestriction, {
    fields: [agelist.ageid],
    references: [agerestriction.ageid]
  })
}));

export const seasonsRelations = relations(seasons, ({ many }) => ({
  arrangements: many(arrangement),
  classRegistrations: many(classregistration),
  familyBalances: many(familybalance),
  familyBalancesSave: many(familybalanceSave),
  dutyAssignments: many(dutyassignment),
  parentDuties: many(parentdutyPb),
  regChangeRequests: many(regchangerequest),
  schoolCalendars: many(schoolcalendar),
  studentScores: many(studentscore),
  studentScoreComments: many(studentscorecomment),
  studentScoreRatings: many(studentscorerating),
  feeLists: many(feelist),
  tempClasses: many(tempclass)
}));

// Class and Type Relations
export const classtypeRelations = relations(classtype, ({ one, many }) => ({
  ageRestriction: one(agerestriction, {
    fields: [classtype.ageid],
    references: [agerestriction.ageid]
  }),
  classes: many(classes),
  teachers: many(teacher),
  tempClasses: many(tempclass)
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  ageRestriction: one(agerestriction, {
    fields: [classes.ageid],
    references: [agerestriction.ageid]
  }),
  classType: one(classtype, {
    fields: [classes.typeid],
    references: [classtype.typeid]
  }),
  arrangements: many(arrangement),
  classRegistrations: many(classregistration),
  regChangeRequests: many(regchangerequest),
  studentScores: many(studentscore),
  studentScoreComments: many(studentscorecomment),
  studentScoreRatings: many(studentscorerating)
}));

// Teacher Relations
export const teacherRelations = relations(teacher, ({ one, many }) => ({
  family: one(family, {
    fields: [teacher.familyid],
    references: [family.familyid]
  }),
  classType: one(classtype, {
    fields: [teacher.classtypeid],
    references: [classtype.typeid]
  }),
  arrangements: many(arrangement),
  tempClasses: many(tempclass)
}));

// Infrastructure Relations
export const classroomsRelations = relations(classrooms, ({ many }) => ({
  arrangements: many(arrangement),
  tempClasses: many(tempclass)
}));

export const sessionsRelations = relations(sessions, ({ many }) => ({
  arrangements: many(arrangement),
  tempClasses: many(tempclass)
}));

export const suitabletermRelations = relations(suitableterm, ({ many }) => ({
  arrangements: many(arrangement),
  tempClasses: many(tempclass)
}));

// Arrangement Relations
export const arrangementRelations = relations(arrangement, ({ one, many }) => ({
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
  session: one(sessions, {
    fields: [arrangement.timeid],
    references: [sessions.timeid]
  }),
  suitableTerm: one(suitableterm, {
    fields: [arrangement.suitableterm],
    references: [suitableterm.termno]
  }),
  classRegistrations: many(classregistration)
}));

// Student Relations
export const studentRelations = relations(student, ({ one, many }) => ({
  family: one(family, {
    fields: [student.familyid],
    references: [family.familyid]
  }),
  classRegistrations: many(classregistration),
  dutyAssignments: many(dutyassignment),
  parentDuties: many(parentdutyPb),
  regChangeRequests: many(regchangerequest),
  studentScores: many(studentscore),
  studentScoreComments: many(studentscorecomment),
  studentScoreRatings: many(studentscorerating)
}));

// Registration Status Relations
export const regstatusRelations = relations(regstatus, ({ many }) => ({
  classRegistrations: many(classregistration),
  classRegistrationsPrevious: many(classregistration, {
    relationName: "previousStatus"
  }),
  regChangeRequestsOriginal: many(regchangerequest, {
    relationName: "originalStatus"
  }),
  regChangeRequestsCurrent: many(regchangerequest, {
    relationName: "currentStatus"
  })
}));

// Family Balance Relations
export const familybalancestatusRelations = relations(familybalancestatus, ({ many }) => ({
  familyBalances: many(familybalance),
  familyBalancesSave: many(familybalanceSave)
}));

export const familybalancetypeRelations = relations(familybalancetype, ({ many }) => ({
  familyBalances: many(familybalance),
  familyBalancesSave: many(familybalanceSave)
}));

export const familybalanceRelations = relations(familybalance, ({ one, many }) => ({
  family: one(family, {
    fields: [familybalance.familyid],
    references: [family.familyid]
  }),
  season: one(seasons, {
    fields: [familybalance.seasonid],
    references: [seasons.seasonid]
  }),
  type: one(familybalancetype, {
    fields: [familybalance.typeid],
    references: [familybalancetype.typeid]
  }),
  status: one(familybalancestatus, {
    fields: [familybalance.statusid],
    references: [familybalancestatus.statusid]
  }),
  classRegistrations: many(classregistration, {
    relationName: "familyBalance"
  }),
  classRegistrationsNew: many(classregistration, {
    relationName: "newBalance"
  }),
  regChangeRequests: many(regchangerequest, {
    relationName: "familyBalance"
  }),
  regChangeRequestsNew: many(regchangerequest, {
    relationName: "newBalance"
  })
}));

export const familybalanceSaveRelations = relations(familybalanceSave, ({ one }) => ({
  family: one(family, {
    fields: [familybalanceSave.familyid],
    references: [family.familyid]
  }),
  season: one(seasons, {
    fields: [familybalanceSave.seasonid],
    references: [seasons.seasonid]
  }),
  type: one(familybalancetype, {
    fields: [familybalanceSave.typeid],
    references: [familybalancetype.typeid]
  }),
  status: one(familybalancestatus, {
    fields: [familybalanceSave.statusid],
    references: [familybalancestatus.statusid]
  })
}));

// Class Registration Relations
export const classregistrationRelations = relations(classregistration, ({ one }) => ({
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
  status: one(regstatus, {
    fields: [classregistration.statusid],
    references: [regstatus.regstatusid]
  }),
  previousStatus: one(regstatus, {
    fields: [classregistration.previousstatusid],
    references: [regstatus.regstatusid],
    relationName: "previousStatus"
  }),
  family: one(family, {
    fields: [classregistration.familyid],
    references: [family.familyid]
  }),
  familyBalance: one(familybalance, {
    fields: [classregistration.familybalanceid],
    references: [familybalance.balanceid],
    relationName: "familyBalance"
  }),
  newBalance: one(familybalance, {
    fields: [classregistration.newbalanceid],
    references: [familybalance.balanceid],
    relationName: "newBalance"
  })
}));

// Duty Relations
export const dutycommitteeRelations = relations(dutycommittee, ({ many }) => ({
  parentDuties: many(parentdutyPb)
}));

export const dutystatusRelations = relations(dutystatus, ({ many }) => ({
  dutyAssignments: many(dutyassignment)
}));

export const dutyassignmentRelations = relations(dutyassignment, ({ one }) => ({
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
  dutyStatus: one(dutystatus, {
    fields: [dutyassignment.dutystatus],
    references: [dutystatus.dutystatusid]
  }),
  parentDuty: one(parentdutyPb, {
    fields: [dutyassignment.pdid],
    references: [parentdutyPb.pdid]
  })
}));

export const parentdutyPbRelations = relations(parentdutyPb, ({ one, many }) => ({
  family: one(family, {
    fields: [parentdutyPb.familyid],
    references: [family.familyid]
  }),
  student: one(student, {
    fields: [parentdutyPb.studentid],
    references: [student.studentid]
  }),
  committee: one(dutycommittee, {
    fields: [parentdutyPb.committeeid],
    references: [dutycommittee.dcid]
  }),
  season: one(seasons, {
    fields: [parentdutyPb.seasonid],
    references: [seasons.seasonid]
  }),
  dutyAssignments: many(dutyassignment)
}));

// Feedback and Other Relations
export const feedbackRelations = relations(feedback, ({ one }) => ({
  family: one(family, {
    fields: [feedback.familyid],
    references: [family.familyid]
  })
}));

export const feelistRelations = relations(feelist, ({ one }) => ({
  season: one(seasons, {
    fields: [feelist.seasonid],
    references: [seasons.seasonid]
  })
}));

export const menuRelations = relations(menu, ({ one, many }) => ({
  parent: one(menu, {
    fields: [menu.parentid],
    references: [menu.menuid],
    relationName: "menuHierarchy"
  }),
  children: many(menu, {
    relationName: "menuHierarchy"
  })
}));

// Request Relations
export const requeststatusRelations = relations(requeststatus, ({ many }) => ({
  regChangeRequests: many(regchangerequest)
}));

export const regchangerequestRelations = relations(regchangerequest, ({ one }) => ({
  registration: one(classregistration, {
    fields: [regchangerequest.regid],
    references: [classregistration.regid]
  }),
  student: one(student, {
    fields: [regchangerequest.studentid],
    references: [student.studentid]
  }),
  season: one(seasons, {
    fields: [regchangerequest.seasonid],
    references: [seasons.seasonid]
  }),
  relatedSeason: one(seasons, {
    fields: [regchangerequest.relatedseasonid],
    references: [seasons.seasonid],
    relationName: "relatedSeason"
  }),
  class: one(classes, {
    fields: [regchangerequest.classid],
    references: [classes.classid]
  }),
  originalStatus: one(regstatus, {
    fields: [regchangerequest.oriregstatusid],
    references: [regstatus.regstatusid],
    relationName: "originalStatus"
  }),
  currentStatus: one(regstatus, {
    fields: [regchangerequest.regstatusid],
    references: [regstatus.regstatusid],
    relationName: "currentStatus"
  }),
  requestStatus: one(requeststatus, {
    fields: [regchangerequest.reqstatusid],
    references: [requeststatus.reqstatusid]
  }),
  family: one(family, {
    fields: [regchangerequest.familyid],
    references: [family.familyid]
  }),
  familyBalance: one(familybalance, {
    fields: [regchangerequest.familybalanceid],
    references: [familybalance.balanceid],
    relationName: "familyBalance"
  }),
  newBalance: one(familybalance, {
    fields: [regchangerequest.newbalanceid],
    references: [familybalance.balanceid],
    relationName: "newBalance"
  })
}));

// Calendar Relations
export const schoolcalendarRelations = relations(schoolcalendar, ({ one }) => ({
  season: one(seasons, {
    fields: [schoolcalendar.seasonid],
    references: [seasons.seasonid]
  })
}));

// Scoring Relations
export const scorefactorsRelations = relations(scorefactors, ({ many }) => ({
  studentScores: many(studentscore),
  studentScoreFactors: many(studentscorefactor)
}));

export const studentscoreRelations = relations(studentscore, ({ one, many }) => ({
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
  factor: one(scorefactors, {
    fields: [studentscore.factorid],
    references: [scorefactors.factorid]
  }),
  scoreDetails: many(scoredetail),
  scoreFactors: many(studentscorefactor),
  scoreComments: many(studentscorecomment)
}));

export const scoredetailRelations = relations(scoredetail, ({ one }) => ({
  studentScore: one(studentscore, {
    fields: [scoredetail.scoreid],
    references: [studentscore.scoreid]
  })
}));

export const scoreratingRelations = relations(scorerating, ({ many }) => ({
  studentScoreRatings: many(studentscorerating)
}));

export const scoreratingfactorsRelations = relations(scoreratingfactors, ({ many }) => ({
  studentScoreRatings: many(studentscorerating)
}));

export const studentscorecommentRelations = relations(studentscorecomment, ({ one }) => ({
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
  score: one(studentscore, {
    fields: [studentscorecomment.scoreid],
    references: [studentscore.scoreid]
  })
}));

export const studentscorefactorRelations = relations(studentscorefactor, ({ one }) => ({
  studentScore: one(studentscore, {
    fields: [studentscorefactor.scoreid],
    references: [studentscore.scoreid]
  }),
  factor: one(scorefactors, {
    fields: [studentscorefactor.factorid],
    references: [scorefactors.factorid]
  })
}));

export const studentscoreratingRelations = relations(studentscorerating, ({ one }) => ({
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
  ratingFactor: one(scoreratingfactors, {
    fields: [studentscorerating.ratingfactorid],
    references: [scoreratingfactors.ratingfactorid]
  }),
  rating: one(scorerating, {
    fields: [studentscorerating.ratingid],
    references: [scorerating.ratingid]
  })
}));

// Temp Class Relations
export const tempclassRelations = relations(tempclass, ({ one }) => ({
  classType: one(classtype, {
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
  session: one(sessions, {
    fields: [tempclass.timeid],
    references: [sessions.timeid]
  }),
  suitableTerm: one(suitableterm, {
    fields: [tempclass.suitableterm],
    references: [suitableterm.termno]
  })
}));

