"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Calendar, Cog, Power, Settings } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod/v4";
import { type threeSeasons } from "@/types/seasons.types";
import { updateDates } from "@/server/seasons/actions/updateDates";
import { updateRegControls } from "@/server/seasons/actions/updateRegControls";
import { seasonDatesSchema, seasonRegSettingsSchema } from "@/server/seasons/schema";
import { useRegistrationContext } from "@/components/registration/registration-context";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type settingOptions = "HOME" | "DATES" | "REGISTRATION" | "CONTROLS";
export default function SemesterControlsPopover() {
    const { seasons } = useRegistrationContext();
    const [settings, setSettings] = useState<settingOptions>("HOME");
    return (
        <Popover>
            <PopoverTrigger
                onClick={() => setSettings("HOME")}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
                <Settings className="h-4 w-4" />
                Controls
            </PopoverTrigger>
            <PopoverContent className="min-h-[220px] min-w-[400px] p-3" align="end">
                <div className="flex flex-col gap-4">
                    {settings === "HOME" && <HomeControls setSettings={setSettings} />}
                    {settings === "DATES" && (
                        <DateControls setSettings={setSettings} seasons={seasons} />
                    )}
                    {settings === "REGISTRATION" && (
                        <RegistrationControls setSettings={setSettings} season={seasons} />
                    )}
                    {settings === "CONTROLS" && <Controls setSettings={setSettings} />}
                </div>
            </PopoverContent>
        </Popover>
    );
}

function HomeControls({
    setSettings,
}: {
    setSettings: React.Dispatch<React.SetStateAction<settingOptions>>;
}) {
    return (
        <>
            <h3 className="border-b pb-2 font-semibold text-gray-800">Semester Controls</h3>

            <button
                onClick={() => setSettings("CONTROLS")}
                className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50"
            >
                <Power className="h-4 w-4" />
                Change Semester Status
            </button>

            <button
                onClick={() => setSettings("DATES")}
                className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50"
            >
                <Calendar className="h-4 w-4" />
                Change Semester Dates
            </button>

            <button
                onClick={() => setSettings("REGISTRATION")}
                className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50"
            >
                <Cog className="h-4 w-4" />
                Change Registration Settings
            </button>
        </>
    );
}

