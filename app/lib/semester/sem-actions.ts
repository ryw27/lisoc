"use server";
import { db } from "../db";
import { arrangement, classregistration, familybalance, seasons, student } from "../db/schema";
import type { InferInsertModel } from "drizzle-orm";
import { requireRole } from "../auth-lib/auth-actions";
import { and, desc, eq, InferSelectModel, or } from "drizzle-orm";
import { startSemFormSchema, type uiClasses, type selectOptions, arrangementSchema, IdMaps, seasonDatesSchema, seasonRegSettingsSchema, type term, registrationSchema, checkApplySchema, arrangementArraySchema, fullRegClass } from "./sem-schemas";
import { inSpring } from "./sem-utils";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { toESTString } from "@/lib/utils";
import { studentSchema } from "./sem-schemas";
import { familyObject } from "@/app/admintest/data/(people-pages)/families/family-helpers"; 
import { ArrowDownRightFromCircle } from "lucide-react";
import ClassroomPage from "@/app/admintest/data/(class-pages)/classrooms/[roomid]/page";

const SEMESTERONLY_SUITBALETERM_FOREIGNKEY = 2;
const REGISTRATION_FEE = 0;
const LATE_REG_FEE = 0;

export type Transaction = Parameters<Parameters<typeof db["transaction"]>[0]>[0];

export async function getSeasonDrafts(tx: Transaction, seasonid: number) {
    const seasonRows = await tx.query.arrangement.findMany({
        where: eq(arrangement.seasonid, seasonid),
        columns: {
            activestatus: false,
            regstatus: false,
            lastmodify: false,
            updateby: false,
        },
        // with: {
        //     season: {
        //         columns: {
        //             seasonid: true,
        //             seasonnamecn: true,
        //             seasonnameeng: true
        //         }
        //     },
        //     class: {
        //         columns: {
        //             classid: true,
        //             classnamecn: true,
        //             classnameen: true
        //         }
        //     },
        //     teacher: {
        //         columns: {
        //             teacherid: true,
        //             namecn: true,
        //             namefirsten: true,
        //             namelasten: true
        //         }
        //     },
        //     classroom: {
        //         columns: {
        //             roomid: true,
        //             roomno: true
        //         }
        //     },
        //     classtime: {
        //         columns: {
        //             timeid: true,
        //             period: true
        //         }
        //     },
        //     suitableterm: {
        //         columns: {
        //             termno: true,
        //             suitableterm: true,
        //             suitabletermcn: true
        //         }
        //     }
        // },
        orderBy: (arrangement, { asc }) => [asc(arrangement.suitableterm), asc(arrangement.agelimit)]
    }) satisfies uiClasses[];

    return seasonRows;
}

export async function getCurrentSeason(seasonid: number): Promise<uiClasses[]> {
    return await db.transaction(async (tx) => {
        return await getSeasonDrafts(tx, seasonid);
    })
}

// export async function getPreviousSeason() {
//     return await db.transaction(async (tx) => {
//         // Check for previous season
//         const maxSeasonRow = await tx
//             .select()
//             .from(seasons)
//             .orderBy(desc(seasons.seasonid))
//             .limit(3);

//         if (!maxSeasonRow || maxSeasonRow.length === 0) {
//             // In case
//             return { lastSeasonArrangements: { yearRows: [], fallRows: [], springRows: [] }, lastSeason: [{}, {}, {}] as InferSelectModel<typeof seasons>[] };
//         }
//         // TODO: Change -1 to -2 to get previous academic year in prod
//         const yearRows = await getSeasonDrafts(tx, maxSeasonRow[2].seasonid - 1); // Previous academic year
//         const fallRows = await getSeasonDrafts(tx, maxSeasonRow[1].seasonid); // Fall semester
//         const springRows = await getSeasonDrafts(tx, maxSeasonRow[0].seasonid); // Spring semester

//         return { lastSeasonArrangements: { yearRows, fallRows, springRows }, lastSeason: [maxSeasonRow[0], maxSeasonRow[1], maxSeasonRow[2]] };
//     }) 
// }

