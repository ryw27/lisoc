import RegisterButton from "./register-button"
import { type uiClasses, type threeSeasons } from "@/lib/registration/types"
import { studentObject } from "@/app/admintest/data/(people-pages)/students/student-helpers";
import { getSelectOptions } from "@/lib/registration/semester";
import { familyRegister } from "@/lib/registration";
import { familyObject } from "@/app/admintest/data/(people-pages)/families/family-helpers";


// TODO: Change this to the reg history
export default async function RegClassBox({ classData, students, season, family }: { classData: uiClasses, students: studentObject[], season: threeSeasons, family: familyObject }) {
    // TODO: More efficient here?
    const { idMaps } = await getSelectOptions();

    const regSpecificClass = async (studentid: number) => {
        "use server";
        let seasonidx = "year";
        if (classData.seasonid === season.spring.seasonid) {
            seasonidx = "spring";
        } else if (classData.seasonid === season.fall.seasonid) {
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
        await familyRegister(classData, season[seasonidx as keyof threeSeasons], family, studentid);
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