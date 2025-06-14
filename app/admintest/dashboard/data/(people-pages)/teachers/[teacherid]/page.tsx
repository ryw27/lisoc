import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { teacher } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';

interface TeacherPageProps {
    params: {
        teacherid: string;
    }
}

export default async function TeacherPage({ params }: TeacherPageProps) {
    // Await params before accessing classid
    const resolvedParams = await params;
    const teacherId = parseInt(resolvedParams.teacherid);
    
    // Fetch the specific class
    const teacherData = await db.query.teacher.findFirst({
        where: eq(teacher.teacherid, teacherId)
    });
    

    // If no class found, show 404
    if (!teacherData) {
        console.error("No teacher found!!");
        notFound();
    }

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between px-4">
                <Link 
                    href="/admintest/dashboard/teacher-view"
                    className="text-blue-600 flex items-center gap-1 underline hover:text-blue-800 text-sm cursor-pointer p-2" 
                >
                    <span className="underline"><ArrowLeft className="w-3 h-3"/></span> Go Back
                </Link>

                <Link 
                    className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-800 cursor-pointer p-2 underline"
                    href={`${teacherId}/teacher-edit`}
                >
                    <Edit className="w-3 h-3"/>Edit Teacher
                </Link>
            </div>
            <div className="mx-auto max-w-2xl w-full">
                <h1 className="text-2xl font-extrabold mb-4 break-words">{teacherData.namecn}</h1>
                <div className="flex flex-col gap-6">
                    <div className="gap-2">
                        <h2 className="text-lg font-semibold mb-2 text-blue-800">Teacher Information</h2>
                        <div className="space-y-4">
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Teacher Name (CN):</span> {teacherData.namecn}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Teacher LastName (English):</span> {teacherData.namelasten}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Teacher FirstName (English):</span> {teacherData.namefirsten}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Status:</span> {teacherData.status}</p>
                        </div>
                    </div>
                    <div className="gap-2">
                        <h2 className="text-lg font-semibold mb-2 text-blue-800">Additional Information</h2>
                        <div className="space-y-4">
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Address:</span> {teacherData.address ? teacherData.address : "No first address"}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Address 2:</span> {teacherData.address1 ? teacherData.address1 : "No second address"}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">City:</span> {teacherData.city}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">State:</span> {teacherData.state}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Phone:</span> {teacherData.phone}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Email:</span> {teacherData.email}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
