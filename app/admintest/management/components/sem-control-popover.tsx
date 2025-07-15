"use client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings, Calendar, TriangleAlert, Power, Cog, AlertTriangle } from "lucide-react";
import React, { useState, useContext } from "react";
import { OptionContext } from "./sem-view"; 
import { InferSelectModel } from "drizzle-orm";
import { seasons } from "@/app/lib/db/schema";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { seasonDatesSchema, seasonRegSettingsSchema } from "@/app/lib/semester/sem-schemas";
import { Input } from "@/components/ui/input";
import { updateDates, registerControls } from "@/app/lib/semester/sem-actions";
import { Switch } from "@/components/ui/switch";
import { z } from "zod/v4";
import { useFormState } from "react-dom";

type settingOptions = "HOME" | "DATES" | "REGISTRATION" | "CONTROLS"
export default function SemesterControlsPopover() {
    const { selectOptions, idMaps, season } = useContext(OptionContext)!;
    const [settings, setSettings] = useState<settingOptions>("HOME")
    return (
        <Popover>
            <PopoverTrigger onClick={() => setSettings("HOME")} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Settings className="w-4 h-4" />
                Controls
            </PopoverTrigger>
            <PopoverContent
                className="p-3 min-w-[400px] min-h-[220px]"
                align="end"
            >
                <div className="flex flex-col gap-4">
                    {settings === "HOME" && <HomeControls setSettings={setSettings} />}
                    {settings === "DATES" && <DateControls setSettings={setSettings} season={season}/>}
                    {settings === "REGISTRATION" && <RegistrationControls setSettings={setSettings} season={season}/>}
                    {settings === "CONTROLS" && <Controls setSettings={setSettings} />}
                </div>
            </PopoverContent>
        </Popover>
    );
}

function HomeControls({ setSettings }: {setSettings: React.Dispatch<React.SetStateAction<settingOptions>>}) {
    return (
        <>
            <h3 className="font-semibold text-gray-800 border-b pb-2">Semester Controls</h3>

            <button onClick={() => setSettings("CONTROLS")} className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 rounded transition-colors cursor-pointer">
                <Power className="w-4 h-4" />
                Change Semester Status 
            </button>           


            <button onClick={() => setSettings("DATES")} className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 rounded transition-colors cursor-pointer">
                <Calendar className="w-4 h-4" />
                Change Semester Dates 
            </button>


            <button onClick={() => setSettings("REGISTRATION")}className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 rounded transition-colors cursor-pointer">
                <Cog className="w-4 h-4" />
                Change Registration Settings
            </button>
        </>
    )
}

