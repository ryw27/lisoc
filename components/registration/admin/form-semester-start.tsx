"use client";

import { seasons } from "@/lib/db/schema";
import { cn, toESTString } from "@/lib/utils";
import { createSemester } from "@/server/seasons/actions/createSemester";
import { selectRegistrationClass } from "@/server/seasons/actions/selectRegistration";
import { startSemFormSchema } from "@/server/seasons/schema";
import { threeSeasons } from "@/types/seasons.types";
import { IdMaps, selectOptions } from "@/types/shared.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { DrizzleError, InferSelectModel } from "drizzle-orm";
import { BookOpen, CalendarIcon, PlusIcon, Save, School, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
    FormProvider,
    Path,
    SubmitHandler,
    useFieldArray,
    useForm,
    useFormContext,
} from "react-hook-form";
import { z } from "zod";
// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { uiClasses } from "@/types/shared.types";
import { useState } from "react";
import { RegistrationProvider } from "../registration-context";
import SemesterClassBox from "./form-class-box";


// --- Types ---

type Season = InferSelectModel<typeof seasons>;
type FormValues = z.infer<typeof startSemFormSchema>;
type LastArrangement = {year: uiClasses[],fall: uiClasses[] ,spring: uiClasses[]};

interface StartSemesterFormProps {
    // drafts: uiClasses[];
    selectOptions: selectOptions;
    idMaps: IdMaps;
    lastSeasonArrangement: LastArrangement
    lastSeason: {year: Season|null,fall: Season|null ,spring: Season|null};
}

// --- Helper Functions ---

/**
 * Calculates the date for next year.
 * Returns a YYYY-MM-DD string.
 */
const getNextYearDateString = (dateStr?: string | null): string | undefined => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    // need day of week are same 
    const dow =  date.getDay() 
    date.setFullYear(date.getFullYear() + 1);
    while( date.getDay() != dow)
    {
        // go back 
        date.setDate(date.getDate() -1 ) 

    }


    return toESTString(date).slice(0, 10);
};

/**
 * Strict Mapper: Converts loose DB types (string | null) to strict Form types (number).
 * This eliminates the need for 'as' casting inside the component.
 */
// const mapDraftsToForm = (drafts: uiClasses[]): FormValues["classes"] => {
//     return drafts.map((d) => ({
//         // IDs
//         seasonid: d.seasonid,
//         classid: d.classid,
//         teacherid: d.teacherid,
//         roomid: d.roomid,
//         timeid: d.timeid,
//         suitableterm: d.suitableterm,

//         // Coerce Money strings to Numbers (handling nulls)
//         tuitionW: d.tuitionW ? Number(d.tuitionW) : 0,
//         tuitionH: d.tuitionH ? Number(d.tuitionH) : 0,
//         bookfeeW: d.bookfeeW ? Number(d.bookfeeW) : 0,
//         bookfeeH: d.bookfeeH ? Number(d.bookfeeH) : 0,
//         specialfeeW: d.specialfeeW ? Number(d.specialfeeW) : 0,
//         specialfeeH: d.specialfeeH ? Number(d.specialfeeH) : 0,

//         // Coerce Limits (handling nulls)
//         seatlimit: d.seatlimit ?? 0,
//         agelimit: d.agelimit ?? 0,

//         // Enum Safety
//         term: d.term === "SPRING" || d.term === "FALL" ? d.term : "FALL",

//         // Booleans & Strings
//         waiveregfee: d.waiveregfee,
//         closeregistration: d.closeregistration,
//         isregclass: d.isregclass,
//         notes: d.notes ?? "",

//         // Ensure arrangeid is handled if it exists in schema, otherwise ignore
//         arrangeid: d.arrangeid,
//     }));
// };

/**
 * Helper to force a date string into the shape TypeScript expects for the Zod schema.
 * We use 'as unknown as Date' because RHF treats strings as valid inputs for Date fields
 * if z.coerce.date() is used, but the TypeScript interface strictly demands 'Date'.
 */
