import { db } from "@/lib/db";
import { familybalance, classregistration } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/app/lib/auth-lib/auth-actions";
import { 
    seasonObj,
    fambalanceObj,
    familyObj,
    famBalanceInsert
} from "@/lib/shared/types";
import { uiClasses } from "@/lib/registration/types";
import { toESTString } from "@/lib/utils";
import { REGISTRATION_FEE, LATE_REG_FEE } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { canRegister } from "../helpers";



// TODO: Check stuff with student
export async function familyRegister(
    arrData: uiClasses, 
    season: seasonObj, 
    balanceData: fambalanceObj | null, 
    family: familyObj, 
    studentid: number
) {
    // 1. Check user role
    const user = await requireRole(["FAMILY"], { redirect: false });
    if (!user || new Date(user.expires) <= new Date(Date.now())) {
        throw new Error("Expired user session. Please login again");
    }

    // 2. Begin transaction
    await db.transaction(async (tx) => {
        // 3. Check if this registration is valid
        if (!canRegister(arrData, tx)) {
            throw new Error("Registration not allowed")
        }

        // 4. Check if student exists
        const student = await tx.query.student.findFirst({
            where: (student, { eq, and }) => and(eq(student.studentid, studentid), eq(student.familyid, family.familyid))
        });

        if (!student) {
            throw new Error("Student not found");
        }

        // 5. Check for existing registration of this student in this season
        const existingReg = await tx.query.classregistration.findFirst({
            where: (reg, { and, eq }) => and(eq(reg.studentid, student.studentid), eq(reg.seasonid, season.seasonid)) 
        })

        // TODO: More comprehensive handling, especially with different periods or terms
        if (existingReg) {
            throw new Error("[RegisterClass Action Error] This student is already enrolled in a class"); 
        }

        // 6. Insert into classregistration. Use postgres default values for most
        const isyearclass = season.seasonid < season.beginseasonid && season.seasonid < season.relatedseasonid;
        const [inserted] = await tx
                .insert(classregistration)
                .values({
                    studentid: student.studentid,
                    arrangeid: arrData.arrangeid,
                    seasonid: season.seasonid,
                    isyearclass: isyearclass,
                    classid: arrData.classid,
                    registerdate: toESTString(new Date()),
                    familyid: family.familyid,
                    lastmodify: toESTString(new Date()),
                    notes: "",
                })
                .returning();

        if (!inserted) {
            throw new Error("Unknown registration error occured");
        }

        // 7. Calculate full price
        const fullPrice = isyearclass ? 
                            Number(arrData.tuitionW) + Number(arrData.bookfeeW) + Number(arrData.specialfeeW)
                            : Number(arrData.tuitionH) + Number(arrData.bookfeeH) + Number(arrData.specialfeeH);

        // 8. Check for existing balance
        const existingBalance = balanceData; // Null if no balance exists for this season

        // 9. Create family balance data
        // TODO: Figure out what all this means
        const familyBalanceData: famBalanceInsert = {
            seasonid: season.seasonid,
            familyid: family.familyid,
            yearclass: isyearclass ? arrData.classid : 0,
            yearclass4child: isyearclass ? arrData.classid : 0,
            semesterclass: isyearclass ? 0 : arrData.classid,
            semesterclass4child: isyearclass ? 0 : arrData.classid,
            childnum: student.studentno ? Number(student.studentno) : 0,
            childnumRegfee: 2, // TODO: What?
            studentnum: 1, // TODO: What?
            regfee: arrData.waiveregfee ? "0" : REGISTRATION_FEE.toString(), // Numeric requires string
            earlyregdiscount: (new Date(season.earlyregdate) >= new Date(Date.now()) ? 50 : 0).toString(),
            lateregfee: (season.haslateregfee && new Date(season.lateregdate1) >= new Date(Date.now())) ? LATE_REG_FEE.toString() : "0",
            extrafee4newfamily: (season.haslateregfee4newfamily && new Date(season.date4newfamilytoregister) >= new Date(Date.now())) ? LATE_REG_FEE.toString() : "0", // TODO: IS this logic correct?
            managementfee: "0", // TODO: What?
            dutyfee: "0", // TODO: What?
            cleaningfee: "0", // TODO: What?
            otherfee: "0", // TODO: What?
            tuition: fullPrice.toString(),
            totalamount: fullPrice.toString(),
            typeid: 1, // TODO: huh?
            statusid: 1, // TODO: huh?
            checkno: "",
            transactionno: "",
            registerdate: inserted.registerdate,
            reference: "", // TODO: huh?
            // userid: user.user.name ?? user.user.email ?? "Unknown user",
            groupdiscount: "0", // TODO: huh?
            processfee: "0", // TODO: huh?
        };

        // 10. Update or insert 
        let balance;
        if (existingBalance) {
            // Simply need to update the tuition
            [balance] = await tx.
                    update(familybalance)
                    .set({
                        regfee: arrData.waiveregfee // TODO: Check if you need to add more reg fees, same for rest of fields
                            ? "0"
                            : (existingBalance.regfee
                                ? (Number(existingBalance.regfee) + REGISTRATION_FEE).toString()
                                : REGISTRATION_FEE.toString()),
                        earlyregdiscount: (
                            new Date(season.earlyregdate) <= new Date(toESTString(new Date())) &&
                            new Date(toESTString(new Date())) < new Date(season.normalregdate)
                        )
                            ? existingBalance.earlyregdiscount
                                ? (50 + Number(existingBalance.earlyregdiscount)).toString()
                                : "50"
                            : "0",

                        lateregfee: (
                            season.haslateregfee &&
                            new Date(season.lateregdate1) <= new Date(toESTString(new Date())) &&
                            new Date(toESTString(new Date())) < new Date(season.lateregdate2)
                        )
                            ? existingBalance.lateregfee
                                ? (LATE_REG_FEE + Number(existingBalance.lateregfee)).toString()
                                : LATE_REG_FEE.toString()
                            : "0",
                        extrafee4newfamily: (
                            season.haslateregfee4newfamily &&
                            new Date(season.date4newfamilytoregister) <= new Date(toESTString(new Date())) &&
                            new Date(toESTString(new Date())) < new Date(season.lateregdate2)
                        )
                            ? existingBalance.extrafee4newfamily
                                ? (LATE_REG_FEE + Number(existingBalance.extrafee4newfamily)).toString()
                                : LATE_REG_FEE.toString()
                            : "0",
                        tuition: existingBalance.tuition ? (Number(existingBalance.tuition) + fullPrice).toString() : fullPrice.toString(),
                        totalamount: existingBalance.totalamount ? (Number(existingBalance.totalamount) + fullPrice).toString() : fullPrice.toString(),
                    })
                    .where(eq(familybalance.balanceid, existingBalance.balanceid))
                    .returning();
        } else {
            [balance] = await tx
                .insert(familybalance)
                .values(familyBalanceData)
                .returning();
        }

        if (!balance) {
            throw new Error("Unknown DB error occured with family balance");
        }

        // Update the classregistration with the new familybalance inserted object id
        await tx
            .update(classregistration)
            .set({
                familybalanceid: balance.balanceid,
            })
            .where(eq(classregistration.regid, inserted.regid));

        revalidatePath("/admintest/management/semester");
        revalidatePath("/dashboard/classes");
        return inserted;
    })
}