"use client";
import { arrangement, seasons } from "@/app/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";
import SemesterViewBox from "./sem-view-box";
import SemesterControlsPopover from "./sem-control-popover";
import { type selectOptions, type classWithStudents, type uiClasses, type studentView, type IdMaps, arrangementSchema } from "@/app/lib/semester/sem-schemas";
import { PlusIcon } from "lucide-react";
import { createContext, useState } from "react";
import SemClassEditor from "./sem-class-editor";
import { z } from "zod/v4";

type semViewProps = {
    season: InferSelectModel<typeof seasons>
    classDataWithStudents: classWithStudents[]
    selectOptions: selectOptions
    idMaps: IdMaps;
    insertArr: (data: z.infer<typeof arrangementSchema>, season: InferSelectModel<typeof seasons>) => Promise<InferSelectModel<typeof arrangement>>;
    updateArr: (data: z.infer<typeof arrangementSchema>, season: InferSelectModel<typeof seasons>) => Promise<InferSelectModel<typeof arrangement>>;
}

export type uiClassStudents = uiClasses & {
    students: studentView[]
}



export const OptionContext = createContext<{season: InferSelectModel<typeof seasons>, selectOptions: selectOptions, idMaps: IdMaps} | null>(null); 

// Start with a general class overview that is clickable. Each one expands into a data table of students
export default function SemesterView({ season, classDataWithStudents, selectOptions, idMaps, insertArr, updateArr }: semViewProps) {
    const [uiState, setUIState] = useState<uiClassStudents[]>(() => {
        return classDataWithStudents.map(item => {
            return {
                ...item,
                arrangeid: item.arrangeid,
                season: { seasonid: season.seasonid, seasonnamecn: season.seasonnamecn, seasonnameeng: season.seasonnameeng },
                class: { classid: item.class.classid, classnamecn: item.class.classnamecn, classnameen: item.class.classnameen },
                teacher: { teacherid: item.teacher.teacherid, namecn: item.teacher.namecn || "", namelasten: item.teacher.namelasten || "", namefirsten: item.teacher.namefirsten || "" },
                classroom: { roomid: item.classroom.roomid, roomno: item.classroom.roomno },
                classtime: { timeid: item.classtime.timeid, period: item.classtime.period },
                suitableterm: { termno: item.suitableterm.termno, suitableterm: item.suitableterm.suitableterm, suitabletermcn: item.suitableterm.suitabletermcn || "" },
                students: item.students,
            } satisfies uiClassStudents
        })
    })
    const [configuring, setConfiguring] = useState<{ editing: boolean; expanded: boolean }[]>(
        Array(classDataWithStudents.length).fill({ editing: false, expanded: false })
    )
    const [adding, setAdding] = useState<boolean>(false);



    const getCurrentPhase = () => {
        const curDate = new Date(Date.now());
        if (curDate <= new Date(season.earlyregdate)) {
            return "Registration has not begun";
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




    const cancelAddClass = () => {
        setAdding(false);
    }


    return (
        <OptionContext.Provider value={{ season: season, selectOptions: selectOptions, idMaps: idMaps}}>
            <div className="container mx-auto flex flex-col">
                <div className="flex justify-between">
                    <h1 className="font-bold text-3xl mb-4">{season.seasonnamecn}</h1>
                    <SemesterControlsPopover />
                </div>
                <div className="mb-4">
                    <h2 className="text-md font-semibold mb-1">Current Phase: {currentPhase}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                        <div>
                            <span className="font-medium">Early Registration: </span>
                            {season.earlyregdate ? new Date(season.earlyregdate).toLocaleString() : "N/A"}
                        </div>
                        <div>
                            <span className="font-medium">Normal Registration: </span>
                            {season.normalregdate ? new Date(season.normalregdate).toLocaleString() : "N/A"}
                        </div>
                        <div>
                            <span className="font-medium">Late Registration 1: </span>
                            {season.lateregdate1 ? new Date(season.lateregdate1).toLocaleString() : "N/A"}
                        </div>
                        <div>
                            <span className="font-medium">Late Registration 2: </span>
                            {season.lateregdate2 ? new Date(season.lateregdate2).toLocaleString() : "N/A"}
                        </div>
                        <div>
                            <span className="font-medium">Close Registration: </span>
                            {season.closeregdate ? new Date(season.closeregdate).toLocaleString() : "N/A"}
                        </div>
                        <div>
                            <span className="font-medium">Cancel Deadline: </span>
                            {season.canceldeadline ? new Date(season.canceldeadline).toLocaleString() : "N/A"}
                        </div>
                        <div>
                            <span className="font-medium">Semester Start: </span>
                            {season.startdate ? new Date(season.startdate).toLocaleString() : "N/A"}
                        </div>
                        <div>
                            <span className="font-medium">Semester End: </span>
                            {season.enddate ? new Date(season.enddate).toLocaleString() : "N/A"}
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2">
                    {uiState.map((classItem, idx) => (
                        <SemesterViewBox
                            key={`${idx}-${classItem.arrangeid}-${classItem.class.classid}-${classItem.teacher.teacherid}`}
                            idx={idx}
                            data={classItem}
                            registrations={classItem.students}
                            setUIState={setUIState}
                            setConfiguring={setConfiguring}
                            configuring={configuring}
                        />
                    ))}

                    <button className="font-md text-blue-600 px-4 py-2 rounded-md flex justify-center items-center gap-2" onClick={() => setAdding(true)}>
                        <PlusIcon className="w-4 h-4" /> Add Class (TODO)
                    </button>
                    {adding && 
                        <SemClassEditor
                            cancelEdit={cancelAddClass}
                            setUIState={setUIState}
                            setConfiguring={setConfiguring}
                            editClass={(data) => insertArr(data, season)}
                            idx={-1}
                        />

                    }
                </div>
            </div>
        </OptionContext.Provider>
    )
}

