import { z } from "zod/v4";

export const confirmDutySchema = z.object({
    seasonid: z.number().int().positive(),
    /** `YYYY-MM-DD`, taken from the duty date dropdown. */
    dutydate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a duty date"),
    rows: z
        .array(
            z.object({
                familyid: z.number().int().positive(),
                studentid: z.number().int().positive(),
            })
        )
        .min(1, "Nothing has been assigned yet"),
});

export const autoDistributeSchema = z.object({
    seasonid: z.number().int().positive(),
    /** Duty dates kept in the dialog, `YYYY-MM-DD`. */
    dutydates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1, "Keep at least one date"),
    rows: z
        .array(
            z.object({
                familyid: z.number().int().positive(),
                studentid: z.number().int().positive(),
            })
        )
        .min(1, "The available list is empty"),
});

export const updateDutyAssignmentSchema = z.object({
    dutyassignid: z.number().int().positive(),
    dutystatus: z.number().int().min(1).max(5),
    note: z.string().max(150).nullable(),
});

export const deleteDutyAssignmentSchema = z.object({
    dutyassignid: z.number().int().positive(),
});
