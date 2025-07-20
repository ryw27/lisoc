"use client";
import { createContext, useReducer, useState } from "react";
import { PlusIcon, ChevronUp, ChevronDown } from "lucide-react";
import SemesterViewBox from "./sem-view-box";
import SemesterControlsPopover from "./sem-control-popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type selectOptions,
  type fullSemClassesData,
  type IdMaps,
  type fullRegClass,
  type threeSeason,
  arrangementSchema,
  uiClasses,
} from "@/app/lib/semester/sem-schemas";
import { seasons } from "@/app/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { z } from "zod/v4";

type semViewProps = {
    fullData: fullSemClassesData
    academicYear: threeSeason;
    selectOptions: selectOptions
    idMaps: IdMaps;
}

export type fullRegID = fullRegClass & { id: string }
export type fullSemDataID = fullRegID[]
export type Action = 
    | { type: "hydrate", classes: fullSemDataID}
    | { type: "reg/add", regDraft: fullRegID }
    | { type: "reg/update", id: string, next: fullRegID }
    | { type: "reg/remove", id: string }
    | { type: "class/add", id: string, roomDraft: Partial<uiClasses>}
    | { type: "class/update", id: string, arrangeid: number, update: Pick<uiClasses, "teacherid" | "roomid" | "seatlimit"> }
    | { type: "class/remove", id: string, arrangeid: number }


const CLASS_UNIQUE_FIELDS: (keyof uiClasses)[] = ["teacherid", "roomid", "seatlimit"]

function reducer(state: fullSemDataID, action: Action) {
    switch (action.type) {
        case "hydrate":
            return action.classes;
        case "reg/add": 
            return [...state, { ...action.regDraft }];
        case "reg/update":
            const newRegClass = action.next;
            newRegClass.classrooms.map((c) => {
                // For each classroom, set fields from newRegClass.arrinfo if not in CLASS_UNIQUE_FIELDS
                const newC = {
                    ...c,
                    arrinfo: {
                        ...c.arrinfo,
                        ...Object.fromEntries(
                            Object.entries(newRegClass.arrinfo).filter(
                                ([key]) => !CLASS_UNIQUE_FIELDS.includes(key as keyof uiClasses)
                            )
                        ),
                    }
                }
                return newC;
            })
            return state.map((c) => (c.id === action.id ? newRegClass : c));
        case "reg/remove":
            return state.filter((c) => c.id !== action.id);
        case "class/add":
            return state.map((c) => (c.id === action.id ? {...c, classrooms: [...c.classrooms, action.roomDraft]} : c));
        case "class/update":
            const regClass = state.find((c) => c.id === action.id);
            if (!regClass) throw new Error("Unable to find class in class/add dispatch action");
            regClass.classrooms.map((c) => {
                c.arrinfo.arrangeid === action.arrangeid ? {
                    ...c.arrinfo,
                    ...action.update
                } : c
            })
            return state.map((c) => (c.id === action.id ? regClass : c));
        case "class/remove":
            return state.map((c) => (c.id === action.id ? {...c, classrooms: c.classrooms.filter((c) => c.arrinfo.arrangeid !== action.arrangeid)} : c));
        default:
            return state;
    }
}

export const SeasonOptionContext = createContext<{seasons: threeSeason, selectOptions: selectOptions, idMaps: IdMaps} | null>(null); 

