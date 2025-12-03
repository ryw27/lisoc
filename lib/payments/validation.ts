import { z } from "zod/v4";

export const checkApplySchema = z.object({
    balanceid: z.coerce.number(),
    amount: z.coerce.number(),
    checkNo: z.string(),
    paidDate: z.coerce.date(),
    note: z.string().optional()
})