// TODO: TEMP FUNCTION TO WORK IN DEV. 
export async function getPreviousSeason() {
    return await db.transaction(async (tx) => {
        const maxSeasonRow = await tx
            .select()
            .from(seasons)
            .orderBy(desc(seasons.seasonid))
            .limit(2);

        const arrangements = await getSeasonDrafts(tx, maxSeasonRow[0].seasonid - 1);
        return { lastSeasonArrangements: { yearRows: arrangements, fallRows: [], springRows: [] }, lastSeason: [maxSeasonRow[0], maxSeasonRow[1]] };
    })
}

export async function startSemester(data: z.infer<typeof startSemFormSchema>) {
    // Check incoming data
    const semData = startSemFormSchema.parse(data)

    // Check user and redirect if not authorized
    // const user = await requireRole(["ADMIN"], { redirect: true });
    return await db.transaction(async (tx) => {
        // Check if any seasons are active and disable them
        await tx
            .update(seasons)
            .set({ status: "Inactive" })
            .where(eq(seasons.status, "Active"));

        const [academicYear] = await tx 
            .insert(seasons)
            .values({
                seasonnamecn: semData.seasonnamecn,
                seasonnameeng: semData.seasonnameen,
                isspring: false,
                relatedseasonid: 0,
                beginseasonid: 0,
                haslateregfee: semData.haslateregfee,
                haslateregfee4newfamily: semData.haslateregfee4newfamily,
                hasdutyfee: semData.hasdutyfee,
                startdate: toESTString(semData.fallstart), // Full Academic Year
                enddate: toESTString(semData.springend), // Full Academic Year
                earlyregdate: toESTString(semData.fallearlyreg),
                normalregdate: toESTString(semData.fallnormalreg),
                lateregdate1: toESTString(semData.falllatereg),
                lateregdate2: toESTString(semData.falllatereg),
                closeregdate: toESTString(semData.fallclosereg),
                canceldeadline: toESTString(semData.fallcanceldeadline),
                hasdeadline: true,
                status: "Active",
                open4register: new Date(Date.now()) >= new Date(semData.fallearlyreg),
                showadmissionnotice: semData.showadmissionnotice,
                showteachername: semData.showteachername,
                days4showteachername: semData.days4showteachername,
                allownewfamilytoregister: semData.allownewfamilytoregister,
                date4newfamilytoregister: semData.date4newfamilytoregister ? toESTString(semData.date4newfamilytoregister) : toESTString(semData.fallearlyreg),
                createddate: toESTString(new Date()),
                lastmodifieddate: toESTString(new Date()),
                updateby: "testaccount" // user.user.name ?? user.user.email ?? "Unknown admin"
            })
            .returning();

        const [fallSem] = await tx
            .insert(seasons)
            .values({
                seasonnamecn: `${semData.seasonnamecn} 秋季`,
                seasonnameeng: `${semData.seasonnamecn} Fall Semester`,
                isspring: false,
                relatedseasonid: academicYear.seasonid,
                beginseasonid: 0,
                haslateregfee: semData.haslateregfee,
                haslateregfee4newfamily: semData.haslateregfee4newfamily,
                hasdutyfee: semData.hasdutyfee,
                startdate: toESTString(semData.fallstart),
                enddate: toESTString(semData.fallend),
                earlyregdate: toESTString(semData.fallearlyreg),
                normalregdate: toESTString(semData.fallnormalreg),
                lateregdate1: toESTString(semData.falllatereg),
                lateregdate2: toESTString(semData.falllatereg),
                closeregdate: toESTString(semData.fallclosereg),
                canceldeadline: toESTString(semData.fallcanceldeadline),
                hasdeadline: true,
                status: "Active",
                open4register: new Date(Date.now()) >= new Date(semData.fallearlyreg),
                showadmissionnotice: semData.showadmissionnotice,
                showteachername: semData.showteachername,
                days4showteachername: semData.days4showteachername,
                allownewfamilytoregister: semData.allownewfamilytoregister,
                date4newfamilytoregister: toESTString(semData.fallearlyreg),
                createddate: toESTString(new Date()),
                lastmodifieddate: toESTString(new Date()),
                updateby: "testaccount" // user.user.name ?? user.user.email ?? "Unknown admin" 
            })
            .returning()

        const [springSem] = await tx
            .insert(seasons)
            .values({
                seasonnamecn: `${semData.seasonnamecn} 春季`,
                seasonnameeng: `${semData.seasonnamecn} Spring Semester`,
                isspring: true,
                relatedseasonid: academicYear.seasonid,
                beginseasonid: fallSem.seasonid,
                haslateregfee: semData.haslateregfee,
                haslateregfee4newfamily: semData.haslateregfee4newfamily,
                hasdutyfee: semData.hasdutyfee,
                startdate: toESTString(semData.springstart),
                enddate: toESTString(semData.springend),
                earlyregdate: toESTString(semData.springearlyreg),
                normalregdate: toESTString(semData.springnormalreg),
                lateregdate1: toESTString(semData.springlatereg),
                lateregdate2: toESTString(semData.springlatereg),
                closeregdate: toESTString(semData.springclosereg),
                canceldeadline: toESTString(semData.springcanceldeadline),
                hasdeadline: true,
                status: "Inactive", // Start with fall semester
                open4register: false,
                showadmissionnotice: semData.showadmissionnotice,
                showteachername: semData.showteachername,
                days4showteachername: semData.days4showteachername,
                allownewfamilytoregister: semData.allownewfamilytoregister,
                date4newfamilytoregister: toESTString(semData.springearlyreg),
                createddate: toESTString(new Date()),
                lastmodifieddate: toESTString(new Date()),
                updateby: "testaccount" // user.user.name ?? user.user.email ?? "Unknown admin" 
            })
            .returning()
            
        // TODO: Check if this is needed
        await tx
            .update(seasons)
            .set({
                relatedseasonid: springSem.seasonid,
                beginseasonid: fallSem.seasonid,
            })
            .where(eq(seasons.seasonid, academicYear.seasonid))
            .returning();


        // Ensure any open or active arrangements are closed and set inactive
        await tx
            .update(arrangement)
            .set({ activestatus: "Inactive", regstatus: "Close"})
            .where(or(eq(arrangement.activestatus, "Active"), eq(arrangement.regstatus, "Open")));

        // Push into arrangements
        for (const classData of semData.classes) {
            const parsedClass = arrangementSchema.parse(classData);
            // TODO: Uncomment once this is fixed
            // const { seasonid, activestatus, regstatus } = await getTermVariables(parsedClass, academicYear, tx);
            // Term should only appear if semester only is chosen for suitable term
            const seasonid = academicYear.seasonid;
            let activestatus = "Active";
            let regstatus = "Open";
            
            if ("term" in parsedClass && parsedClass.term === "SPRING") {
                activestatus = "Inactive";
                regstatus = "Closed"
            }

            await tx
                .insert(arrangement)
                .values({
                    seasonid: seasonid,
                    classid: classData.classid,
                    teacherid: classData.teacherid,
                    roomid: classData.roomid,
                    timeid: classData.timeid, 
                    seatlimit: classData.seatlimit,
                    agelimit: classData.agelimit,
                    suitableterm: classData.suitableterm,
                    waiveregfee: classData.waiveregfee,
                    activestatus: activestatus,
                    regstatus: regstatus,
                    closeregistration: classData.closeregistration,
                    tuitionW: classData.tuitionW?.toString() || "0",
                    bookfeeW: classData.bookfeeW?.toString() || "0",
                    specialfeeW: classData.specialfeeW?.toString() || "0",
                    tuitionH: classData.tuitionH?.toString() || "0",
                    bookfeeH: classData.bookfeeH?.toString() || "0",
                    specialfeeH: classData.specialfeeH?.toString() || "0",
                    notes: classData?.notes || "",
                    lastmodify: toESTString(new Date()),
                    updateby: "testaccount", // user.user.name ?? user.user.email ?? "Unknown",
                    isregclass: true // Should be reg class. Show only reg classes in class select
                })
        }
        return academicYear;
    });
}

