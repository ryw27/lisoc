import { reducedClassColumns, ReducedClass} from "@/app/admintest/components/columns/column-types";
import { getAllClasses } from '@/app/lib/data-actions'
import DataTable from "@/app/admintest/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { DownloadIcon, PlusIcon, UploadIcon, ColumnsIcon } from "lucide-react";
import Filter from "@/components/filter";

type searchParams = {
    page: string;
    query: string;
    selectedTab: string;
}
export default async function ClassesPage({ 
    searchParams 
}: { 
    searchParams: Promise<searchParams> 
}) {
    const { page, query, selectedTab } = await searchParams;
    
    const pageSize = 4; // Number of items per page

    // Fetch only the data needed for the current page
    const { classes, totalCount } = await getAllClasses({
        page: parseInt(page) || 1,
        pageSize,
        query
    });

    const tabs = [
        {
            label: "Classes",
            value: "classes",
        },
        {
            label: "Classrooms",
            value: "classrooms",
        }
    ]
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Class Management</h1>
            {/* <HorizontalNav tabs={tabs} selectedTab={selectedTab} setSelectedTab={} /> */}

            <div className="flex items-center px-4 py-2 gap-1">
                <p className="text-lg font-bold">All classes </p>
                <span className="text-sm text-gray-500">({totalCount})</span>
            </div>
            <div className="flex justify-between items-center gap-2 px-4 py-2">
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md px-2 py-1 hover:bg-blue-600 hover:text-white transition-colors duration-200 cursor-pointer"> <ColumnsIcon className="w-4 h-4" /> Select Columns</button>
                    {/* <button className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md px-2 py-1 hover:bg-blue-600 hover:text-white transition-colors duration-200 cursor-pointer"> <FilterIcon className="w-4 h-4" /> Filters</button> */}
                    <Filter columns={reducedClassColumns} />
                </div>
                <div className="flex gap-2">        
                    <button className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md px-2 py-1 hover:bg-blue-600 hover:text-white transition-colors duration-200 cursor-pointer"> <UploadIcon className="w-4 h-4" /> Import</button>
                    <button className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md px-2 py-1 hover:bg-blue-600 hover:text-white transition-colors duration-200 cursor-pointer"> <DownloadIcon className="w-4 h-4" /> Export</button>
                    <button className="flex items-center gap-2 text-sm text-white bg-blue-600 font-medium px-2 py-1 rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer"> <PlusIcon className="w-4 h-4" /> Add Class</button>
                </div>
            </div>
            <DataTable 
                data={classes as ReducedClass[]} 
                columns={reducedClassColumns as ColumnDef<ReducedClass>[]}
                pageCount={Math.ceil(totalCount / pageSize)}
                currentPage={parseInt(page) || 1}
            />
        </div>
    )
}