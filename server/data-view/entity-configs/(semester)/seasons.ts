import { InferSelectModel } from "drizzle-orm";
import { DefaultSession } from "next-auth";
import { z } from "zod/v4";
import { seasons } from "@/lib/db/schema";
import { toESTString } from "@/lib/utils";
import { type EntityConfig, type Extras } from "@/types/dataview.types";

// 1. Types
export type SeasonTable = typeof seasons;
export type SeasonObject = InferSelectModel<SeasonTable>;

// 2. Form Schema
export const seasonFormSchema = z.object({
    seasonnamecn: z
        .string()
        .min(1, { message: "Season name (CN) is required" })
        .max(100, { message: "Season name (CN) must be at most 100 characters" }),
    seasonnameeng: z
        .string()
        .min(1, { message: "Season name (EN) is required" })
        .max(100, { message: "Season name (EN) must be at most 100 characters" }),
    isspring: z.boolean().default(false),
    relatedseasonid: z.coerce
        .number({ message: "Invalid related season ID" })
        .int()
        .min(0, { message: "Invalid related season ID" })
        .default(0),
    beginseasonid: z.coerce
        .number({ message: "Invalid begin season ID" })
        .int()
        .min(0, { message: "Invalid begin season ID" })
        .default(0),
    haslateregfee: z.boolean().default(true),
    haslateregfee4newfamily: z.boolean().default(true),
    hasdutyfee: z.boolean().default(true),
    startdate: z
        .date({ message: "Invalid start date" })
        .default(new Date(toESTString(new Date("1900-01-01")))),
    enddate: z
        .date({ message: "Invalid end date" })
        .default(new Date(toESTString(new Date("1900-01-01")))),
    earlyregdate: z
        .date({ message: "Invalid early registration date" })
        .default(new Date(toESTString(new Date("1900-01-01")))),
    normalregdate: z
        .date({ message: "Invalid normal registration date" })
        .default(new Date(toESTString(new Date("1900-01-01")))),
    lateregdate1: z
        .date({ message: "Invalid late registration date 1" })
        .default(new Date(toESTString(new Date("1900-01-01")))),
    lateregdate2: z
        .date({ message: "Invalid late registration date 2" })
        .default(new Date(toESTString(new Date("1900-01-01")))),
    closeregdate: z
        .date({ message: "Invalid close registration date" })
        .default(new Date(toESTString(new Date("1900-01-01")))),
    canceldeadline: z
        .date({ message: "Invalid cancel deadline" })
        .default(new Date(toESTString(new Date("1900-01-01")))),
    hasdeadline: z.boolean().default(true),
    status: z.enum(["Active", "Inactive"]).default("Inactive"),
    open4register: z.boolean().default(false),
    showadmissionnotice: z.boolean().default(false),
    showteachername: z.boolean().default(true),
    days4showteachername: z.coerce
        .number({ message: "Days to show teacher name must be a number" })
        .int()
        .min(0, { message: "Days to show teacher name must be positive" })
        .default(0),
    allownewfamilytoregister: z.boolean().default(true),
    date4newfamilytoregister: z
        .date({ message: "Invalid date for new family to register" })
        .default(new Date(toESTString(new Date("1900-01-01")))),
    notes: z.string().max(2000, { message: "Notes must be at most 2000 characters" }).optional(),
});

// 3. Create/Update extras
export const makeSeasonInsertExtras = (user: DefaultSession["user"]) => {
    const insertExtras: Extras<SeasonTable> = {
        createddate: toESTString(new Date()),
        lastmodifieddate: toESTString(new Date()),
        updateby: user?.name || user?.email || "Unknown admin",
    };
    return insertExtras;
};

export const makeSeasonUpdateExtras = (user: DefaultSession["user"]) => {
    const updateExtras: Extras<SeasonTable> = {
        lastmodifieddate: toESTString(new Date()),
        updateby: user?.name || user?.email || "Unknown admin",
    };
    return updateExtras;
};

// 4. The Season Config
export const seasonConfig: EntityConfig<SeasonTable> = {
    table: seasons,
    tableName: "seasons",
    primaryKey: "seasonid",
    formSchema: seasonFormSchema,
    makeInsertExtras: makeSeasonInsertExtras,
    makeUpdateExtras: makeSeasonUpdateExtras,
};
