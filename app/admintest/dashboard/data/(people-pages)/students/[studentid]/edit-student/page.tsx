import { student } from "@/app/lib/db/schema";
import { Input } from "@/components/ui/input";
import { eq } from "drizzle-orm";
import { Textarea } from "@/components/ui/textarea";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/app/lib/db";
import Link from "next/link";
import { updateStudent } from "../../student-helpers";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";

export default async function StudentEditPage({
    params,
}: {
    params: { studentid: string, error?: string }
}) {
    
    const { studentid, error } = await params;
    const studentId = parseInt(studentid);
    
    // Fetch the student data
    const studentData = await db.query.student.findFirst({
        where: eq(student.studentid, studentId)
    });

    if (!studentData) {
        notFound();
    }

    const showError = error !== undefined;
    
    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between px-4">
                <Link 
                    href={`/admintest/dashboard/student-view/${studentId}`}
                    className="text-blue-600 flex items-center gap-1 underline hover:text-blue-800 text-sm cursor-pointer p-2" 
                >
                    <span className="underline"><ArrowLeft className="w-3 h-3"/></span> Go Back
                </Link>
            </div>
            <div className="mx-auto max-w-2xl w-full">
                <h1 className="text-2xl font-extrabold mb-4">Edit Student</h1>
                <form action={async (formData) => {
                  "use server";
                  await updateStudent(formData, studentid);
                }} className="flex flex-col gap-6 p-2">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Family ID</label>
                            <Input 
                                type="number" 
                                name="familyid"
                                defaultValue={studentData.familyid}
                                className="rounded-sm !text-base h-9"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Student Number</label>
                            <Input 
                                type="text" 
                                name="studentno"
                                defaultValue={studentData.studentno || ''}
                                className="rounded-sm !text-base h-9"
                            />
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1/2">
                                <label className="block text-sm text-gray-400 font-bold mb-2">First Name</label>
                                <Input 
                                    type="text" 
                                    name="namefirsten"
                                    defaultValue={studentData.namefirsten || ''}
                                    className="rounded-sm !text-base h-9"
                                    required
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm text-gray-400 font-bold mb-2">Last Name</label>
                                <Input 
                                    type="text" 
                                    name="namelasten"
                                    defaultValue={studentData.namelasten || ''}
                                    className="rounded-sm !text-base h-9"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Chinese Name</label>
                            <Input 
                                type="text" 
                                name="namecn"
                                defaultValue={studentData.namecn || ''}
                                className="rounded-sm !text-base h-9"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Gender</label>
                            <Input 
                                type="text" 
                                name="gender"
                                defaultValue={studentData.gender || ''}
                                className="rounded-sm !text-base h-9"
                            />
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1/2">
                                <label className="block text-sm text-gray-400 font-bold mb-2">Age Group</label>
                                <Input 
                                    type="text" 
                                    name="ageof"
                                    defaultValue={studentData.ageof || ''}
                                    className="rounded-sm !text-base h-9"
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm text-gray-400 font-bold mb-2">Age</label>
                                <Input 
                                    type="number" 
                                    name="age"
                                    defaultValue={studentData.age || ''}
                                    className="rounded-sm !text-base h-9"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Date of Birth</label>
                            <Input 
                                type="date" 
                                name="dob"
                                defaultValue={studentData.dob ? new Date(studentData.dob).toISOString().split('T')[0] : ''}
                                className="rounded-sm !text-base h-9"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Status</label>
                            <div className="flex items-center space-x-2 mt-3">
                                <Checkbox 
                                    id="active" 
                                    name="active" 
                                    defaultChecked={studentData.active} 
                                />
                                <label
                                    htmlFor="active"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Active
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Upgradable</label>
                            <Input 
                                type="number" 
                                name="upgradable"
                                defaultValue={studentData.upgradable}
                                className="rounded-sm !text-base h-9"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Notes</label>
                            <Textarea 
                                name="notes"
                                defaultValue={studentData.notes || ''}
                                className="rounded-sm !text-base"
                            />
                        </div>
                    </div>
                    {showError && <p className="self-start text-red-400 text-center mt-2">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <Link href={`/admintest/dashboard/student-view/${studentId}`}>
                            <button type="button" className="rounded-md text-sm flex items-center gap-1 border-gray-300 border-1 font-semibold hover:bg-gray-50 cursor-pointer p-2">
                                Cancel
                            </button>
                        </Link>
                        <button type="submit" className="rounded-md bg-blue-600 text-white text-sm flex items-center gap-1 hover:bg-blue-800 font-semibold cursor-pointer p-2">
                            Save 
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 