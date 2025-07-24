import RegisterButton from "./register-button"
import { type threeSeason, type uiClasses } from "@/app/lib/semester/sem-schemas"
import { studentObject } from "@/app/admintest/data/(people-pages)/students/student-helpers";
import { classregistration } from "@/app/lib/db/schema";
import { getSelectOptions, registerClass } from "@/app/lib/semester/sem-actions";
import { familyObject } from "@/app/admintest/data/(people-pages)/families/family-helpers";



export default async function RegClassBox({ classData, students, season, family }: { classData: uiClasses, students: studentObject[], season: threeSeason, family: familyObject }) {
    // TODO: More efficient here?
    const { options, idMaps } = await getSelectOptions();

    const regSpecificClass = async (studentid: number) => {
        "use server";
        let insertSeasonID = season.year.seasonid;
        let seasonidx = "year";
        if (classData.seasonid === season.spring.seasonid) {
            insertSeasonID = season.spring.seasonid;
            seasonidx = "spring";
        } else if (classData.seasonid === season.fall.seasonid) {
            insertSeasonID = season.fall.seasonid;
            seasonidx = "fall";
        }

        // const regObject = {
        //     studentid: studentid,
        //     arrangeid: classData.arrangeid,
        //     seasonid: insertSeasonID,
        //     isyearclass: true,
        //     classid: classData.classid,
        //     registerdate: new Date(Date.now()).toISOString(),
        //     statusid: 1, // "Submitted"
        //     familybalanceid: 1, // Needs a placeholder
        //     familyid: family.familyid,
        //     isdropspring: false,
        //     byadmin: false,
        // } satisfies typeof classregistration.$inferInsert;


        // Try catch in the original page
        await registerClass(classData, season[seasonidx as keyof threeSeason], family, studentid);
    }

    return (
        <div className="flex gap-6 p-2">
            <div className="flex flex-col">
                <label className="font-bold text-gray-400">Class Name</label>
                <p className="font-bold">{idMaps.classMap[classData.classid].classnamecn}</p>
            </div>
            <div className="flex flex-col">
                <label className="font-bold text-gray-400">Teacher</label>
                <p className="font-bold">{idMaps.teacherMap[classData.teacherid].namecn}</p>
            </div>
            <div>
                <label className="font-bold text-gray-400">Fee</label>
                <p className="font-bold">${Number(classData.bookfeeW) + Number(classData.tuitionW) + Number(classData.specialfeeW)}</p>
            </div>

            <RegisterButton regSpecificClass={regSpecificClass} students={students} />
        </div>
    )
}