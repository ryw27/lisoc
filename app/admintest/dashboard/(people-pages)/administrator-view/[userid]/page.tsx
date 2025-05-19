import { notFound } from 'next/navigation';
import { db } from '@/app/lib/db';
import { adminuser } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';

interface AdminPageProps {
    params: {
        userid: string;
    }
}

export default async function AdminPage({ params }: AdminPageProps) {
    // Await params before accessing userid
    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.userid);
    
    // Fetch the specific admin
    const adminData = await db.query.adminuser.findFirst({
        where: eq(adminuser.userid, userId)
    });
    
    // If no admin found, show 404
    if (!adminData) {
        console.error("No administrator found!");
        notFound();
    }

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between px-4">
                <Link 
                    href="/admintest/dashboard/administrator-view"
                    className="text-blue-600 flex items-center gap-1 underline hover:text-blue-800 text-sm cursor-pointer p-2" 
                >
                    <span className="underline"><ArrowLeft className="w-3 h-3"/></span> Go Back
                </Link>

                <Link 
                    className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-800 cursor-pointer p-2 underline"
                    href={`${userId}/edit-administrator`}
                >
                    <Edit className="w-3 h-3"/>Edit Administrator
                </Link>
            </div>
            <div className="mx-auto max-w-2xl w-full">
                <h1 className="text-2xl font-extrabold mb-4 break-words">{adminData.firstname} {adminData.lastname}</h1>
                <div className="flex flex-col gap-6">
                    <div className="gap-2">
                        <h2 className="text-lg font-semibold mb-2 text-blue-800">Administrator Information</h2>
                        <div className="space-y-4">
                            <p className="break-words text-gray-700"><span className="font-bold text-black">User ID:</span> {adminData.userid}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Username:</span> {adminData.username}</p>
                            {adminData.namecn && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">Chinese Name:</span> {adminData.namecn}</p>
                            )}
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Email:</span> {adminData.email}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Phone:</span> {adminData.phone}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Status:</span> {adminData.status}</p>
                        </div>
                    </div>
                    <div className="gap-2">
                        <h2 className="text-lg font-semibold mb-2 text-blue-800">Additional Information</h2>
                        <div className="space-y-4">
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Address:</span> {adminData.address}</p>
                            {adminData.address1 && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">Address Line 2:</span> {adminData.address1}</p>
                            )}
                            <p className="break-words text-gray-700"><span className="font-bold text-black">City:</span> {adminData.city}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">State:</span> {adminData.state}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Zip:</span> {adminData.zip}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Family ID:</span> {adminData.familyid}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Change Password Next Login:</span> {adminData.ischangepwdnext ? 'Yes' : 'No'}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Last Login:</span> {adminData.lastlogin ? new Date(adminData.lastlogin).toLocaleDateString() : 'Never'}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Created By:</span> {adminData.createby}</p>
                            <p className="break-words text-gray-700"><span className="font-bold text-black">Created On:</span> {adminData.createon ? new Date(adminData.createon).toLocaleDateString() : 'Unknown'}</p>
                            {adminData.notes && (
                                <p className="break-words text-gray-700"><span className="font-bold text-black">Notes:</span> {adminData.notes}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 