// Season is the academic year
export async function getTermVariables(parsedData: z.infer<typeof arrangementSchema>, season: InferSelectModel<typeof seasons>, tx: Transaction) {
    let seasonid = season.seasonid;
    let activestatus = "Active";
    let regstatus = "Open";
    if (parsedData.suitableterm === SEMESTERONLY_SUITBALETERM_FOREIGNKEY) { // ID Number for the semester only key in suitbaleterms. Term should exist if first part is true
        if ("term" in parsedData) {
            // Get the spring semester to check if spring semester is right now
            const springSem = await tx.query.seasons.findFirst({
                where: (seasons, { eq }) => eq(seasons.seasonid, season.relatedseasonid)
            });
            // Spring semester validity check
            if (!springSem || !springSem.isspring || springSem.relatedseasonid !== season.seasonid) {
                throw new Error("[AddArrangement Action Error]: Spring semester not correctly set or wrong season passed in");
            }
            if (parsedData.term === "SPRING") {
                seasonid = season.relatedseasonid;
                ({ regstatus, activestatus } = inSpring(springSem) ? { regstatus: "Open", activestatus: "Active" } : { regstatus: "Close", activestatus: "Inactive" });
            } else {
                // Archival purposes in case
                seasonid = season.beginseasonid; 
                ({ regstatus, activestatus } = inSpring(springSem) ? { regstatus: "Close", activestatus: "Inactive" } : { regstatus: "Open", activestatus: "Active" });
            }
        } else {
            throw new Error("Term does not exist on data despite semester only input");
        }
    }
    return { seasonid, activestatus, regstatus };
}

