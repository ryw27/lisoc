"use client";
import React, { useState } from 'react';
import { Controller, useFormContext, useWatch, type FieldArrayWithId } from 'react-hook-form';
import { Edit, Trash, Info } from 'lucide-react';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
    Select, 
    SelectContent, 
    SelectValue, 
    SelectTrigger, 
    SelectItem 
} from "@/components/ui/select";
import { startSemFormSchema } from '@/lib/registration/validation';
import { arrangementSchema } from '@/lib/shared/validation';
import { z } from 'zod/v4';
import { useRegistrationContext } from '@/lib/registration/registration-context';


type classBoxProps = {
    field: FieldArrayWithId<z.infer<typeof arrangementSchema>>;
    idx: number;
    deleteSemClass: (index: number) => void;
}

function LabeledInput({
    idx,
    name,
    label,
    type = "text",
    required = false,
    disabled = false,
    inputClassName
}: {
    idx: number
    name: keyof z.infer<typeof arrangementSchema>;
    label: string;
    type?: string;
    required?: boolean;
    disabled?: boolean;
    inputClassName?: string 
}) {
    const { register, formState: { errors }} = useFormContext<z.infer<typeof startSemFormSchema>>();

    return (
        <div className="flex flex-col gap-1">
            <label className="block text-sm text-gray-400 font-bold mb-2" htmlFor={`${idx}-${name}`}>{label}</label>
            <Input
                id={`${idx}-${name}`}
                type={type}
                required={required}
                disabled={disabled}
                className={inputClassName}
                {...register(`classes.${idx}.${name}`)}
            /> 
            {errors?.classes?.[idx]?.[name] && (
                <p className="text-xs text-red-600">
                    {errors.classes[idx][name]?.message}
                </p>
            )}
        </div>
    )
}


