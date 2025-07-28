import { 
    seasonObj, 
    fambalanceObj 
} from "../shared/types";



// TODO: Check this type, make sure it's extendable and reusable
// export type uiClasses = z.infer<typeof arrangementSchema>;
export type uiClasses = {
    arrangeid?: number;
    seasonid: number;
    classid: number;
    teacherid: number;
    roomid: number;
    timeid: number;
    seatlimit: number | null;
    agelimit: number | null;
    suitableterm: number;
    term?: "SPRING" | "FALL";
    waiveregfee: boolean;
    closeregistration: boolean;
    tuitionW: string | null; // Numeric, or float, needs string
    specialfeeW: string | null;
    bookfeeW: string | null;
    tuitionH: string | null;
    specialfeeH: string | null;
    bookfeeH: string | null;
    isregclass: boolean;
    notes: string | null;
} 

export type term = "year" | "fall" | "spring" | "any"

// Common views for dropdowns and data fetches
type teacherJoin = { teacherid: number, namecn: string, namelasten: string, namefirsten: string}
type classJoin = { classid: number, classnamecn: string, classnameen: string };
// type seasonJoin = { seasonid: number, seasonnamecn: string, seasonnameeng: string }
type roomJoin = { roomid: number, roomno: string };
type timeJoin = { timeid: number, period: string | null };
type termJoin = { termno: number, suitableterm: string | null, suitabletermcn: string | null };

export type selectOptions = {
    teachers: teacherJoin[];
    classes: classJoin[];
    rooms: roomJoin[];
    times: timeJoin[];
    terms: termJoin[];
}

export type IdMaps = {
    teacherMap: Record<number, (teacherJoin[])[number]>;
    classMap: Record<number, (classJoin[])[number]>;
    roomMap: Record<number, (roomJoin[])[number]>;
    timeMap: Record<number, (timeJoin[])[number]>;
    termMap: Record<number, (termJoin[])[number]>;
}

export type threeSeasons = {
    year: seasonObj,
    fall: seasonObj,
    spring: seasonObj
}

export type studentStatus = 
    | "Submitted"
    | "Registered"
    | "Dropout" 
    | "Dropout Spring"
    | "Pending Drop"
    | {}

export type studentView = {
    regid: number;
    studentid: number;
    registerDate: string; 
    dropped: studentStatus;
    familyid: number;
    namecn: string;
    namelasten: string;
    namefirsten: string;
    dob: string;
    gender: string;
    notes: string
} 

// New semester page overhaul. Probably the final. 
export type fullClassStudents = {
    arrinfo: uiClasses;
    students: studentView[];
}

export type fullRegClass = fullClassStudents & {
    classrooms: fullClassStudents[]
}

// For each reg class
export type fullSemClassesData = fullRegClass[]

export type threeBalances = { year: fambalanceObj | null, fall: fambalanceObj | null, spring: fambalanceObj | null }