export async function addArrangement(data: z.infer<typeof arrangementArraySchema>, season: InferSelectModel<typeof seasons>) {
    // Auth check 
    // const user = await requireRole(["ADMIN"]);

    // Parse data
    const parsedArray = arrangementArraySchema.parse(data);

    return await db.transaction(async (tx) => {
        for (const data of parsedArray.classrooms) {
            const parsedData = arrangementSchema.parse(data);
            const { seasonid, activestatus, regstatus } = await getTermVariables(parsedData, season, tx);
            console.log(parsedData.roomid);

            const inserted = await tx
                .insert(arrangement)
                .values({
                    seasonid: seasonid,
                    classid: parsedData.classid,
                    teacherid: parsedData.teacherid,
                    roomid: parsedData.roomid,
                    timeid: parsedData.timeid,
                    seatlimit: parsedData.seatlimit,
                    agelimit: parsedData.agelimit,
                    suitableterm: parsedData.suitableterm,
                    waiveregfee: parsedData.waiveregfee,
                    activestatus: activestatus,
                    regstatus: regstatus,
                    closeregistration: parsedData.closeregistration,
                    tuitionW: parsedData.tuitionW.toString(),
                    bookfeeW: parsedData.bookfeeW.toString(),
                    specialfeeW: parsedData.specialfeeW.toString(),
                    tuitionH: parsedData.tuitionH.toString(),
                    bookfeeH: parsedData.bookfeeH.toString(),
                    specialfeeH: parsedData.specialfeeH.toString(),
                    notes: parsedData.notes ?? "",
                    lastmodify: toESTString(new Date()),
                    isregclass: true,
                    updateby: "admin"
                })
                .returning();
            return inserted[0];
        }
        revalidatePath(`/admintest/management/semester`);
    })
}


