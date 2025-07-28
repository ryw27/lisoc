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


export async function createSemester(data: z.infer<typeof startSemFormSchema>) {
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