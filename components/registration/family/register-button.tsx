"use client";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { studentObject } from "@/app/admintest/data/(people-pages)/students/student-helpers";
import { useRouter } from "next/navigation";

export default function RegisterButton({ regSpecificClass, students }: { regSpecificClass: (studentid: number) => Promise<void>, students: studentObject[] }) {
    const [selectedStudent, setSelectedStudent] = useState<number>(); // Should be the student ID, ensure Select value is the student ID
    const [error, setError] = useState<string | null>(null)
    const router = useRouter();

    const hasStudents = students && students.length > 0;

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button 
                    className="rounded-md bg-blue-600 text-white text-sm flex items-center gap-1 hover:bg-blue-800 font-semibold cursor-pointer p-2"
                >
                    Register 
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Select Student</AlertDialogTitle>
                    <AlertDialogDescription>
                            <Select onValueChange={(value: string) => setSelectedStudent(Number(value))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a student to register" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hasStudents ? (
                                        students.map((student) => (
                                            <SelectItem 
                                                key={student.studentid} 
                                                value={student.studentid.toString()}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {student.namefirsten} {student.namelasten}
                                                    </span>
                                                    ({student.namecn && (
                                                        <span className="text-sm text-muted-foreground">
                                                            {student.namecn}
                                                        </span>
                                                    )})
                                                </div>
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="no-students" disabled>
                                            No students available
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                    {error && (
                        <div className="text-red-600 text-sm px-4 py-2 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}
                    <AlertDialogAction 
                        onClick={async () => {
                            try {
                                setError(null);
                                await regSpecificClass(selectedStudent as number); // Disabled when no selected student
                                router.push("/dashboard/registration/payment");
                            } catch (err) {
                                setError(err instanceof Error ? err.message : 'An error occurred while registering');
                            }
                        }}
                        className={cn(
                            "bg-blue-600 hover:bg-blue-700",
                            !hasStudents || !selectedStudent ? "cursor-not-allowed" : "cursor-pointer"
                        )}
                        disabled={!hasStudents || !selectedStudent}
                    >
                        Confirm
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}