// Start with a general class overview that is clickable. Each one expands into a data table of students
// Season is always the academic year.
export default function SemesterView({ fullData, academicYear, selectOptions, idMaps } : semViewProps) {
    // Augment each fullData item with a uuid for local state management
    const [regClasses, dispatch] = useReducer(
        reducer,
        fullData.map(item => ({
            ...item,
            id: crypto.randomUUID()
        }))
    );


    const [currentView, setCurrentView] = useState<'fall' | 'spring' | 'academic' | 'all'>('all');

    const { year, fall, spring } = academicYear;
    console.log(year.seasonid, fall.seasonid, spring.seasonid);

    // Filter classes based on current view, but return with original indices
    const getFilteredClassesWithIndices = () => {
        const filtered: Array<{ item: fullRegID }> = [];
        regClasses.forEach((item) => {
            let shouldInclude = true;
            
            switch (currentView) {
                case "fall":
                    shouldInclude = fall.seasonid === item.arrinfo.seasonid // If the academic year's fall sem is this items seasonid
                    break;
                case "spring":
                    shouldInclude = spring.seasonid === item.arrinfo.seasonid // If the academic year's spring sem is this item's seasonid
                    break;
                case "academic":
                    shouldInclude = year.seasonid === item.arrinfo.seasonid; // If academic years seasonid is this item's seasonid
                    break;
                case "all":
                    shouldInclude = true // Include all
                default:
                    shouldInclude = true;
                    break;
            }
            
            if (shouldInclude) {
                filtered.push({ item });
            }
        });
        
        return filtered;
    }


    const getCurrentPhase = (term: InferSelectModel<typeof seasons>, termName: string) => {
        const curDate = new Date(Date.now());
        if (curDate <= new Date(term.earlyregdate)) {
            return `${termName} registration has not begun`;
        } else if (curDate <= new Date(term.normalregdate)) {
            return `${termName} early registration`;
        } else if (curDate <= new Date(term.lateregdate1)) {
            return `${termName} normal registration`;
        } else if (curDate <= new Date(term.closeregdate)) {
            return `${termName} late registration`;
        } else if (curDate <= new Date(term.startdate)) {
            return `${termName} registration has closed`;
        } else if (curDate <= new Date(term.enddate)) {
            return `${termName} semester in session`;
        } else {
            return `${termName} semester has ended`;
        }
    }

    const CurrentPhase = () => {
        return (
            <>
                {(currentView !== "spring") && <h2 className="text-md font-semibold mb-1">Fall Phase: {getCurrentPhase(fall, "Fall")}</h2>}
                {(currentView != "fall") && <h2 className="text-md font-semibold mb-1">Spring Phase: {getCurrentPhase(spring, "Spring")}</h2>}
            </>
        )
    }

    const Dates = ({ term }: { term: InferSelectModel<typeof seasons> }) => {
        return <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
            <div>
                <span className="font-medium">Early Registration: </span>
                {term.earlyregdate ? new Date(term.earlyregdate).toLocaleString() : "N/A"}
            </div>
            <div>
                <span className="font-medium">Normal Registration: </span>
                {term.normalregdate ? new Date(term.normalregdate).toLocaleString() : "N/A"}
            </div>
            <div>
                <span className="font-medium">Late Registration 1: </span>
                {term.lateregdate1 ? new Date(term.lateregdate1).toLocaleString() : "N/A"}
            </div>
            <div>
                <span className="font-medium">Late Registration 2: </span>
                {term.lateregdate2 ? new Date(term.lateregdate2).toLocaleString() : "N/A"}
            </div>
            <div>
                <span className="font-medium">Close Registration: </span>
                {term.closeregdate ? new Date(term.closeregdate).toLocaleString() : "N/A"}
            </div>
            <div>
                <span className="font-medium">Cancel Deadline: </span>
                {term.canceldeadline ? new Date(term.canceldeadline).toLocaleString() : "N/A"}
            </div>
            <div>
                <span className="font-medium">Academic Year Start: </span>
                {term.startdate ? new Date(term.startdate).toLocaleString() : "N/A"}
            </div>
            <div>
                <span className="font-medium">Academic Year End: </span>
                {term.enddate ? new Date(term.enddate).toLocaleString() : "N/A"}
            </div>
        </div>
    }

    const addClass = () => {
        console.log("Adding class");
    }

    return (
        <SeasonOptionContext.Provider value={{ seasons: academicYear, selectOptions: selectOptions, idMaps: idMaps}}>
            <div className="container mx-auto flex flex-col">
                <div className="flex justify-between">
                    <h1 className="font-bold text-3xl mb-4">{year.seasonnamecn}</h1>
                    <SemesterControlsPopover />
                </div>
                <div className="mb-4">
                    <CurrentPhase />
                    {(currentView === "academic" || currentView === "all") && <Dates term={year} />}
                    {currentView === "fall" && <Dates term={fall} />}
                    {currentView === "spring" && <Dates term={spring} />} 
                </div>

                {/* Add view selector */}
                <div className="mb-4">
                    <div className="w-56 mb-2">
                        <label htmlFor="view-select" className="block text-sm font-medium text-gray-700 mb-1">
                            View Semester
                        </label>
                        <Select value={currentView} onValueChange={v => setCurrentView(v as 'academic' | 'fall' | 'spring' | 'all')}>
                            <SelectTrigger id="view-select" className="flex flex-row items-center gap-2 [&>svg]:hidden">
                                <div className="flex flex-col justify-center">
                                    <ChevronUp className="w-4 h-4 text-gray-400 -mb-1" />
                                    <ChevronDown className="w-4 h-4 text-gray-400 -mt-1" />
                                </div>
                                <SelectValue placeholder="Select view" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="academic">Academic Year</SelectItem>
                                <SelectItem value="fall">Fall</SelectItem>
                                <SelectItem value="spring">Spring</SelectItem>
                                <SelectItem value="all">Show All</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                { /* Classes */} 
                <div className="flex flex-col gap-2">
                    {getFilteredClassesWithIndices().map(({ item: classItem }) => (
                        <SemesterViewBox
                            key={classItem.id}
                            uuid={classItem.id}
                            dataWithStudents={classItem}
                            dispatch={dispatch}
                        />
                    ))}

                    <button className="font-md text-blue-600 px-4 py-2 rounded-md flex justify-center items-center gap-2" onClick={addClass}>
                        <PlusIcon className="w-4 h-4" /> Add Class (TODO)
                    </button>
                    {/* {adding && 
                        <SemClassEditor
                            editClass={(data) => insertArr(data, season)}
                            idx={-1}
                        />

                    } */}
                </div>
            </div>
        </SeasonOptionContext.Provider>
    )
}