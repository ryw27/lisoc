import { Input } from '@/components/ui/input'
import { addStudent } from '../student-helpers'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from "@/components/ui/checkbox"

export default async function AddStudent({
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
                <h1 className="text-2xl font-bold mr-10">Add a new student</h1>
                <p className="text-sm text-gray-400">Fill out the form below to add a new student. 
                    Be sure to double check your inputs before saving.</p>
                <form action={addStudent} className="flex flex-col p-2">
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Family ID</label>
                        <Input 
                            type="number" 
                            name="familyid"
                            placeholder="Enter family ID" 
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Student Number (Optional)</label>
                        <Input 
                            type="text" 
                            name="studentno" 
                            placeholder="Enter student number" 
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                        />
                    </div>
                    <div className="flex gap-3 mb-6">
                        <div className="w-1/2">
                            <label className="block text-sm text-gray-400 font-bold mb-2">First Name</label>
                            <Input 
                                type="text" 
                                name="namefirsten"
                                placeholder="First name" 
                                className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                                required
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-sm text-gray-400 font-bold mb-2">Last Name</label>
                            <Input 
                                type="text" 
                                name="namelasten"
                                placeholder="Last name" 
                                className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Chinese Name (Optional)</label>
                        <Input 
                            type="text" 
                            name="namecn"
                            placeholder="Enter Chinese name" 
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Gender (Optional)</label>
                        <Input 
                            type="text" 
                            name="gender"
                            placeholder="Enter gender" 
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                        />
                    </div>
                    <div className="flex gap-3 mb-6">
                        <div className="w-1/2">
                            <label className="block text-sm text-gray-400 font-bold mb-2">Age Group (Optional)</label>
                            <Input 
                                type="text" 
                                name="ageof"
                                placeholder="Age group" 
                                className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-sm text-gray-400 font-bold mb-2">Age (Optional)</label>
                            <Input 
                                type="number" 
                                name="age"
                                placeholder="Age" 
                                className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                            />
                        </div>
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Date of Birth</label>
                        <Input 
                            type="date" 
                            name="dob"
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Status</label>
                        <div className="flex items-center space-x-2 mt-3">
                            <Checkbox 
                                id="active" 
                                name="active" 
                                defaultChecked={true} 
                            />
                            <label
                                htmlFor="active"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Active
                            </label>
                        </div>
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Upgradable</label>
                        <Input 
                            type="number"
                            name="upgradable"
                            placeholder="Enter upgradable value (0 if not upgradable)"
                            defaultValue={0}
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Notes (Optional)</label>
                        <Textarea
                            name="notes"
                            placeholder="Enter notes"
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