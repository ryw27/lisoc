import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TZDate } from "@date-fns/tz";
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
export const SEMESTERONLY_SUITBALETERM_FOREIGNKEY = 2;
export const REGISTRATION_FEE = 0;
export const LATE_REG_FEE = 0;
