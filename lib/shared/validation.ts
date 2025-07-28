import { z } from "zod/v4"


// TODO: Ensure this is reusable and correct. Possibly add some refinements
export const arrangementSchema = z.object({
    arrangeid: z.coerce.number()
        .int()
        .min(0, { message: "Class ID must be 0 or greater" })
        .optional(),
    classid: z.coerce.number()
        .int()
        .min(0, { message: "Class ID must be 0 or greater" }),
    teacherid: z.coerce.number()
        .int()
        .min(0, { message: "Teacher ID must be 0 or greater" }),
    roomid: z.coerce.number()
        .int()
        .min(0, { message: "Room ID must be 0 or greater" }),
    timeid: z.coerce.number()
        .int()
        .min(0, { message: "Time ID must be 0 or greater" }),
    seatlimit: z.coerce.number()
        .int()
        .min(0, { message: "Seat limit must be 0 or greater." })
        .nullable()
        .default(null),
    agelimit: z.coerce.number()
        .int()
        .min(0, { message: "Age limit must be 0 or greater." })
        .nullable()
        .default(null),
    suitableterm: z.coerce.number()
        .int()
        .min(0, { message: "Suitable term must be 0 or greater" }),
    term: z.enum(["SPRING", "FALL"]).optional(),
    waiveregfee: z.boolean().default(false),
    closeregistration: z.boolean().default(false),
    tuitionW: z.coerce.number()
        .min(0, { message: "Tuition (W) must be 0 or greater." })
        .default(0),
    specialfeeW: z.coerce.number()
        .min(0, { message: "Special fee (W) must be 0 or greater." })
        .default(0),
    bookfeeW: z.coerce.number()
        .min(0, { message: "Book fee (W) must be 0 or greater." })
        .default(0),
    tuitionH: z.coerce.number()
        .min(0, { message: "Tuition (H) must be 0 or greater." })
        .default(0),
    specialfeeH: z.coerce.number()
        .min(0, { message: "Special fee (H) must be 0 or greater." })
        .default(0),
    bookfeeH: z.coerce.number()
        .min(0, { message: "Book fee (H) must be 0 or greater." })
        .default(0),
    isregclass: z.boolean(),
    notes: z.string().max(500, { message: "Notes must be 500 characters or less." }).optional().nullable()
})