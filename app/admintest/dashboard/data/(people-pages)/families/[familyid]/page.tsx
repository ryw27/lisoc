import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { family } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';

interface FamilyPageProps {
    params: {
        familyid: string;
    }
}

export default async function FamilyPage({ params }: FamilyPageProps) {
    // Await params before accessing familyid
    const resolvedParams = await params;
    const familyId = parseInt(resolvedParams.familyid);
    
    // Fetch the specific family
    const familyData = await db.query.family.findFirst({
        where: eq(family.familyid, familyId)
    });
    
    // If no family found, show 404
    if (!familyData) {
        console.error("No family found!");
        notFound();
    }

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between px-4">
                <Link 
                    href="/admintest/dashboard/family-view"
                    className="text-blue-600 flex items-center gap-1 underline hover:text-blue-800 text-sm cursor-pointer p-2" 
                >
                    <span className="underline"><ArrowLeft className="w-3 h-3"/></span> Go Back
                </Link>

                <Link 
                    className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-800 cursor-pointer p-2 underline"
                    href={`${familyId}/edit-family`}
                >
                    <Edit className="w-3 h-3"/>Edit Family
                </Link>
            </div>
            <div className="mx-auto max-w-2xl w-full">
                <h1 className="text-2xl font-extrabold mb-4 break-words">
                    {familyData.fatherfirsten && familyData.fatherlasten ? 
                        `${familyData.fatherfirsten} ${familyData.fatherlasten}` : 
                        (familyData.motherfirsten && familyData.motherlasten ? 
                            `${familyData.motherfirsten} ${familyData.motherlasten}` : 
                            `Family #${familyData.familyid}`
                        )
                    }
                    {familyData.fathernamecn && ` (${familyData.fathernamecn})`}
                </h1>
                <div className="flex flex-col gap-6">
                    <div className="gap-2">
                        <h2 className="text-lg font-semibold mb-2 text-blue-800">Family Information</h2>
                        <div className="space-y-4">
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Family ID:</span> {familyData.familyid}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Username:</span> {familyData.username}</p>
                            {familyData.fatherfirsten && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">Father:</span> {familyData.fatherfirsten} {familyData.fatherlasten} {familyData.fathernamecn ? `(${familyData.fathernamecn})` : ''}</p>
                            )}
                            {familyData.motherfirsten && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">Mother:</span> {familyData.motherfirsten} {familyData.motherlasten} {familyData.mothernamecn ? `(${familyData.mothernamecn})` : ''}</p>
                            )}
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Email:</span> {familyData.email}</p>
                            {familyData.email2 && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">Secondary Email:</span> {familyData.email2}</p>
                            )}
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Primary Phone:</span> {familyData.phone}</p>
                            {familyData.cellphone && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">Cell Phone:</span> {familyData.cellphone}</p>
                            )}
                            {familyData.officephone && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">Office Phone:</span> {familyData.officephone}</p>
                            )}
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Status:</span> {familyData.status ? 'Active' : 'Inactive'}</p>
                        </div>
                    </div>
                    <div className="gap-2">
                        <h2 className="text-lg font-semibold mb-2 text-blue-800">Additional Information</h2>
                        <div className="space-y-4">
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Address:</span> {familyData.address}</p>
                            {familyData.address1 && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">Address Line 2:</span> {familyData.address1}</p>
                            )}
                            <p className="break-words text-gray-700"><span className="font-bold text-black">City:</span> {familyData.city}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">State:</span> {familyData.state}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Zip:</span> {familyData.zip}</p>
                            {familyData.contact && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">Contact Preference:</span> {familyData.contact}</p>
                            )}
                            {familyData.schoolmember && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">School Member:</span> {familyData.schoolmember}</p>
                            )}
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Last Login:</span> {familyData.lastlogin ? new Date(familyData.lastlogin).toLocaleDateString() : 'Never'}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Created Date:</span> {familyData.createddate ? new Date(familyData.createddate).toLocaleDateString() : 'Unknown'}</p>
                            {familyData.remark && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">Remarks:</span> {familyData.remark}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 