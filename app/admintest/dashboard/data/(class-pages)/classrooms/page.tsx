import { getClassrooms,classroomColumns, Classroom, deleteClassroomRows } from "./classroom-helpers";
import DataTable from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { DownloadIcon, PlusIcon, UploadIcon, ColumnsIcon } from "lucide-react";
import Filter from "@/components/filter";
import HorizontalNav from "@/components/horizontal-nav";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { FilterableColumn } from "@/app/lib/column-types";
// import AddButton from '@/app/admintest/components/add-button';

//--------------------------------
//-- Types and Helpers 
//--------------------------------

type SearchParams = {
    page?: string;
    pageSizes?: string;
    query?: string;
    [key: string]: string | undefined; // Allow for additional query parameters
}

//--------------------------------
//-- Page Component for classrooms
//--------------------------------

export default async function ClassroomsPage({ 
    searchParams 
}: { 
    searchParams: Promise<SearchParams> 
}) {
    // Await searchParams before using it
    const params = await searchParams;
    
    // Parse and validate search parameters with defaults
    const page = parseInt(params.page || '1');
    const pageSize = parseInt(params.pageSizes || '10');
    
    // Validate parsed values
    const validPage = isNaN(page) || page < 1 ? 1 : page;
    const validPageSize = isNaN(pageSize) || pageSize < 1 ? 10 : pageSize;
    // console.log("valid", validPage, validPageSize);

    // Build query
    const query = Object.entries(params)
        .filter(([key]) => key !== 'page' && key !== 'pageSizes')
        .map(([key, val]) => `${key}=${val}`)
        .join('&') || '';

    // Fetch only the data needed for the current page
    const { classrooms, totalCount } = await getClassrooms(
        validPage,
        validPageSize,
        query
    );


    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Class Management</h1>
            <HorizontalNav
                tabs={[
                { label: 'Classes', href: '/admintest/dashboard/classes' },
                { label: 'Classrooms', href: '/admintest/dashboard/classrooms' },
                ]}
                activeHref={`/admintest/dashboard/classrooms`}
            />

            <div className="flex items-center px-4 py-2 gap-1">
                <p className="text-lg font-bold">All classrooms</p>
                <span className="text-sm text-gray-500">({totalCount})</span>
            </div>
            <div className="flex justify-between items-center gap-2 px-4 py-2">
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md px-2 py-1 hover:bg-blue-600 hover:text-white transition-colors duration-200 cursor-pointer"> <ColumnsIcon className="w-4 h-4" /> Select Columns</button>
                    {/* <button className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md px-2 py-1 hover:bg-blue-600 hover:text-white transition-colors duration-200 cursor-pointer"> <FilterIcon className="w-4 h-4" /> Filters</button> */}
                    <Filter columns={classroomColumns} />
                </div>
                <div className="flex gap-2">        
                    <button className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md px-2 py-1 hover:bg-blue-600 hover:text-white transition-colors duration-200 cursor-pointer"> <UploadIcon className="w-4 h-4" /> Import</button>
                    <button className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-md px-2 py-1 hover:bg-blue-600 hover:text-white transition-colors duration-200 cursor-pointer"> <DownloadIcon className="w-4 h-4" /> Export</button>
                    {/* <button className="flex items-center gap-2 text-sm text-white bg-blue-600 font-medium px-2 py-1 rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer"> <PlusIcon className="w-4 h-4" /> Add Class</button> */}
                </div>
            </div>
            <DataTable 
                data={classrooms as Classroom[]} 
                columns={classroomColumns as FilterableColumn<Classroom>[]}
                totalCount={totalCount}
                tableName="classrooms"
                primaryKey="roomid"
                deleteAction={deleteClassroomRows}
            />
        </div>
    )
}