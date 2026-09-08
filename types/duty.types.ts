export interface DutyRosterRow {
    familyid: number;
    studentid: number;
    studentname: string;
    classid: number;
    classname: string;
    fathername: string;
    mothername: string;
    address: string;
    phone: string;
    email: string;
}

/** One selectable duty date: `value` is `YYYY-MM-DD`, `label` is the display form. */
export interface DutyDateOption {
    value: string;
    label: string;
}

export interface DutyRoster {
    seasonid: number | null;
    seasonname: string | null;
    /** Rows already written to `dutyassignment` for this season. */
    assignedcount: number;
    rows: DutyRosterRow[];
}

export type DutyTerm = "fall" | "spring";

/** One academic year, keyed by the fall semester's seasonid (`seasons.beginseasonid`). */
export interface SeasonYearOption {
    beginseasonid: number;
    label: string;
    fallseasonid: number | null;
    springseasonid: number | null;
}

export interface SeasonFilterOptions {
    years: SeasonYearOption[];
    /** Academic year containing the currently active season, if any. */
    currentBeginSeasonId: number | null;
}

export interface DutyAssignmentRow {
    dutyassignid: number;
    familyid: number;
    studentname: string;
    /** `YYYY-MM-DD`, the date part of `dutyassignment.dutydate`. */
    dutydate: string;
    mothername: string;
    fathername: string;
    dutystatus: number;
    phone: string;
    email: string;
    address: string;
    note: string;
}

export interface DutyAssignments {
    seasonid: number | null;
    seasonname: string | null;
    rows: DutyAssignmentRow[];
}
