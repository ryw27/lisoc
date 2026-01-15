"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef, getCoreRowModel, Row, useReactTable } from "@tanstack/react-table";
import { InferSelectModel } from "drizzle-orm";
import { MoreHorizontal, PencilIcon, XIcon } from "lucide-react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod/v4";
import { student } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { createStudent, getFammilyStudent, removeStudent } from "@/server/familymanagement/actions";
import { studentSchema } from "@/server/familymanagement/validation";
import { ClientTable } from "@/components/client-table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type studentInfo = InferSelectModel<typeof student>;

const columns: ColumnDef<studentInfo>[] = [
    {
        header: "Student Id",
        accessorKey: "studentid",
    },
    {
        header: "Last Name",
        accessorKey: "namelasten",
    },
    {
        header: "First Name",
        accessorKey: "namefirsten",
    },

    {
        header: "Chinese Name",
        accessorKey: "namecn",
    },
    {
        header: "Gender",
        accessorKey: "gender",
    },
    {
        header: "Birth Day",
        accessorKey: "dob",
        cell: ({ getValue }) => {
            const date = new Date(getValue() as string);
            return date.toLocaleDateString("en-US");
        },
    },
];

const EditCell = ({
    row,
    setReload,
    setError,
    setTitle,
    setStudentId,
    studentForm,
}: {
    row: Row<studentInfo>;
    setReload: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<string | null | undefined>>;
    setTitle: React.Dispatch<React.SetStateAction<string>>;
    setStudentId: React.Dispatch<React.SetStateAction<number>>;
    studentForm: UseFormReturn<z.infer<typeof studentSchema>>;
}) => {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    return (
        <>
            <Popover>
                {/* Trigger */}
                <PopoverTrigger
                    className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-sm transition-colors",
                        "text-muted-foreground hover:text-foreground hover:bg-gray-100",
                        "focus:ring-primary/20 focus:ring-2 focus:outline-none",
                        "data-[state=open]:text-foreground data-[state=open]:bg-gray-100"
                    )}
                    aria-label="Row actions"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </PopoverTrigger>

                <PopoverContent
                    className={cn(
                        "w-40 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg",
                        "p-1",
                        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                        "z-50"
                    )}
                    align="end"
                    side="bottom"
                    sideOffset={5}
                >
                    <div className="flex flex-col">
                        {/* Label */}
                        <span className="px-2 py-1.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                            Actions
                        </span>

                        <button
                            className={cn(
                                "group relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none",
                                "hover:bg-accent/80 hover:text-accent-foreground",
                                "focus:bg-accent/80 focus:text-accent-foreground"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                // --- LOGIC STARTS HERE ---
                                const studentid = row.original.studentid ?? -1;
                                const gender = row.original.gender == "Male" ? "Male" : "Female";
                                const namecn = row.original.namecn;
                                const namelasten = row.original.namelasten;
                                const namefirsten = row.original.namefirsten;
                                //const ageof = row.original.ageof
                                const dob = row.original.dob;
                                const dobDate = new Date(dob);
                                const year = dobDate.getFullYear();
                                const month = dobDate.getMonth() + 1;
                                const day = dobDate.getDate();

                                const dobFormatted = `${year}-${month
                                    .toString()
                                    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                                setStudentId(studentid);
                                setTitle("Edit Student Info - ID: " + studentid);
                                studentForm.setValue("gender", gender);
                                studentForm.setValue("namecn", namecn);
                                studentForm.setValue("namelasten", namelasten);
                                studentForm.setValue("namefirsten", namefirsten);
                                //studentForm.setValue("age", ageof);
                                studentForm.setValue("dob", new Date(dobFormatted));
                                setError(null);
                            }}
                        >
                            <PencilIcon className="group-hover:text-accent-foreground h-3.5 w-3.5 text-gray-500" />
                            <span>Edit</span>
                        </button>

                        <>
                            <button
                                className={cn(
                                    "group relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none",
                                    "text-red-600 hover:bg-red-50 hover:text-red-700",
                                    "focus:bg-red-50 focus:text-red-700"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowConfirmDialog(true);
                                }}
                            >
                                <XIcon className="h-3.5 w-3.5" />
                                <span>Delete</span>
                            </button>

                            <AlertDialog
                                open={showConfirmDialog}
                                onOpenChange={setShowConfirmDialog}
                            >
                                <AlertDialogContent className="border-l-destructive border-l-4 bg-white">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-destructive">
                                            Confirm Deletion
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-600">
                                            <p className="mb-2 font-medium text-gray-900">
                                                您将不能删除以前或现在在本校注册过课程的学生记录。确定要删除这个学生的记录吗?{" "}
                                                <span className="text-destructive font-mono font-bold">
                                                    {row.original.studentid}
                                                </span>
                                                ?
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                You will not be able to delete any student who has
                                                registered any courses in the past. Are you sure to
                                                continue deleting the student?
                                            </p>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    <AlertDialogFooter className="mt-4">
                                        <AlertDialogCancel
                                            onClick={() => setShowConfirmDialog(false)}
                                            className="border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                                        >
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-red-600 text-white hover:bg-red-700"
                                            onClick={async () => {
                                                try {
                                                    await removeStudent(row.original.studentid!);
                                                } catch (err) {
                                                    const msg =
                                                        err instanceof Error
                                                            ? err.message
                                                            : String(err);
                                                    setReload(true);
                                                    //setError(" can not delet " + row.original.studentid + " : " + msg ) ;
                                                    alert(
                                                        " Cannot delete student ID " +
                                                            row.original.studentid +
                                                            " : " +
                                                            msg
                                                    );
                                                } finally {
                                                    setShowConfirmDialog(false);
                                                    setReload(true);
                                                }
                                            }}
                                        >
                                            Confirm Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    </div>
                </PopoverContent>
            </Popover>
        </>
    );
};

export default function CreateStudentForm({ familyid }: { familyid: number }) {
    const [sid, setStudentId] = useState<number>(-1); // default to add student
    const [title, setTitle] = useState<string>("Add New Student");
    const [error, setError] = useState<string | null>();
    const [busy, setBusy] = useState<boolean>(false);
    const [famStudents, setFamStudents] = useState<studentInfo[]>([]);
    const [reload, setReload] = useState<boolean>(false);

    const studentForm = useForm({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            familyid: familyid,
        },
        mode: "onBlur",
    });

    const onSubmit = async (data: z.infer<typeof studentSchema>) => {
        setBusy(true);
        setError(null);
        try {
            const studentData = studentSchema.parse(data);
            await createStudent(studentData, familyid, sid);
            studentForm.reset();
            setStudentId(-1);
            setTitle("Add New Student");
        } catch (error) {
            if (error instanceof z.ZodError) {
                error.issues.map((e) => {
                    studentForm.setError(e.path as unknown as keyof z.infer<typeof studentSchema>, {
                        message: e.message,
                    });
                });
            } else if (typeof error === "string") {
                setError(error);
            } else {
                setError("Unknown error occured. Please try again or contact regadmin");
            }
        } finally {
            setBusy(false);
            setReload(true);
        }
    };

    useEffect(() => {
        const loadStudents = async () => {
            const students = await getFammilyStudent(familyid);
            setFamStudents(students);
        };
        loadStudents();
        setReload(false);
    }, [familyid, reload]);

    const editColumn: ColumnDef<studentInfo>[] = [
        {
            id: "edit",
            header: "Edit/Delete",
            cell: ({ row }) => (
                <EditCell
                    row={row}
                    setReload={setReload}
                    setError={setError}
                    setTitle={setTitle}
                    setStudentId={setStudentId}
                    // Don't know how to fix the type error here
                    studentForm={studentForm as UseFormReturn<z.infer<typeof studentSchema>>}
                />
            ),
        },
    ];

    const table = useReactTable<studentInfo>({
        data: famStudents,
        columns: [...columns, ...editColumn],
        getCoreRowModel: getCoreRowModel(),
    });
    return (
        <div className="space-y-10">
            <div className="border-primary/20 bg-card mx-auto mt-8 max-w-md rounded-xs border p-8 shadow-lg">
                <h2 className="border-primary/10 text-primary mb-6 border-b-2 pb-4 text-center text-xl font-bold tracking-widest uppercase">
                    {title}
                </h2>

                <form
                    onSubmit={studentForm.handleSubmit(onSubmit)}
                    className="space-y-6"
                    autoComplete="off"
                >
                    <div className="space-y-1.5">
                        <label
                            htmlFor="namecn"
                            className="text-primary block text-xs font-bold tracking-widest uppercase"
                        >
                            Chinese Name
                        </label>
                        <Input
                            type="text"
                            id="namecn"
                            placeholder="中文名"
                            {...studentForm.register("namecn")}
                            className="border-primary/20 bg-background focus-visible:ring-accent w-full rounded-xs"
                        />
                        {studentForm.formState.errors.namecn && (
                            <span className="text-destructive text-xs font-medium">
                                {studentForm.formState.errors.namecn.message}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 space-y-1.5">
                            <label
                                htmlFor="namelasten"
                                className="text-primary block text-xs font-bold tracking-widest uppercase"
                            >
                                Last Name (EN)
                            </label>
                            <Input
                                type="text"
                                id="namelasten"
                                placeholder="Last Name"
                                {...studentForm.register("namelasten")}
                                className="border-primary/20 bg-background focus-visible:ring-accent w-full rounded-xs"
                            />
                            {studentForm.formState.errors.namelasten && (
                                <span className="text-destructive text-xs font-medium">
                                    {studentForm.formState.errors.namelasten.message}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <label
                                htmlFor="namefirsten"
                                className="text-primary block text-xs font-bold tracking-widest uppercase"
                            >
                                First Name (EN)
                            </label>
                            <Input
                                type="text"
                                id="namefirsten"
                                placeholder="First Name"
                                {...studentForm.register("namefirsten")}
                                className="border-primary/20 bg-background focus-visible:ring-accent w-full rounded-xs"
                            />
                            {studentForm.formState.errors.namefirsten && (
                                <span className="text-destructive text-xs font-medium">
                                    {studentForm.formState.errors.namefirsten.message}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 space-y-1.5">
                            <label
                                htmlFor="gender"
                                className="text-primary block text-xs font-bold tracking-widest uppercase"
                            >
                                Gender（性别）
                            </label>
                            <Select
                                value={studentForm.watch("gender") || ""}
                                onValueChange={(value) =>
                                    studentForm.setValue("gender", value as "Male" | "Female", {
                                        shouldValidate: true,
                                    })
                                }
                                name="gender"
                            >
                                <SelectTrigger
                                    id="gender"
                                    className={cn(
                                        "border-primary/20 bg-background focus:ring-accent w-full rounded-xs",
                                        studentForm.formState.errors.gender && "border-destructive"
                                    )}
                                >
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent className="border-primary/20 rounded-xs bg-white">
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                            {studentForm.formState.errors.gender && (
                                <span className="text-destructive text-xs font-medium">
                                    {studentForm.formState.errors.gender.message}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 space-y-1.5">
                            <label
                                htmlFor="dob"
                                className="text-primary block text-xs font-bold tracking-widest uppercase"
                            >
                                Date of Birth
                            </label>
                            <Input
                                type="date"
                                id="dob"
                                {...studentForm.register("dob")}
                                className="border-primary/20 bg-background focus-visible:ring-accent w-full rounded-xs"
                            />
                            {studentForm.formState.errors.dob && (
                                <span className="text-destructive text-xs font-medium">
                                    {studentForm.formState.errors.dob.message}
                                </span>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="border-destructive/20 bg-destructive/5 text-destructive py-2 text-center text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <button
                            type="button"
                            className="border-primary/20 hover:bg-muted text-primary w-full rounded-xs border bg-transparent px-4 py-2.5 text-xs font-bold tracking-widest uppercase transition-colors"
                            onClick={(e) => {
                                e.preventDefault();
                                setStudentId(-1);
                                setTitle("Add New Student");
                                setError(null);
                                studentForm.reset();
                            }}
                        >
                            Reset (重置)
                        </button>

                        <button
                            type="submit"
                            disabled={busy}
                            className={cn(
                                "bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-xs px-4 py-2.5 text-xs font-bold tracking-widest uppercase transition-colors",
                                (busy || studentForm.formState.isSubmitting) &&
                                    "cursor-not-allowed opacity-70"
                            )}
                        >
                            {busy ? "Creating..." : "Add/Edit (更新)"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="mx-auto mt-12 max-w-7xl">
                <div className="border-primary/10 mb-4 flex items-center border-b-2 pb-2">
                    <h3 className="text-primary text-sm font-bold tracking-widest uppercase">
                        Students in Family
                    </h3>
                </div>

                <div className="w-full">
                    <ClientTable table={table} />
                </div>
            </div>
        </div>
    );
}
