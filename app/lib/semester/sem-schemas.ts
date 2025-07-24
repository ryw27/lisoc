import { z } from 'zod/v4';
import { classregistration, familybalance } from '../db/schema';
import { createInsertSchema } from 'drizzle-zod';
import { arrangement } from '../db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { classes, teacher, classrooms, classtime, suitableterm, seasons } from '../db/schema';
import { toESTString } from '@/lib/utils';

// TODO: These type names suck ass
export const studentSchema = z.object({
	familyid: z.number(),
	studentno: z.string(), // number of students 
	namecn: z.string(),
	namelasten: z.string(),
	namefirsten: z.string(),
	gender: z.string(),
	ageof: z.string(), // minimum age studetn can theoretically be
	age: z.number(),
	dob: z.string().default('1900-01-01 00:00:00'),
	active: z.boolean().default(false),
	notes: z.string().default(''),
})

// Runtime validation
export const arrangementSchema = z.object({
    arrangeid: z.coerce.number()
        .int()
        .min(0, { message: "Class ID must be 0 or greater" })
        .optional(),
    classid: z.coerce.number()
        .int()
        .min(0, { message: "Class ID must be 0 or greater" }),
    teacherid: z.coerce.number()
        .int()
        .min(0, { message: "Teacher ID must be 0 or greater" }),
    roomid: z.coerce.number()
        .int()
        .min(0, { message: "Room ID must be 0 or greater" }),
    timeid: z.coerce.number()
        .int()
        .min(0, { message: "Time ID must be 0 or greater" }),
    seatlimit: z.coerce.number()
        .int()
        .min(0, { message: "Seat limit must be 0 or greater." })
        .nullable()
        .default(null),
    agelimit: z.coerce.number()
        .int()
        .min(0, { message: "Age limit must be 0 or greater." })
        .nullable()
        .default(null),
    suitableterm: z.coerce.number()
        .int()
        .min(0, { message: "Suitable term must be 0 or greater" }),
    term: z.enum(["SPRING", "FALL"]).optional(),
    waiveregfee: z.boolean().default(false),
    closeregistration: z.boolean().default(false),
    tuitionW: z.coerce.number()
        .min(0, { message: "Tuition (W) must be 0 or greater." })
        .default(0),
    specialfeeW: z.coerce.number()
        .min(0, { message: "Special fee (W) must be 0 or greater." })
        .default(0),
    bookfeeW: z.coerce.number()
        .min(0, { message: "Book fee (W) must be 0 or greater." })
        .default(0),
    tuitionH: z.coerce.number()
        .min(0, { message: "Tuition (H) must be 0 or greater." })
        .default(0),
    specialfeeH: z.coerce.number()
        .min(0, { message: "Special fee (H) must be 0 or greater." })
        .default(0),
    bookfeeH: z.coerce.number()
        .min(0, { message: "Book fee (H) must be 0 or greater." })
        .default(0),
    isregclass: z.boolean(),
    notes: z.string().max(500, { message: "Notes must be 500 characters or less." }).optional().nullable()
})

export const newRegSchema = z.object({
    studentid: z.coerce.number().min(0),
    registeredClasses: z.array(
        z.object({
            seasonid: z.number().int().optional(),
            arrid: z.number().int().optional()
        }).refine(
            v =>
                (v.seasonid === undefined && v.arrid === undefined) ||
                (v.seasonid !== undefined && v.arrid !== undefined),
            {
                message: "Both season and class must be provided",
            }
        )
    )
}).transform(({ studentid, registeredClasses}) => ({
    studentid,
    registeredClasses: registeredClasses.filter(
        (s): s is { seasonid: number; arrid: number } =>
            typeof s.seasonid === "number" && typeof s.arrid === "number"
    ),
})).refine(
    data => 
        data.registeredClasses.length >= 1 && 
        data.registeredClasses.length <= 3,
        { message: "Pick 1 - 3 classes" }
);

export const checkApplySchema = z.object({
    balanceid: z.coerce.number(),
    amount: z.coerce.number(),
    checkNo: z.string(),
    paidDate: z.coerce.date()
})


export const arrangementArraySchema = z.object({
    classrooms: z.array(arrangementSchema)
})



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

export const classRegistrationSchema = createInsertSchema(classregistration);



// For admin creation of new semester
export const seasonDatesSchema = z.object({
    fallstart: z.coerce.date(),
    fallend: z.coerce.date(),
    fallearlyreg: z.coerce.date(),
    fallnormalreg: z.coerce.date(),
    falllatereg: z.coerce.date(),
    fallclosereg: z.coerce.date(),
    fallcanceldeadline: z.coerce.date(),
    springstart: z.coerce.date(),
    springend: z.coerce.date(),
    springearlyreg: z.coerce.date(),
    springnormalreg: z.coerce.date(),
    springlatereg: z.coerce.date(),
    springclosereg: z.coerce.date(),
    springcanceldeadline: z.coerce.date(),
})

export const seasonRegSettingsSchema = z.object({
    haslateregfee: z.boolean(),
    haslateregfee4newfamily: z.boolean(),
    hasdutyfee: z.boolean(),
    showadmissionnotice: z.boolean(),
    showteachername: z.boolean(),
    days4showteachername: z.int().min(0, { message: 'Must be positive'}),
    allownewfamilytoregister: z.boolean(),
    date4newfamilytoregister: z.coerce.date(),
    isspring: z.boolean().optional()
})

export const startSemFormSchema = z.object({
    seasonnamecn: z.string()
        .min(1, { message: "Season name is required." }),
    seasonnameen: z.string()
        .min(1, { message: "Season name is required." }),
    ...seasonDatesSchema.shape,
    ...seasonRegSettingsSchema.shape,
    classes: z.array(arrangementSchema).min(1)
})

export const registrationSchema = z.object({
    studentid: z.number(),
	arrangeid: z.number().default(0),
	seasonid: z.number(),
	isyearclass: z.boolean().default(false),
	classid: z.number(),
	registerdate: z.string().default(toESTString(new Date())),
	statusid: z.number().default(1),
	previousstatusid: z.number().default(0).nullable(),
	familybalanceid: z.number().default(0),
	familyid: z.number().default(0),
	newbalanceid: z.number().default(0),
	isdropspring: z.boolean().default(false),
	byadmin: z.boolean().default(false),
	userid: z.string().default('0'),
	lastmodify: z.string().default('1900-01-01 00:00:00'),
	notes: z.string().max(500),
})

export type term = "academic" | "fall" | "spring"

// UI representation of arrangements


type seasonJoin = { seasonid: number, seasonnamecn: string, seasonnameeng: string }
type teacherJoin = { teacherid: number, namecn: string, namelasten: string, namefirsten: string}
type classJoin = { classid: number, classnamecn: string, classnameen: string };
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

// Full arrangement data
export type fullArrData = InferSelectModel<typeof arrangement> & { 
    class: InferSelectModel<typeof classes> 
    teacher: InferSelectModel<typeof teacher>
    classroom: InferSelectModel<typeof classrooms>
    classtime: InferSelectModel<typeof classtime>
    suitableterm: InferSelectModel<typeof suitableterm>
};

// export type classWithStudents = fullArrData & {
//     students: studentView[];
// }

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

export type threeSeason = { year: InferSelectModel<typeof seasons>, fall: InferSelectModel<typeof seasons>, spring: InferSelectModel<typeof seasons> }

export type threeBalances = { year: InferSelectModel<typeof familybalance> | null, fall: InferSelectModel<typeof familybalance> | null, spring: InferSelectModel<typeof familybalance> | null }
