import { family } from "@/app/lib/db/schema";
import { Input } from "@/components/ui/input";
import { eq } from "drizzle-orm";
import { Textarea } from "@/components/ui/textarea";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/app/lib/db";
import Link from "next/link";
import { updateFamily } from "../../family-helpers";
import { Checkbox } from "@/components/ui/checkbox";

export default async function FamilyEditPage({
    params,
}: {
    params: { familyid: string, error?: string }
}) {
    
    const { familyid, error } = await params;
    const familyId = parseInt(familyid);
    
    // Fetch the family data
    const familyData = await db.query.family.findFirst({
        where: eq(family.familyid, familyId)
    });

    if (!familyData) {
        notFound();
    }

    const showError = error !== undefined;
    
    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between px-4">
                <Link 
                    href={`/admintest/dashboard/family-view/${familyId}`}
                    className="text-blue-600 flex items-center gap-1 underline hover:text-blue-800 text-sm cursor-pointer p-2" 
                >
                    <span className="underline"><ArrowLeft className="w-3 h-3"/></span> Go Back
                </Link>
            </div>
            <div className="mx-auto max-w-2xl w-full">
                <h1 className="text-2xl font-extrabold mb-4">Edit Family</h1>
                <form action={async (formData) => {
                  "use server";
                  await updateFamily(formData, familyid);
                }} className="flex flex-col gap-6 p-2">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Username</label>
                            <Input 
                                type="text" 
                                name="username"
                                defaultValue={familyData.username || ''}
                                className="rounded-sm !text-base h-9"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Password</label>
                            <Input 
                                type="password" 
                                name="password"
                                defaultValue={familyData.password || ''}
                                className="rounded-sm !text-base h-9"
                                required
                            />
                        </div>
                        
                        <div className="mb-4">
                            <h3 className="text-lg font-bold mb-2">Father Information</h3>
                            <div className="flex gap-3 mb-2">
                                <div className="w-1/2">
                                    <label className="block text-sm text-gray-400 font-bold mb-2">Father First Name</label>
                                    <Input 
                                        type="text" 
                                        name="fatherfirsten"
                                        defaultValue={familyData.fatherfirsten || ''}
                                        className="rounded-sm !text-base h-9"
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-sm text-gray-400 font-bold mb-2">Father Last Name</label>
                                    <Input 
                                        type="text" 
                                        name="fatherlasten"
                                        defaultValue={familyData.fatherlasten || ''}
                                        className="rounded-sm !text-base h-9"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 font-bold mb-2">Father Chinese Name</label>
                                <Input 
                                    type="text" 
                                    name="fathernamecn"
                                    defaultValue={familyData.fathernamecn || ''}
                                    className="rounded-sm !text-base h-9"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-lg font-bold mb-2">Mother Information</h3>
                            <div className="flex gap-3 mb-2">
                                <div className="w-1/2">
                                    <label className="block text-sm text-gray-400 font-bold mb-2">Mother First Name</label>
                                    <Input 
                                        type="text" 
                                        name="motherfirsten"
                                        defaultValue={familyData.motherfirsten || ''}
                                        className="rounded-sm !text-base h-9"
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-sm text-gray-400 font-bold mb-2">Mother Last Name</label>
                                    <Input 
                                        type="text" 
                                        name="motherlasten"
                                        defaultValue={familyData.motherlasten || ''}
                                        className="rounded-sm !text-base h-9"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 font-bold mb-2">Mother Chinese Name</label>
                                <Input 
                                    type="text" 
                                    name="mothernamecn"
                                    defaultValue={familyData.mothernamecn || ''}
                                    className="rounded-sm !text-base h-9"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Contact Preference</label>
                            <Input 
                                type="text" 
                                name="contact"
                                defaultValue={familyData.contact || ''}
                                className="rounded-sm !text-base h-9"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Email</label>
                            <Input 
                                type="email" 
                                name="email"
                                defaultValue={familyData.email || ''}
                                className="rounded-sm !text-base h-9"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Secondary Email</label>
                            <Input 
                                type="email" 
                                name="email2"
                                defaultValue={familyData.email2 || ''}
                                className="rounded-sm !text-base h-9"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Primary Phone</label>
                            <Input 
                                type="tel" 
                                name="phone"
                                defaultValue={familyData.phone || ''}
                                className="rounded-sm !text-base h-9"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Cell Phone</label>
                            <Input 
                                type="tel" 
                                name="cellphone"
                                defaultValue={familyData.cellphone || ''}
                                className="rounded-sm !text-base h-9"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Office Phone</label>
                            <Input 
                                type="tel" 
                                name="officephone"
                                defaultValue={familyData.officephone || ''}
                                className="rounded-sm !text-base h-9"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Address</label>
                            <Input 
                                type="text" 
                                name="address"
                                defaultValue={familyData.address || ''}
                                className="rounded-sm !text-base h-9"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Address Line 2</label>
                            <Input 
                                type="text" 
                                name="address1"
                                defaultValue={familyData.address1 || ''}
                                className="rounded-sm !text-base h-9"
                            />
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1/3">
                                <label className="block text-sm text-gray-400 font-bold mb-2">City</label>
                                <Input 
                                    type="text" 
                                    name="city"
                                    defaultValue={familyData.city || ''}
                                    className="rounded-sm !text-base h-9"
                                    required
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="block text-sm text-gray-400 font-bold mb-2">State</label>
                                <Input 
                                    type="text" 
                                    name="state"
                                    defaultValue={familyData.state || ''}
                                    className="rounded-sm !text-base h-9"
                                    required
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="block text-sm text-gray-400 font-bold mb-2">Zip</label>
                                <Input 
                                    type="text" 
                                    name="zip"
                                    defaultValue={familyData.zip || ''}
                                    className="rounded-sm !text-base h-9"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">School Member</label>
                            <Input 
                                type="text" 
                                name="schoolmember"
                                defaultValue={familyData.schoolmember || ''}
                                className="rounded-sm !text-base h-9"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Status</label>
                            <div className="flex items-center space-x-2 mt-3">
                                <Checkbox 
                                    id="status" 
                                    name="status" 
                                    defaultChecked={familyData.status} 
                                />
                                <label
                                    htmlFor="status"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Active
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Remarks</label>
                            <Textarea 
                                name="remark"
                                defaultValue={familyData.remark || ''}
                                className="rounded-sm !text-base"
                            />
                        </div>
                    </div>
                    {showError && <p className="self-start text-red-400 text-center mt-2">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <Link href={`/admintest/dashboard/family-view/${familyId}`}>
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