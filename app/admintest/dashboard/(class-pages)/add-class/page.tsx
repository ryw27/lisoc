import { Input } from '@/components/ui/input'
import { addClass } from '../class-helpers'




//---------------------------------------------------------------------------------------------
// Helpers/Data Getters
//---------------------------------------------------------------------------------------------



//---------------------------------------------------------------------------------------------
// Main Page
//---------------------------------------------------------------------------------------------
export default function AddClass({
    searchParams,
}: {
    searchParams: {
        error?: string
    }
}) {

    const showError = searchParams?.error === undefined;

    return (
        <main className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold mr-10">Add a class</h1>
            <form action={addClass} className="flex flex-col p-2">
                <div className="mb-6">
                    <label className="block text-sm text-gray-400 font-bold mb-2">Class Name (中文)</label>
                    <Input 
                        type="text" 
                        name="classnamecn" 
                        placeholder="中文课名字" 
                        className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-sm text-gray-400 font-bold mb-2">Class Name (EN)</label>
                    <Input 
                        type="text" 
                        name="classnameen" 
                        placeholder="Enter the English class name..." 
                        className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-sm text-gray-400 font-bold mb-2">Class Name (EN)</label>
                    <Input 
                        type="text" 
                        name="classnameen" 
                        placeholder="Enter the English class name..." 
                        className="rounded-sm !text-base h-9 [&::placeholder]:text-gray-400 [&::placeholder]:font-medium"
                    />
                </div>

                {showError && <p className="text-red-400 text-center mt-5">{searchParams?.error}</p>}
            </form>
        </main>
    ) 
}