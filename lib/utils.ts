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
// Constants
// ----------------------------------------------------------------

export const SITE_LINK = "localhost:3000"; // TODO: change to actual link

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
export const FAMILYBALANCE_TYPE_OTHER = 6;
export const FAMILYBALANCE_TYPE_TRANSFER = 8;
export const FAMILYBALANCE_TYPE_PAYMENT = 3;
export const FAMILYBALANCE_TYPE_DROPOUT = 9;
export const FAMILYBALANCE_TYPE_SCHOOL_CHECK = 5;



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

// Request status
export const REQUEST_STATUS_PENDING = 1;
export const REQUEST_STATUS_APPROVED = 2;
export const REQUEST_STATUS_REJECTED = 3;