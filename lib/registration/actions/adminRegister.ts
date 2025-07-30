import { db } from "@/lib/db";
import { seasonObj, famBalanceInsert } from "@/lib/shared/types";
import { regKind, uiClasses, uniqueRegistration } from "../types";
import { CLASSTIME_PERIOD_BOTH_TIMEID, EARLY_REG_DISCOUNT, LATE_REG_FEE_1, LATE_REG_FEE_2, REGISTRATION_FEE, REGSTATUS_SUBMITTED, toESTString } from "@/lib/utils";
import { canRegister, getArrSeason, getTotalPrice, Transaction } from "../helpers";
// import { z } from "zod/v4";
import { classregistration, familybalance } from "@/lib/db/schema";
import { ensureTimeline } from "../helpers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
// import { arrangementSchema } from "@/lib/shared/validation";
// import { familySchema, seasonDatesSchema, seasonSchema } from "../validation";
// import { requireRole } from "@/lib/auth";

// const regValidation = z.object({
//     arrData: arrangementSchema,
//     season: seasonSchema,
//     family: familySchema,
//     studentid: z.number().positive(),
//     override: z.boolean()
// })

export async function adminRegister(
    arrData: uiClasses, 
    season: seasonObj, 
    familyid: number, 
    studentid: number, 
    override: boolean
) {
    // 1. Auth Check and TODO: Parse data?
    // const user = await requireRole(["ADMIN"]);
    return await db.transaction(async (tx) => {
        // 2. Check other active registrations and ensure timeline is correct
        // TODO: Find a more efficient way of doing this
        const canRegisterTimeline = await ensureTimeline(
            tx,
            arrData.timeid,
            {
                seasonid: season.seasonid,
                familyid: familyid,
                studentid,
                classid: arrData.classid,
            }
        );
        if (!canRegisterTimeline) {
            throw new Error("Registered class does not fit this student's schedule");
        }

        // 3. Ensure season id's match
        if (arrData.seasonid !== season.seasonid) {
            throw new Error("Season of arrangement and passed in season do not match");
        }

        // 4. Ensure registration is open for this arrangement and there is no admin override present 
        const checkReg: regKind = await canRegister(tx, arrData, season);

        if (checkReg === "closed" && !override) {
            throw new Error("Registration is not currently open for this class");
        }

        // 5. Register student
        const arrSeason = await getArrSeason(tx, arrData);
        const [newReg] = await tx
            .insert(classregistration)
            .values({
                studentid: studentid,
                arrangeid: arrData.arrangeid!,
                seasonid: season.seasonid,
                isyearclass: arrSeason === "year",
                classid: arrData.classid,
                registerdate: toESTString(new Date()),
                statusid: REGSTATUS_SUBMITTED,
                familyid: familyid,
                byadmin: true,
                lastmodify: toESTString(new Date()),
                notes: "Admin register",
            })
            .returning()
        
        // 6. Open family balance
        const classPrice = getTotalPrice(tx, arrData, arrSeason);
        // Let defaults fill the rest
        const familyBalanceData: famBalanceInsert = {
            appliedregid: newReg.regid,
            seasonid: season.seasonid,
            familyid: familyid,
            regfee: arrData.waiveregfee ? "0" : REGISTRATION_FEE.toString(),
            earlyregdiscount: (checkReg === "early" ? EARLY_REG_DISCOUNT : 0).toString(),
            lateregfee: (checkReg === "late1" ? LATE_REG_FEE_1 : checkReg === "late2" ? LATE_REG_FEE_2 : 0).toString(),
            registerdate: newReg.registerdate,
            lastmodify: toESTString(new Date()),
            tuition: classPrice.toString(),
            totalamount: classPrice.toString(),
        };
        
        const [newBal] = await tx
            .insert(familybalance)
            .values(familyBalanceData)
            .returning();
        
        // 7. Update the class registration with the new fb id
        await tx
            .update(classregistration)
            .set({
                familybalanceid: newBal.balanceid
            })
            .where(eq(classregistration.regid, newReg.regid));


        revalidatePath("/admintest/management/semester");
        revalidatePath("/dashboard/classes");
        return newBal;
    })
}