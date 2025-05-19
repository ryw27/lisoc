import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { student } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';

interface StudentPageProps {
    params: {
        studentid: string;
    }
}

export default async function StudentPage({ params }: StudentPageProps) {
    // Await params before accessing studentid
    const resolvedParams = await params;
    const studentId = parseInt(resolvedParams.studentid);
    
    // Fetch the specific student
    const studentData = await db.query.student.findFirst({
        where: eq(student.studentid, studentId)
    });
    
    // If no student found, show 404
    if (!studentData) {
        console.error("No student found!");
        notFound();
    }

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between px-4">
                <Link 
                    href="/admintest/dashboard/student-view"
                    className="text-blue-600 flex items-center gap-1 underline hover:text-blue-800 text-sm cursor-pointer p-2" 
                >
                    <span className="underline"><ArrowLeft className="w-3 h-3"/></span> Go Back
                </Link>

                <Link 
                    className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-800 cursor-pointer p-2 underline"
                    href={`${studentId}/edit-student`}
                >
                    <Edit className="w-3 h-3"/>Edit Student
                </Link>
            </div>
            <div className="mx-auto max-w-2xl w-full">
                <h1 className="text-2xl font-extrabold mb-4 break-words">
                    {studentData.namefirsten} {studentData.namelasten}
                    {studentData.namecn && ` (${studentData.namecn})`}
                </h1>
                <div className="flex flex-col gap-6">
                    <div className="gap-2">
                        <h2 className="text-lg font-semibold mb-2 text-blue-800">Student Information</h2>
                        <div className="space-y-4">
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Student ID:</span> {studentData.studentid}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Family ID:</span> {studentData.familyid}</p>
                            {studentData.studentno && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">Student Number:</span> {studentData.studentno}</p>
                            )}
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Name:</span> {studentData.namefirsten} {studentData.namelasten}</p>
                            {studentData.namecn && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">Chinese Name:</span> {studentData.namecn}</p>
                            )}
                            {studentData.gender && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">Gender:</span> {studentData.gender}</p>
                            )}
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Date of Birth:</span> {studentData.dob ? new Date(studentData.dob).toLocaleDateString() : 'Unknown'}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Status:</span> {studentData.active ? 'Active' : 'Inactive'}</p>
                        </div>
                    </div>
                    <div className="gap-2">
                        <h2 className="text-lg font-semibold mb-2 text-blue-800">Additional Information</h2>
                        <div className="space-y-4">
                            {studentData.ageof && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">Age Group:</span> {studentData.ageof}</p>
                            )}
                            {studentData.age && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">Age:</span> {studentData.age}</p>
                            )}
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Upgradable:</span> {studentData.upgradable}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Created Date:</span> {studentData.createddate ? new Date(studentData.createddate).toLocaleDateString() : 'Unknown'}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Last Modified:</span> {studentData.lastmodify ? new Date(studentData.lastmodify).toLocaleDateString() : 'Unknown'}</p>
                            {studentData.notes && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">Notes:</span> {studentData.notes}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 