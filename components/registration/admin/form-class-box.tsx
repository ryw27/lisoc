"use client";

import { useState } from "react";
import { Edit, Info, Trash } from "lucide-react";
import { Controller, useFormContext, useWatch, type FieldArrayWithId } from "react-hook-form";
import { z } from "zod/v4";
import { arrangementSchema } from "@/lib/schema";
import { startSemFormSchema } from "@/server/seasons/schema";
import { useRegistrationContext } from "@/components/registration/registration-context";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type classBoxProps = {
    field: FieldArrayWithId<z.infer<typeof arrangementSchema>>;
    idx: number;
    deleteSemClass: (index: number) => void;
};

function LabeledInput({
    idx,
    name,
    label,
    type = "text",
    required = false,
    disabled = false,
    inputClassName,
}: {
    idx: number;
    name: keyof z.infer<typeof arrangementSchema>;
    label: string;
    type?: string;
    required?: boolean;
    disabled?: boolean;
    inputClassName?: string;
}) {
    const {
        register,
        formState: { errors },
    } = useFormContext<z.infer<typeof startSemFormSchema>>();

    return (
        <div className="flex flex-col gap-1">
            <label
                className="mb-2 block text-sm font-bold text-gray-400"
                htmlFor={`${idx}-${name}`}
            >
                {label}
            </label>
            <Input
                id={`${idx}-${name}`}
                type={type}
                required={required}
                disabled={disabled}
                className={inputClassName}
                {...register(`classes.${idx}.${name}`)}
            />
            {errors?.classes?.[idx]?.[name] && (
                <p className="text-xs text-red-600">{errors.classes[idx][name]?.message}</p>
            )}
        </div>
    );
}

