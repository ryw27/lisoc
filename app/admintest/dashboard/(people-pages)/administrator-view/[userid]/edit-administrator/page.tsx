import { adminuser } from "@/app/lib/db/schema";
import { Input } from "@/components/ui/input";
import { eq } from "drizzle-orm";
import { Textarea } from "@/components/ui/textarea";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/app/lib/db";
import Link from "next/link";
import { updateAdmin } from "../../admin-helpers";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default async function AdminEditPage({
    params,
}: {
    params: { userid: string, error?: string }
}) {
    
    const { userid, error } = await params;
    const userId = parseInt(userid);
    
    // Fetch the admin data
    const adminData = await db.query.adminuser.findFirst({
        where: eq(adminuser.userid, userId)
    });

    if (!adminData) {
        notFound();
    }

    const showError = error !== undefined;
    
    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between px-4">
                <Link 
                    href={`/admintest/dashboard/administrator-view/${userId}`}
                    className="text-blue-600 flex items-center gap-1 underline hover:text-blue-800 text-sm cursor-pointer p-2" 
                >
                    <span className="underline"><ArrowLeft className="w-3 h-3"/></span> Go Back
                </Link>
            </div>
            <div className="mx-auto max-w-2xl w-full">
                <h1 className="text-2xl font-extrabold mb-4">Edit Administrator</h1>
                <form action={async (formData) => {
                  "use server";
                  await updateAdmin(formData, userid);
                }} className="flex flex-col gap-6 p-2">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Username</label>
                            <Input 
                                type="text" 
                                name="username"
                                defaultValue={adminData.username}
                                className="rounded-sm !text-base h-9"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Password</label>
                            <Input 
                                type="password" 
                                name="password"
                                defaultValue={adminData.password}
                                className="rounded-sm !text-base h-9"
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1/2">
                                <label className="block text-sm text-gray-400 font-bold mb-2">First Name</label>
                                <Input 
                                    type="text" 
                                    name="firstname"
                                    defaultValue={adminData.firstname || ''}
                                    className="rounded-sm !text-base h-9"
                                    required
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm text-gray-400 font-bold mb-2">Last Name</label>
                                <Input 
                                    type="text" 
                                    name="lastname"
                                    defaultValue={adminData.lastname || ''}
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
                                defaultValue={adminData.namecn ?? ""}
                                className="rounded-sm !text-base h-9"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Email</label>
                            <Input 
                                type="email" 
                                name="email"
                                defaultValue={adminData.email || ''}
                                className="rounded-sm !text-base h-9"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Phone</label>
                            <Input 
                                type="tel" 
                                name="phone"
                                defaultValue={adminData.phone || ''}
                                className="rounded-sm !text-base h-9"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Address</label>
                            <Input 
                                type="text" 
                                name="address"
                                defaultValue={adminData.address || ''}
                                className="rounded-sm !text-base h-9"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Address Line 2</label>
                            <Input 
                                type="text" 
                                name="address1"
                                defaultValue={adminData.address1 ?? ""}
                                className="rounded-sm !text-base h-9"
                            />
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1/3">
                                <label className="block text-sm text-gray-400 font-bold mb-2">City</label>
                                <Input 
                                    type="text" 
                                    name="city"
                                    defaultValue={adminData.city || ''}
                                    className="rounded-sm !text-base h-9"
                                    required
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="block text-sm text-gray-400 font-bold mb-2">State</label>
                                <Input 
                                    type="text" 
                                    name="state"
                                    defaultValue={adminData.state || ''}
                                    className="rounded-sm !text-base h-9"
                                    required
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="block text-sm text-gray-400 font-bold mb-2">Zip</label>
                                <Input 
                                    type="text" 
                                    name="zip"
                                    defaultValue={adminData.zip || ''}
                                    className="rounded-sm !text-base h-9"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Family ID</label>
                            <Input 
                                type="number" 
                                name="familyid"
                                defaultValue={adminData.familyid ?? ""}
                                className="rounded-sm !text-base h-9"
                            />
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1/2">
                                <label className="block text-sm text-gray-400 font-bold mb-2">Status</label>
                                <Select name="status" required defaultValue={adminData.status}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={adminData.status} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm text-gray-400 font-bold mb-2">Change Password Next Login</label>
                                <div className="flex items-center space-x-2 mt-3">
                                    <Checkbox 
                                        id="ischangepwdnext" 
                                        name="ischangepwdnext" 
                                        defaultChecked={adminData.ischangepwdnext} 
                                    />
                                    <label
                                        htmlFor="ischangepwdnext"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Required
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 font-bold mb-2">Notes</label>
                            <Textarea 
                                name="notes"
                                defaultValue={adminData.notes ?? ""}
                                className="rounded-sm !text-base"
                            />
                        </div>
                    </div>
                    {showError && <p className="self-start text-red-400 text-center mt-2">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <Link href={`/admintest/dashboard/administrator-view/${userId}`}>
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