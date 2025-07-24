"use client";
import React, { useContext, useState } from "react";
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
import { arrangementArraySchema, arrangementSchema, type uiClasses } from "@/app/lib/semester/sem-schemas";
import { type Action, type fullRegID, SeasonOptionContext } from "./sem-view";
import { addArrangement, updateArrangement, getSubClassrooms } from "@/app/lib/semester/sem-actions";
import { cn } from "@/lib/utils";


type semClassEditorProps = {
    uuid: string | "ADDING";
    initialData: fullRegID;
    // All UI state, server side mutation is imported above
    dispatch: React.Dispatch<Action>
    endEdit: () => void;
}


export default function SemClassEditor({ uuid, initialData, dispatch, endEdit }: semClassEditorProps) {
    const { seasons, selectOptions, idMaps } = useContext(SeasonOptionContext)!;
    const { classMap, teacherMap, roomMap, termMap, timeMap } = idMaps;

    const [classEdited, setClassEdited] = useState<number>(0);
    const [addClassroom, setAddClassroom] = useState<boolean>(false);

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
                    ...(initialData.classrooms?.map(c => ({
                        ...c.arrinfo,
                    })) ?? [])
                ]
            },
        mode: "all"
    })


    const { fields, append, remove, update } = useFieldArray({ control: editForm.control, name: "classrooms" })

    const onAddClassroom = async () => {
        const newIndex = fields.length;
        append({
            classid: 1,
            teacherid: 7,
            roomid: 59,
            seatlimit: 0,
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
        })
        setClassEdited(newIndex);
    }

    const onSubmit = async (formData: z.infer<typeof arrangementArraySchema>) => {
        const snapshot = initialData;
        const new_uuid = crypto.randomUUID();
        try {
            // Safely check if classrooms is defined and is an array
            if (uuid !== "ADDING") {
                const dirtyClassrooms = editForm.formState.dirtyFields.classrooms;
                console.log("dirty ", dirtyClassrooms)
                // 1. Optimistic update
                if (Array.isArray(dirtyClassrooms)) {
                    dirtyClassrooms.map((c, idx) => {
                        if (formData.classrooms[idx].isregclass && c) {
                            console.log("changing");
                            // Convert numeric tuition fields to strings for uiClasses type
                            const convertedData = {
                                ...formData.classrooms[idx],
                                tuitionW: formData.classrooms[idx].tuitionW?.toString() || null,
                                specialfeeW: formData.classrooms[idx].specialfeeW?.toString() || null,
                                bookfeeW: formData.classrooms[idx].bookfeeW?.toString() || null,
                                tuitionH: formData.classrooms[idx].tuitionH?.toString() || null,
                                specialfeeH: formData.classrooms[idx].specialfeeH?.toString() || null,
                                bookfeeH: formData.classrooms[idx].bookfeeH?.toString() || null,
                            };
                            dispatch({ type: "reg/update", id: uuid, next: convertedData});
                            console.log("changed");
                        } else {
                            if (c.seatlimit || c.teacherid || c.roomid) {
                                const convertedUpdate = {
                                    ...formData.classrooms[idx],
                                    tuitionW: formData.classrooms[idx].tuitionW?.toString() || null,
                                    specialfeeW: formData.classrooms[idx].specialfeeW?.toString() || null,
                                    bookfeeW: formData.classrooms[idx].bookfeeW?.toString() || null,
                                    tuitionH: formData.classrooms[idx].tuitionH?.toString() || null,
                                    specialfeeH: formData.classrooms[idx].specialfeeH?.toString() || null,
                                    bookfeeH: formData.classrooms[idx].bookfeeH?.toString() || null,
                                };
                                dispatch({type: "class/update", id: uuid, arrangeid: formData.classrooms[idx].arrangeid as number, update: convertedUpdate });
                            } else {
                                throw new Error("Other fields have been updated for non reg class")
                            }
                        }
                    })
                }
                // Server update
                await updateArrangement(formData, seasons.year);
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

                await addArrangement(formData, seasons.year);
            }
            endEdit();
        } catch (error) {
            // Revert optimistic update in case of error
            if (uuid !== "adding") {
                dispatch({ type: "reg/update", id: uuid, next: snapshot.arrinfo })
                snapshot.classrooms.map((c, idx) => {
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
    const getDefaultValue = (key: keyof uiClasses) => {
        if (key === "seatlimit") {
            return classEdited === 0 ? seatLimitSum : (fields[classEdited] as unknown as uiClasses)?.seatlimit?.toString() || "0";
        }
        if (key !== "roomid" && key !== "teacherid" && key !== "classid" && key !== "notes") {
            return (fields[0] as unknown as uiClasses)?.[key]?.toString() || "0";
        } else {
            return (fields[classEdited] as unknown as uiClasses)?.[key]?.toString() || "0";
        }
    }
    // If arrInfo is an empty object, set it to null
    const isEmptyObject = (obj: unknown): boolean =>
        !!obj && typeof obj === "object" && !Array.isArray(obj) && Object.keys(obj).length === 0;

    const arrInfo = isEmptyObject(initialData.arrinfo) ? null : initialData.arrinfo || null;

    const classrooms = initialData.classrooms || null
    const seatLimitSum = initialData.classrooms.reduce(
        (sum, classroom) => sum + (classroom.arrinfo.seatlimit ?? 0),
        0
    ) ?? 0;

    console.log(fields);
    console.log(classEdited);
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
                <label className="block text-sm text-gray-400 font-bold mb-2">Class Name </label>
                <Controller
                    name={`classrooms.${classEdited}.classid`}
                    control={editForm.control}
                    render={({ field }) => (
                        <Select
                            required
                            aria-required
                            value={field.value !== undefined ? `${field.value}, ${classEdited}` : undefined}
                            onValueChange={(value) => {
                                 const [classid, index] = value.split(", ");
                                 console.log("Values: ", classid, index);
                                 field.onChange(Number(classid));
                                 setClassEdited(Number(index));
                             }}
                        >
                            <SelectTrigger className="w-full border rounded p-1">
                                <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] overflow-y-auto">
                                {uuid !== "ADDING" ? (
                                    <>
                                        {fields.map((obj, index) => {
                                            const field = obj as z.infer<typeof arrangementSchema>;
                                            return (
                                                <SelectItem key={obj.id} value={`${field.classid}, ${index}`}>
                                                    {classMap[field.classid].classnamecn}
                                                </SelectItem>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <>
                                        {selectOptions.classes.map((obj) => (
                                            <SelectItem key={obj.classid} value={`${obj.classid}, 0`}>
                                                {classMap[obj.classid].classnamecn}
                                            </SelectItem>
                                        ))}
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    )}
                />

                {classEdited !== 0 && (
                    <>
                        <label className="block text-sm text-gray-400 font-bold mb-2">Teacher</label>
                        <Controller
                            name={`classrooms.${classEdited}.teacherid`}
                            control={editForm.control}
                            render={({ field }) => (
                                <Select required aria-required value={field.value?.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a teacher" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] overflow-y-auto">
                                        {selectOptions.teachers.map((obj: { teacherid: number; namecn: string | null}) => (
                                            <SelectItem key={obj.teacherid} value={obj.teacherid.toString()}>{obj.namecn}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </>
                )}

                {classEdited !== 0 && (
                    <>
                        <label className="block text-sm text-gray-400 font-bold mb-2">Classroom</label>
                        <Controller
                            name={`classrooms.${classEdited}.roomid`}
                            control={editForm.control}
                            render={({ field }) => (
                                <Select required aria-required value={field.value?.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a classroom" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] overflow-y-auto">
                                        {selectOptions.rooms.map((obj: { roomid: number; roomno: string }) => (
                                            <SelectItem key={obj.roomid} value={obj.roomid.toString()}>{obj.roomno}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </>
                )}

                <label className="block text-sm text-gray-400 font-bold mb-2">Seat Limit</label>
                <Input
                    type="number"
                    required
                    aria-required
                    {...editForm.register(`classrooms.${classEdited}.seatlimit`)}
                    defaultValue={getDefaultValue("seatlimit")}
                    disabled={classEdited === 0}
                    className={cn(`border rounded p-1 ${classEdited === 0 ? "cursor-disabled" : ""}`)}
                />

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
                <label className="block text-sm text-gray-400 font-bold mb-2">Special Fee Year (Whole Year) </label>
                <Input
                    type="number" 
                    {...editForm.register(`classrooms.${classEdited}.specialfeeW`)}
                    defaultValue={getDefaultValue("specialfeeW")}
                    disabled={classEdited !== 0}
                    required
                    aria-required
                    className="border rounded p-1"
                />

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
                <label className="block text-sm text-gray-400 font-bold mb-2">Special Fee (Half Year) </label>
                <Input
                    type="number" 
                    {...editForm.register(`classrooms.${classEdited}.specialfeeH`)}
                    defaultValue={getDefaultValue("specialfeeH")}
                    disabled={classEdited !== 0}
                    className="border rounded p-1"
                />


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
            </form>
        </div>
    )
}