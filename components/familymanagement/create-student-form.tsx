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
                <PopoverTrigger
                    className={cn(
                        "cursor-pointer items-center rounded-md p-1",
                        "border-1 border-gray-300 hover:border-gray-700",
                        "focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    )}
                    aria-label="Row actions"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </PopoverTrigger>
                <PopoverContent
                    className={cn(
                        "justify-begin flex w-48 flex-col items-center gap-1",
                        "rounded-md border border-gray-300 bg-white",
                        "p-1"
                    )}
                    align="end"
                    side="bottom"
                    sideOffset={5}
                >
                    {
                        <>
                            <button
                                className={cn(
                                    cn(
                                        "flex items-center self-start text-left text-sm whitespace-nowrap hover:bg-gray-100",
                                        "w-full cursor-pointer gap-1 rounded-sm p-1 transition-colors duration-200",
                                        "focus:bg-gray-100 focus:outline-none"
                                    )
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const studentid = row.original.studentid ?? -1;
                                    const gender =
                                        row.original.gender == "Male" ? "Male" : "Female";
                                    const namecn = row.original.namecn;
                                    const namelasten = row.original.namelasten;
                                    const namefirsten = row.original.namefirsten;
                                    //const ageof = row.original.ageof
                                    const dob = row.original.dob;
                                    const dobDate = new Date(dob);
                                    const year = dobDate.getFullYear();
                                    const month = dobDate.getMonth() + 1;
                                    const day = dobDate.getDate();

                                    const dobFormatted = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
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
                                <PencilIcon className="h-4 w-4" /> Edit
                            </button>
                            <>
                                <button
                                    className={cn(
                                        cn(
                                            "flex items-center self-start text-left text-sm whitespace-nowrap hover:bg-gray-100",
                                            "w-full cursor-pointer gap-1 rounded-sm p-1 transition-colors duration-200",
                                            "focus:bg-gray-100 focus:outline-none",
                                            "cursor-pointer text-blue-500 hover:text-blue-600"
                                        )
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowConfirmDialog(true);
                                    }}
                                >
                                    <XIcon className="h-5 w-5 cursor-pointer text-red-500 hover:text-red-700" />{" "}
                                    Delete
                                </button>
                                <AlertDialog
                                    open={showConfirmDialog}
                                    onOpenChange={setShowConfirmDialog}
                                >
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirm Deletion </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                您将不能删除以前或现在在本校注册过课程的学生记录。确定要删除这个学生的记录吗?{" "}
                                                {row.original.studentid} ? <br /> ou will not be
                                                able to delete any student who has registered any
                                                courses in the past. Are you sure to continue
                                                deleting the student?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>

                                        <AlertDialogFooter>
                                            <AlertDialogCancel
                                                onClick={() => setShowConfirmDialog(false)}
                                            >
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={async () => {
                                                    try {
                                                        await removeStudent(
                                                            row.original.studentid!
                                                        );
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
                                                Confirm
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        </>
                    }
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
        <div>
            <div className="mx-auto mt-8 max-w-md rounded-lg bg-white p-8 shadow-md">
                <h2 className="mb-6 text-center text-2xl font-semibold">{title}</h2>
                <form
                    onSubmit={studentForm.handleSubmit(onSubmit)}
                    className="space-y-5"
                    autoComplete="off"
                >
                    <div>
                        <label
                            htmlFor="namecn"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Chinese Name
                        </label>
                        <Input
                            type="text"
                            id="namecn"
                            placeholder="中文名"
                            {...studentForm.register("namecn")}
                            className="w-full"
                        />
                        {studentForm.formState.errors.namecn && (
                            <span className="text-xs text-red-500">
                                {studentForm.formState.errors.namecn.message}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label
                                htmlFor="namelasten"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Last Name (EN)
                            </label>
                            <Input
                                type="text"
                                id="namelasten"
                                placeholder="Last Name"
                                {...studentForm.register("namelasten")}
                                className="w-full"
                            />
                            {studentForm.formState.errors.namelasten && (
                                <span className="text-xs text-red-500">
                                    {studentForm.formState.errors.namelasten.message}
                                </span>
                            )}
                        </div>
                        <div className="flex-1">
                            <label
                                htmlFor="namefirsten"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                First Name (EN)
                            </label>
                            <Input
                                type="text"
                                id="namefirsten"
                                placeholder="First Name"
                                {...studentForm.register("namefirsten")}
                                className="w-full"
                            />
                            {studentForm.formState.errors.namefirsten && (
                                <span className="text-xs text-red-500">
                                    {studentForm.formState.errors.namefirsten.message}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div>
                            <label
                                htmlFor="gender"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Gender（性别）
                            </label>
                            {/* Use shadcn/ui Select for gender */}
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
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    aria-invalid={!!studentForm.formState.errors.gender}
                                >
                                    <SelectValue placeholder="gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                            {studentForm.formState.errors.gender && (
                                <span className="text-xs text-red-500">
                                    {studentForm.formState.errors.gender.message}
                                </span>
                            )}
                        </div>

                        <div className="flex-1">
                            <label
                                htmlFor="dob"
                                className="align-right mb-1 block text-sm font-medium text-gray-700"
                            >
                                Date of Birth（出生日期）
                            </label>
                            <Input
                                type="date"
                                id="dob"
                                {...studentForm.register("dob")}
                                className="w-full"
                            />
                            {studentForm.formState.errors.dob && (
                                <span className="text-xs text-red-500">
                                    {studentForm.formState.errors.dob.message}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* <div className="flex items-center gap-2">
                    <Input
                        type="checkbox"
                        id="active"
                        {...studentForm.register('active')}
                        className="h-4 w-4"
                    />
                    <label htmlFor="active" className="text-sm font-medium text-gray-700">
                        Active
                    </label>
                </div> */}
                    {/* <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                    </label>
                    <Input
                        type="text"
                        id="notes"
                        placeholder="Additional notes"
                        {...studentForm.register('notes')}
                        className="w-full"
                    />
                    {studentForm.formState.errors.notes && (
                        <span className="text-red-500 text-xs">
                            {studentForm.formState.errors.notes.message}
                        </span>
                    )}
                </div> */}
                    {error && <div className="text-center text-sm text-red-600">{error}</div>}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            className={`w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60`}
                            onClick={(e) => {
                                e.preventDefault();
                                setStudentId(-1);
                                setTitle("Add New Student");
                                setError(null);
                                studentForm.reset();
                            }}
                        >
                            Reset( 重置 )
                        </button>

                        <button
                            type="submit"
                            className={`w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60 ${
                                busy || studentForm.formState.isSubmitting
                                    ? "cursor-not-allowed"
                                    : "cursor-pointer"
                            }`}
                            disabled={busy}
                            name="submit"
                        >
                            {busy ? "Creating..." : "Add/Edit(更新)"}
                        </button>
                    </div>
                </form>
            </div>
            <div></div>
            <div className="mx-auto mt-10 rounded-lg bg-white p-8 shadow-md">
                <h3 className="mb-4 text-center text-xl font-semibold">Students in Family</h3>
                <ClientTable table={table} />
            </div>
        </div>
    );
}