// TODO: Diagnose the white bar at the bottom issue 
export default function SemesterClassBox({
    idx,
    deleteSemClass,
}: classBoxProps) {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);


    const { control, setValue } = useFormContext<z.infer<typeof startSemFormSchema>>();
    const classValues = useWatch({
        control,
        name: `classes.${idx}`
    })
    const { selectOptions, idMaps } = useRegistrationContext();

    
    const setField = <T extends string | number | boolean | null | undefined>(field: keyof z.infer<typeof arrangementSchema>, value: T) => {
        setValue(`classes.${idx}.${field}`, value, { shouldValidate: true })
    }


    const wholeYearFields = (
        <div className="grid grid-cols-3 gap-4">
            <LabeledInput
                idx={idx}
                name="tuitionW"
                label="Tuition (Year)"
                type="number"
                inputClassName="col-span-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                required
            />
            <LabeledInput
                idx={idx}
                name="bookfeeW"
                label="Book Fee (Year)"
                type="number"
                inputClassName="col-span-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                required
            />
            <LabeledInput
                idx={idx}
                name="specialfeeW"
                label="Special Fee (Year)"
                type="number"
                inputClassName="col-span-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                required
            />
        </div>
    )

    const halfYearFields = (
        <div className="grid grid-cols-3 gap-4">
            <LabeledInput
                idx={idx}
                name="tuitionH"
                label="Tuition (Half)"
                type="number"
                inputClassName="col-span-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                required
            />
            <LabeledInput
                idx={idx}
                name="bookfeeH"
                label="Book Fee (Half)"
                type="number"
                inputClassName="col-span-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                required
            />
            <LabeledInput
                idx={idx}
                name="specialfeeH"
                label="Special Fee (Half)"
                type="number"
                inputClassName="col-span-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                required
            />
        </div>
    )


    const termSelect = (
        <Controller
            control={control}
            name={`classes.${idx}.term`}
            render={({ field }) => (
                <div className="flex flex-col gap-1">
                    <label className="block text-sm text-gray-400 font-bold mb-2" htmlFor={`${idx}-term`}>Semester Term</label>
                    <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(val) => setField("term", val)}
                    >
                    <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 items-center">
                        <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
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
    )
    
    const timeSelect = (
        <Controller
            control={control}
            name={`classes.${idx}.timeid`}
            render={({ field }) => (
                <div className="flex flex-col gap-1">
                    <label className="block text-sm text-gray-400 font-bold mb-2" htmlFor={`${idx}-timeid`}>Class Time</label>
                    <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(val) => setField("timeid", Number(val))}
                    >
                    <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 items-center">
                        <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                        {selectOptions.times.map((c) => (
                            <SelectItem key={`${idx}-${c.timeid}-${c.period}`} value={`${c.timeid}`}>
                                {c.period}
                            </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
            )}
        /> 
    )

    const { classMap, timeMap, termMap } = idMaps;

    const totalPrice = classValues.suitableterm !== 2 ? 
        Number(classValues.tuitionW) + Number(classValues.bookfeeW) + Number(classValues.specialfeeW) 
        : Number(classValues.tuitionH) + Number(classValues.bookfeeH) + Number(classValues.specialfeeH);


    return (
        <div className="flex flex-col">
            {/* Editing */}
            {isEditing ? (
                <div className="flex flex-col gap-4">
                    {/* Class select */}
                    <div>
                        <Controller
                            control={control}
                            name={`classes.${idx}.classid`}
                            render={({ field }) => (
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-bold text-gray-600">Class Name</label>
                                    <Select
                                        value={field.value?.toString() || ""}
                                        onValueChange={(val) => setField("classid", Number(val))}
                                    >
                                    <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500">
                                        <SelectValue placeholder="Select a class" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60 overflow-y-auto">
                                        {selectOptions.classes.map((c) => (
                                        <SelectItem key={c.classid} value={c.classid.toString()}>
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
                                <label className="text-sm font-medium text-gray-600">Suitable Term</label>
                                <Select
                                    value={field.value?.toString() || ""}
                                    onValueChange={(val) => setField("suitableterm", Number(val))}
                                >
                                <SelectTrigger className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500">
                                    <SelectValue placeholder="Select term" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectOptions.terms.map((t) => (
                                    <SelectItem key={t.termno} value={t.termno.toString()}>
                                        {t.suitabletermcn ?? "Term"}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                            </div>
                            )}
                        />
                    </div>
                    {/* fees */ }
                    {classValues?.suitableterm === 2 ? (
                        <>
                            {halfYearFields}
                        </>
                        ) : (
                            <>
                                {wholeYearFields}
                                {halfYearFields}
                            </>
                    )}
                    {classValues?.suitableterm === 2 ? (
                        <div>
                            <div className="grid grid-cols-2 gap-2 items-center">
                                <LabeledInput
                                    idx={idx}
                                    name="agelimit"
                                    label="Age Limit"
                                    type="number"
                                    inputClassName="col-span-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                                    required
                                />
                                {termSelect}
                            </div>
                            {timeSelect}
                        </div>
                    ): (
                        <div className="grid grid-cols-2 gap-2 items-center">
                            <LabeledInput
                                idx={idx}
                                name="agelimit"
                                label="Age Limit"
                                type="number"
                                inputClassName="col-span-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                                required
                            />
                            {timeSelect}
                        </div>
                    )}
                    
                    {/* <LabeledInput
                        idx={idx}
                        name="seatlimit"
                        label="Seat Limit"
                        type="number"
                        required
                    /> */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Waive Registration Fee */}
                        <div className="flex items-center gap-2 col-span-1">
                            <Controller
                                name={`classes.${idx}.waiveregfee`}
                                render={({ field }) => (
                                    <>                                        

                                        <Input
                                            id={`${idx}-waiveregfee`}
                                            type="checkbox"
                                            checked={!!field.value}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                            className="h-4 w-4 border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                                        />
                                        <label
                                            htmlFor={`${idx}-waiveregfee`}
                                            className="text-sm text-gray-600 font-medium select-none"
                                        >
                                            Waive Registration Fee
                                        </label>
                                    </>
                                )}
                            />
                        </div>
                        {/* Close Registration */}
                        <div className="flex items-center col-span-1 w-full gap-2">
                            <Controller
                                name={`classes.${idx}.closeregistration`}
                                render={({ field }) => (
                                    <>
                                        <Input
                                            id={`${idx}-closeregistration`}
                                            type="checkbox"
                                            checked={!!field.value}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                            className="h-4 w-4"
                                        />
                                        <label
                                            htmlFor={`${idx}-closeregistration`}
                                            className="text-sm text-gray-600 font-medium select-none"
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
                                onChange={e => field.onChange(e.target.value)}
                                placeholder="Enter any notes or remarks for this class"
                                className="min-h-[60px] resize-y col-span-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                            />
                        )}
                    />

                    {/* Edit buttons */} 
                    <div className="flex gap-2 mt-2">
                        <button 
                            type="button" 
                            className="rounded-md text-sm flex items-center border-gray-300 border-1 font-semibold hover:bg-gray-50 cursor-pointer p-2"
                            onClick={() => setIsEditing(false)}
                        >
                            Cancel
                        </button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button 
                                    type="button"
                                    className="rounded-md bg-blue-600 text-white text-sm flex items-center gap-1 hover:bg-blue-800 font-semibold cursor-pointer p-2"
                                >
                                    Save
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to save?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={() => {
                                            setIsEditing(false)
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                                    >
                                        Confirm 
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col">
                    <div className="flex justify-between">
                        <span className="font-semibold">
                            {classMap[classValues?.classid]?.classnamecn || "Unnamed Class"}
                        </span>
                        <span className="text-gray-600 font-bold">
                            ${totalPrice}
                        </span>
                    </div>
                    <span className="text-gray-600">
                        {termMap[classValues?.suitableterm]?.suitabletermcn || "No term"}
                    </span>
                    <div className="flex justify-between">
                        <span className="text-gray-600">
                            {classValues?.suitableterm === 2 ? classValues.term : "Full Year"}
                        </span>
                        <div className="flex gap-2">
                            <button 
                                type="button"
                                className="cursor-pointer text-gray-600 hover:text-blue-700"
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit className="w-4 h-4"/>
                            </button>
                            <button 
                                type="button"
                                className="cursor-pointer textgray-600 hover:text-red-700"
                                onClick={() => deleteSemClass(idx)}
                            >
                                <Trash className="w-4 h-4 font-bold"/>
                            </button>
                        </div>
                    </div>
                    <div className="flex mt-1">
                        <button 
                            type="button"
                            className="cursor-pointer text-gray-700 hover:text-gray-500"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <Info className="w-4 h-4"/>
                        </button>
                    </div>    



                    {isExpanded && (
                        <ExpandedClass classValues={classValues} timeMap={timeMap} />
                    )}

                </div>   
            )}
        </div>
    )
}


function ExpandedClass({ classValues, timeMap }: { classValues: z.infer<typeof startSemFormSchema>["classes"][number], timeMap: Record<number, { period: string | null }> }) {
    return (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
            <h4 className="font-semibold text-gray-700 mb-2">Additional Details</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
                {classValues.suitableterm !== 2 && (
                <>
                    <div>
                        <span className="text-gray-600">Tuition (Whole Year):</span>
                        <span className="ml-2 font-medium">${classValues.tuitionW || 0}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Book Fee (Whole Year):</span>
                        <span className="ml-2 font-medium">${classValues.bookfeeW || 0}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Special Fee (Whole Year):</span>
                        <span className="ml-2 font-medium">${classValues.specialfeeW || 0}</span>
                    </div>
                </>
                )}
                
                <div>
                    <span className="text-gray-600">Tuition (Half Year):</span>
                    <span className="ml-2 font-medium">${classValues.tuitionH || 0}</span>
                </div>
                <div>
                    <span className="text-gray-600">Book Fee (Half Year):</span>
                    <span className="ml-2 font-medium">${classValues.bookfeeH || 0}</span>
                </div>

                <div>
                    <span className="text-gray-600">Special Fee (Half Year):</span>
                    <span className="ml-2 font-medium">${classValues.specialfeeH || 0}</span>
                </div>
                <div>
                    <span className="text-gray-600">Age Limit:</span>
                    <span className="ml-2 font-medium">{classValues.agelimit || 0}</span>
                </div>
                <div>
                    <span className="text-gray-600">Class Time:</span>
                    <span className="ml-2 font-medium">{timeMap[classValues.timeid]?.period || "No Time"}</span>
                </div>
                <div>
                    <span className="text-gray-600">Waive Registration Fee:</span>
                    <span className="ml-2 font-medium">{classValues.waiveregfee ? "Yes" : "No"}</span>
                </div>
                <div>
                    <span className="text-gray-600">Close Registration:</span>
                    <span className="ml-2 font-medium">{classValues.closeregistration ? "Yes" : "No"}</span>
                </div>
                <div>
                    <span className="text-gray-600">Notes:</span>
                    <span className="ml-2 font-medium">{classValues.notes || "No Notes"}</span>
                </div>
            </div>
        </div>
    )
}