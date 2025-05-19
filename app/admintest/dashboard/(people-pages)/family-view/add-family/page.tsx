import { Input } from '@/components/ui/input'
import { addFamily } from '../family-helpers'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from "@/components/ui/checkbox"

export default async function AddFamily({
    searchParams,
}: {
    searchParams: Promise<{
        error?: string;
    }>
    
}) {

    const params = await searchParams;
    const showError = params?.error !== undefined;

    return (
        <main className="flex flex-col gap-2">
            <div className="max-w-2xl mx-auto w-full">
                <h1 className="text-2xl font-bold mr-10">Add a new family</h1>
                <p className="text-sm text-gray-400">Fill out the form below to add a new family. 
                    Be sure to double check your inputs before saving.</p>
                <form action={addFamily} className="flex flex-col p-2">
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Username</label>
                        <Input 
                            type="text" 
                            name="username"
                            placeholder="Enter username" 
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Password</label>
                        <Input 
                            type="password" 
                            name="password" 
                            placeholder="Enter password" 
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                            required
                        />
                    </div>
                    
                    <div className="mb-6">
                        <h3 className="text-lg font-bold mb-2">Father Information</h3>
                        <div className="flex gap-3 mb-4">
                            <div className="w-1/2">
                                <label className="block text-sm text-gray-400 font-bold mb-2">Father First Name</label>
                                <Input 
                                    type="text" 
                                    name="fatherfirsten"
                                    placeholder="First name" 
                                    className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm text-gray-400 font-bold mb-2">Father Last Name</label>
                                <Input 
                                    type="text" 
                                    name="fatherlasten"
                                    placeholder="Last name" 
                                    className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 font-bold mb-2">Father Chinese Name</label>
                            <Input 
                                type="text" 
                                name="fathernamecn"
                                placeholder="Enter Chinese name" 
                                className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-bold mb-2">Mother Information</h3>
                        <div className="flex gap-3 mb-4">
                            <div className="w-1/2">
                                <label className="block text-sm text-gray-400 font-bold mb-2">Mother First Name</label>
                                <Input 
                                    type="text" 
                                    name="motherfirsten"
                                    placeholder="First name" 
                                    className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm text-gray-400 font-bold mb-2">Mother Last Name</label>
                                <Input 
                                    type="text" 
                                    name="motherlasten"
                                    placeholder="Last name" 
                                    className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 font-bold mb-2">Mother Chinese Name</label>
                            <Input 
                                type="text" 
                                name="mothernamecn"
                                placeholder="Enter Chinese name" 
                                className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Contact Preference</label>
                        <Input 
                            type="text" 
                            name="contact"
                            placeholder="Enter contact preference" 
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Address</label>
                        <Input 
                            type="text" 
                            name="address"
                            placeholder="Enter address" 
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Address Line 2 (Optional)</label>
                        <Input 
                            type="text" 
                            name="address1"
                            placeholder="Enter address line 2" 
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                        />
                    </div>
                    <div className="flex gap-3 mb-6">
                        <div className="w-1/3">
                            <label className="block text-sm text-gray-400 font-bold mb-2">City</label>
                            <Input 
                                type="text" 
                                name="city"
                                placeholder="City" 
                                className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                                required
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="block text-sm text-gray-400 font-bold mb-2">State</label>
                            <Input 
                                type="text" 
                                name="state"
                                placeholder="State" 
                                className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                                required
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="block text-sm text-gray-400 font-bold mb-2">Zip</label>
                            <Input 
                                type="text" 
                                name="zip"
                                placeholder="Zip code" 
                                className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Primary Phone</label>
                        <Input 
                            type="tel" 
                            name="phone"
                            placeholder="Enter phone number" 
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Cell Phone (Optional)</label>
                        <Input 
                            type="tel" 
                            name="cellphone"
                            placeholder="Enter cell phone" 
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Office Phone (Optional)</label>
                        <Input 
                            type="tel" 
                            name="officephone"
                            placeholder="Enter office phone" 
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Email</label>
                        <Input 
                            type="email" 
                            name="email"
                            placeholder="Enter email address" 
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Secondary Email (Optional)</label>
                        <Input 
                            type="email" 
                            name="email2"
                            placeholder="Enter second email address" 
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Status</label>
                        <div className="flex items-center space-x-2 mt-3">
                            <Checkbox 
                                id="status" 
                                name="status" 
                                defaultChecked={true} 
                            />
                            <label
                                htmlFor="status"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Active
                            </label>
                        </div>
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">School Member (Optional)</label>
                        <Input 
                            type="text" 
                            name="schoolmember"
                            placeholder="Enter school member information" 
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Remarks (Optional)</label>
                        <Textarea
                            name="remark"
                            placeholder="Enter remarks"
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                        />
                    </div>
                    
                    {showError && <p className="self-start text-red-400 text-center mt-2">{params?.error}</p>}
                    <button 
                        type="submit" 
                        className="text-white rounded-sm bg-blue-600 cursor-pointer text-lg font-bold py-2 px-4"
                    >
                        Save
                    </button>
                </form>
            </div>
        </main>
    ) 
} 