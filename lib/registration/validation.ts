import { z } from "zod/v4";
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

export const oneSeasonDatesSchema = z.object({
    startdate: z.coerce.date(),
    enddate: z.coerce.date(),
    earlyregdate: z.coerce.date(),
    normalregdate: z.coerce.date(),
    lateregdate1: z.coerce.date(),
    lateregdate2: z.coerce.date(),
    closeregdate: z.coerce.date(),
    canceldeadline: z.coerce.date()
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

export const seasonSchema = z.object({
    seasonnamecn: z.string()
        .min(1, { message: "Season name is required." }),
    seasonnameen: z.string()
        .min(1, { message: "Season name is required." }),
    ...seasonDatesSchema.shape,
    ...seasonRegSettingsSchema.shape,
})

// Schema for starting a new semester
export const startSemFormSchema = z.object({
    ...seasonSchema.shape,
    arrangements: z.array(z.object({
        regClass: arrangementSchema,
        classrooms: z.array(arrangementSchema)
    })
    ).min(1)
})

export const familySchema = z.object({
    familyid: z.number().positive(),
    fatherfirsten: z
        .string()
        .max(72, { message: "Father's first name is too long" })
        .optional(),
    fatherlasten: z
        .string()
        .max(72, { message: "Father's last name is too long" })
        .optional(),
    fathernamecn: z
        .string()
        .max(50, { message: "Mother Chinese name is too long" })
        .optional(),
    motherlasten: z
        .string()
        .max(72, { message: "Mother's last name is too long" })
        .optional(),
    motherfirsten: z
        .string()
        .max(72, { message: "Mother's first name is too long" })
        .optional(),
    mothernamecn: z
        .string()
        .max(50, { message: "Mother Chinese name is too long" })
        .optional(),
    contact: z
        .string()
        .max(25, { message: "Contact is too long" })
        .optional(),
    address1: z
        .string()
        .max(100, { message: "Address is too long" })
        .optional(),
    officephone: z
        .string()
        .max(50, { message: "Office phone number is too long" })
        .optional(),
    cellphone: z
        .string()
        .max(50, { message: "Cell phone number is too long" })
        .optional(),
    email2: z
        .string()
        .max(100, { message: "Email is too long" })
        .optional(),
    status: z.boolean(),
    remark: z
        .string()
        .max(200, { message: "Remark is too long" })
        .optional(),
    schoolmember: z
        .string()
        .max(50, { message: "School member is too long" })
        .optional(),
    userid: z.uuid()
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