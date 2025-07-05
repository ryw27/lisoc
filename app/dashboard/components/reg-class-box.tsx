import RegisterButton from "./register-button"
import { draftClasses } from "@/app/lib/semester/sem-schemas"
import { studentObject } from "@/app/admintest/dashboard/data/(people-pages)/students/student-helpers";
import { classregistration, seasons } from "@/app/lib/db/schema";
import { registerClass } from "@/app/lib/semester/sem-actions";
import { InferSelectModel } from "drizzle-orm";



export default function RegClassBox({ classData, students, season }: { classData: draftClasses, students: studentObject[], season: InferSelectModel<typeof seasons> }) {

    const regSpecificClass = async (student: string) => {
        "use server";
        const sid = students.filter(obj => obj.namecn === student);
        if (sid.length > 1 || sid.length <= 0) throw new Error("Invalid student names");
        const regObject = {
            studentid: sid[0].studentid,
            arrangeid: classData.arrangeid,
            seasonid: classData.season.seasonid,
            isyearclass: true,
            classid: classData.class.classid,
            registerdate: new Date(Date.now()).toISOString(),
            statusid: 1, // "Submitted"
            previousstatusid: null,
            familybalanceid: 1, // TODO: how to find this? Needs a placeholder
            familyid: students[0].familyid,
            newbalanceid: 5, // TODO: huh?
            isdropspring: false,
            byadmin: false,
            userid: "idk" // TODO: how to get this?
        } satisfies typeof classregistration.$inferInsert;

        await registerClass(regObject, classData, season);
    }

    return (
        <div className="flex gap-6 p-2">
            <div className="flex flex-col">
                <label className="font-bold text-gray-400">Class Name</label>
                <p className="font-bold">{classData.class.classnamecn}</p>
            </div>
            <div className="flex flex-col">
                <label className="font-bold text-gray-400">Teacher</label>
                <p className="font-bold">{classData.teacher.namecn}</p>
            </div>
            <div>
                <label className="font-bold text-gray-400">Fee</label>
                <p className="font-bold">${Number(classData.bookfeeW) + Number(classData.tuitionW) + Number(classData.specialfeeW)}</p>
            </div>

            <RegisterButton regSpecificClass={regSpecificClass} students={students} />
        </div>
    )
}