import { db } from "@/lib/db";
import { familybalance, classregistration } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth/actions/requireRole";
import { 
    seasonObj,
    fambalanceObj,
    familyObj,
    famBalanceInsert
} from "@/lib/shared/types";
import { regKind, uiClasses } from "@/lib/registration/types";
import { EARLY_REG_DISCOUNT, REGSTATUS_SUBMITTED, toESTString } from "@/lib/utils";
import { 
    REGISTRATION_FEE, 
    LATE_REG_FEE_1,
    LATE_REG_FEE_2
} from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { canRegister, ensureTimeline, getArrSeason, getTotalPrice } from "../helpers";



// TODO: Check stuff with student
export async function familyRegister(
    arrData: uiClasses, 
    season: seasonObj, 
    family: familyObj, 
    studentid: number
) {
    // 1. Check user role and TODO: parse data
    // const user = await requireRole(["FAMILY"], { redirect: false });

    await db.transaction(async (tx) => {
        // 2. Check other active registrations and ensure timeline is correct
        const canRegisterTimeline = await ensureTimeline(
            tx,
            arrData.timeid,
            {
                seasonid: season.seasonid,
                familyid: family.familyid,
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
        if (checkReg === "closed") {
            throw new Error("Registration is not currently open for this class");
        }

        // 5. Check existence of student in this family
        const student = await tx.query.student.findFirst({
            where: (student, { eq, and }) => and(
                eq(student.studentid, studentid), 
                eq(student.familyid, family.familyid)
            )
        });
        if (!student) {
            throw new Error("Student not found in this family");
        }

        // 6. Insert into classregistration. Use postgres default values for most
        const arrSeason = await getArrSeason(arrData);
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
                familyid: family.familyid,
                lastmodify: toESTString(new Date()),
                byadmin: false,
            })
            .returning()

        // 7. Calculate full price
        const classPrice = getTotalPrice(arrData, arrSeason);


        // 8. Create family balance data
        const familyBalanceData: famBalanceInsert = {
            appliedregid: newReg.regid,
            seasonid: season.seasonid,
            familyid: family.familyid,
            childnum: student.studentno ? Number(student.studentno) : 0,
            regfee: arrData.waiveregfee ? "0" : REGISTRATION_FEE.toString(), // Numeric requires string
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

        // 9. Update the classregistration with the new familybalance inserted object id
        await tx
            .update(classregistration)
            .set({
                familybalanceid: newBal.balanceid,
            })
            .where(eq(classregistration.regid, newReg.regid));

        revalidatePath("/admintest/management/semester");
        revalidatePath("/dashboard/classes");
        return newBal;
    })
}