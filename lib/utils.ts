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