function DateControls({ setSettings, season }: {setSettings: React.Dispatch<React.SetStateAction<settingOptions>>, season: InferSelectModel<typeof seasons>}) {
    const dateForm = useForm({
        defaultValues: {
            fallstart: season.startdate ? new Date(season.startdate) : undefined,
            fallend: season.enddate ? new Date(season.enddate) : undefined,
            earlyreg: season.earlyregdate ? new Date(season.earlyregdate) : undefined,
            normalreg: season.normalregdate ? new Date(season.normalregdate) : undefined,
            latereg: season.lateregdate1 ? new Date(season.lateregdate1) : undefined,
            closereg: season.closeregdate ? new Date(season.closeregdate) : undefined,
            canceldeadline: season.canceldeadline ? new Date(season.canceldeadline) : undefined,
        },
        resolver: zodResolver(seasonDatesSchema),
        mode: "all"
    })

    const onSubmit = async (data: z.infer<typeof seasonDatesSchema>) => {
        try {
            await updateDates(data, season);
        } catch (error) {
            dateForm.setError("root", {
                type: "manual",
                message: "Failed to update dates. Please check the form for errors.",
            });
            console.error("Error occured while updating dates");
        }
    }
    return (
        <>
            <h3 className="font-semibold text-gray-800 border-b pb-2">Change dates</h3>
            <form
                onSubmit={dateForm.handleSubmit(onSubmit)}
                className="flex flex-col gap-4 mt-4"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fallstart">
                            Fall Start
                        </label>
                        <Input
                            id="fallstart"
                            type="date"
                            {...dateForm.register("fallstart", { valueAsDate: true })}
                        />
                        {dateForm.formState.errors.fallstart && (
                            <span className="text-xs text-red-500">{dateForm.formState.errors.fallstart.message}</span>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fallend">
                            Fall End
                        </label>
                        <Input
                            id="fallend"
                            type="date"
                            {...dateForm.register("fallend", { valueAsDate: true })}
                        />
                        {dateForm.formState.errors.fallend && (
                            <span className="text-xs text-red-500">{dateForm.formState.errors.fallend.message}</span>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="springstart">
                            Spring Start
                        </label>
                        <Input
                            id="springstart"
                            type="date"
                            {...dateForm.register("springstart", { valueAsDate: true })}
                        />
                        {dateForm.formState.errors.springstart && (
                            <span className="text-xs text-red-500">{dateForm.formState.errors.springstart.message}</span>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="springend">
                            Spring End
                        </label>
                        <Input
                            id="springend"
                            type="date"
                            {...dateForm.register("springend", { valueAsDate: true })}
                        />
                        {dateForm.formState.errors.fallend && (
                            <span className="text-xs text-red-500">{dateForm.formState.errors.springend?.message}</span>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="earlyreg">
                            Early Registration
                        </label>
                        <Input
                            id="earlyreg"
                            type="date"
                            {...dateForm.register("earlyreg", { valueAsDate: true })}
                        />
                        {dateForm.formState.errors.earlyreg && (
                            <span className="text-xs text-red-500">{dateForm.formState.errors.earlyreg.message}</span>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="normalreg">
                            Normal Registration
                        </label>
                        <Input
                            id="normalreg"
                            type="date"
                            {...dateForm.register("normalreg", { valueAsDate: true })}
                        />
                        {dateForm.formState.errors.normalreg && (
                            <span className="text-xs text-red-500">{dateForm.formState.errors.normalreg.message}</span>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="latereg">
                            Late Registration
                        </label>
                        <Input
                            id="latereg"
                            type="date"
                            {...dateForm.register("latereg", { valueAsDate: true })}
                        />
                        {dateForm.formState.errors.latereg && (
                            <span className="text-xs text-red-500">{dateForm.formState.errors.latereg.message}</span>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="closereg">
                            Close Registration
                        </label>
                        <Input
                            id="closereg"
                            type="date"
                            {...dateForm.register("closereg", { valueAsDate: true })}
                        />
                        {dateForm.formState.errors.closereg && (
                            <span className="text-xs text-red-500">{dateForm.formState.errors.closereg.message}</span>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="canceldeadline">
                            Cancel Deadline
                        </label>
                        <Input
                            id="canceldeadline"
                            type="date"
                            {...dateForm.register("canceldeadline", { valueAsDate: true })}
                        />
                        {dateForm.formState.errors.canceldeadline && (
                            <span className="text-xs text-red-500">{dateForm.formState.errors.canceldeadline.message}</span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <button
                        type="button"
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                        onClick={() => setSettings("HOME")}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                        disabled={dateForm.formState.isSubmitting}
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </>
    )
}

function RegistrationControls({ setSettings, season }: { setSettings: React.Dispatch<React.SetStateAction<settingOptions>>, season : InferSelectModel<typeof seasons>}) {
    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError
    } = useForm({
        defaultValues: {
            isspring: season.isspring,
            haslateregfee: season.haslateregfee,
            haslateregfee4newfamily: season.haslateregfee4newfamily,
            hasdutyfee: season.hasdutyfee,
            showadmissionnotice: season.showadmissionnotice,
            showteachername: season.showteachername,
            days4showteachername: season.days4showteachername,
            allownewfamilytoregister: season.allownewfamilytoregister,
            date4newfamilytoregister: new Date(season.date4newfamilytoregister),
        },
        resolver: zodResolver(seasonRegSettingsSchema),
        mode: "all",
    });

    // TODO: Replace with actual update logic
    // The error is likely because `seasonRegSettingsSchema` is not a value, but a type, or vice versa.
    // To fix, ensure you are importing/using the actual Zod schema object, not a type.
    // If you want the inferred type, use `z.infer<typeof seasonRegSettingsSchema>`.
    // If you want the schema as a value (for zodResolver), use `seasonRegSettingsSchema` directly.

    // This is correct usage for the type:
    const onSubmit = async (data: z.infer<typeof seasonRegSettingsSchema>) => {
        try {
            await registerControls(data, season);
            setSettings("HOME");
        } catch (err) {
            setError("root", {
                type: "manual",
                message: "Failed to update registration settings. Please check the form for errors.",
            });
            console.error("Error occured while updating registration settings");
        }
    };

    return (
        <>
            <h3 className="font-semibold text-gray-800 border-b pb-2">Registration Settings</h3>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4 mt-4"
                autoComplete="off"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                        <label htmlFor="isspring" className="text-sm font-medium text-gray-700">
                            Is Spring Semester
                        </label>
                        <Controller
                            name="isspring"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    id="isspring"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="haslateregfee" className="text-sm font-medium text-gray-700">
                            Late Registration Fee
                        </label>
                        <Controller
                            name="haslateregfee"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    id="haslateregfee"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="haslateregfee4newfamily" className="text-sm font-medium text-gray-700">
                            Late Reg Fee for New Family
                        </label>
                        <Controller
                            name="haslateregfee4newfamily"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    id="haslateregfee4newfamily"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="hasdutyfee" className="text-sm font-medium text-gray-700">
                            Duty Fee
                        </label>
                        <Controller
                            name="hasdutyfee"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    id="hasdutyfee"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="showadmissionnotice" className="text-sm font-medium text-gray-700">
                            Show Admission Notice
                        </label>
                        <Controller
                            name="showadmissionnotice"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    id="showadmissionnotice"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="showteachername" className="text-sm font-medium text-gray-700">
                            Show Teacher Name
                        </label>
                        <Controller
                            name="showteachername"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    id="showteachername"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                    </div>
                    <div>
                        <label htmlFor="days4showteachername" className="block text-sm font-medium text-gray-700 mb-1">
                            Days to Show Teacher Name
                        </label>
                        <Input
                            id="days4showteachername"
                            type="number"
                            min={0}
                            {...register("days4showteachername", { valueAsNumber: true })}
                        />
                        {errors.days4showteachername && (
                            <span className="text-xs text-red-500">{errors.days4showteachername.message as string}</span>
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="allownewfamilytoregister" className="text-sm font-medium text-gray-700">
                            Allow New Family to Register
                        </label>
                        <Controller
                            name="allownewfamilytoregister"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    id="allownewfamilytoregister"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                    </div>
                    <div>
                        <label htmlFor="date4newfamilytoregister" className="block text-sm font-medium text-gray-700 mb-1">
                            New Family Registration Date
                        </label>
                        <Controller
                            name="date4newfamilytoregister"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="date4newfamilytoregister"
                                    type="date"
                                    value={field.value ? (field.value as Date).toISOString().slice(0, 10) : ""} // Remove the time from the database version
                                    onChange={e => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                />
                            )}
                        />
                        {errors.date4newfamilytoregister && (
                            <span className="text-xs text-red-500">{errors.date4newfamilytoregister.message as string}</span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <button
                        type="button"
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                        onClick={() => setSettings("HOME")}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                        disabled={isSubmitting}
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </>
    );
}

function Controls({ setSettings }: {setSettings: React.Dispatch<React.SetStateAction<settingOptions>>}) {
    return (
        <>
            <h3 className="font-semibold text-gray-800 border-b pb-2">Change Semester Status</h3>

            <p className="flex gap-2 justify-center items-center">Be careful with these settings! <AlertTriangle className="w-4 h-4"/></p>

            <div className="flex gap-2 mt-4">
                <button
                    type="button"
                    className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                    onClick={() => setSettings("HOME")}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                    Save Changes
                </button>
            </div> 
        </>
    )
}