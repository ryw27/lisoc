"use client";
import React, { useState, useEffect } from "react";
import { 
    Select, 
    SelectItem, 
    SelectContent, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { z } from "zod/v4";
import { arrangementArraySchema } from "@/lib/registration/validation";
import { uiClasses } from "@/lib/registration/types";
import { type Action, type fullRegID } from "./sem-view";
import { createArrangement, editArrangement } from "@/lib/registration/semester";
import { cn } from "@/lib/utils";
import { useRegistrationContext } from "@/lib/registration/registration-context";


type semClassEditorProps = {
    uuid: string | "ADDING";
    initialData: fullRegID;
    // All UI state, server side mutation is imported above
    dispatch: React.Dispatch<Action>
    endEdit: () => void;
}


export default function SemClassEditor({ uuid, initialData, dispatch, endEdit }: semClassEditorProps) {
    const { seasons, selectOptions, idMaps } = useRegistrationContext();
    const { classMap } = idMaps;

    const [classEdited, setClassEdited] = useState<number>(0);
    // const [addClassroom, setAddClassroom] = useState<boolean>(false);

    const editForm = useForm({
        resolver: zodResolver(arrangementArraySchema),
        defaultValues: {
                classrooms: [
                    {
                        ...initialData.arrinfo,
                        seatlimit: uuid === "ADDING" ? 0 : initialData.arrinfo.seatlimit,
                        teacherid: uuid === "ADDING" ? 7 : initialData.arrinfo.teacherid,
                        roomid: uuid === "ADDING" ? 59 : initialData.arrinfo.roomid,
                        isregclass: true
                    },
                    ...(initialData.classrooms?.map((c) => ({
                        ...c.arrinfo,
                    })) ?? [])
                ]
            },
        mode: "all"
    })


    const { fields, append } = useFieldArray({ control: editForm.control, name: "classrooms" })

    // TODO: Uncomment when gradeclassid is ready
    // const [childClasses, setChildClasses] = useState<classObject[]>([]);

    // useEffect(() => {
    //     let isMounted = true;
    //     const fetchChildClasses = async () => {
    //         if (initialData?.arrinfo?.classid) {
    //             try {
    //                 const result = await getSubClassrooms(initialData.arrinfo.classid);
    //                 if (isMounted) setChildClasses(result);
    //             } catch (err) {
    //                 setChildClasses([]);
    //             }
    //         } else {
    //             setChildClasses([]);
    //         }
    //     };
    //     fetchChildClasses();
    //     return () => { isMounted = false; };
    // }, [initialData]);

    /*const [childClasses, setChildClasses] = useState<number[]>([]);
    useEffect(() => {
        setChildClasses([1, 2, 4, 6, 8, 12]);
    }, [])
    */
    const onAddClassroom = async () => {
        const newIndex = fields.length;
        append({
            classid: null, // childClasses[newIndex - 1], //.classid
            teacherid: 7,
            roomid: 59,
            seatlimit: 20,
            agelimit: fields[0].agelimit,
            tuitionW: fields[0].tuitionW,
            bookfeeW: fields[0].bookfeeW,
            specialfeeW: fields[0].specialfeeW,
            tuitionH: fields[0].tuitionH,
            bookfeeH: fields[0].bookfeeH,
            specialfeeH: fields[0].specialfeeH,
            suitableterm: fields[0].suitableterm,
            timeid: fields[0].timeid,
            closeregistration: fields[0].closeregistration,
            waiveregfee: fields[0].waiveregfee,
            isregclass: false,
        });
        setClassEdited(newIndex);
        
        // editForm.setValue(`classrooms.${newIndex}.classid`, childClasses[newIndex - 1], {
        //     shouldDirty: true,
        //     shouldValidate: true,
        // });
    }

    const onSubmit = async (formData: z.infer<typeof arrangementArraySchema>) => {
        const snapshot = initialData;
        const new_uuid = crypto.randomUUID();
        try {
            // Safely check if classrooms is defined and is an array
            if (uuid !== "ADDING") {
                const dirtyClassrooms = editForm.formState.dirtyFields.classrooms;
                // 1. Optimistic update
                // Process all classrooms to handle both updates and additions
                // Note that the structure of form data is different than most data in this domain: All classrooms, including the reg class are in formData.classrooms
                // It is at index 0 for simplicity. ONLY FOR THIS FORM DATA. 
                formData.classrooms.forEach((classroom, idx) => {
                    // Skip the reg class (index 0) - handle it separately if needed
                    if (idx === 0 && classroom.isregclass) {
                        // Only update reg class if it's dirty
                        if (dirtyClassrooms && Array.isArray(dirtyClassrooms) && dirtyClassrooms[idx]) {
                            const convertedData = {
                                ...classroom,
                                tuitionW: classroom.tuitionW?.toString() || null,
                                specialfeeW: classroom.specialfeeW?.toString() || null,
                                bookfeeW: classroom.bookfeeW?.toString() || null,
                                tuitionH: classroom.tuitionH?.toString() || null,
                                specialfeeH: classroom.specialfeeH?.toString() || null,
                                bookfeeH: classroom.bookfeeH?.toString() || null,
                            };
                            dispatch({ type: "reg/update", id: uuid, next: convertedData});
                        }
                        return;
                    }

                    // For non-reg classrooms, check if it's an update or addition
                    const isDirty = dirtyClassrooms && Array.isArray(dirtyClassrooms) && dirtyClassrooms[idx];
                    const hasArrangeid = classroom.arrangeid !== undefined && classroom.arrangeid !== null;
                    
                    if (isDirty || !hasArrangeid) {
                        const convertedClassroom = {
                            ...classroom,
                            tuitionW: classroom.tuitionW?.toString() || null,
                            specialfeeW: classroom.specialfeeW?.toString() || null,
                            bookfeeW: classroom.bookfeeW?.toString() || null,
                            tuitionH: classroom.tuitionH?.toString() || null,
                            specialfeeH: classroom.specialfeeH?.toString() || null,
                            bookfeeH: classroom.bookfeeH?.toString() || null,
                        };

                        if (hasArrangeid) {
                            // Existing classroom - update it
                            dispatch({
                                type: "class/update", 
                                id: uuid, 
                                arrangeid: classroom.arrangeid as number, 
                                update: convertedClassroom 
                            });
                        } else {
                            // New classroom - add it
                            // Server action will create the arrangeid
                            // TODO: Check this; I think this may cause errors if I don't revalidate since certain actions requiring arrangeid technically won't get it as the arrangeid won't arrive on the client until a revalidation
                            dispatch({
                                type: "class/add", 
                                id: uuid, 
                                roomDraft: convertedClassroom 
                            });
                        }
                    }
                });
                // Server update
                await editArrangement(formData, seasons.year);
            } else {
                let seasonid;
                if (formData.classrooms[0].suitableterm === 2) {
                    seasonid = seasons.year.seasonid;
                } else {
                    if (formData.classrooms[0].term === "FALL") {
                        seasonid = seasons.fall.seasonid
                    } else {
                        seasonid = seasons.spring.seasonid
                    }
                }
                // Generate a UUID for the new reg class on the client
                // Prepare the regDraft for the new registration class
                const regDraft = {
                    ...initialData,
                    id: new_uuid,
                    // Use the first classroom's arrinfo as the regclass arrinfo
                    arrinfo: {
                        ...formData.classrooms[0],
                        seasonid: seasonid,
                        notes: formData.classrooms[0].notes || null,
                        tuitionW: formData.classrooms[0].tuitionW?.toString() || null,
                        specialfeeW: formData.classrooms[0].specialfeeW?.toString() || null,
                        bookfeeW: formData.classrooms[0].bookfeeW?.toString() || null,
                        tuitionH: formData.classrooms[0].tuitionH?.toString() || null,
                        specialfeeH: formData.classrooms[0].specialfeeH?.toString() || null,
                        bookfeeH: formData.classrooms[0].bookfeeH?.toString() || null,
                    },
                    classrooms: formData.classrooms.map((c) => ({
                        arrinfo: {
                            ...c,
                            seasonid: seasonid,
                            notes: formData.classrooms[0].notes || null,
                            tuitionW: c.tuitionW?.toString() || null,
                            specialfeeW: c.specialfeeW?.toString() || null,
                            bookfeeW: c.bookfeeW?.toString() || null,
                            tuitionH: c.tuitionH?.toString() || null,
                            specialfeeH: c.specialfeeH?.toString() || null,
                            bookfeeH: c.bookfeeH?.toString() || null,
                        },
                        students: [],
                    })),
                } satisfies fullRegID;

                dispatch({ type: "reg/add", regDraft: regDraft });

                await createArrangement(formData, seasons.year);
            }
            endEdit();
        } catch (error) {
            // Revert optimistic update in case of error
            if (uuid !== "adding") {
                dispatch({ type: "reg/update", id: uuid, next: snapshot.arrinfo })
                snapshot.classrooms.map((c) => {
                    if (c.arrinfo.arrangeid) { // Should be true at all times
                        dispatch({ type: "class/update", id: uuid, arrangeid: c.arrinfo.arrangeid, update: c.arrinfo });
                    } else {
                        console.error("No arrangeid found for existing arrangement of regclass");
                    }
                })
            } else {
               dispatch({ type: "reg/remove", id: new_uuid })
            }

            editForm.setError("root", { message: "Error updating class" });
            console.error(error);
        }
    }

    // Roomid, teacherid, classid, notes are unique to each classroom. The rest are shared and are received from the initial data to ensure consistency.
    const seatLimitSum = fields.slice(1).reduce(
        (sum, classroom) => sum + (Number(classroom.seatlimit) || 0),
        0
    );

    // Update reg class seat limit when other classroom limits change
    useEffect(() => {
        editForm.setValue(`classrooms.0.seatlimit`, seatLimitSum);
    }, [seatLimitSum, classEdited, editForm]);

    const getDefaultValue = (key: keyof uiClasses) => {
        if (key === "seatlimit") {
            return classEdited === 0 ? seatLimitSum.toString() : (fields[classEdited] as unknown as uiClasses)?.seatlimit?.toString() || "0";
        }
        if (key !== "roomid" && key !== "teacherid" && key !== "classid" && key !== "notes") {
            return (fields[0] as unknown as uiClasses)?.[key]?.toString() || "0";
        } else {
            return (fields[classEdited] as unknown as uiClasses)?.[key]?.toString() || "0";
        }
    }
    // If arrInfo is an empty object, set it to null
    // const isEmptyObject = (obj: unknown): boolean =>
    //     !!obj && typeof obj === "object" && !Array.isArray(obj) && Object.keys(obj).length === 0;

    // const arrInfo = isEmptyObject(initialData.arrinfo) ? null : initialData.arrinfo || null;

    // const classrooms = initialData.classrooms || null


    return (
        <div className="mt-2 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <button
                disabled={uuid === "ADDING"}
                onClick={onAddClassroom}
                className={cn(
                    "bg-blue-600 text-white font-bold self-end rounded-md p-2 transition-opacity",
                    uuid === "ADDING" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                )}
            >
                Add Classroom
            </button>
            <form className="mt-2" onSubmit={editForm.handleSubmit(onSubmit)} >
                {/* Field selector */}
                <div className="mb-4">
                    <label className="block text-sm text-gray-400 font-bold mb-2">Select Field to Edit:</label>
                    <div className="flex gap-2 flex-wrap">
                        {fields.map((field, idx) => (
                            <button
                                key={field.id}
                                type="button"
                                onClick={() => setClassEdited(idx)}
                                className={cn(
                                    "px-3 py-1 rounded text-sm font-medium transition-colors",
                                    classEdited === idx
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                )}
                            >
                                {idx === 0 ? "Reg Class" : `${idx}:`} ({classMap[(field.classid as number)]?.classnamecn ?? `Class ${field.classid}`})
                            </button>
                        ))}
                    </div>
                </div>

                {fields.map((field, idx) =>
                    idx === classEdited ? (
                        <React.Fragment key={field.id}>
                            {uuid === "ADDING" && (
                                <>
                                    <label className="block text-sm text-gray-400 font-bold mb-2">
                                        Class Name {classEdited === 0 ? "(Reg Class)" : ""}
                                    </label>
                                    <Controller
                                        name={`classrooms.${idx}.classid`}
                                        control={editForm.control}
                                        render={({ field }) => (
                                            <Select
                                                required
                                                aria-required
                                                value={field.value?.toString()}
                                                onValueChange={value => {
                                                    field.onChange(Number(value));
                                                }}
                                            >
                                                <SelectTrigger className="w-full border rounded p-1">
                                                    <SelectValue placeholder="Select a class" />
                                                </SelectTrigger>
                                                {<SelectContent className="max-h-[200px] overflow-y-auto">
                                                    {selectOptions.classes.map((obj) => (
                                                        <SelectItem key={obj.classid} value={obj.classid.toString()}>
                                                            {classMap[obj.classid]?.classnamecn ?? `Class ${obj.classid}`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>}
                                                    {/* {uuid !== "ADDING"
                                                        ? fields.map((obj) => (
                                                            <SelectItem key={obj.id} value={(obj.classid as number).toString()}>
                                                                {classMap[obj.classid as number]?.classnamecn ?? `Class ${obj.classid}`}
                                                            </SelectItem>
                                                        ))
                                                        : selectOptions.classes.map((obj) => (
                                                            <SelectItem key={obj.classid} value={obj.classid.toString()}>
                                                                {classMap[obj.classid]?.classnamecn ?? `Class ${obj.classid}`}
                                                            </SelectItem>
                                                        ))
                                                    } */}
                                            </Select>
                                        )}
                                    />
                                </>
                            )}

                            {classEdited !== 0 && (
                                <>
                                <div className="flex-1 min-w-0">
                                    <label className="block text-sm text-gray-400 font-bold mb-2">Choose Class</label>
                                        <Controller
                                            name={`classrooms.${classEdited}.classid`}
                                            control={editForm.control}
                                            render={({ field }) => (
                                                <Select
                                                    required
                                                    aria-required
                                                    value={field.value?.toString()}
                                                    onValueChange={value => field.onChange(Number(value))}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select a class" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-[200px] overflow-y-auto">
                                                        {initialData.availablerooms.map((obj: { classid: number, classnamecn: string, description: string | null }) => (
                                                            <SelectItem key= {obj.classid.toString()} value={obj.classid.toString()} >
                                                                {`${obj.classnamecn} ${obj.description ?? ""}`}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                </div>
                                <div className="flex flex-row gap-4 mb-4">
                                    <div className="flex-1 min-w-0">
                                        <label className="block text-sm text-gray-400 font-bold mb-2">Teacher</label>
                                        <Controller
                                            name={`classrooms.${classEdited}.teacherid`}
                                            control={editForm.control}
                                            render={({ field }) => (
                                                <Select
                                                    required
                                                    aria-required
                                                    value={field.value?.toString()}
                                                    onValueChange={value => field.onChange(Number(value))}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select a teacher" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-[200px] overflow-y-auto">
                                                        {selectOptions.teachers.map((obj: { teacherid: number; namecn: string | null }) => (
                                                            <SelectItem key={obj.teacherid} value={obj.teacherid.toString()}>
                                                                {obj.namecn}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <label className="block text-sm text-gray-400 font-bold mb-2">Classroom</label>
                                        <Controller
                                            name={`classrooms.${classEdited}.roomid`}
                                            control={editForm.control}
                                            render={({ field }) => (
                                                <Select
                                                    required
                                                    aria-required
                                                    value={field.value?.toString()}
                                                    onValueChange={value => field.onChange(Number(value))}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select a classroom" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-[200px] overflow-y-auto">
                                                        {selectOptions.rooms.map((obj: { roomid: number; roomno: string }) => (
                                                            <SelectItem key={obj.roomid} value={obj.roomid.toString()}>
                                                                {obj.roomno}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>
                                </>
                            )}
                            <div className="flex-1 min-w-0">
                                <label className="block text-sm text-gray-400 font-bold mb-2">Seat Limit</label>
                                <Input
                                    type="number"
                                    required
                                    aria-required
                                    disabled={classEdited === 0}
                                    {...editForm.register(`classrooms.${classEdited}.seatlimit`)}
                                    defaultValue={getDefaultValue("seatlimit")}
                                    className={cn("border rounded p-1")}
                                />
                            </div>

                            <div className="flex gap-2 mb-2">
                                <div className="w-1/3">
                                    <label className="block text-sm text-gray-400 font-bold mb-2">Tuition (Whole Year)</label>
                                    <Input
                                        type="number"
                                        {...editForm.register(`classrooms.${classEdited}.tuitionW`)}
                                        disabled={classEdited !== 0}
                                        required
                                        aria-required
                                        defaultValue={getDefaultValue("tuitionW")}
                                        className="border rounded p-1"
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-sm text-gray-400 font-bold mb-2">Book Fee (Whole Year)</label>
                                    <Input
                                        type="number"
                                        {...editForm.register(`classrooms.${classEdited}.bookfeeW`)}
                                        defaultValue={getDefaultValue("bookfeeW")}
                                        disabled={classEdited !== 0}
                                        required
                                        aria-required
                                        className="border rounded p-1"
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-sm text-gray-400 font-bold mb-2">Special Fee (Whole Year)</label>
                                    <Input
                                        type="number"
                                        {...editForm.register(`classrooms.${classEdited}.specialfeeW`)}
                                        defaultValue={getDefaultValue("specialfeeW")}
                                        disabled={classEdited !== 0}
                                        required
                                        aria-required
                                        className="border rounded p-1"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mb-2">
                                <div className="w-1/3">
                                    <label className="block text-sm text-gray-400 font-bold mb-2">Tuition (Half Year)</label>
                                    <Input
                                        type="number"
                                        {...editForm.register(`classrooms.${classEdited}.tuitionH`)}
                                        defaultValue={getDefaultValue("tuitionH")}
                                        disabled={classEdited !== 0}
                                        required
                                        aria-required
                                        className="border rounded p-1"
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-sm text-gray-400 font-bold mb-2">Book Fee (Half Year)</label>
                                    <Input
                                        type="number"
                                        {...editForm.register(`classrooms.${classEdited}.bookfeeH`)}
                                        defaultValue={getDefaultValue("bookfeeH")}
                                        disabled={classEdited !== 0}
                                        required
                                        aria-required
                                        className="border rounded p-1"
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-sm text-gray-400 font-bold mb-2">Special Fee (Half Year)</label>
                                    <Input
                                        type="number"
                                        {...editForm.register(`classrooms.${classEdited}.specialfeeH`)}
                                        defaultValue={getDefaultValue("specialfeeH")}
                                        disabled={classEdited !== 0}
                                        className="border rounded p-1"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 mb-2">
                                <div className="w-1/2">
                                    <label className="block text-sm text-gray-400 font-bold mb-2">Age Limit</label>
                                    <Input
                                        type="number"
                                        required
                                        aria-required
                                        {...editForm.register(`classrooms.${classEdited}.agelimit`)}
                                        defaultValue={getDefaultValue("agelimit")}
                                        disabled={classEdited !== 0}
                                        className="border rounded p-1"
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-sm text-gray-400 font-bold mb-2">Class Time</label>
                                    <Controller
                                        name={`classrooms.${classEdited}.timeid`}
                                        control={editForm.control}
                                        render={({ field }) => (
                                            <Select
                                                required
                                                aria-required
                                                value={field.value?.toString() || "0"}
                                                onValueChange={(value) => field.onChange(Number(value))}
                                                disabled={classEdited !== 0}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select a time" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                                    {selectOptions.times.map((time: { timeid: number; period: string | null }) => (
                                                        <SelectItem key={time.timeid} value={time.timeid.toString()}>
                                                            {time.period}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mb-2">
                                <div className="w-1/2">
                                    <label className="block text-sm text-gray-400 font-bold mb-2">Close Registration</label>
                                    <Controller
                                        name={`classrooms.${classEdited}.closeregistration`}
                                        control={editForm.control}
                                        render={({ field }) => (
                                            <Select
                                                required
                                                aria-required
                                                value={field.value?.toString() || "false"}
                                                onValueChange={(value) => field.onChange(value === "true" ? true : false)}
                                                disabled={classEdited !== 0}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select a time" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                                    <SelectItem key={"true-closeregistration"} value={"true"}>
                                                        Yes
                                                    </SelectItem>
                                                    <SelectItem key={"false-closeregistration"} value={"false"}>
                                                        No
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-sm text-gray-400 font-bold mb-2">Waive Registration Fee</label>
                                    <Controller
                                        name={`classrooms.${classEdited}.waiveregfee`}
                                        control={editForm.control}
                                        render={({ field }) => (
                                            <Select
                                                required
                                                aria-required
                                                value={field.value?.toString() || "false"}
                                                onValueChange={(value) => field.onChange(value === "true" ? true : false)}
                                                disabled={classEdited !== 0}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select a time" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                                    <SelectItem key={"true-waiveregfee"} value={"true"}>
                                                        Yes
                                                    </SelectItem>
                                                    <SelectItem key={"false-waiveregfee"} value={"false"}>
                                                        No
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Suitable Term</label>
                            <Controller
                                name={`classrooms.${classEdited}.suitableterm`}
                                control={editForm.control}
                                render={({ field }) => (
                                    <Select
                                        required
                                        aria-required
                                        value={field.value?.toString() || "0"}
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        disabled={classEdited !== 0}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a time" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px] overflow-y-auto">
                                            {selectOptions.terms.map((term: { termno: number; suitableterm: string | null }) => (
                                                <SelectItem key={term.termno} value={term.termno.toString()}>
                                                    {term.suitableterm}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />

                            <div className="flex justify-end mt-2 gap-2">
                                <button
                                    type="button"
                                    onClick={endEdit}
                                    className="rounded-md text-sm flex items-center gap-1 border-gray-300 border-1 font-semibold hover:bg-gray-50 cursor-pointer p-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    className={cn("bg-blue-600 text-sm text-white font-bold px-4 py-2 rounded-md", (!editForm.formState.isValid || editForm.formState.isSubmitting) ? "bg-gray-400 cursor-not-allowed" : "cursor-pointer")}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                    type="submit"
                                    disabled={!editForm.formState.isValid || editForm.formState.isSubmitting}
                                >
                                    {editForm.formState.isSubmitting ? "Saving..." : "Save"}
                                </button>
                            </div>
                            {Object.keys(editForm.formState.errors).length > 0 && (
                                <div className="mt-2 text-red-600 text-sm">
                                    {Object.entries(editForm.formState.errors).map(([field, error]) =>
                                        error && typeof error === "object" && "message" in error ? (
                                            <div key={field}>{(error as { message?: string }).message}</div>
                                        ) : null
                                    )}
                                </div>
                            )}
                        </React.Fragment>
                    ) : null
                )}
            </form>
        </div>
    )
}