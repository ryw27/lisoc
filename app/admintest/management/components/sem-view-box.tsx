"use client";
import { useState } from "react";
import { Pen } from "lucide-react";
import { studentView } from "./sem-view";
import StudentTable from "./student-table";
import SemClassEditor from "./sem-class-editor";
import { type draftClasses } from "@/app/lib/semester/sem-schemas";
import { type fullClassData, type selectOptions } from "./sem-view";
import { InferSelectModel } from "drizzle-orm";
import { seasons } from "@/app/lib/db/schema";

type semViewBoxProps = {
    season: InferSelectModel<typeof seasons>;
    data: fullClassData;
    registrations: studentView[];
    selectOptions: selectOptions;
}

export default function SemesterViewBox({ season, data, registrations, selectOptions }: semViewBoxProps) {
    const [expanded, setExpanded] = useState<boolean>(false);
    const [editing, setEditing] = useState<boolean>(false);
    const [uiState, setUIState] = useState<draftClasses>(() => {
        return {
            arrangeid: data.arrangeid,
            season: { seasonid: season.seasonid, seasonnamecn: season.seasonnamecn },
            class: { classid: data.class.classid, classnamecn: data.class.classnamecn },
            teacher: { teacherid: data.teacher.teacherid, namecn: data.teacher.namecn || "" },
            classroom: { roomid: data.classroom.roomid, roomno: data.classroom.roomno },
            classtime: { timeid: data.classtime.timeid, period: data.classtime.period },
            seatlimit: data.seatlimit,
            agelimit: data.agelimit,
            suitableterm: { termno: data.suitableterm.termno, suitabletermcn: data.suitableterm.suitabletermcn },
            waiveregfee: data.waiveregfee,
            closeregistration: data.closeregistration,
            tuitionW: data.tuitionW,
            specialfeeW: data.specialfeeW,
            bookfeeW: data.bookfeeW,
            tuitionH: data.tuitionH,
            specialfeeH: data.specialfeeH,
            bookfeeH: data.bookfeeH,
            notes: data.notes,
        }
    })


    return (
        <div
            className={`flex flex-col border-2 border-gray cursor-pointer p-4  transition-colors duration-200 ${expanded || editing ? "" : "rounded-md hover:bg-gray-100"}`}
        >
            <div 
                className="flex justify-between" 
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex flex-col">
                    <h1 className="text-md text-gray-500">Teacher {uiState.teacher.namecn}</h1>
                    <h1 className="text-lg font-bold">{uiState.class.classnamecn}</h1>
                    <h1 className="text-md text-gray-500">Room {uiState.classroom.roomno}</h1>
                    <h1 className="text-md text-gray-500">Registered: {registrations.length} students</h1>
                </div>
                <div className="flex justify-center items-center">
                    <button
                        className="flex gap-2 p-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700"
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditing(!editing)
                            setExpanded(false)
                        }}
                    >
                        <Pen /> Edit
                    </button>
                </div>
            </div>
            {expanded && (
                <StudentTable registrations={registrations}/>
             )}
             
             {editing && (
                <SemClassEditor data={uiState} selectOptions={selectOptions} setEditing={setEditing} setUIState={setUIState}/>
             )}

        </div>
    )
}