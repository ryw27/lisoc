import { z } from "zod/v4"
import { arrangementSchema } from "@/lib/shared/validation"
import { createInsertSchema } from "drizzle-zod";
import { classregistration } from "@/lib/db/schema";
import { toESTString } from "@/lib/utils";


// TODO: Add further refinement to make sure dates are in order
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

// Season reg settings
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

// Schema for starting a new semester
export const startSemFormSchema = z.object({
    seasonnamecn: z.string()
        .min(1, { message: "Season name is required." }),
    seasonnameen: z.string()
        .min(1, { message: "Season name is required." }),
    ...seasonDatesSchema.shape,
    ...seasonRegSettingsSchema.shape,
    classes: z.array(arrangementSchema).min(1)
})


export const arrangementArraySchema = z.object({
    classrooms: z.array(arrangementSchema)
})

// Schema for inserting into classregistration table
export const classRegistrationSchema = createInsertSchema(classregistration);

// Schema for inserting into classregistration table
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

// Registration schema for family registration page
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