const asDate = (dateString: string | undefined): Date => {
    // This looks like a lie to TS, but it aligns the HTML input (string) with the Zod Schema (Date)
    return dateString as unknown as Date;
};

// --- Main Component ---

export default function StartSemesterForm({
    // drafts,
    selectOptions,
    idMaps,
    lastSeasonArrangement,
    lastSeason,
}: StartSemesterFormProps) {
    const router = useRouter();

    // Calculate defaults only once
    const defaultValues = useMemo<Partial<FormValues>>(() => {
        const now = new Date();
        const nextYear = now.getFullYear() + 1;
        const lastFall = lastSeason.fall;
        const lastSpring = lastSeason.spring;

        return {
            // classes: mapDraftsToForm(drafts),

            // Text Defaults
            seasonnamecn: `${now.getFullYear()}-${nextYear} 学年`,
            seasonnameen: `${now.getFullYear()}-${nextYear} Academic Year`,

            // Date Defaults (Projected +1 year)
            // We use the helper to strictly cast these strings to Date types for TS satisfaction
            fallstart: asDate(getNextYearDateString(lastFall?.startdate)),
            fallend: asDate(getNextYearDateString(lastFall?.enddate)),
            fallearlyreg: asDate(getNextYearDateString(lastFall?.earlyregdate)),
            fallnormalreg: asDate(getNextYearDateString(lastFall?.normalregdate)),
            falllatereg: asDate(getNextYearDateString(lastFall?.lateregdate1)),
            fallclosereg: asDate(getNextYearDateString(lastFall?.closeregdate)),
            fallcanceldeadline: asDate(getNextYearDateString(lastFall?.canceldeadline)),

            springstart: asDate(getNextYearDateString(lastSpring?.startdate)),
            springend: asDate(getNextYearDateString(lastSpring?.enddate)),
            springearlyreg: asDate(getNextYearDateString(lastSpring?.earlyregdate)),
            springnormalreg: asDate(getNextYearDateString(lastSpring?.normalregdate)),
            springlatereg: asDate(getNextYearDateString(lastSpring?.lateregdate1)),
            springclosereg: asDate(getNextYearDateString(lastSpring?.closeregdate)),
            springcanceldeadline: asDate(getNextYearDateString(lastSpring?.canceldeadline)),

            // Boolean / Settings Defaults
            haslateregfee: lastFall?.haslateregfee ?? false,
            haslateregfee4newfamily: lastFall?.haslateregfee4newfamily ?? false,
            hasdutyfee: lastFall?.hasdutyfee ?? false,
            showadmissionnotice: lastFall?.showadmissionnotice ?? true,
            showteachername: lastFall?.showteachername ?? true,
            days4showteachername: lastFall?.days4showteachername ?? 0,
            allownewfamilytoregister: lastFall?.allownewfamilytoregister ?? false,
            date4newfamilytoregister: asDate(
                getNextYearDateString(lastFall?.date4newfamilytoregister)
            ),
        };
    }, [lastSeason]);

    const form = useForm({
        // @ts-expect-error - Resolver types are incompatible but runtime is safe
        resolver: zodResolver(startSemFormSchema),
        defaultValues,
        mode: "onBlur",
    });

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        try {
            await createSemester(data);
            router.push("/admin/management/semester");
        } catch (err) {
            const message =
                err instanceof DrizzleError
                    ? err.message
                    : "An unexpected error occurred while starting the semester.";
            form.setError("root", { message });
        }
    };

    return (
        <RegistrationProvider value={{ seasons: {} as threeSeasons, selectOptions, idMaps }}>
            <FormProvider {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="bg-background min-h-screen pb-20"
                >
                    {/* Sticky Header */}
                    <div className="border-border bg-card/95 supports-[backdrop-filter]:bg-card/60 sticky top-0 z-10 border-b px-6 py-4 shadow-sm backdrop-blur">
                        <div className="mx-auto flex max-w-5xl items-center justify-between">
                            <div>
                                <h1 className="text-primary font-serif text-2xl font-bold">
                                    Initialize New Academic Year
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    Configure dates, settings, and initial class offerings.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => router.push("/admin/management/semester")}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? (
                                        "Processing..."
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" /> Start Semester
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="mx-auto mt-8 max-w-5xl space-y-8 px-6">
                        {/* Error Alert */}
                        {form.formState.errors.root && (
                            <div className="border-destructive/20 bg-destructive/15 text-destructive rounded-none border p-4 text-sm">
                                {form.formState.errors.root.message}
                            </div>
                        )}

                        <SeasonInfoSection />

                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                            <DateGroup label="Fall Semester" prefix="fall" />
                            <DateGroup label="Spring Semester" prefix="spring" />
                        </div>

                        <SettingsSection />

                        <ClassListSection  lastSeasonArrangement = {lastSeasonArrangement} selectOptions={ selectOptions}/>
                    </div>
                </form>
            </FormProvider>
        </RegistrationProvider>
    );
}

