import { z } from "zod/v4";
import { arrangementSchema } from "@/lib/schema";

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
});

export const oneSeasonDatesSchema = z.object({
    startdate: z.coerce.date(),
    enddate: z.coerce.date(),
    earlyregdate: z.coerce.date(),
    normalregdate: z.coerce.date(),
    lateregdate1: z.coerce.date(),
    lateregdate2: z.coerce.date(),
    closeregdate: z.coerce.date(),
    canceldeadline: z.coerce.date(),
});

// Season reg settings
export const seasonRegSettingsSchema = z.object({
    haslateregfee: z.boolean(),
    haslateregfee4newfamily: z.boolean(),
    hasdutyfee: z.boolean(),
    showadmissionnotice: z.boolean(),
    showteachername: z.boolean(),
    days4showteachername: z.int().min(0, { message: "Must be positive" }),
    allownewfamilytoregister: z.boolean(),
    date4newfamilytoregister: z.coerce.date(),
    isspring: z.boolean().optional(),
});

export const seasonSchema = z.object({
    seasonnamecn: z.string().min(1, { message: "Season name is required." }),
    seasonnameen: z.string().min(1, { message: "Season name is required." }),
    ...seasonDatesSchema.shape,
    ...seasonRegSettingsSchema.shape,
});

// Schema for starting a new semester
export const startSemFormSchema = z.object({
    ...seasonSchema.shape,
    classes: z.array(arrangementSchema).min(1),
});
