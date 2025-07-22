"use client";
import React, { useState } from "react";
import { arrangement, classregistration, family, familybalance, student } from "@/app/lib/db/schema"
import { InferSelectModel } from "drizzle-orm"
import { IdMaps, selectOptions, threeSeason, type uiClasses } from "@/app/lib/semester/sem-schemas"
import { 
    Select, 
    SelectContent, 
    SelectGroup, 
    SelectItem, 
    SelectLabel, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { registerClass } from "@/app/lib/semester/sem-actions";
import RegTable from "../components/reg-table";

type RegStudentProps = {
    registrations: InferSelectModel<typeof classregistration>[]
    totalBalance: number  
    family: InferSelectModel<typeof family>
    students: InferSelectModel<typeof student>[]
    registerSpring: boolean
    season: threeSeason
    fallArrs: InferSelectModel<typeof arrangement>[]
    yearArrs: InferSelectModel<typeof arrangement>[]
    springArrs: InferSelectModel<typeof arrangement>[]
    selectOptions: selectOptions
    idMaps: IdMaps
    balances: InferSelectModel<typeof familybalance>[]
}

// For reference
const periodMap = {
    1: "1:30 - 3:30",
    2: "1:30 - 4:30",
    3: "3:30 - 4:30"
}

const hasConflict = (current: { first: number, second: number}, period: number) => {
    if (period === 2) return current.first > 0 || current.second > 0;
    if (period === 1) return current.first > 0;
    if (period === 3) return current.second > 0;
    return false;
}

const addPeriod = (current: { first: number, second: number }, period: number) => {
    if (hasConflict(current, period)) return false;
    else if (period === 1) current.first++;
    else if (period === 3) current.second++;
    else if (period === 2) {
        current.first++;
        current.second++;
    }
    return current;

}

const removePeriod = (current: { first: number, second: number }, period: number) => {
    if (period === 1) current.first = Math.max(0, current.first - 1);
    else if (period === 3) current.second = Math.max(0, current.second - 1);
    else if (period === 2) {
        current.first = Math.max(0, current.first - 1);
        current.second = Math.max(0, current.second - 1);
    }
    return current;
}

export default function RegisterStudent({
    registrations,
    totalBalance,
    family,
    students,
    registerSpring,
    season,
    fallArrs,
    yearArrs,
    springArrs,
    selectOptions,
    idMaps,
    balances
}: RegStudentProps) {
    // Student ID
    const [selectedStudent, setSelectedStudent] = useState<number>(0); 
    // Semester ID
    const [selectedSemester, setSelectedSemester] = useState<[number, number, number]>([0, 0, 0]);
    // Class ID
    type classAndTime = { classid: number, timeid: number , contrib: number};
    const [selectedClass, setSelectedClass] = 
        useState<[classAndTime, classAndTime, classAndTime]>([{ classid: 0, timeid: 0, contrib: 0 }, { classid: 0, timeid: 0, contrib: 0 }, { classid: 0, timeid: 0, contrib: 0 }]);
    // Errors
    const [error, setError] = useState<Record<number, [string, string, string]>>(() => {
        const errors = {} as Record<number, [string, string, string]>
        for (let i = 0; i < students.length; i++) {
            errors[students[i].studentid] = ["", "", ""];
        }
        return errors
    });

    // Periods to ensure no duplicates
    const [periods, setPeriods] = useState<Record<number, { first: number, second: number }>>(() => {
        const periods = {} as Record<number, { first: number, second: number }>;
        for (let i = 0; i < students.length; i++) {
            periods[students[i].studentid] = { first: 0, second: 0 };
        }
        return periods;
    });

    const getValidClasses = (idx: 0 | 1 | 2) => {
        if (selectedSemester[idx] === 0) {
            return [...yearArrs, ...fallArrs, ...springArrs]
        } else if (selectedSemester[idx] === season.year.seasonid) {
            return yearArrs
        } else if (selectedSemester[idx] === season.fall.seasonid) {
            return fallArrs
        } else if (selectedSemester[idx] === season.spring.seasonid) {
            return springArrs
        }
        return []
    }
    const newRegSchema = z.object({
        studentid: z.coerce.number().min(0),
        registeredClasses: z.array(
            z.object({
                seasonid: z.number().int().optional(),
                arrid: z.number().int().optional()
            }).refine(
                v =>
                    (v.seasonid === undefined && v.arrid === undefined) ||
                    (v.seasonid !== undefined && v.arrid !== undefined),
                {
                    message: "Both season and class must be provided",
                }
            )
        )
    }).transform(({ studentid, registeredClasses}) => ({
        studentid,
        registeredClasses: registeredClasses.filter(
            (s): s is { seasonid: number; arrid: number } =>
                typeof s.seasonid === "number" && typeof s.arrid === "number"
        ),
    })).refine(
        data => 
            data.registeredClasses.length >= 1 && 
            data.registeredClasses.length <= 3,
            { message: "Pick 1 - 3 classes" }
    );

    const regForm = useForm({
        resolver: zodResolver(newRegSchema),
        defaultValues: {
            studentid: selectedStudent,
            registeredClasses: [{}, {}, {}]
        },
        mode: "onSubmit"
    })

    const resetAll = () => {
        if (selectedStudent) {
            setPeriods(prev => {
                // TODO: Set it to classregistrations
                return { ...prev, [selectedStudent]: { first: 0, second: 0}}
            });
            setError(prev => {
                return { ...prev, [selectedStudent]: ["", "", ""]}
            });
        }
        setSelectedStudent(0);
        regForm.setValue(`studentid`, 0);
        setSelectedSemester([0, 0, 0]);
        setSelectedClass([{ classid: 0, timeid: 0, contrib: 0 }, { classid: 0, timeid: 0, contrib: 0 }, { classid: 0, timeid: 0, contrib: 0 }]);
        [0, 1, 2].map((idx) => {
            regForm.setValue(`registeredClasses.${idx}.seasonid`, undefined);
            regForm.setValue(`registeredClasses.${idx}.arrid`, undefined);
        })
    }

    const resetSelections = (idx: number) => {
        if (selectedStudent !== 0) {
            setPeriods(prev => {
                const newPeriod = { ...prev[selectedStudent] } ;
                const periodRemoved = selectedClass[idx].timeid;
                if (periodRemoved === 0) return prev;
                removePeriod(newPeriod, periodRemoved);
                return { ...prev, [selectedStudent]: newPeriod};
            })
            setError(prev => {
                const newErr = { ...prev };
                if (newErr[selectedStudent]) {
                    newErr[selectedStudent] = [...newErr[selectedStudent]] as [string, string, string];
                    newErr[selectedStudent][idx] = ""; // Just clear this specific index
                }
                return newErr;
            });
        }
        setSelectedSemester(prev => {
            const newSem = [...prev] as [number, number, number];
            newSem[idx] = 0;
            return newSem
        })     
        setSelectedClass(prev => {
            const newSem = [...prev] as [classAndTime, classAndTime, classAndTime];
            newSem[idx] = { classid: 0, timeid: 0, contrib: 0 };
            return newSem
        })     
        regForm.setValue(`registeredClasses.${idx}.seasonid`, undefined);
        regForm.setValue(`registeredClasses.${idx}.arrid`,    undefined);
    }

    const isDisabled = Object.values(error).some(x => x[0] !== "" || x[1] !== "" || x[2] !== "") 
        || selectedStudent === 0 || selectedSemester.every(c => c === 0) || selectedClass.every(c => c.classid === 0|| c.timeid === 0) || regForm.formState.isSubmitting

    const onSubmit = async (formData: z.infer<typeof newRegSchema>) => {
        try {
            // console.log(formData);
            for (let i = 0; i < formData.registeredClasses.length; i++) {
                let classSeason;
                let arrangementData;
                if (formData.registeredClasses[i].seasonid === season.year.seasonid) {
                    classSeason = season.year;
                    arrangementData = yearArrs.find((c) => c.arrangeid === formData.registeredClasses[i].arrid);
                } else if (formData.registeredClasses[i].seasonid === season.fall.seasonid) {
                    classSeason = season.fall;
                    arrangementData = fallArrs.find((c) => c.arrangeid === formData.registeredClasses[i].arrid);
                } else {
                    classSeason = season.spring;
                    arrangementData = springArrs.find((c) => c.arrangeid === formData.registeredClasses[i].arrid);
                }
                await registerClass(arrangementData as uiClasses, classSeason, family, formData.studentid);
            }
        } catch (err) {
            console.error("Registration submission error: ", err);
        }
    }


    function RegSelect({idx}: { idx: 0 | 1 | 2}) {
        return (
            <div className="flex space-x-2 items-center">
                <div className="flex flex-col gap-1">
                    <Controller
                        control={regForm.control}
                        name={`registeredClasses.${idx}.seasonid`}
                        render={({ field }) => (
                            <Select
                                value={field.value === 0 ? "" : String(field.value)}
                                onValueChange={(val: string) => {
                                    const seasonId = Number(val);
                                    field.onChange(seasonId);
                                    setSelectedSemester(prev => {
                                        const newSem = [...prev] as [number, number, number];
                                        newSem[idx] = seasonId;
                                        return newSem;
                                    });
                                }}
                                disabled={selectedStudent === 0}
                            >
                                <SelectTrigger className="w-64">
                                    <SelectValue placeholder="Select a Semester" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem key={season.year.seasonid} value={String(season.year.seasonid)}>
                                        {season.year.seasonnamecn}
                                    </SelectItem>
                                    <SelectItem key={season.fall.seasonid} value={String(season.fall.seasonid)}>
                                        {season.fall.seasonnamecn}
                                    </SelectItem>
                                    <SelectItem key={season.spring.seasonid} value={String(season.spring.seasonid)}>
                                        {season.spring.seasonnamecn}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <Controller
                        control={regForm.control}
                        name={`registeredClasses.${idx}.arrid`}
                        render={({ field }) => (
                            <Select
                                value={selectedClass[idx].classid === 0 ? "" : `${selectedClass[idx].classid}, ${selectedClass[idx].timeid}`}
                                onValueChange={(val: string) => {
                                    const [arrangeid, timeid] = val.split(", ");
                                    
                                    // Check for duplicate class selection
                                    const isDuplicate = selectedClass.some((cls, i) => 
                                        i !== idx && cls.classid === Number(arrangeid)
                                    );
                                    
                                    
                                    field.onChange(Number(arrangeid));
                                    
                                    const oldTime = selectedClass[idx].contrib;
                                    const newTime = Number(timeid);
                                    const classData = { classid: Number(arrangeid), timeid: newTime, contrib: 0 };
                                    setPeriods(prev => {
                                        const newPeriod = { ...prev[selectedStudent] }; // Create a copy
                                        if (oldTime !== 0) {
                                            removePeriod(newPeriod, oldTime);
                                        }
                                        
                                        if (isDuplicate) {
                                            setError(prevErr => {
                                                const newErr = { ...prevErr };
                                                newErr[selectedStudent] = [...newErr[selectedStudent]] as [string, string, string];
                                                newErr[selectedStudent][idx] = "Cannot select the same class multiple times";
                                                return newErr;
                                            })
                                            return { ...prev, [selectedStudent]: newPeriod};
                                        }
                                        
                                        // Try to add the new period
                                        if (!addPeriod(newPeriod, newTime)) { 
                                            setError(prevErr => {
                                                const newErr = { ...prevErr };
                                                newErr[selectedStudent] = [...newErr[selectedStudent]] as [string, string, string];
                                                newErr[selectedStudent][idx] = `Time: ${periodMap[Number(timeid) as 1 | 2 | 3]}, time conflict with other selected classes`
                                                return newErr;
                                            })
                                            // Keep contrib at 0
                                        } else {
                                            // Clear this index if no conflict
                                            setError(prev => {
                                                const newErr = { ...prev};
                                                newErr[selectedStudent] = [...newErr[selectedStudent]] as [string, string, string];
                                                newErr[selectedStudent][idx] = "";
                                                newErr[selectedStudent] = newErr[selectedStudent].map((err, i) => 
                                                    i === idx ? "" : hasConflict(newPeriod, selectedClass[i].timeid) ? err : ""
                                                ) as [string, string, string];
                                                return newErr;
                                            })
                                            classData.contrib = newTime;
                                        }
                                        // Update selected class state
                                        setSelectedClass(prevClass => { 
                                            const newSem = [...prevClass] as [classAndTime, classAndTime, classAndTime]; 
                                            newSem[idx] = classData; 
                                            return newSem;
                                        })
                                        return { ...prev, [selectedStudent]: newPeriod};
                                    })
                                }}
                                disabled={selectedStudent === 0}
                            >
                                <SelectTrigger className="w-64">
                                    <SelectValue placeholder="Select a Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getValidClasses(idx).map((c) => (
                                        <SelectItem key={c.arrangeid} value={String(c.arrangeid) + ", " + String(c.timeid)}>
                                            {idMaps.classMap[c.classid].classnamecn} {idMaps.timeMap[c.timeid].period}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                <button type="button" className="border-gray-300 border-2 text-black p-2 rounded-md text-xs cursor-pointer" onClick={() => resetSelections(idx)}>
                    Reset
                </button>
                <div className="ml-2xl items-center">
                    <p className="text-sm text-red-600">
                        {selectedStudent !== 0 ? error[selectedStudent][idx] : ""}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col">
            <form onSubmit={regForm.handleSubmit(onSubmit)} className="border-1 border-black p-4">
                <h1 className="flex-col gap-1 font-bold text-lg">
                    注册课程 Register Classes
                </h1>
                <p className="mt-2">
                    Please choose which student to register first, then choose semester, type of class and finally choose class to register. 
                    After the classes are selected, if you want to cancel any one of them, just check Cancel. 
                    If you want to cancel a class after you submit the registration, click to cancel that class. 
                    After fininshing all registration, please click Print Registration Record button. 
                    Some classes might only open for current semester, in this case you should select the semester to register the class. 
                    Click here for school registration policy Click here to view the complete list of opened classes. 
                    If you have any questions or comment please click here
                </p>
                <div className="space-y-2 mt-10">
                    <div className="flex gap-2 items-center">
                        <span className="text-black">Select Student:</span>
                        <Controller
                            control={regForm.control}
                            name="studentid"
                            render={({ field }) => (
                                <Select
                                    value={field.value === 0 ? "" : String(field.value)}
                                    onValueChange={(val: string) => {
                                        const numVal = Number(val);
                                        field.onChange(numVal);
                                        setSelectedStudent(numVal);
                                    }}
                                >
                                    <SelectTrigger className="w-64">
                                        <SelectValue placeholder="Select a Student" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Students</SelectLabel>
                                            {students.map((stu) => (
                                                <SelectItem key={stu.studentid} value={String(stu.studentid)}>
                                                    {stu.namefirsten} {stu.namelasten}
                                                    {stu.namecn ? ` (${stu.namecn})` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                    {([0, 1, 2] as const).map(idx => (
                        <div key={idx} className="flex gap-5 items-center">
                            <p>Course {idx + 1} </p>
                            <RegSelect idx={idx} />
                        </div>
                    ))}
                    {regForm.formState.errors.registeredClasses && (
                        <div className="text-red-600 text-sm mt-2">
                            {regForm.formState.errors.registeredClasses.message}
                        </div>
                    )}
                    {regForm.formState.errors.root && (
                        <div className="text-red-600 text-sm mt-2">
                            {regForm.formState.errors.root.message}
                        </div>
                    )}
                    {Array.isArray(regForm.formState.errors.registeredClasses) &&
                        regForm.formState.errors.registeredClasses.map((err, idx) => {
                            if (!err) return null;
                            return (
                                <div key={idx} className="text-red-600 text-sm mt-1">
                                    Course {idx + 1}: {err.message || "Please select both semester and class"}
                                </div>
                            );
                        })
                    }
                    <div className="flex justify-end">
                        <div className="flex gap-2">
                            <button type="button" className="border-gray-300 border-2 text-black font-bold rounded-md p-2" onClick={resetAll}>
                                Reset all
                            </button>
                            <button
                                type="submit"
                                disabled={isDisabled}
                                className={[
                                    "font-bold rounded-md p-2 transition-colors duration-150",
                                    isDisabled
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                                ].join(" ")}
                                aria-disabled={isDisabled}
                                tabIndex={isDisabled ? -1 : 0}
                            >
                                Register
                            </button>
                        </div>
                    </div>
                </div>
            </form>
            <div className="mt-5">
                <RegTable registrations={registrations} idMaps={idMaps} students={students} season={season} balances={balances}/>
            </div>
            <div className="mt-5 flex self-end">
                <p className="font-bold">
                    Total Balance: {totalBalance}
                </p>
            </div>
        </div>
    )
}