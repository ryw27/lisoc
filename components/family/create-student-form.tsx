"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from 'zod/v4'
import { Input } from "@/components/ui/input";
import { createStudent, getFammilyStudent,removeStudent } from "@/lib/family/actions/createStudent";
import { studentSchema } from "@/lib/family/validation";
import { useState, useEffect } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
//import { db } from "@/lib/db";
import { student } from "@/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";

import { ColumnDef, useReactTable } from "@tanstack/react-table";
import { getCoreRowModel, } from "@tanstack/react-table";
import { ClientTable } from "@/components/client-table";
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from "@/components/ui/popover";

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


import { 
    PencilIcon, 
    MoreHorizontal, 
    XIcon,
} from "lucide-react";

import { cn  } from "@/lib/utils";

type studentInfo = InferSelectModel<typeof student> 

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
        }
    }

];



export default function CreateStudentForm({ familyid }: { familyid: number }) {
    const [sid, setStudentId] = useState<number >(-1); // default to add student
    const [title , setTitle] = useState<string>("Add New Student");
    const [error, setError] = useState<string | null>()
    const [busy, setBusy] = useState<boolean>(false);
    const [famStudents, setFamStudents] = useState<studentInfo[]>([]);
    const [reload, setReload] = useState<boolean>(false);

    const studentForm = useForm({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            familyid: familyid,
        },
        mode: "onBlur"
    })

    const onSubmit = async (data: z.infer<typeof studentSchema>) => {
        setBusy(true);
        setError(null);
        try {
            const studentData = studentSchema.parse(data);
            await createStudent(studentData, familyid,sid);
            studentForm.reset();
            setStudentId(-1);
            setTitle("Add New Student");
        } catch (error) {
            if (error instanceof z.ZodError) {
                error.issues.map((e) => {
                    studentForm.setError(e.path as unknown as keyof z.infer<typeof studentSchema>, { message: e.message });
                })
            } else if (typeof error === "string") {
                setError(error);
            } else {
                setError("Unknown error occured. Please try again or contact regadmin");
            }
        } finally {
            setBusy(false);
            setReload(true);
        }
    }
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
            header:"Edit/Delete",
            cell: ({ row}) => {
            const [showConfirmDialog, setShowConfirmDialog] = useState(false);

            return (
                    <>
                        <Popover>
                            <PopoverTrigger 
                                className={cn(
                                    "items-center rounded-md p-1 cursor-pointer",
                                    "border-1 border-gray-300 hover:border-gray-700",
                                    "focus:outline-none focus:ring-2 focus:ring-blue-500"
                                )}
                                aria-label="Row actions"
                                onClick={(e) => e.stopPropagation()}
                            >
                                 <MoreHorizontal className="w-4 h-4" />
                            </PopoverTrigger>
                            <PopoverContent 
                                className={cn(
                                    "flex flex-col gap-1 justify-begin items-center w-48",
                                    "bg-white border border-gray-300 rounded-md",
                                    "p-1"
                                )}
                                align="end"
                                side="bottom"
                                sideOffset={5}
                            >
                               { 
                               (
                                <>
                                <button
                                    className={cn(
                                        cn(
                                            "flex items-center self-start text-left text-sm hover:bg-gray-100 whitespace-nowrap",
                                            "rounded-sm w-full p-1 cursor-pointer transition-colors duration-200 gap-1",
                                            "focus:outline-none focus:bg-gray-100",
                                        )
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const studentid = row.original.studentid?? -1 ;
                                        const gender = row.original.gender=="Male" ? "Male" :"Female"
                                        const namecn = row.original.namecn
                                        const namelasten = row.original.namelasten
                                        const namefirsten = row.original.namefirsten
                                        //const ageof = row.original.ageof
                                        const dob = row.original.dob ;
                                        const dobDate = new Date(dob);
                                        const year = dobDate.getFullYear();
                                        const month = dobDate.getMonth() + 1;
                                        const day = dobDate.getDate();

                                        const dobFormatted = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                        setStudentId(studentid);
                                        setTitle("Edit Student Info - ID: " + studentid);
                                        studentForm.setValue("gender", gender);         
                                        studentForm.setValue("namecn", namecn);
                                        studentForm.setValue("namelasten", namelasten);
                                        studentForm.setValue("namefirsten", namefirsten);
                                        //studentForm.setValue("age", ageof);
                                        studentForm.setValue("dob", dobFormatted);    
                                        setError(null);

                                    }}
                                >
                                    <PencilIcon className="w-4 h-4" /> Edit
                                </button>
                                <>        
                                <button 
                                    className={cn(
                                        cn(
                                            "flex items-center self-start text-left text-sm hover:bg-gray-100 whitespace-nowrap",
                                            "rounded-sm w-full p-1 cursor-pointer transition-colors duration-200 gap-1",
                                            "focus:outline-none focus:bg-gray-100",
                                            "text-blue-500 hover:text-blue-600 cursor-pointer"
                                        )
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowConfirmDialog(true);
                                    }}
                                >
                                  <XIcon className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-700" /> Delete
                                </button>
                                        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                                          <AlertDialogContent>
                                              <AlertDialogHeader>
                                                  <AlertDialogTitle>Confirm Deletion </AlertDialogTitle>
                                                      <AlertDialogDescription>
                                                          您将不能删除以前或现在在本校注册过课程的学生记录。确定要删除这个学生的记录吗? {row.original.studentid} ? <br/> ou will not be able to delete any student who has registered any courses in the past. Are you sure to continue deleting the student?
                                                      </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              
                                              <AlertDialogFooter>
                                                  <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>Cancel</AlertDialogCancel>
                                                  <AlertDialogAction onClick={async () => {
                                                          try {
                                                                await removeStudent(row.original.studentid!);
                                                                
                                                          } catch (err) {
                                                              const msg = err instanceof Error ? err.message : String(err);
                                                              setReload(true);
                                                              //setError(" can not delet " + row.original.studentid + " : " + msg ) ;
                                                              alert(" Cannot delete student ID " + row.original.studentid + " : " + msg ) ;
                                                          } finally {
                                                                  setShowConfirmDialog(false);
                                                                  setReload(true);
                                                          }
                                                        }}>
                                                      Confirm
                                                  </AlertDialogAction>
                                              </AlertDialogFooter>
                                          </AlertDialogContent>
                                      </AlertDialog>


                                </>
                               </>
                                ) }
                            </PopoverContent>
                        </Popover>

                    </>
                )
            }
        }
    ]
   
    const table = useReactTable<studentInfo>({
        data: famStudents,
        columns: [...columns,...editColumn ], 
        getCoreRowModel: getCoreRowModel(),
    });
    

    return (
        <div>
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 mt-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">{title}</h2>
            <form
                onSubmit={studentForm.handleSubmit(onSubmit)}
                className="space-y-5"
                autoComplete="off"
            >
                <div>
                    <label htmlFor="namecn" className="block text-sm font-medium text-gray-700 mb-1">
                        Chinese Name
                    </label>
                    <Input
                        type="text"
                        id="namecn"
                        placeholder="中文名"
                        {...studentForm.register('namecn')}
                        className="w-full"
                    />
                    {studentForm.formState.errors.namecn && (
                        <span className="text-red-500 text-xs">
                            {studentForm.formState.errors.namecn.message}
                        </span>
                    )}
                </div>
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label htmlFor="namelasten" className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name (EN)
                        </label>
                        <Input
                            type="text"
                            id="namelasten"
                            placeholder="Last Name"
                            {...studentForm.register('namelasten')}
                            className="w-full"
                        />
                        {studentForm.formState.errors.namelasten && (
                            <span className="text-red-500 text-xs">
                                {studentForm.formState.errors.namelasten.message}
                            </span>
                        )}
                    </div>
                    <div className="flex-1">
                        <label htmlFor="namefirsten" className="block text-sm font-medium text-gray-700 mb-1">
                            First Name (EN)
                        </label>
                        <Input
                            type="text"
                            id="namefirsten"
                            placeholder="First Name"
                            {...studentForm.register('namefirsten')}
                            className="w-full"
                        />
                        {studentForm.formState.errors.namefirsten && (
                            <span className="text-red-500 text-xs">
                                {studentForm.formState.errors.namefirsten.message}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                        Gender（性别）
                    </label>
                    {/* Use shadcn/ui Select for gender */}
                    <Select
                        value={studentForm.watch('gender') || ""}
                        onValueChange={value => studentForm.setValue('gender', value as "Male" | "Female" , { shouldValidate: true })}
                        name="gender"
                    >
                        <SelectTrigger
                            id="gender"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                        <span className="text-red-500 text-xs">
                            {studentForm.formState.errors.gender.message}
                        </span>
                    )}
                </div>
                
                    <div className="flex-1">
                        <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1 align-right">
                            Date of Birth（出生日期）
                        </label>
                        <Input
                            type="date"
                            id="dob"
                            {...studentForm.register('dob')}
                            className="w-full"
                        />
                        {studentForm.formState.errors.dob && (
                            <span className="text-red-500 text-xs">
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
                {error && (
                    <div className="text-red-600 text-sm text-center">{error}</div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-60 `}
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
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-60 ${
                        busy || studentForm.formState.isSubmitting
                            ? "cursor-not-allowed"
                            : "cursor-pointer"
                        
                    }`
                }
                    disabled={busy }
                    name="submit"                    
                >
                    {busy ? "Creating..." : "Add/Edit(更新)"}
                 </button>
                </div>
            </form>

        </div>
            <div></div>
            <div className="mx-auto bg-white rounded-lg shadow-md p-8 mt-10">
                <h3 className="text-xl font-semibold mb-4 text-center">Students in Family</h3>
                <ClientTable table={table} />
            </div>

        </div>

    )
}