// TODO: Diagnose the white bar at the bottom issue
export default function SemesterClassBox({ idx, deleteSemClass }: classBoxProps) {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const { control, setValue } = useFormContext<z.infer<typeof startSemFormSchema>>();
    const classValues = useWatch({
        control,
        name: `classes.${idx}`,
    });
    const { selectOptions, idMaps } = useRegistrationContext();

    const setField = <T extends string | number | boolean | null | undefined>(
        field: keyof z.infer<typeof arrangementSchema>,
        value: T
    ) => {
        setValue(`classes.${idx}.${field}`, value, { shouldValidate: true });
    };
    const inputStyles =
        "col-span-1 w-full border-input rounded-none focus:ring-accent focus:border-accent shadow-none";

    const wholeYearFields = (
        <div className="grid grid-cols-3 gap-4">
            <LabeledInput
                idx={idx}
                name="tuitionW"
                label="Tuition (Year)"
                type="number"
                inputClassName={inputStyles}
                required
            />
            <LabeledInput
                idx={idx}
                name="bookfeeW"
                label="Book Fee (Year)"
                type="number"
                inputClassName={inputStyles}
                required
            />
            <LabeledInput
                idx={idx}
                name="specialfeeW"
                label="Special Fee (Year)"
                type="number"
                inputClassName={inputStyles}
                required
            />
        </div>
    );

    const halfYearFields = (
        <div className="grid grid-cols-3 gap-4">
            <LabeledInput
                idx={idx}
                name="tuitionH"
                label="Tuition (Half)"
                type="number"
                inputClassName={inputStyles}
                required
            />
            <LabeledInput
                idx={idx}
                name="bookfeeH"
                label="Book Fee (Half)"
                type="number"
                inputClassName={inputStyles}
                required
            />
            <LabeledInput
                idx={idx}
                name="specialfeeH"
                label="Special Fee (Half)"
                type="number"
                inputClassName={inputStyles}
                required
            />
        </div>
    );

    const termSelect = (
        <Controller
            control={control}
            name={`classes.${idx}.term`}
            render={({ field }) => (
                <div className="flex flex-col gap-1">
                    <label
                        className="text-muted-foreground mb-2 block text-sm font-bold"
                        htmlFor={`${idx}-term`}
                    >
                        Semester Term
                    </label>
                    <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(val) => setField("term", val)}
                    >
                        <SelectTrigger className="border-input focus:ring-accent w-full items-center rounded-none shadow-none">
                            <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent className="border-input rounded-none bg-white">
                            <SelectItem key="SPRING TERM" value="SPRING">
                                Spring
                            </SelectItem>
                            <SelectItem key="FALL TERM" value="FALL">
                                Fall
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
        />
    );

    const timeSelect = (
        <Controller
            control={control}
            name={`classes.${idx}.timeid`}
            render={({ field }) => (
                <div className="flex flex-col gap-1">
                    <label
                        className="text-muted-foreground mb-2 block text-sm font-bold"
                        htmlFor={`${idx}-timeid`}
                    >
                        Class Time
                    </label>
                    <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(val) => setField("timeid", Number(val))}
                    >
                        <SelectTrigger className="border-input focus:ring-accent w-full items-center rounded-none shadow-none">
                            <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent className="border-input rounded-none bg-white">
                            {selectOptions.times.map((c) => (
                                <SelectItem
                                    key={`${idx}-${c.timeid}-${c.period}`}
                                    value={`${c.timeid}`}
                                >
                                    {c.period}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        />
    );

    const { classMap, timeMap, termMap } = idMaps;

    const totalPrice =
        classValues.suitableterm !== 2
            ? Number(classValues.tuitionW) +
              Number(classValues.bookfeeW) +
              Number(classValues.specialfeeW)
            : Number(classValues.tuitionH) +
              Number(classValues.bookfeeH) +
              Number(classValues.specialfeeH);

    return (
        <div className="border-border/50 mb-6 flex flex-col border-b pb-6 last:border-0">
            {/* Editing */}
            {isEditing ? (
                <div className="bg-background border-input flex flex-col gap-4 border p-4 shadow-sm">
                    {/* Class select */}
                    <div>
                        <Controller
                            control={control}
                            name={`classes.${idx}.classid`}
                            render={({ field }) => (
                                <div className="flex flex-col gap-1">
                                    <label className="text-foreground text-sm font-bold">
                                        Class Name
                                    </label>
                                    <Select
                                        value={field.value?.toString() || ""}
                                        onValueChange={(val) => setField("classid", Number(val))}
                                    >
                                        <SelectTrigger className="border-input focus:ring-accent w-full rounded-none shadow-none">
                                            <SelectValue placeholder="Select a class" />
                                        </SelectTrigger>
                                        <SelectContent className="border-input max-h-60 overflow-y-auto rounded-none bg-white">
                                            {selectOptions.classes.map((c) => (
                                                <SelectItem
                                                    key={c.classid}
                                                    value={c.classid.toString()}
                                                >
                                                    {c.classnamecn}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        />
                    </div>

                    {/* Suitable term */}
                    <div>
                        <Controller
                            control={control}
                            name={`classes.${idx}.suitableterm`}
                            render={({ field }) => (
                                <div className="flex flex-col gap-1">
                                    <label className="text-muted-foreground text-sm font-medium">
                                        Suitable Term
                                    </label>
                                    <Select
                                        value={field.value?.toString() || ""}
                                        onValueChange={(val) =>
                                            setField("suitableterm", Number(val))
                                        }
                                    >
                                        <SelectTrigger className="border-input focus:ring-accent w-full rounded-none shadow-none">
                                            <SelectValue placeholder="Select term" />
                                        </SelectTrigger>
                                        <SelectContent className="border-input rounded-none bg-white">
                                            {selectOptions.terms.map((t) => (
                                                <SelectItem
                                                    key={t.termno}
                                                    value={t.termno.toString()}
                                                >
                                                    {t.suitabletermcn ?? "Term"}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        />
                    </div>
                    {/* fees */}
                    {classValues?.suitableterm === 2 ? (
                        <>{halfYearFields}</>
                    ) : (
                        <>
                            {wholeYearFields}
                            {halfYearFields}
                        </>
                    )}
                    {classValues?.suitableterm === 2 ? (
                        <div>
                            <div className="grid grid-cols-2 items-center gap-2">
                                <LabeledInput
                                    idx={idx}
                                    name="agelimit"
                                    label="Age Limit"
                                    type="number"
                                    inputClassName={inputStyles}
                                    required
                                />
                                {termSelect}
                            </div>
                            {timeSelect}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 items-center gap-2">
                            <LabeledInput
                                idx={idx}
                                name="agelimit"
                                label="Age Limit"
                                type="number"
                                inputClassName={inputStyles}
                                required
                            />
                            {timeSelect}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6 pt-2">
                        {/* Waive Registration Fee */}
                        <div className="col-span-1 flex items-center gap-2">
                            <Controller
                                name={`classes.${idx}.waiveregfee`}
                                render={({ field }) => (
                                    <>
                                        <Input
                                            id={`${idx}-waiveregfee`}
                                            type="checkbox"
                                            checked={!!field.value}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                            className="border-input text-primary focus:ring-accent h-4 w-4 rounded-none shadow-none"
                                        />
                                        <label
                                            htmlFor={`${idx}-waiveregfee`}
                                            className="text-foreground text-sm font-medium select-none"
                                        >
                                            Waive Registration Fee
                                        </label>
                                    </>
                                )}
                            />
                        </div>
                        {/* Close Registration */}
                        <div className="col-span-1 flex w-full items-center gap-2">
                            <Controller
                                name={`classes.${idx}.closeregistration`}
                                render={({ field }) => (
                                    <>
                                        <Input
                                            id={`${idx}-closeregistration`}
                                            type="checkbox"
                                            checked={!!field.value}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                            className="border-input text-primary focus:ring-accent h-4 w-4 rounded-none shadow-none"
                                        />
                                        <label
                                            htmlFor={`${idx}-closeregistration`}
                                            className="text-foreground text-sm font-medium select-none"
                                        >
                                            Close Registration
                                        </label>
                                    </>
                                )}
                            />
                        </div>
                    </div>
                    <Controller
                        name={`classes.${idx}.notes`}
                        render={({ field }) => (
                            <Textarea
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                placeholder="Enter any notes or remarks for this class"
                                className="border-input focus:ring-accent col-span-1 min-h-[60px] w-full resize-y rounded-none shadow-none"
                            />
                        )}
                    />

                    {/* Edit buttons */}
                    <div className="mt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            className="border-input hover:bg-muted flex cursor-pointer items-center rounded-none border px-4 py-2 text-sm font-semibold transition-colors"
                            onClick={() => setIsEditing(false)}
                        >
                            Cancel
                        </button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button
                                    type="button"
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex cursor-pointer items-center gap-1 rounded-none px-4 py-2 text-sm font-semibold shadow-sm transition-colors"
                                >
                                    Save
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border-input rounded-none">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to save?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-none">
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => {
                                            setIsEditing(false);
                                        }}
                                        className="bg-primary hover:bg-primary/90 rounded-none"
                                    >
                                        Confirm
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col px-2 py-1">
                    <div className="flex items-baseline justify-between">
                        <span className="text-primary text-lg font-semibold">
                            {classMap[classValues?.classid]?.classnamecn || "Unnamed Class"}
                        </span>
                        <span className="text-foreground text-lg font-bold">${totalPrice}</span>
                    </div>
                    <span className="text-muted-foreground text-sm tracking-wide uppercase">
                        {termMap[classValues?.suitableterm]?.suitabletermcn || "No term"}
                    </span>
                    <div className="mt-1 flex justify-between">
                        <span className="text-foreground">
                            {classValues?.suitableterm === 2 ? classValues.term : "Full Year"}
                        </span>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                className="text-muted-foreground hover:text-accent cursor-pointer transition-colors"
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                className="text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                                onClick={() => deleteSemClass(idx)}
                            >
                                <Trash className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div className="mt-2 flex">
                        <button
                            type="button"
                            className="text-muted-foreground hover:text-primary flex cursor-pointer items-center gap-1 text-sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <Info className="h-4 w-4" />
                            {isExpanded ? "Hide Details" : "Show Details"}
                        </button>
                    </div>

                    {isExpanded && <ExpandedClass classValues={classValues} timeMap={timeMap} />}
                </div>
            )}
        </div>
    );
}

function ExpandedClass({
    classValues,
    timeMap,
}: {
    classValues: z.infer<typeof startSemFormSchema>["classes"][number];
    timeMap: Record<number, { period: string | null }>;
}) {
    return (
        <div className="border-input bg-muted/20 mt-4 rounded-none border p-4 shadow-inner">
            <h4 className="text-primary border-primary/20 mb-3 border-b pb-1 text-xs font-semibold tracking-wider uppercase">
                Class Details
            </h4>
            <div className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm">
                {classValues.suitableterm !== 2 && (
                    <>
                        <div className="flex flex-col">
                            <span className="text-muted-foreground text-xs">Tuition (Year)</span>
                            <span className="text-foreground font-medium">
                                ${classValues.tuitionW || 0}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-muted-foreground text-xs">Book Fee (Year)</span>
                            <span className="text-foreground font-medium">
                                ${classValues.bookfeeW || 0}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-muted-foreground text-xs">
                                Special Fee (Year)
                            </span>
                            <span className="text-foreground font-medium">
                                ${classValues.specialfeeW || 0}
                            </span>
                        </div>
                    </>
                )}

                <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">Tuition (Half)</span>
                    <span className="text-foreground font-medium">
                        ${classValues.tuitionH || 0}
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">Book Fee (Half)</span>
                    <span className="text-foreground font-medium">
                        ${classValues.bookfeeH || 0}
                    </span>
                </div>

                <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">Special Fee (Half)</span>
                    <span className="text-foreground font-medium">
                        ${classValues.specialfeeH || 0}
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">Age Limit</span>
                    <span className="text-foreground font-medium">{classValues.agelimit || 0}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">Class Time</span>
                    <span className="text-foreground font-medium">
                        {timeMap[classValues.timeid]?.period || "No Time"}
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">Waive Reg Fee</span>
                    <span className="text-foreground font-medium">
                        {classValues.waiveregfee ? "Yes" : "No"}
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">Close Registration</span>
                    <span className="text-foreground font-medium">
                        {classValues.closeregistration ? "Yes" : "No"}
                    </span>
                </div>
                <div className="border-primary/20 col-span-3 mt-2 flex flex-col border-t border-dashed pt-2">
                    <span className="text-muted-foreground text-xs">Notes</span>
                    <span className="text-foreground font-medium italic">
                        {classValues.notes || "No Notes"}
                    </span>
                </div>
            </div>
        </div>
    );
}
