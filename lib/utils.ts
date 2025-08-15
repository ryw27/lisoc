import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatInTimeZone } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  	return twMerge(clsx(inputs))
}

// ----------------------------------------------------------------
// TIMEZONE UTILITIES
// ----------------------------------------------------------------


export function toESTString(date: Date) {
	return formatInTimeZone(date, 'America/New_York', "yyyy-MM-dd'T'HH:mm:ssXXX")
}


// ----------------------------------------------------------------
// Link
// ----------------------------------------------------------------

export const ADMIN_DATAVIEW_LINK = "/admin/data"

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------

export const US_STATES = [
    "AL","AK","AZ","AR","CA","CO","CT","DC","DE","FL","GA","HI","IA","ID","IL","IN",
    "KS","KY","LA","MA","MD","ME","MI","MN","MO","MS","MT","NC","ND","NE","NH","NJ",
    "NM","NV","NY","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VA","VT","WA",
    "WI","WV","WY",
] as const;


export const SITE_LINK = process.env.SITE_LINK; 

// Teacher
export const UNKNOWN_TEACHERID = 7;

// Classroom
export const UNKNOWN_CLASSROOMID = 59;

// Fees
export const REGISTRATION_FEE = 0;
export const LATE_REG_FEE_1 = 0;
export const LATE_REG_FEE_2 = 0;
export const EARLY_REG_DISCOUNT = 50;

// Family balance types
export const FAMILYBALANCE_TYPE_PAYMENT = 3;
export const FAMILYBALANCE_TYPE_SCHOOL_CHECK = 5;
export const FAMILYBALANCE_TYPE_OTHER = 6;
export const FAMILYBALANCE_TYPE_TRANSFER = 8;
export const FAMILYBALANCE_TYPE_DROPOUT = 9;



// Family balance status
export const FAMILYBALANCE_STATUS_PENDING = 2;
export const FAMILYBALANCE_STATUS_PROCESSED = 3;

// Suitable Terms
export const SEMESTERONLY_SUITBALETERM_FOREIGNKEY = 2;

// Time periods
export const CLASSTIME_PERIOD_ONE_TIMEID = 1;
export const CLASSTIME_PERIOD_TWO_TIMEID = 2;
export const CLASSTIME_PERIOD_BOTH_TIMEID = 3; 

// Reg status
export const REGSTATUS_SUBMITTED = 1;
export const REGSTATUS_REGISTERED = 2;
export const REGSTATUS_TRANSFERRED = 3;
export const REGSTATUS_DROPOUT = 4;
export const REGSTATUS_DROPOUT_SPRING = 5;
export const regStatusMap = {
	[REGSTATUS_SUBMITTED]: "Submitted",
	[REGSTATUS_REGISTERED]: "Submitted",
	[REGSTATUS_TRANSFERRED]: "Submitted",
	[REGSTATUS_DROPOUT]: "Submitted",
	[REGSTATUS_DROPOUT_SPRING]: "Submitted",
} satisfies Record<number, string>

// Request status
export const REQUEST_STATUS_PENDING = 1;
export const REQUEST_STATUS_APPROVED = 2;
export const REQUEST_STATUS_REJECTED = 3;
export const requestStatusMap = {
	[REQUEST_STATUS_PENDING]: "Pending",
	[REQUEST_STATUS_APPROVED]: "Approved",
	[REQUEST_STATUS_REJECTED]: "Rejected",
} satisfies Record<number, string>


// Class Type
export const classTypeMap = {
	1: { typenameen: "Stardard Chinese", typenamecn: "标准中文" },
	2: { typenameen: "Ma Liping Chinese", typenamecn: "马立平中文" },
	3: { typenameen: "Culture (Adult)", typenamecn: "成人文体课" },
	4: { typenameen: "Culture (Child)", typenamecn: "少儿文体课" },
	5: { typenameen: "English(1)", typenamecn: "双语班" },
} satisfies Record<number, { typenameen: string; typenamecn: string }>;