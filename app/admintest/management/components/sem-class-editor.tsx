"use client";
import { draftClasses, semClassSchema } from "@/app/lib/semester/sem-schemas";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { updateClass } from "@/app/lib/semester/sem-actions";
import { selectOptions } from "./sem-view";
import { useMemo } from "react";

type semClassEditorProps = {
    data: draftClasses
    selectOptions: selectOptions;
    setEditing: (editing: boolean) => void;
    setUIState: React.Dispatch<React.SetStateAction<draftClasses>>;
}

export default function SemClassEditor({ data, selectOptions, setEditing, setUIState }: semClassEditorProps) {
    const editForm = useForm({
        resolver: zodResolver(semClassSchema),
        defaultValues: {
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
        }
    })

    const idToClass = useMemo(() => {
        const m = new Map<number, string>();
        selectOptions.classes.forEach((c: { classid: number, classnamecn: string }) => m.set(c.classid, c.classnamecn))
        return m;
    }, [selectOptions.classes]);

    const idToTeacher = useMemo(() => {
        const m = new Map<number, string>();
        selectOptions.teachers.forEach((t: { teacherid: number, namecn: string | null }) => m.set(t.teacherid, t.namecn || ""))
        return m;
    }, [selectOptions.teachers]);

    const idToRoom = useMemo(() => {
        const m = new Map<number, string>();
        selectOptions.rooms.forEach((r: { roomid: number, roomno: string }) => m.set(r.roomid, r.roomno))
        return m;
    }, [selectOptions.rooms]);

    const idToTime = useMemo(() => {
        const m = new Map<number, string>();
        selectOptions.times.forEach((t: { timeid: number, period: string | null }) => m.set(t.timeid, t.period || ""))
        return m;
    }, [selectOptions.times]);

    const idToTerm = useMemo(() => {
        const m = new Map<number, string>();
        selectOptions.terms.forEach((t: { termno: number, suitableterm: string | null }) => m.set(t.termno, t.suitableterm || ""))
        return m;
    }, [selectOptions.terms]);

    const onSubmit = async (formData: z.infer<typeof semClassSchema>) => {
        try {
            // Optimistic update
            setUIState(prev => {
                return {
                    ...prev,
                    class: { classid: formData.classid, classnamecn: idToClass.get(formData.classid) || "" },
                    teacher: { teacherid: formData.teacherid, namecn: idToTeacher.get(formData.teacherid) || "" },
                    classroom: { roomid: formData.roomid, roomno: idToRoom.get(formData.roomid) || "" },
                    classtime: { timeid: formData.timeid, period: idToTime.get(formData.timeid) || "" },
                    suitableterm: { termno: formData.suitableterm, suitabletermcn: idToTerm.get(formData.suitableterm) || "" },
                    tuitionW: formData.tuitionW.toString(),
                    bookfeeW: formData.bookfeeW.toString(),
                    specialfeeW: formData.specialfeeW.toString(),
                    tuitionH: formData.tuitionH.toString(),
                    bookfeeH: formData.bookfeeH.toString(),
                    specialfeeH: formData.specialfeeH.toString(),
                    seatlimit: Number(formData.seatlimit),
                    agelimit: Number(formData.agelimit),
                    waiveregfee: formData.waiveregfee,
                    closeregistration: formData.closeregistration,
                } 
            });
            setEditing(false);
            await updateClass(formData, data);
        } catch (error) {
            // Revert optimistic update in case of error
            setUIState(prev => {
                return {
                    ...prev,
                    class: { classid: data.class.classid, classnamecn: data.class.classnamecn },
                    teacher: { teacherid: data.teacher.teacherid, namecn: data.teacher.namecn || "" },
                    classroom: { roomid: data.classroom.roomid, roomno: data.classroom.roomno },
                    classtime: { timeid: data.classtime.timeid, period: data.classtime.period || "" },
                    suitableterm: { termno: data.suitableterm.termno, suitabletermcn: data.suitableterm.suitabletermcn || "" },
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
                }
            })
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
                    <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(Number(value))}>
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
                    <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(Number(value))}>
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
                    <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(Number(value))}>
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
                defaultValue={data.tuitionW?.toString() || "Undetermined"}
                className="border rounded p-1"
            />

            <label className="block text-sm text-gray-400 font-bold mb-2">Book Fee (Whole Year)</label>
            <Input
                type="number" 
                {...editForm.register("bookfeeW")}
                defaultValue={data.bookfeeW?.toString() || "Undetermined"}
                className="border rounded p-1"
            />
            <label className="block text-sm text-gray-400 font-bold mb-2">Special Fee Year (Whole Year) </label>
            <Input
                type="number" 
                {...editForm.register("specialfeeW")}
                defaultValue={data.specialfeeW?.toString() || "Undetermined"}
                className="border rounded p-1"
            />

            <label className="block text-sm text-gray-400 font-bold mb-2">Tuition (Half Year)</label>
            <Input
                type="number" 
                {...editForm.register("tuitionH")}
                defaultValue={data.tuitionH?.toString() || "Undetermined"}
                className="border rounded p-1"
            />

            <label className="block text-sm text-gray-400 font-bold mb-2">Book Fee (Half Year)</label>
            <Input
                type="number" 
                {...editForm.register("bookfeeH")}
                defaultValue={data.bookfeeH?.toString() || "Undetermined"}
                className="border rounded p-1"
            />
            <label className="block text-sm text-gray-400 font-bold mb-2">Special Fee (Half Year) </label>
            <Input
                type="number" 
                {...editForm.register("specialfeeH")}
                defaultValue={data.specialfeeH?.toString() || "Undetermined"}
                className="border rounded p-1"
            />

            <label className="block text-sm text-gray-400 font-bold mb-2">Seat Limit</label>
            <Input
                type="number" 
                {...editForm.register("seatlimit")}
                defaultValue={data.seatlimit?.toString() || "0"}
                className="border rounded p-1"
            />
            <label className="block text-sm text-gray-400 font-bold mb-2">Age Limit</label>
            <Input
                type="number" 
                {...editForm.register("agelimit")}
                defaultValue={data.agelimit?.toString() || "0"}
                className="border rounded p-1"
            />
            <label className="block text-sm text-gray-400 font-bold mb-2">Class Time</label>
            <Controller
                name="timeid"
                control={editForm.control}
                render={({ field }) => (
                    <Select
                        value={field.value?.toString()}
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
                        value={field.value?.toString()}
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
                        value={field.value?.toString()}
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
                        value={field.value?.toString()}
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
                    onClick={() => setEditing(false)}
                    className="rounded-md text-sm flex items-center gap-1 border-gray-300 border-1 font-semibold hover:bg-gray-50 cursor-pointer p-2"
                >
                    Cancel
                </button>
                <button
                    className="bg-blue-600 text-sm text-white font-bold px-4 py-2 rounded-md cursor-pointer"
                    type="submit"
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