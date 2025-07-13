import { seasons, arrangement, classes, suitableterm, classrooms, teacher, classtime } from "@/app/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { db } from "@/app/lib/db";
import SemesterViewBox from "./sem-view-box";
import { getSelectOptions } from "@/app/lib/semester/sem-actions";
import SemesterControlsPopover from "./sem-control-popover";


type semViewProps = {
    season: InferSelectModel<typeof seasons>
}

// Data type for data table
export type studentView = {
    regid: number;
    studentid: number;
    registerDate: string; 
    dropped: studentStatus;
    familyid: number;
    namecn: string;
    namelasten: string;
    namefirsten: string;
    dob: string;
    gender: string;
    notes: string
} 

export type studentStatus = 
    | "Submitted"
    | "Registered"
    | "Dropout" 
    | "Dropout Spring"
    | "Pending Drop"
    | {}

export type fullClassData = InferSelectModel<typeof arrangement> & { 
    class: InferSelectModel<typeof classes> 
    teacher: InferSelectModel<typeof teacher>
    classroom: InferSelectModel<typeof classrooms>
    classtime: InferSelectModel<typeof classtime>
    suitableterm: InferSelectModel<typeof suitableterm>
};

export type selectOptions = {
    teachers: { teacherid: number, namecn: string | null, namelasten: string | null, namefirsten: string | null }[];
    classes: { classid: number, classnamecn: string, classnameen: string }[];
    rooms: { roomid: number, roomno: string }[];
    times: { timeid: number, period: string | null }[];
    terms: { termno: number, suitableterm: string | null, suitabletermcn: string | null }[];
}


// Start with a general class overview that is clickable. Each one expands into a data table of students
export default async function SemesterView({ season }: semViewProps) {
    // Active semester
    const classData = await db.query.arrangement.findMany({
        where: (arr, { eq }) => eq(arr.seasonid, season.seasonid),
        with: {
            class: true,
            teacher: true, 
            classroom: true,
            classtime: true,
            suitableterm: true,
        },
        orderBy: (arr, { asc }) => [asc(arr.arrangeid)]
    }) satisfies fullClassData[];


    const selectOptions = (await getSelectOptions()) satisfies selectOptions


    // Get student view data and transform into data table form
    const getStudents = async (classid: number) => {
        // Get all students who have registered
        const reg = await db.query.classregistration.findMany({
            where: (reg, { and, eq }) => and(eq(reg.classid, classid), eq(reg.seasonid, season.seasonid)),
            with: {
                student: {}
            }
        });

        const dataview = await Promise.all(reg.map(async (student) => {
            // TODO: More complete handling of whether a drop/transfer has occured
            // Check if dropped, request status id is 2 indicating approval
            const requests = await db.query.regchangerequest.findFirst({
                where: (reg, { and, eq }) => and(eq(reg.appliedid, student.regid), eq(reg.reqstatusid, 2))
            });

            const reqStatusMap = {
                1: "Pending Drop",
                2: "Dropout",
                3: "Submitted"
            }

            const regStatusMap = {
                1: "Submitted",
                2: "Registered",
                3: "Dropout", // Shouldn't get here
                4: "Dropout",
                5: "Dropout Spring"
            }
            const status = requests ? 
                                reqStatusMap[requests.reqstatusid as 1 | 2 | 3] 
                                : regStatusMap[student.statusid as 1 | 2 | 3 | 4 | 5]

            return {
                regid: student.regid,
                studentid: student.studentid,
                registerDate: student.registerdate,
                dropped: status,
                familyid: student.familyid,
                namecn: student.student.namecn,
                namelasten: student.student.namelasten,
                namefirsten: student.student.namefirsten,
                dob: student.student.dob,
                gender: student.student.gender || "Unknown",
                notes: student.notes || ""
            } satisfies studentView
        }))

        return dataview;
    }

    const getCurrentPhase = () => {
        const curDate = new Date(Date.now());
        if (curDate <= new Date(season.earlyregdate)) {
            "Registration has not begun";
        } else if (curDate <= new Date(season.normalregdate)) {
            return "Early registration";
        } else if (curDate <= new Date(season.lateregdate1)) {
            return "Normal registration";
        } else if (curDate <= new Date(season.closeregdate)) {
            return "Late registration";
        } else if (curDate <= new Date(season.startdate)) {
            return "Registration has closed";
        } else if (curDate <= new Date(season.enddate)) {
            return "Fall semester has begun";
        } else {
            return "Fall semester has ended";
        }
    }

    const currentPhase = getCurrentPhase()

    return (
        <div className="container mx-auto flex flex-col">
            <div className="flex justify-between">
                <h1 className="font-bold text-3xl mb-4">{season.seasonnamecn}</h1>
                <SemesterControlsPopover season={season} />
            </div>
            <div className="mb-4">
                <h2 className="text-md font-semibold mb-1">Current Phase: {currentPhase}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                    <div>
                        <span className="font-medium">Early Registration:</span>{" "}
                        {season.earlyregdate ? new Date(season.earlyregdate).toLocaleString() : "N/A"}
                    </div>
                    <div>
                        <span className="font-medium">Normal Registration:</span>{" "}
                        {season.normalregdate ? new Date(season.normalregdate).toLocaleString() : "N/A"}
                    </div>
                    <div>
                        <span className="font-medium">Late Registration 1:</span>{" "}
                        {season.lateregdate1 ? new Date(season.lateregdate1).toLocaleString() : "N/A"}
                    </div>
                    <div>
                        <span className="font-medium">Late Registration 2:</span>{" "}
                        {season.lateregdate2 ? new Date(season.lateregdate2).toLocaleString() : "N/A"}
                    </div>
                    <div>
                        <span className="font-medium">Close Registration:</span>{" "}
                        {season.closeregdate ? new Date(season.closeregdate).toLocaleString() : "N/A"}
                    </div>
                    <div>
                        <span className="font-medium">Cancel Deadline:</span>{" "}
                        {season.canceldeadline ? new Date(season.canceldeadline).toLocaleString() : "N/A"}
                    </div>
                    <div>
                        <span className="font-medium">Semester Start:</span>{" "}
                        {season.startdate ? new Date(season.startdate).toLocaleString() : "N/A"}
                    </div>
                    <div>
                        <span className="font-medium">Semester End:</span>{" "}
                        {season.enddate ? new Date(season.enddate).toLocaleString() : "N/A"}
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col gap-2">
                {classData.map(async (val, idx) => {
                    const studentView = await getStudents(val.classid);

                    return (
                        <SemesterViewBox
                            key={`${idx}-${val.classid}-${val.arrangeid}`}
                            season={season}
                            data={val}
                            registrations={studentView}
                            selectOptions={selectOptions}
                        />
                    )
                })}
            </div>
        </div>
    )
}

