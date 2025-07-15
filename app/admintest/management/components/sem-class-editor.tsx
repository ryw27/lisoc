"use client";
import { arrangementSchema } from "@/app/lib/semester/sem-schemas";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { z } from "zod/v4";
import { type uiClassStudents } from "./sem-view";
import React, { useContext } from "react";
import { OptionContext } from "./sem-view"; 
import { InferSelectModel } from "drizzle-orm";
import { arrangement, seasons } from "@/app/lib/db/schema";


type semClassEditorProps = {
    cancelEdit: () => void
    setUIState: React.Dispatch<React.SetStateAction<uiClassStudents[]>>;
    setConfiguring: React.Dispatch<React.SetStateAction<{ editing: boolean, expanded: boolean}[]>>;
    editClass: (formData: z.infer<typeof arrangementSchema>, season: InferSelectModel<typeof seasons>) => Promise<InferSelectModel<typeof arrangement>>;
    idx: number;
    data?: uiClassStudents;
}

export default function SemClassEditor({ cancelEdit, setUIState, setConfiguring, editClass, idx, data }: semClassEditorProps) {
    const { selectOptions, idMaps, season } = useContext(OptionContext)!;
    const { classMap, teacherMap, roomMap, termMap, timeMap } = idMaps
    const defaultObj: uiClassStudents = {
        arrangeid: undefined,
        season: { seasonid: season.seasonid, seasonnamecn: season.seasonnamecn, seasonnameeng: season.seasonnameeng },
        class: { classid: 0, classnamecn: "", classnameen: "" },
        teacher: { teacherid: 0, namecn: "", namelasten: "", namefirsten: "" },
        classroom: { roomid: 0, roomno: "" },
        classtime: { timeid: 0, period: "" },
        suitableterm: { termno: 0, suitableterm: "", suitabletermcn: "" },
        seatlimit: null,
        agelimit: null,
        waiveregfee: false,
        closeregistration: false,
        tuitionW: null,
        specialfeeW: null,
        bookfeeW: null,
        tuitionH: null,
        specialfeeH: null,
        bookfeeH: null,
        notes: null,
        students: [],
    }

    const editForm = useForm({
        resolver: zodResolver(arrangementSchema),
        defaultValues: (data ? {
            arrangeid: data.arrangeid,
            classid: data.class.classid,
            teacherid: data.teacher.teacherid,
            roomid: data.classroom.roomid,
            timeid: data.classtime.timeid,
            seatlimit: data.seatlimit || 0,
            agelimit: data.agelimit || 0,
            suitableterm: data.suitableterm.termno,
            waiveregfee: data.waiveregfee,
            closeregistration: data.closeregistration,
            notes: data.notes || "",
            tuitionW: data.tuitionW ? Number(data.tuitionW) : 0,
            bookfeeW: data.bookfeeW ? Number(data.bookfeeW) : 0,
            specialfeeW: data.specialfeeW ? Number(data.specialfeeW) : 0,
            tuitionH: data.tuitionH ? Number(data.tuitionH) : 0,
            bookfeeH: data.bookfeeH ? Number(data.bookfeeH) : 0,
            specialfeeH: data.specialfeeH ? Number(data.specialfeeH) : 0,
        } : undefined)
    })

    const onSubmit = async (formData: z.infer<typeof arrangementSchema>) => {
        try {
            // Optimistic update
            setUIState(prev => {
                const newState = prev;
                const classObj = classMap[formData.classid!];
                const teacherObj = teacherMap[formData.teacherid!];
                const roomObj = roomMap[formData.roomid!];
                const timeObj = timeMap[formData.timeid!];
                const termObj = termMap[formData.suitableterm!];
                const formObj = {
                    arrangeid: data?.arrangeid || undefined,
                    season: { seasonid: season.seasonid, seasonnamecn: season.seasonnamecn, seasonnameeng: season.seasonnameeng },
                    class: { classid: formData.classid!, classnamecn: classObj?.classnamecn || "", classnameen: classObj?.classnameen || "" },
                    teacher: { teacherid: formData.teacherid!, namecn: teacherObj?.namecn || "", namelasten: teacherObj?.namelasten || "", namefirsten: teacherObj?.namefirsten || "" },
                    classroom: { roomid: formData.roomid!, roomno: roomObj?.roomno || "" },
                    classtime: { timeid: formData.timeid!, period: timeObj?.period || "" },
                    suitableterm: { termno: formData.suitableterm!, suitableterm: termObj?.suitableterm || "", suitabletermcn: termObj?.suitabletermcn || "" },
                    students: data?.students || [],
                    tuitionW: formData.tuitionW!.toString(),
                    bookfeeW: formData.bookfeeW!.toString(),
                    specialfeeW: formData.specialfeeW!.toString(),
                    tuitionH: formData.tuitionH!.toString(),
                    bookfeeH: formData.bookfeeH!.toString(),
                    specialfeeH: formData.specialfeeH!.toString(),
                    seatlimit: Number(formData.seatlimit),
                    agelimit: Number(formData.agelimit),
                    waiveregfee: formData.waiveregfee!,
                    closeregistration: formData.closeregistration!,
                    notes: formData.notes || "",
                } satisfies uiClassStudents
                if (data) {
                    newState[idx] = formObj;
                } else {
                    newState.push(formObj);
                }
                return newState
            });
            const updatedClass = await editClass(formData, season);
            if (data) {
                setConfiguring(prev => {
                    const newState = prev;
                    newState[idx] = { ...newState[idx], editing: false }
                    return newState
                })
            } else {
                setUIState(prev => {
                    const newState = prev;
                    newState[idx] = {
                        ...newState[idx],
                        arrangeid: updatedClass.arrangeid,
                    }
                    return newState
                })
                setConfiguring(prev => {
                    const newState = prev;
                    newState.push({ editing: false, expanded: false});
                    return newState
                })
            }
            cancelEdit();
        } catch (error) {
            // Revert optimistic update in case of error
            if (data) {
                setUIState(prev => {
                    const newState = prev;
                    newState[idx] = {
                        season: { seasonid: season.seasonid, seasonnamecn: season.seasonnamecn, seasonnameeng: season.seasonnameeng },
                        class: { classid: data.class.classid, classnamecn: data.class.classnamecn, classnameen: data.class.classnameen },
                        teacher: { teacherid: data.teacher.teacherid, namecn: data.teacher.namecn || "", namelasten: data.teacher.namelasten || "", namefirsten: data.teacher.namefirsten || "" },
                        classroom: { roomid: data.classroom.roomid, roomno: data.classroom.roomno },
                        classtime: { timeid: data.classtime.timeid, period: data.classtime.period || "" },
                        suitableterm: { termno: data.suitableterm.termno, suitableterm: data.suitableterm.suitableterm || "", suitabletermcn: data.suitableterm.suitabletermcn || "" },
                        tuitionW: data.tuitionW || null,
                        bookfeeW: data.bookfeeW || null,
                        specialfeeW: data.specialfeeW || null,
                        tuitionH: data.tuitionH || null,
                        bookfeeH: data.bookfeeH || null,
                        specialfeeH: data.specialfeeH || null,
                        seatlimit: data.seatlimit || 0,
                        agelimit: data.agelimit || 0,
                        waiveregfee: data.waiveregfee,
                        closeregistration: data.closeregistration,
                        students: data.students || [],
                        notes: data.notes || ""
                    }
                    return newState;
                })
            } else {
                setUIState(prev => prev.slice(0, -1))
            }
            editForm.setError("root", { message: "Error updating class" });
            console.error(error);
        }
    }

    return (
        <form onSubmit={editForm.handleSubmit(onSubmit)}>
            <label className="block text-sm text-gray-400 font-bold mb-2">Class Name</label>
            <Controller
                name="classid"
                control={editForm.control}
                render={({ field }) => (
                    <Select required aria-required value={field.value?.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                        <SelectTrigger className="w-full border rounded p-1">
                            <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                            {selectOptions.classes.map((obj: { classid: number; classnamecn: string }) => (
                                <SelectItem key={obj.classid} value={obj.classid.toString()}>
                                    {obj.classnamecn}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />

            <label className="block text-sm text-gray-400 font-bold mb-2">Teacher</label>
            <Controller
                name="teacherid"
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

            <label className="block text-sm text-gray-400 font-bold mb-2">Classroom</label>
            <Controller
                name="roomid"
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
            <label className="block text-sm text-gray-400 font-bold mb-2">Tuition (Whole Year)</label>
            <Input
                type="number" 
                {...editForm.register("tuitionW")}
                required
                aria-required
                defaultValue={data?.tuitionW?.toString() || "0"}
                className="border rounded p-1"
            />

            <label className="block text-sm text-gray-400 font-bold mb-2">Book Fee (Whole Year)</label>
            <Input
                type="number" 
                {...editForm.register("bookfeeW")}
                defaultValue={data?.bookfeeW?.toString() || "0"}
                required
                aria-required
                className="border rounded p-1"
            />
            <label className="block text-sm text-gray-400 font-bold mb-2">Special Fee Year (Whole Year) </label>
            <Input
                type="number" 
                {...editForm.register("specialfeeW")}
                defaultValue={data?.specialfeeW?.toString() || "0"}
                required
                aria-required
                className="border rounded p-1"
            />

            <label className="block text-sm text-gray-400 font-bold mb-2">Tuition (Half Year)</label>
            <Input
                type="number" 
                {...editForm.register("tuitionH")}
                defaultValue={data?.tuitionH?.toString() || "0"}
                required
                aria-required
                className="border rounded p-1"
            />

            <label className="block text-sm text-gray-400 font-bold mb-2">Book Fee (Half Year)</label>
            <Input
                type="number" 
                {...editForm.register("bookfeeH")}
                defaultValue={data?.bookfeeH?.toString() || "0"}
                required
                aria-required
                className="border rounded p-1"
            />
            <label className="block text-sm text-gray-400 font-bold mb-2">Special Fee (Half Year) </label>
            <Input
                type="number" 
                {...editForm.register("specialfeeH")}
                defaultValue={data?.specialfeeH?.toString() || "0"}
                className="border rounded p-1"
            />

            <label className="block text-sm text-gray-400 font-bold mb-2">Seat Limit</label>
            <Input
                type="number" 
                required
                aria-required
                {...editForm.register("seatlimit")}
                defaultValue={data?.seatlimit?.toString() || "0"}
                className="border rounded p-1"
            />
            <label className="block text-sm text-gray-400 font-bold mb-2">Age Limit</label>
            <Input
                type="number" 
                required
                aria-required
                {...editForm.register("agelimit")}
                defaultValue={data?.agelimit?.toString() || "0"}
                className="border rounded p-1"
            />
            <label className="block text-sm text-gray-400 font-bold mb-2">Class Time</label>
            <Controller
                name="timeid"
                control={editForm.control}
                render={({ field }) => (
                    <Select
                        required
                        aria-required
                        value={field.value?.toString() || "0"}
                        onValueChange={(value) => field.onChange(Number(value))}
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
                name="suitableterm"
                control={editForm.control}
                render={({ field }) => (
                    <Select
                        required
                        aria-required
                        value={field.value?.toString() || "0"}
                        onValueChange={(value) => field.onChange(Number(value))}
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
                name="closeregistration"
                control={editForm.control}
                render={({ field }) => (
                    <Select
                        required
                        aria-required
                        value={field.value?.toString() || "false"}
                        onValueChange={(value) => field.onChange(value === "true" ? true : false)}
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
                name="waiveregfee"
                control={editForm.control}
                render={({ field }) => (
                    <Select
                        required
                        aria-required
                        value={field.value?.toString() || "false"}
                        onValueChange={(value) => field.onChange(value === "true" ? true : false)}
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
                    onClick={cancelEdit}
                    className="rounded-md text-sm flex items-center gap-1 border-gray-300 border-1 font-semibold hover:bg-gray-50 cursor-pointer p-2"
                >
                    Cancel
                </button>
                <button
                    className="bg-blue-600 text-sm text-white font-bold px-4 py-2 rounded-md cursor-pointer"
                    type="submit"
                    disabled={!editForm.formState.isValid}
                >
                    Save
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
    )
}