// TODO: Check this 
export async function updateArrangement(data: z.infer<typeof arrangementArraySchema>, season: InferSelectModel<typeof seasons>) {
    // const user = await requireRole(["ADMIN"]);
    return await db.transaction(async (tx) => {
        const parsedArray = arrangementArraySchema.parse(data);
        // Ensure arrangeid is present and valid. It should since it's an update
        const { seasonid, activestatus, regstatus } = await getTermVariables(parsedArray.classrooms[0], season, tx);
        const regClassObject = {
            ...parsedArray.classrooms[0],
            seasonid: seasonid,
            activestatus: activestatus,
            regstatus: regstatus,
            tuitionW: parsedArray.classrooms[0].tuitionW?.toString() ?? null,
            specialfeeW: parsedArray.classrooms[0].specialfeeW?.toString() ?? null,
            bookfeeW: parsedArray.classrooms[0].bookfeeW?.toString() ?? null,
            tuitionH: parsedArray.classrooms[0].tuitionH?.toString() ?? null,
            specialfeeH: parsedArray.classrooms[0].specialfeeH?.toString() ?? null,
            bookfeeH: parsedArray.classrooms[0].bookfeeH?.toString() ?? null,
            lastmodify: toESTString(new Date()),
            updateby: "testaccount"
        } satisfies InferInsertModel<typeof arrangement>;

        for (const data of parsedArray.classrooms) {
            const parsedData = arrangementSchema.parse(data);
            if (parsedData.isregclass) {
                if (typeof parsedData.arrangeid !== "number" || isNaN(parsedData.arrangeid)) {
                    throw new Error("Update data does not contain a valid arrange ID identifier");
                }
                const { arrangeid, ...updateData } = regClassObject;
                const updated = await tx
                    .update(arrangement)
                    .set({
                        ...updateData
                    })
                    .where(eq(arrangement.arrangeid, parsedData.arrangeid))
                    .returning();
            } else {
                // Either updating or adding
                if (parsedData.arrangeid) {
                    // Update
                    const { arrangeid, ...updateData } = regClassObject;
                    const updated = await tx
                        .update(arrangement)
                        .set({
                            ...updateData, // Handles update to the three important columns for non reg classes
                            isregclass: false,
                            classid: parsedData.classid,
                            teacherid: parsedData.teacherid,
                            roomid: parsedData.roomid,
                            seatlimit: parsedData.seatlimit
                        })
                        .where(eq(arrangement.arrangeid, parsedData.arrangeid));
                } else {
                    const { arrangeid, ...updateData } = regClassObject;
                    await tx
                        .insert(arrangement)
                        .values({
                            ...updateData,
                            isregclass: false,
                            classid: parsedData.classid,
                            teacherid: parsedData.teacherid,
                            roomid: parsedData.roomid,
                            seatlimit: parsedData.seatlimit
                        })
                }
            }
        }
    })
}

export async function getSubClassrooms(regclassid: number) {
    const classrooms = await db.query.classes.findMany({
        where: (c, { eq }) => eq(c.gradeclassid, regclassid)
    });

    return classrooms
}

// TODO: Change based on new format
export async function deleteClass(classData: uiClasses) {
    return await db.transaction(async (tx) => {
        if (typeof classData.arrangeid !== "number" || isNaN(classData.arrangeid)) {
            throw new Error("Update data does not contain a valid arrange ID identifier");
        }

        // Delete any related registrations
        await tx
            .delete(classregistration)
            .where(and(
                eq(classregistration.classid, classData.classid),
                eq(classregistration.seasonid, classData.seasonid)
            ));

        // Then delete the arrangement
        const deleted = await tx
            .delete(arrangement)
            .where(and(
                eq(arrangement.arrangeid, classData.arrangeid),
                eq(arrangement.seasonid, classData.seasonid)
            ))
            .returning();

        if (!deleted.length) {
            throw new Error("Failed to delete class arrangement");
        }

        
        return deleted[0];
    });
}

export async function canRegister(regData: uiClasses, tx: Transaction) {
    // Check if valid 
    const arrangement = await tx.query.arrangement.findFirst({
        where: (arr, { eq }) => eq(arr.arrangeid, regData.arrangeid as number),
        with: {
            season: {}
        }
    });

    if (!arrangement) {
        throw new Error("No arrangement found for registered class")
    }

    const now = new Date(Date.now());
    // Spring class and fall
    const springSem = inSpring(arrangement.season);
    if (springSem && !arrangement.season.isspring) {
        return false;
    }
    // Fall class and spring
    else if (!springSem && arrangement.season.isspring) {
        return false;
    }

    // Check for valid registration date - as long as it's after early reg and before late reg
    if (now <= new Date(arrangement.season.earlyregdate) || now >= new Date(arrangement.season.lateregdate1)) {
        return false;
    }

    return true;
}

