import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classregistration } from "@/lib/db/schema";
import { toESTString } from "@/lib/utils";

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
    userid: z.string().default("0"),
    lastmodify: z.string().default("1900-01-01 00:00:00"),
    notes: z.string().max(500),
});

// Registration schema for family registration page
export const newRegSchema = z
    .object({
        studentid: z.coerce.number().min(0),
        registeredClasses: z.array(
            z
                .object({
                    seasonid: z.number().int().optional(),
                    arrid: z.number().int().optional(),
                })
                .refine(
                    (v) =>
                        (v.seasonid === undefined && v.arrid === undefined) ||
                        (v.seasonid !== undefined && v.arrid !== undefined),
                    {
                        message: "Both season and class must be provided",
                    }
                )
        ),
    })
    .transform(({ studentid, registeredClasses }) => ({
        studentid,
        registeredClasses: registeredClasses.filter(
            (s): s is { seasonid: number; arrid: number } =>
                typeof s.seasonid === "number" && typeof s.arrid === "number"
        ),
    }))
    .refine((data) => data.registeredClasses.length >= 1 && data.registeredClasses.length <= 3, {
        message: "Pick 1 - 3 classes",
    });
