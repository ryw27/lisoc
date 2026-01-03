"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { classregistration, familybalance } from "@/lib/db/schema";
// import { requireRole } from "@/lib/auth/actions/requireRole";
import { famBalanceInsert, familyObj, seasonObj, type uiClasses } from "@/lib/types.shared";
import {
    EARLY_REG_DISCOUNT,
    FAMILYBALANCE_STATUS_PENDING,
    FAMILYBALANCE_STATUS_PROCESSED,
    FAMILYBALANCE_TYPE_TUITION,
    LATE_REG_FEE_1,
    LATE_REG_FEE_2,
    REGISTRATION_FEE,
    REGSTATUS_SUBMITTED,
    toESTString,
} from "@/lib/utils";
import { regKind } from "@/types/registration.types";
import { canRegister, ensureTimeline, getArrSeason, getTotalPrice } from "../data";

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
        const canRegisterTimeline = await ensureTimeline(tx, arrData.timeid, {
            seasonid: season.seasonid,
            familyid: family.familyid,
            studentid,
            classid: arrData.classid,
        });

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
            where: (student, { eq, and }) =>
                and(eq(student.studentid, studentid), eq(student.familyid, family.familyid)),
        });
        if (!student) {
            throw new Error("Student not found in this family");
        }

        const arrSeason = await getArrSeason(tx, arrData);

        // 7. Calculate full price
        const classPrice = await getTotalPrice(tx, arrData, arrSeason);

        //this has to be in tranaction in with classregistration insert an familybalance insert/update
        // select * from familybalance where familyid and seasonid and appliedid=0 and statusid != 5

        const [existingBal] = await tx
            .select()
            .from(familybalance)
            .where(
                and(
                    eq(familybalance.familyid, family.familyid),
                    eq(familybalance.seasonid, season.seasonid),
                    eq(familybalance.appliedid, 0),
                    ne(familybalance.statusid, FAMILYBALANCE_STATUS_PROCESSED) // Not cancelled
                )
            )
            .limit(1)
            .for("update");

        let balanceObj = null;

        if (existingBal) {
            // Update existing balance
            //set yearclass+1 yearclass4child +1 childnum +1 student +1   tuition + new tuition totalamount + new totalamount
            const newyearclass = existingBal.yearclass ? existingBal.yearclass + 1 : 1;
            const newyearclass4child = existingBal.yearclass4child
                ? existingBal.yearclass4child + 1
                : 1;

            const newChildNum = existingBal.childnum ? existingBal.childnum + 1 : 1;
            const newTuition = existingBal.tuition
                ? Number(existingBal.tuition) + classPrice
                : classPrice;
            const newTotal = existingBal.totalamount
                ? Number(existingBal.totalamount) + classPrice
                : classPrice;
            await tx
                .update(familybalance)
                .set({
                    yearclass: newyearclass,
                    yearclass4child: newyearclass4child,
                    childnum: newChildNum,
                    tuition: newTuition.toString(),
                    totalamount: newTotal.toString(),
                })
                .where(eq(familybalance.balanceid, existingBal.balanceid));

            balanceObj = existingBal;
        } else {
            // New balance
            // 8. Create family balance data
            const familyBalanceData: famBalanceInsert = {
                appliedregid: 0, // this is for drop out class or transfer class not for family balance
                seasonid: season.seasonid,
                familyid: family.familyid,
                childnum: 1,
                yearclass: 1,
                yearclass4child: 1,
                regfee: arrData.waiveregfee ? "0" : REGISTRATION_FEE.toString(), // Numeric requires string
                earlyregdiscount: (checkReg === "early" ? EARLY_REG_DISCOUNT : 0).toString(),
                lateregfee: (checkReg === "late1"
                    ? LATE_REG_FEE_1
                    : checkReg === "late2"
                      ? LATE_REG_FEE_2
                      : 0
                ).toString(),
                registerdate: toESTString(new Date()),
                lastmodify: toESTString(new Date()),
                typeid: FAMILYBALANCE_TYPE_TUITION,
                statusid: FAMILYBALANCE_STATUS_PENDING, // Pending
                notes: "",
                tuition: classPrice.toString(),
                totalamount: classPrice.toString(),
            };

            const [newBal] = await tx.insert(familybalance).values(familyBalanceData).returning();

            balanceObj = newBal;
        }

        // 6. Insert into classregistration. Use postgres default values for most
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
                familybalanceid: balanceObj.balanceid,
                lastmodify: toESTString(new Date()),
                byadmin: false,
            })
            .returning();

        console.log(newReg.regid);

        // 9. Update the classregistration with the new familybalance inserted object id
        /*
        await tx
            .update(classregistration)
            .set({
                familybalanceid: newBal.balanceid,
            })
            .where(eq(classregistration.regid, newReg.regid));
        */
        revalidatePath("/admin/management/semester");
        revalidatePath("/dashboard/classes");
        return balanceObj;
    });
}
