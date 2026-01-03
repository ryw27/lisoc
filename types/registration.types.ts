import { uiClasses, uiClassKey } from "@/lib/types.shared";

export type studentStatus =
    | "Submitted"
    | "Registered"
    | "Dropout"
    | "Dropout Spring"
    | "Transferred"
    | "Pending Drop"
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    | {};

export type adminStudentView = {
    regid: number;
    studentid: number;
    registerDate: string;
    status: studentStatus;
    familyid: number;
    namecn: string;
    namelasten: string;
    namefirsten: string;
    dob: string;
    gender: string;
    notes: string;
    classid: number;
};

export type fullClassStudents = {
    arrinfo: uiClasses & uiClassKey;
    students: adminStudentView[];
};

export type availableClasses = {
    classid: number;
    classnamecn: string;
    description: string | null;
};

// For each reg class
export type fullSemClassesData = fullRegClass[];

export type uniqueRegistration = {
    seasonid: number;
    classid: number;
    familyid: number;
    studentid: number;
};

export type uniqueRegRequests = {
    seasonid: number;
    familyid: number;
    studentid: number;
};

export type regKind =
    | "early"
    | "normal"
    | "late1"
    | "late2"
    | "closed"
    | "noclosereg"
    | "exception";

export type fullRegClass = fullClassStudents & {
    classrooms: fullClassStudents[];
    availablerooms: availableClasses[];
    dropped: adminStudentView[];
};

export type regChangeRow = {
    regid: number;
    requestid: number;
    classid: number;
    seasonid: number | null;
    relatedseasonid: number | null;
    appliedid: number;
    // newclass: number
    familyid: string;
    father: string;
    mother: string;
    phone: string;
    email: string;
    NumOfReq: number;
    parentNote: string;
    action: string;
    reqStatus: number;
    firstReq: string;
    lastProcess: string;
    processBy: string;
};