function DateControls({
    setSettings,
    seasons,
}: {
    setSettings: React.Dispatch<React.SetStateAction<settingOptions>>;
    seasons: threeSeasons;
}) {
    // Simple function to format date for HTML date input (YYYY-MM-DD)
    const formatDateForInput = (dateString: string | null) => {
        if (!dateString) return "";
        return new Date(dateString).toISOString().split("T")[0];
    };

    const dateForm = useForm({
        defaultValues: {
            fallstart: formatDateForInput(seasons.fall.startdate),
            fallend: formatDateForInput(seasons.fall.enddate),
            fallearlyreg: formatDateForInput(seasons.fall.earlyregdate),
            fallnormalreg: formatDateForInput(seasons.fall.normalregdate),
            falllatereg: formatDateForInput(seasons.fall.lateregdate1),
            fallclosereg: formatDateForInput(seasons.fall.closeregdate),
            fallcanceldeadline: formatDateForInput(seasons.fall.canceldeadline),
            springstart: formatDateForInput(seasons.spring.startdate),
            springend: formatDateForInput(seasons.spring.enddate),
            springearlyreg: formatDateForInput(seasons.spring.earlyregdate),
            springnormalreg: formatDateForInput(seasons.spring.normalregdate),
            springlatereg: formatDateForInput(seasons.spring.lateregdate1),
            springclosereg: formatDateForInput(seasons.spring.closeregdate),
            springcanceldeadline: formatDateForInput(seasons.spring.canceldeadline),
        },
        resolver: zodResolver(seasonDatesSchema),
        mode: "all",
    });

    const onSubmit = async (data: z.infer<typeof seasonDatesSchema>) => {
        try {
            // Convert string dates back to Date objects for the API
            const dateData = Object.fromEntries(
                Object.entries(data).map(([key, value]) => [
                    key,
                    value ? new Date(value as unknown as string) : undefined,
                ])
            ) as z.infer<typeof seasonDatesSchema>;

            await updateDates(dateData, seasons.year);
            setSettings("HOME");
        } catch (error) {
            dateForm.setError("root", {
                type: "manual",
                message: "Failed to update dates. Please check the form for errors.",
            });
            console.error("Error occured while updating dates", error);
        }
    };
    return (
        <>
            <h3 className="border-b pb-2 font-semibold text-gray-800">Change dates</h3>
            <form onSubmit={dateForm.handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label
                            className="mb-1 block text-sm font-medium text-gray-700"
                            htmlFor="fallstart"
                        >
                            Fall Start
                        </label>
                        <Input id="fallstart" type="date" {...dateForm.register("fallstart")} />
                        {dateForm.formState.errors.fallstart && (
                            <span className="text-xs text-red-500">
                                {dateForm.formState.errors.fallstart.message}
                            </span>
                        )}
                    </div>
                    <div>
                        <label
                            className="mb-1 block text-sm font-medium text-gray-700"
                            htmlFor="fallend"
                        >
                            Fall End
                        </label>
                        <Input id="fallend" type="date" {...dateForm.register("fallend")} />
                        {dateForm.formState.errors.fallend && (
                            <span className="text-xs text-red-500">
                                {dateForm.formState.errors.fallend.message}
                            </span>
                        )}
                    </div>
                    <div>
                        <label
                            className="mb-1 block text-sm font-medium text-gray-700"
                            htmlFor="springstart"
                        >
                            Spring Start
                        </label>
                        <Input id="springstart" type="date" {...dateForm.register("springstart")} />
                        {dateForm.formState.errors.springstart && (
                            <span className="text-xs text-red-500">
                                {dateForm.formState.errors.springstart.message}
                            </span>
                        )}
                    </div>
                    <div>
                        <label
                            className="mb-1 block text-sm font-medium text-gray-700"
                            htmlFor="springend"
                        >
                            Spring End
                        </label>
                        <Input id="springend" type="date" {...dateForm.register("springend")} />
                        {dateForm.formState.errors.springend && (
                            <span className="text-xs text-red-500">
                                {dateForm.formState.errors.springend?.message}
                            </span>
                        )}
                    </div>
                    <div>
                        <label
                            className="mb-1 block text-sm font-medium text-gray-700"
                            htmlFor="fallearlyreg"
                        >
                            Early Registration (Fall)
                        </label>
                        <Input
                            id="fallearlyreg"
                            type="date"
                            {...dateForm.register("fallearlyreg")}
                        />
                        {dateForm.formState.errors.fallearlyreg && (
                            <span className="text-xs text-red-500">
                                {dateForm.formState.errors.fallearlyreg.message}
                            </span>
                        )}
                    </div>
                    <div>
                        <label
                            className="mb-1 block text-sm font-medium text-gray-700"
                            htmlFor="fallnormalreg"
                        >
                            Normal Registration (Fall)
                        </label>
                        <Input
                            id="fallnormalreg"
                            type="date"
                            {...dateForm.register("fallnormalreg")}
                        />
                        {dateForm.formState.errors.fallnormalreg && (
                            <span className="text-xs text-red-500">
                                {dateForm.formState.errors.fallnormalreg.message}
                            </span>
                        )}
                    </div>
                    <div>
                        <label
                            className="mb-1 block text-sm font-medium text-gray-700"
                            htmlFor="falllatereg"
                        >
                            Late Registration (Fall)
                        </label>
                        <Input id="falllatereg" type="date" {...dateForm.register("falllatereg")} />
                        {dateForm.formState.errors.falllatereg && (
                            <span className="text-xs text-red-500">
                                {dateForm.formState.errors.falllatereg.message}
                            </span>
                        )}
                    </div>
                    <div>
                        <label
                            className="mb-1 block text-sm font-medium text-gray-700"
                            htmlFor="fallclosereg"
                        >
                            Close Registration (Fall)
                        </label>
                        <Input
                            id="fallclosereg"
                            type="date"
                            {...dateForm.register("fallclosereg")}
                        />
                        {dateForm.formState.errors.fallclosereg && (
                            <span className="text-xs text-red-500">
                                {dateForm.formState.errors.fallclosereg.message}
                            </span>
                        )}
                    </div>
                    <div>
                        <label
                            className="mb-1 block text-sm font-medium text-gray-700"
                            htmlFor="fallcanceldeadline"
                        >
                            Cancel Deadline (Fall)
                        </label>
                        <Input
                            id="fallcanceldeadline"
                            type="date"
                            {...dateForm.register("fallcanceldeadline")}
                        />
                        {dateForm.formState.errors.fallcanceldeadline && (
                            <span className="text-xs text-red-500">
                                {dateForm.formState.errors.fallcanceldeadline.message}
                            </span>
                        )}
                    </div>
                    <div>
                        <label
                            className="mb-1 block text-sm font-medium text-gray-700"
                            htmlFor="springearlyreg"
                        >
                            Early Registration (Spring)
                        </label>
                        <Input
                            id="springearlyreg"
                            type="date"
                            {...dateForm.register("springearlyreg")}
                        />
                        {dateForm.formState.errors.springearlyreg && (
                            <span className="text-xs text-red-500">
                                {dateForm.formState.errors.springearlyreg.message}
                            </span>
                        )}
                    </div>
                    <div>
                        <label
                            className="mb-1 block text-sm font-medium text-gray-700"
                            htmlFor="springnormalreg"
                        >
                            Normal Registration (Spring)
                        </label>
                        <Input
                            id="springnormalreg"
                            type="date"
                            {...dateForm.register("springnormalreg")}
                        />
                        {dateForm.formState.errors.springnormalreg && (
                            <span className="text-xs text-red-500">
                                {dateForm.formState.errors.springnormalreg.message}
                            </span>
                        )}
                    </div>
                    <div>
                        <label
                            className="mb-1 block text-sm font-medium text-gray-700"
                            htmlFor="springlatereg"
                        >
                            Late Registration (Spring)
                        </label>
                        <Input
                            id="springlatereg"
                            type="date"
                            {...dateForm.register("springlatereg")}
                        />
                        {dateForm.formState.errors.springlatereg && (
                            <span className="text-xs text-red-500">
                                {dateForm.formState.errors.springlatereg.message}
                            </span>
                        )}
                    </div>
                    <div>
                        <label
                            className="mb-1 block text-sm font-medium text-gray-700"
                            htmlFor="springclosereg"
                        >
                            Close Registration (Spring)
                        </label>
                        <Input
                            id="springclosereg"
                            type="date"
                            {...dateForm.register("springclosereg")}
                        />
                        {dateForm.formState.errors.springclosereg && (
                            <span className="text-xs text-red-500">
                                {dateForm.formState.errors.springclosereg.message}
                            </span>
                        )}
                    </div>
                    <div>
                        <label
                            className="mb-1 block text-sm font-medium text-gray-700"
                            htmlFor="springcanceldeadline"
                        >
                            Cancel Deadline (Spring)
                        </label>
                        <Input
                            id="springcanceldeadline"
                            type="date"
                            {...dateForm.register("springcanceldeadline")}
                        />
                        {dateForm.formState.errors.springcanceldeadline && (
                            <span className="text-xs text-red-500">
                                {dateForm.formState.errors.springcanceldeadline.message}
                            </span>
                        )}
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <button
                        type="button"
                        className="rounded bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300"
                        onClick={() => setSettings("HOME")}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                        disabled={dateForm.formState.isSubmitting}
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </>
    );
}

function RegistrationControls({
    setSettings,
    season,
}: {
    setSettings: React.Dispatch<React.SetStateAction<settingOptions>>;
    season: threeSeasons;
}) {
    const [termEditing, setTermEditing] = useState<"fall" | "spring" | "year">("year");

    const getTermRegSettings = (term: "fall" | "spring" | "year") => {
        return {
            isspring: season[term].isspring,
            haslateregfee: season[term].haslateregfee,
            haslateregfee4newfamily: season[term].haslateregfee4newfamily,
            hasdutyfee: season[term].hasdutyfee,
            showadmissionnotice: season[term].showadmissionnotice,
            showteachername: season[term].showteachername,
            days4showteachername: season[term].days4showteachername,
            allownewfamilytoregister: season[term].allownewfamilytoregister,
            date4newfamilytoregister: season[term].date4newfamilytoregister
                ? new Date(season[term].date4newfamilytoregister)
                : undefined,
        };
    };
    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setError,
    } = useForm({
        defaultValues: {
            ...getTermRegSettings("year"),
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
            await updateRegControls(data, season[termEditing], termEditing);
            setSettings("HOME");
        } catch (err) {
            setError("root", {
                type: "manual",
                message:
                    "Failed to update registration settings. Please check the form for errors.",
            });
            console.error("Error occured while updating registration settings", err);
        }
    };

    return (
        <>
            <h3 className="border-b pb-2 font-semibold text-gray-800">Registration Settings</h3>
            <div className="mb-4">
                <label
                    htmlFor="term-select"
                    className="mb-1 block text-sm font-medium text-gray-700"
                >
                    Select Term
                </label>
                <Select
                    value={termEditing}
                    onValueChange={(value: "year" | "spring" | "fall") => {
                        setTermEditing(value);
                        reset(getTermRegSettings(value));
                    }}
                >
                    <SelectTrigger id="term-select" className="w-full">
                        <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="year">Academic Year</SelectItem>
                        <SelectItem value="fall">Fall</SelectItem>
                        <SelectItem value="spring">Spring</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-4 flex flex-col gap-4"
                autoComplete="off"
            >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                        <label
                            htmlFor="haslateregfee"
                            className="text-sm font-medium text-gray-700"
                        >
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
                        <label
                            htmlFor="haslateregfee4newfamily"
                            className="text-sm font-medium text-gray-700"
                        >
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
                        <label
                            htmlFor="showadmissionnotice"
                            className="text-sm font-medium text-gray-700"
                        >
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
                        <label
                            htmlFor="showteachername"
                            className="text-sm font-medium text-gray-700"
                        >
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
                        <label
                            htmlFor="days4showteachername"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Days to Show Teacher Name
                        </label>
                        <Input
                            id="days4showteachername"
                            type="number"
                            min={0}
                            {...register("days4showteachername", { valueAsNumber: true })}
                        />
                        {errors.days4showteachername && (
                            <span className="text-xs text-red-500">
                                {errors.days4showteachername.message as string}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        <label
                            htmlFor="allownewfamilytoregister"
                            className="text-sm font-medium text-gray-700"
                        >
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
                        <label
                            htmlFor="date4newfamilytoregister"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            New Family Registration Date
                        </label>
                        <Controller
                            name="date4newfamilytoregister"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="date4newfamilytoregister"
                                    type="date"
                                    value={
                                        field.value
                                            ? (field.value as Date).toISOString().slice(0, 10)
                                            : ""
                                    } // Remove the time from the database version
                                    onChange={(e) =>
                                        field.onChange(
                                            e.target.value ? new Date(e.target.value) : undefined
                                        )
                                    }
                                />
                            )}
                        />
                        {errors.date4newfamilytoregister && (
                            <span className="text-xs text-red-500">
                                {errors.date4newfamilytoregister.message as string}
                            </span>
                        )}
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <button
                        type="button"
                        className="rounded bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300"
                        onClick={() => setSettings("HOME")}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                        disabled={isSubmitting}
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </>
    );
}

function Controls({
    setSettings,
}: {
    setSettings: React.Dispatch<React.SetStateAction<settingOptions>>;
}) {
    return (
        <>
            <h3 className="border-b pb-2 font-semibold text-gray-800">Change Semester Status</h3>

            <p className="flex items-center justify-center gap-2">
                Be careful with these settings! <AlertTriangle className="h-4 w-4" />
            </p>

            <div className="mt-4 flex gap-2">
                <button
                    type="button"
                    className="rounded bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300"
                    onClick={() => setSettings("HOME")}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                >
                    Save Changes
                </button>
            </div>
        </>
    );
}