// TODO: Check stuff with student
export async function registerClass(arrData: uiClasses, season: InferSelectModel<typeof seasons>, balanceData: InferSelectModel<typeof familybalance> | null, family: familyObject, studentid: number) {
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
        const familyBalanceData: InferInsertModel<typeof familybalance> = {
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

export async function distributeStudents(data: fullRegClass, moved: { studentid: number, toarrangeid: number, toclassid: number }[]) {
    // Update class registrations from regclass to actual classroom
    await db.transaction(async (tx) => {
        for (const student of moved) {
            await tx
                .update(classregistration)
                .set({
                    arrangeid: student.toarrangeid,
                    classid: student.toclassid,
                    lastmodify: toESTString(new Date())
                })
                .where(and(
                    eq(classregistration.studentid, student.studentid), 
                    eq(classregistration.seasonid, data.arrinfo.seasonid),
                    eq(classregistration.arrangeid, data.arrinfo.arrangeid as number) // Should be in registrations. If not, this is the wrong function
                ))
        }
    })
}

export async function rollbackDistribution(data: fullRegClass) {
    await db.transaction(async (tx) => {
        if (!data.arrinfo.arrangeid || data.arrinfo.arrangeid === 0) {
            throw new Error("Arrange identifier does not exist in data in rollback.")
        }

        for (const classroom of data.classrooms) {
            // console.log(student, data.arrinfo.arrangeid, data.arrinfo.classid)
            if (!classroom.arrinfo.arrangeid || classroom.arrinfo.arrangeid === 0) {
                throw new Error("Arrange identifier does not exist in classroom in rollback");
            }
            for (const student of classroom.students) {
                const [test] = await tx
                    .update(classregistration)
                    .set({
                        arrangeid: data.arrinfo.arrangeid,
                        classid: data.arrinfo.classid,
                        lastmodify: toESTString(new Date())
                    })
                    .where(and(
                        eq(classregistration.studentid, student.studentid), 
                        eq(classregistration.seasonid, data.arrinfo.seasonid),
                        eq(classregistration.arrangeid, classroom.arrinfo.arrangeid) 
                    ))
                    .returning()
                console.log("test: ", test);
            }
        }
    })
}

export async function dropRegistration(regid: number, orgTuition: number) {
    await db.transaction(async (tx) => {
        const reg = await tx.query.classregistration.findFirst({
            where: (r, { eq }) => eq(r.regid, regid),
            with: {
                season: { }
            }
        });
        if (!reg) {
            throw new Error("Registration not found");
        }
        // 3 possibilities
        // 1. Delete the reg
        // 2. Drop out
        // 3. Refund 
        // If after cancel deadline, drop out. If before, delete and refund
        const pastCancel = new Date(toESTString(new Date())) >= new Date(reg.season.canceldeadline);
        if (pastCancel) {
            await tx
                .update(classregistration)
                .set({
                    statusid: 4, // Dropout. Check validity of this
                    previousstatusid: reg.statusid
                })
                .where(eq(classregistration.regid, regid))
            // No refund :(
        } else {
            await tx
                .delete(classregistration)
                .where(eq(classregistration.regid, regid));
            const orgBalance = await tx.query.familybalance.findFirst({
                where: (fb, { and, eq }) => and(eq(fb.familyid, reg.familyid), eq(fb.seasonid, reg.seasonid))
            });
            // Paranoia 
            if (!orgBalance) {
                throw new Error("Original family balance corresponding to this registration was not found");
            }

            await tx 
                .update(familybalance)
                .set({
                    tuition: (Number(orgBalance.tuition) - orgTuition).toString(),
                    totalamount: (Number(orgBalance.totalamount) - orgTuition).toString()
                })
                .where(and(eq(familybalance.familyid, reg.familyid), eq(familybalance.seasonid, reg.seasonid)));
        }
        revalidatePath("/admintest/management/semester");
        revalidatePath("/dashboard/classes");
    })
}

export async function getSelectOptions() {
    const teachers = await db.query.teacher.findMany({
        columns: {
            teacherid: true,
            namecn: true,
            namelasten: true,
            namefirsten: true
        }
    });

    // Get registration classes only
    const classes = await db.query.classes.findMany({
        // where: (classes, { eq }) => eq(classes.gradeclassid, classes.classid), // TODO: Uncomment this
        columns: {
            classid: true,
            classnamecn: true,
            classnameen: true,
        }
    })

    const rooms = await db.query.classrooms.findMany({
        columns: {
            roomid: true,
            roomno: true,
        }
    })

    const times = await db.query.classtime.findMany({
        columns: {
            timeid: true,
            period: true,
        }
    })

    const terms = await db.query.suitableterm.findMany({
        columns: {
            termno: true,
            suitableterm: true,
            suitabletermcn: true 
        }
    })
    const options = {
        teachers: teachers,
        classes: classes,
        rooms: rooms,
        times: times,
        terms: terms
    } satisfies selectOptions;


    const idMaps = {
        teacherMap: Object.fromEntries(
            teachers.map(teacher => [teacher.teacherid, teacher])
        ),
        classMap: Object.fromEntries(
            classes.map(cls => [cls.classid, cls])
        ),
        roomMap: Object.fromEntries(
            rooms.map(room => [room.roomid, room])
        ),
        timeMap: Object.fromEntries(
            times.map(time => [time.timeid, time])
        ),
        termMap: Object.fromEntries(
            terms.map(term => [term.termno, term])
        ),
    } satisfies IdMaps;


    return { options, idMaps };
}


// Semester Controls
export async function updateDates(data: z.infer<typeof seasonDatesSchema>, inSeason: InferSelectModel<typeof seasons>) {
    const parsed = seasonDatesSchema.parse(data);
    await db.transaction(async (tx) => {
        const [updatedYear] = await tx
        .update(seasons)
        .set({
            startdate: toESTString(parsed.fallstart),
            enddate: toESTString(parsed.springend),
            earlyregdate: toESTString(parsed.fallearlyreg),
            normalregdate: toESTString(parsed.fallnormalreg), 
            lateregdate1: toESTString(parsed.falllatereg),
            lateregdate2: toESTString(parsed.falllatereg),
            closeregdate: toESTString(parsed.fallclosereg),
            canceldeadline: toESTString(parsed.fallcanceldeadline),
        })
        .where(eq(seasons.seasonid, inSeason.seasonid))
        .returning();

        if (!updatedYear) {
            throw new Error("Unknown DB error occured with season update");
        }

        if (inSeason.seasonid + 1 !== inSeason.beginseasonid) {
            throw new Error("Fall Semester ID does not match expected value in academic year row");
        }

        const [updatedFall] = await tx
            .update(seasons)
            .set({
                startdate: toESTString(parsed.fallstart),
                enddate: toESTString(parsed.fallend),
                earlyregdate: toESTString(parsed.fallearlyreg),
                normalregdate: toESTString(parsed.fallnormalreg), 
                lateregdate1: toESTString(parsed.falllatereg),
                lateregdate2: toESTString(parsed.falllatereg),
                closeregdate: toESTString(parsed.fallclosereg),
                canceldeadline: toESTString(parsed.fallcanceldeadline),
            })
            .where(eq(seasons.seasonid, inSeason.seasonid + 1))
            .returning();

        if (!updatedFall) {
            throw new Error("Unknown DB error occured with fall semester update");
        }

        if (inSeason.seasonid + 2 !== inSeason.relatedseasonid) {
            throw new Error("Spring Semester ID does not match expected value in academic year row");
        }

        const [updatedSpring] = await tx
            .update(seasons)
            .set({
                startdate: toESTString(parsed.springstart),
                enddate: toESTString(parsed.springend),
                earlyregdate: toESTString(parsed.springearlyreg),
                normalregdate: toESTString(parsed.springnormalreg), 
                lateregdate1: toESTString(parsed.springlatereg),
                lateregdate2: toESTString(parsed.springlatereg),
                closeregdate: toESTString(parsed.springclosereg),
                canceldeadline: toESTString(parsed.springcanceldeadline),
            })
            .where(eq(seasons.seasonid, inSeason.seasonid + 2))
            .returning();

        if (!updatedSpring) {
            throw new Error("Unknown DB error occured with spring semester update");
        }

        revalidatePath("/admintest/management/semester")
    })
}

export async function registerControls(data: z.infer<typeof seasonRegSettingsSchema>, inSeason: InferSelectModel<typeof seasons>, changeSeason: term) {
    const parsed = seasonRegSettingsSchema.parse(data);
    await db.transaction(async (tx) => {
        const seasonIds = [inSeason.seasonid, inSeason.seasonid + 1, inSeason.seasonid + 2];
        const where =
            changeSeason === "academic"
                ? or(...seasonIds.map(id => eq(seasons.seasonid, id))) // Change all 3
                : eq( // Or change one term
                    seasons.seasonid,
                    changeSeason === "fall"
                        ? inSeason.seasonid + 1
                        : inSeason.seasonid + 2
                );

        const [updated] = await tx
            .update(seasons)
            .set({
                ...(parsed.isspring !== undefined ? { isspring: parsed.isspring } : {}),
                haslateregfee: parsed.haslateregfee,
                haslateregfee4newfamily: parsed.haslateregfee4newfamily,
                hasdutyfee: parsed.hasdutyfee,
                showadmissionnotice: parsed.showadmissionnotice,
                showteachername: parsed.showteachername,
                days4showteachername: parsed.days4showteachername,
                allownewfamilytoregister: parsed.allownewfamilytoregister,
                date4newfamilytoregister: toESTString(parsed.date4newfamilytoregister),
            })
            .where(where)
            .returning();

        if (!updated) {
            throw new Error("Unknown DB error occured with season update");
        }

        revalidatePath("/admintest/management/semester")
        return updated;
    })
}

export async function applyCheck(data: z.infer<typeof checkApplySchema>, family: familyObject) {
    const parsed = checkApplySchema.parse(data);
    await db.transaction(async (tx) => {
        const fb = await tx.query.familybalance.findFirst({
            where: (fb, { and, eq }) => and(eq(fb.familyid, family.familyid), eq(fb.balanceid, parsed.balanceid))
        })
        if (!fb) {
            throw new Error("No family balance found")
        }
        const [updated] = await tx
            .update(familybalance)
            .set({
                checkno: parsed.checkNo,
                totalamount: (Number(fb.totalamount) - parsed.amount).toString(),
                tuition: (Number(fb.tuition) - parsed.amount).toString()
            })
            .where(eq(familybalance.balanceid, fb.balanceid)).returning();
            
        const classreg = await tx.query.classregistration.findFirst({
            where: (cr, { eq }) => and(eq(cr.familyid, family.familyid), eq(cr.seasonid, fb.seasonid))
        });

        if (!classreg) {
            throw new Error("Cannot find corresponding registrations");
        }

        await tx
            .update(classregistration)
            .set({
                statusid: 2,
                previousstatusid: classreg.statusid,
                familybalanceid: fb.balanceid
            })
            .where(eq(classregistration.regid, classreg.regid));

        revalidatePath(`admintest/management/${fb.familyid}`);
    })
}

// FAmily stuff and student stuff
export async function createStudent(data: z.infer<typeof studentSchema>, familyid: number) {
    const parsed = studentSchema.parse(data);

    // Check user role
    // const user = await requireRole(["FAMILY"], { redirect: false });
    // if (!user || new Date(user.expires) >= new Date(Date.now())) {
    //     throw new Error("Expired user session. Please login again");
    // }
    return await db.transaction(async (tx) => {
        const [inserted] = await tx.insert(student).values({
            ...parsed,
            familyid: familyid,
            createddate: toESTString(new Date()),
            lastmodify: toESTString(new Date()),
        }).returning();
        return inserted;
    })
}