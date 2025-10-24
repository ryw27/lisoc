"use server";
import { db } from "@/lib/db";
import { 
    seasons, 
    arrangement 
} from "@/lib/db/schema";
import { startSemFormSchema } from "../../validation";
import { arrangementSchema } from "@/lib/shared/validation";
import { toESTString } from "@/lib/utils";
import { z } from "zod/v4";
import { eq, or } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { getTermVariables } from "../../helpers";


export async function createSemester(data: z.infer<typeof startSemFormSchema>) {
    // Check incoming data
    const semData = startSemFormSchema.parse(data)

    // Check user and redirect if not authorized
    const user = await requireRole(["ADMIN"], { redirect: true });
    return await db.transaction(async (tx) => {
        // Check if any seasons are active and disable them
        await tx
            .update(seasons)
            .set({ status: "Inactive" })
            .where(eq(seasons.status, "Active"));

        // Create academic year
        const [academicYear] = await tx 
            .insert(seasons)
            .values({
                seasonnamecn: semData.seasonnamecn,
                seasonnameeng: semData.seasonnameen,
                isspring: false,
                relatedseasonid: 0, // To replace later
                beginseasonid: 0, // To replace later
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
                updateby: user.user.name ?? user.user.email ?? "Unknown admin" 
            })
            .returning();

        // Create fall sem
        const [fallSem] = await tx
            .insert(seasons)
            .values({
                seasonnamecn: `${semData.seasonnamecn} 秋季`,
                seasonnameeng: `${semData.seasonnamecn} Fall Semester`,
                isspring: false,
                relatedseasonid: academicYear.seasonid,
                beginseasonid: 0, // To edit later
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
                updateby: user.user.name ?? user.user.email ?? "Unknown admin" 
            })
            .returning()

        // Create spring sem
        await tx
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
                updateby: user.user.name ?? user.user.email ?? "Unknown admin" 
            })
            .returning()
        
            
        // CRUCIAL TO ENSURE DATA MODEL INVARIANTS!!!!!!!!!!!
        await tx
            .update(seasons)
            .set({
                relatedseasonid: academicYear.seasonid,
                beginseasonid: fallSem.seasonid
            })
            .where(eq(seasons.seasonid, fallSem.seasonid))

        // Set related season and begin season to ensure that you can get the spring and fall semesters from the academic year
        await tx
            .update(seasons)
            .set({
                relatedseasonid: academicYear.seasonid, // Set to itself
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
        for (const classData of semData.arrangements) {
            const parsedRegClass = arrangementSchema.parse(classData.regClass);
            // TODO: Uncomment once this is fixed
            const { seasonid, activestatus, regstatus } = await getTermVariables(parsedRegClass, academicYear, tx);

            const regClassValues = {
                seasonid: seasonid,
                classid: parsedRegClass.classid,
                teacherid: parsedRegClass.teacherid,
                roomid: parsedRegClass.roomid,
                timeid: parsedRegClass.timeid, 
                seatlimit: parsedRegClass.seatlimit,
                agelimit: parsedRegClass.agelimit,
                suitableterm: parsedRegClass.suitableterm,
                waiveregfee: parsedRegClass.waiveregfee,
                activestatus: activestatus,
                regstatus: regstatus,
                closeregistration: parsedRegClass.closeregistration,
                tuitionW: parsedRegClass.tuitionW?.toString() || "0",
                bookfeeW: parsedRegClass.bookfeeW?.toString() || "0",
                specialfeeW: parsedRegClass.specialfeeW?.toString() || "0",
                tuitionH: parsedRegClass.tuitionH?.toString() || "0",
                bookfeeH: parsedRegClass.bookfeeH?.toString() || "0",
                specialfeeH: parsedRegClass.specialfeeH?.toString() || "0",
                notes: parsedRegClass.notes || "",
                lastmodify: toESTString(new Date()),
                updateby: user.user.name ?? user.user.email ?? "Unknown admin",
            }

            await tx
                .insert(arrangement)
                .values({
                    ...regClassValues,
                    isregclass: true
                })
            for (const classroom of classData.classrooms) {
                const parsedClassroom = arrangementSchema.parse(classroom);
                await tx
                    .insert(arrangement)
                    .values({
                        ...regClassValues,
                        teacherid: parsedClassroom.teacherid,
                        roomid: parsedClassroom.roomid,
                        seatlimit: parsedClassroom.seatlimit,
                        isregclass: false
                    })
            }
        }
        return academicYear;
    });
}