// --- Sub-Components ---

function SeasonInfoSection() {
    const {
        register,
        formState: { errors },
    } = useFormContext<FormValues>();

    return (
        <Card className="border-l-secondary rounded-none border-l-4">
            <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2 text-xl">
                    <BookOpen className="text-accent h-5 w-5" />
                    Semester Identity
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <label htmlFor="seasonnamecn" className="text-primary text-sm font-medium">
                        Chinese Name
                    </label>
                    <Input
                        id="seasonnamecn"
                        {...register("seasonnamecn")}
                        placeholder="e.g. 2025-2026 学年"
                        className="bg-muted/30"
                    />
                    {errors.seasonnamecn && (
                        <p className="text-destructive text-xs">{errors.seasonnamecn.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label htmlFor="seasonnameen" className="text-primary text-sm font-medium">
                        English Name
                    </label>
                    <Input
                        id="seasonnameen"
                        {...register("seasonnameen")}
                        placeholder="e.g. 2025-2026 Academic Year"
                        className="bg-muted/30"
                    />
                    {errors.seasonnameen && (
                        <p className="text-destructive text-xs">{errors.seasonnameen.message}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function DateGroup({ label, prefix }: { label: string; prefix: "fall" | "spring" }) {
    return (
        <Card className="rounded-none">
            <CardHeader className="pb-3">
                <CardTitle className="text-primary flex items-center gap-2 text-lg font-medium">
                    <CalendarIcon className="text-accent h-5 w-5" />
                    {label} Schedule
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {/* We construct the path string manually, but it is type-safe due to the schema structure */}
                    <DateInput label="Start Date" name={`${prefix}start` as Path<FormValues>} />
                    <DateInput label="End Date" name={`${prefix}end` as Path<FormValues>} />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                    <DateInput
                        label="Early Reg. Start"
                        name={`${prefix}earlyreg` as Path<FormValues>}
                    />
                    <DateInput
                        label="Normal Reg. Start"
                        name={`${prefix}normalreg` as Path<FormValues>}
                    />
                    <DateInput
                        label="Late Reg. Start"
                        name={`${prefix}latereg` as Path<FormValues>}
                    />
                    <DateInput
                        label="Registration Close"
                        name={`${prefix}closereg` as Path<FormValues>}
                    />
                </div>
                <DateInput
                    label="Cancel Deadline"
                    name={`${prefix}canceldeadline` as Path<FormValues>}
                    fullWidth
                />
            </CardContent>
        </Card>
    );
}

// We restrict 'name' to only keys of FormValues to ensure type safety
function DateInput({
    label,
    name,
    fullWidth,
}: {
    label: string;
    name: Path<FormValues>;
    fullWidth?: boolean;
}) {
    const {
        register,
        formState: { errors },
    } = useFormContext<FormValues>();

    // We use a specific helper to retrieve nested errors if necessary,
    // but here we know 'name' is a direct path.
    // However, TypeScript doesn't know 'name' maps to a specific field type in the error object map effortlessly.
    // Casting the error lookup is safe here as it's a read-only display.
    const error = errors[name as keyof typeof errors];

    return (
        <div className={cn("space-y-1.5", fullWidth && "col-span-2")}>
            <label
                htmlFor={name}
                className="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
            >
                {label}
            </label>
            <Input
                id={name}
                type="date"
                {...register(name)}
                className={cn("h-9", error && "border-destructive")}
            />
            {error && <span className="text-destructive text-xs">{error.message as string}</span>}
        </div>
    );
}

function SettingsSection() {
    const { register, watch } = useFormContext<FormValues>();

    // Explicitly watching fields
    const showTeacherName = watch("showteachername");
    const allowNewFamily = watch("allownewfamilytoregister");

    return (
        <Card className="rounded-none">
            <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2 text-xl">
                    <Settings2 className="text-accent h-5 w-5" />
                    Configuration & Fees
                </CardTitle>
                <CardDescription>
                    Manage fees, visibility settings, and registration rules.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8 md:grid-cols-3">
                {/* Fees */}
                <div className="space-y-4">
                    <h3 className="text-primary font-serif text-lg font-medium">Fees</h3>
                    <div className="bg-muted/20 space-y-4 rounded-none border p-4">
                        <SwitchRow name="haslateregfee" label="Late Fee (General)" />
                        <SwitchRow name="haslateregfee4newfamily" label="Late Fee (New Families)" />
                        <SwitchRow name="hasdutyfee" label="Duty Fee" />
                    </div>
                </div>

                {/* Visibility */}
                <div className="space-y-4">
                    <h3 className="text-primary font-serif text-lg font-medium">Visibility</h3>
                    <div className="bg-muted/20 space-y-4 rounded-none border p-4">
                        <SwitchRow name="showadmissionnotice" label="Show Admission Notice" />
                        <SwitchRow name="showteachername" label="Show Teacher Names" />

                        <div className={cn("transition-opacity", !showTeacherName && "opacity-50")}>
                            <label
                                htmlFor="days4showteachername"
                                className="text-muted-foreground text-xs font-semibold"
                            >
                                Days before showing teacher
                            </label>
                            <Input
                                id="days4showteachername"
                                type="number"
                                {...register("days4showteachername", { valueAsNumber: true })}
                                disabled={!showTeacherName}
                                className="mt-1 bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Registration */}
                <div className="space-y-4">
                    <h3 className="text-primary font-serif text-lg font-medium">New Families</h3>
                    <div className="bg-muted/20 space-y-4 rounded-none border p-4">
                        <SwitchRow name="allownewfamilytoregister" label="Allow Registration" />

                        <div className={cn("transition-opacity", !allowNewFamily && "opacity-50")}>
                            <label
                                htmlFor="date4newfamilytoregister"
                                className="text-muted-foreground text-xs font-semibold"
                            >
                                Register Start Date
                            </label>
                            <Input
                                id="date4newfamilytoregister"
                                type="date"
                                {...register("date4newfamilytoregister")}
                                disabled={!allowNewFamily}
                                className="mt-1 bg-white"
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Strictly typed props for the SwitchRow
function SwitchRow({ name, label }: { name: Path<FormValues>; label: string }) {
    const { watch, setValue } = useFormContext<FormValues>();

    // We strictly cast the result of watch to boolean because we know these specific fields are booleans
    // This avoids "unknown" type issues
    const value = watch(name) as boolean;

    return (
        <div className="flex items-center justify-between">
            <label htmlFor={name} className="text-foreground/80 cursor-pointer text-sm font-medium">
                {label}
            </label>
            <Switch
                id={name}
                checked={value}
                onCheckedChange={(checked) => setValue(name, checked)}
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-primary/20 focus-visible:ring-accent"
            />
        </div>
    );
}

function ClassListSection({ lastSeasonArrangement,selectOptions }: { lastSeasonArrangement: LastArrangement , selectOptions : selectOptions }) {
    const { control } = useFormContext<FormValues>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "classes",
    });

    const [tuitionW, setTuitionW] = useState<number>(740.0); // standdar chinese whole
    const [tuitionH, setTuitionH] = useState<number>(400.0);  // staandard chines half
    const [books, setBooks] = useState<number>(30.0);  // stand book fee
    const [bookm, setBookm] = useState<number>(40.0);  // Ma book fee 


    const handleCopy = () => { 

            // cache class type 

            const classTypeMap = new Map();
            selectOptions.classes.forEach(obj => classTypeMap.set(obj.classid,obj.typeid));

            for ( const [ term, arr] of Object.entries(lastSeasonArrangement)) 
            {   
                for(let i= 0; i < arr.length; i++) {
                    const typeid = classTypeMap.get(arr[i].classid) ?? 1 ; 
                    let book = books ; 
                    if (typeid ==2 ) {
                        book = bookm ; 
                    }
                    console.log(typeid)
                    append({
                        classid: arr[i].classid,
                        teacherid: 7,  // TBD
                        roomid: 59,     //TBD
                        timeid: arr[i].timeid,
                        suitableterm: arr[i].suitableterm,
                        term: term.toUpperCase() ,
                        tuitionH: tuitionH, //parseFloat(arr[i].tuitionH?? "0.0"), 
                        tuitionW: tuitionW, //parseFloat(arr[i].tuitionW?? "0.0"),
                        bookfeeH: book, //parseFloat(arr[i].bookfeeH?? "0.0"), 
                        bookfeeW: book, //parseFloat(arr[i].bookfeeW?? "0.0"),
                        specialfeeH: parseFloat(arr[i].specialfeeH?? "0.0"),
                        specialfeeW: parseFloat(arr[i].specialfeeW?? "0.0"),
                        seatlimit: arr[i].seatlimit,
                        agelimit: arr[i].agelimit,
                        waiveregfee: arr[i].waiveregfee,
                        closeregistration: false,
                        isregclass: false,
                        notes: "",
                    })
                }

            }
        
    }

        const handleRegistration = async () => { 

            // cache class type 

            const classTypeMap = new Map();
            selectOptions.classes.forEach(obj => classTypeMap.set(obj.classid,obj.typeid));
            const allRegistration = await selectRegistrationClass()

            for ( const cls of allRegistration) 
            {   
                const typeid = classTypeMap.get(cls.classid) ?? 1 ; 
                let book = books ; 
                if (typeid ==2 ) {
                    book = bookm ; 
                }
                console.log(typeid)
                append({
                    classid: cls.classid,
                    teacherid: 7,  // TBD
                    roomid: 59,     //TBD
                    timeid: 2,
                    suitableterm: 3,
                    term: "FALL",
                    tuitionH: tuitionH, //parseFloat(arr[i].tuitionH?? "0.0"), 
                    tuitionW: tuitionW, //parseFloat(arr[i].tuitionW?? "0.0"),
                    bookfeeH: book, //parseFloat(arr[i].bookfeeH?? "0.0"), 
                    bookfeeW: book, //parseFloat(arr[i].bookfeeW?? "0.0"),
                    specialfeeH: 0.0 ,
                    specialfeeW: 0.0,
                    seatlimit: 300,
                    agelimit: 4,
                    waiveregfee: true, 
                    closeregistration: false,
                    isregclass: false,
                    notes: "",
                })

            }
        
    }

    return (
        <Card className="border-l-primary rounded-none border-l-4">
            {/* Header is now white/transparent with just the text colored */}
            <CardHeader className="border-border/40 bg-background flex flex-row items-center justify-between border-b px-6 py-4">
                <div className="flex flex-col gap-1">
                    <CardTitle className="text-primary flex items-center gap-2 text-xl font-bold tracking-wide uppercase">
                        <School className="text-accent h-5 w-5" />
                        Class Offerings
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-xs tracking-wider uppercase">
                        Define the initial schedule. You can edit these later.
                    </CardDescription>
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="hover:bg-primary hover:text-primary-foreground gap-2 rounded-none shadow-sm transition-colors"
                    onClick={() =>
                        append({
                            classid: 0,
                            teacherid: 7,
                            roomid: 59,
                            timeid: 3,
                            suitableterm: 1,
                            term: "FALL",
                            tuitionH: tuitionH,
                            tuitionW: tuitionW,
                            bookfeeH: books,
                            bookfeeW: books,
                            specialfeeH: 0,
                            specialfeeW: 0,
                            seatlimit: 20,
                            agelimit: 5,
                            waiveregfee: false,
                            closeregistration: false,
                            isregclass: false,
                            notes: "",
                        })
                    }
                >
                    <PlusIcon className="h-4 w-4" />
                    ADD ENTRY
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="hover:bg-primary hover:text-primary-foreground gap-2 rounded-none shadow-sm transition-colors"
                    onClick={handleRegistration}
                >
                    Create Registration
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="hover:bg-primary hover:text-primary-foreground gap-2 rounded-none shadow-sm transition-colors"
                    onClick={handleCopy}
                >
                    Copy Last Term
                </Button>
            </CardHeader>
            <CardContent className="bg-background/50 p-6">
                <div className="mb-4">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-muted-foreground text-xs font-semibold">Full Tuition Fee (学费)</label>
                            <Input
                                type="number"
                                step="any"
                                value={tuitionW}
                                onChange={(e) => setTuitionW(parseFloat(e.target.value || "0"))}
                                placeholder="0.0"
                                className="h-9"
                            />
                        </div>
                        <div>
                            <label className="text-muted-foreground text-xs font-semibold">Half Tuition Fee (半年学费)</label>
                            <Input
                                type="number"
                                step="any"
                                value={tuitionH}
                                onChange={(e) => setTuitionH(parseFloat(e.target.value || "0"))}
                                placeholder="0.0"
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-muted-foreground text-xs font-semibold">MaliPing Book Fee(马力平 教材料)</label>
                            <Input
                                type="number"
                                step="any"
                                value={bookm}
                                onChange={(e) => setBookm(parseFloat(e.target.value || "0"))}
                                placeholder="0.0"
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-muted-foreground text-xs font-semibold">Standard Book Fee(标准中文教材)</label>
                            <Input
                                type="number"
                                step="any"
                                value={books}
                                onChange={(e) => setBooks(parseFloat(e.target.value || "0"))}
                                placeholder="0.0"
                                className="h-9"
                            />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {fields.map((field, index) => (
                        <div
                            key={field.id}
                            className="group border-input bg-background hover:border-primary/60 relative flex flex-col rounded-none border p-1 shadow-none transition-all"
                        >
                            {/* Decorative Index Label */}
                            <div className="bg-background text-muted-foreground group-hover:text-primary absolute -top-3 left-4 px-2 text-xs font-bold transition-colors">
                                ITEM #{String(index + 1).padStart(2, "0")}
                            </div>

                            <SemesterClassBox
                                idx={index}
                                field={field}
                                deleteSemClass={() => remove(index)}
                            />
                        </div>
                    ))}
                </div>

                {fields.length === 0 && (
                    <div className="border-muted-foreground/20 bg-muted/5 flex h-40 flex-col items-center justify-center rounded-none border-2 border-dashed">
                        <p className="text-muted-foreground mb-2 text-sm font-medium tracking-wider uppercase">
                            No Schedule Entries
                        </p>
                        <Button
                            variant="link"
                            className="text-primary hover:text-primary/80 decoration-dotted underline-offset-4"
                            onClick={() =>
                                append({
                                    classid: 0,
                                    teacherid: 7,
                                    roomid: 59,
                                    timeid: 3,
                                    suitableterm: 1,
                                    term: "FALL",
                                    tuitionH: tuitionH,
                                    tuitionW: tuitionW,
                                    bookfeeH: books,
                                    bookfeeW: books,
                                    specialfeeH: 0,
                                    specialfeeW: 0,
                                    seatlimit: 0,
                                    agelimit: 0,
                                    waiveregfee: false,
                                    closeregistration: false,
                                    isregclass: false,
                                    notes: "",
                                })
                            }
                        >
                            Initialize First Class
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
