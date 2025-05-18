import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { classes } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';

interface ClassPageProps {
    params: {
        classid: string;
    }
}

export default async function ClassPage({ params }: ClassPageProps) {
    // Await params before accessing classid
    const resolvedParams = await params;
    const classId = parseInt(resolvedParams.classid);
    
    // Fetch the specific class
    const classData = await db.query.classes.findFirst({
        where: eq(classes.classid, classId)
    });
    

    // If no class found, show 404
    if (!classData) {
        console.error("No class found!!");
        notFound();
    }

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between px-4">
                <Link 
                    href="/admintest/dashboard/class-view"
                    className="text-blue-600 flex items-center gap-1 underline hover:text-blue-800 text-sm cursor-pointer p-2" 
                >
                    <span className="underline"><ArrowLeft className="w-3 h-3"/></span> Go Back
                </Link>

                <Link 
                    className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-800 cursor-pointer p-2 underline"
                    href={`${classId}/class-edit`}
                >
                    <Edit className="w-3 h-3"/>Edit Class
                </Link>
            </div>
            <div className="mx-auto max-w-2xl w-full">
                <h1 className="text-2xl font-extrabold mb-4 break-words">{classData.classnamecn}</h1>
                <div className="flex flex-col gap-6">
                    <div className="gap-2">
                        <h2 className="text-lg font-semibold mb-2 text-blue-800">Class Information</h2>
                        <div className="space-y-4">
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Class ID:</span> {classData.classid}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">English Name:</span> {classData.classnameen}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Class Level:</span> {classData.classno}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Size Limits:</span> {classData.sizelimits}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Status:</span> {classData.status}</p>
                        </div>
                    </div>
                    <div className="gap-2">
                        <h2 className="text-lg font-semibold mb-2 text-blue-800">Additional Information</h2>
                        <div className="space-y-4">
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Description:</span> {classData.description || 'No description available'}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Type ID:</span> {classData.typeid || 'No type available'}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Last Modified:</span> {classData.lastmodify ? new Date(classData.lastmodify).toLocaleDateString() : null}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Created On:</span> {new Date(classData.createon).toLocaleDateString()}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Created By:</span> {classData.createby}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
