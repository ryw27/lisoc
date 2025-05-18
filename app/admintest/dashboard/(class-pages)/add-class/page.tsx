import { Input } from '@/components/ui/input'
import { addClass, getAllClasses } from '../class-helpers'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea'



//---------------------------------------------------------------------------------------------
// Helpers/Data Getters
//---------------------------------------------------------------------------------------------
	// classid: integer().notNull(),
	// classindex: numeric(),
	// ageid: smallint(),
	// classno: numeric().notNull(),
	// classupid: integer().notNull(),
	// sizelimits: integer(),
	// status: varchar({ length: 20 }),
	// description: varchar({ length: 2000 }),
	// lastmodify: timestamp({ precision: 3, mode: 'string' }),
	// createby: varchar({ length: 100 }).notNull(),
	// createon: timestamp({ precision: 3, mode: 'string' }).notNull(),
	// updateby: varchar({ length: 100 }).notNull(),
	// updateon: timestamp({ precision: 3, mode: 'string' }).notNull(),

//---------------------------------------------------------------------------------------------
// Main Page
//---------------------------------------------------------------------------------------------

export default async function AddClass({
    searchParams,
}: {
    searchParams: Promise<{
        error?: string;
    }>
    
}) {

    const params = await searchParams;
    const showError = params?.error !== undefined;
    const classTypes = ["1: Standard Chinese", "2: 马立平", "4: Clubs"];

    const classes = await getAllClasses();
    const classlist = classes.map((someclass) => someclass.classnamecn);
    return (
        <main className="flex flex-col gap-2">
            <div className="max-w-2xl mx-auto w-full">
                <h1 className="text-2xl font-bold mr-10">Add a new class</h1>
                <p className="text-sm text-gray-400">Fill out the form below to add a new class. 
                    Be sure to double check your inputs before saving. Note that this form is for one-off classes. 
                    For adding classes to a semester, go to Semester Management.</p>
                <form action={addClass} className="flex flex-col p-2">
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Class Name (中文)</label>
                        <Input 
                            type="text" 
                            name="classnamecn"
                            placeholder="中文课名字" 
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                            required
                            aria-required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Class Name (EN)</label>
                        <Input 
                            type="text" 
                            name="classnameen" 
                            placeholder="Enter the English class name..." 
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                            required
                            aria-required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Class Type</label>
                        <Select name="typeid" required>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="-- Select --" />
                            </SelectTrigger>
                            <SelectContent>
                                {classTypes.map((classType, index) => {
                                    return (
                                        <SelectItem key={classType} value={(index + 1).toString()}>{classType}</SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Class Level</label>
                        <Select name="classno" required>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="-- Select --" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({length: 13}, (_, i) => {
                                    return (
                                        <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                                    )
                                })} 
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Size Limits</label>
                        <Input 
                            type="number"
                            name="sizelimits"
                            placeholder="Enter the size limits"
                            className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                            required
                        />
                    </div>
                    <div className="flex gap-3 mb-6">
                        <div className="w-1/2">
                            <label className="block text-sm text-gray-400 font-bold mb-2">Status</label>
                            <Select name="status" required>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="-- Select --" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-1/2">
                            <label className="block text-sm text-gray-400 font-bold mb-2">Upgrade Class</label>
                            <Select name="classupid" required>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="-- Select --" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                    {classlist.map((classnamecn) => {
                                        return (
                                            <SelectItem key={classnamecn} value={classnamecn}>{classnamecn}</SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 font-bold mb-2">Description</label>
                        <Textarea
                            name="description"
                            placeholder="Enter the description"
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