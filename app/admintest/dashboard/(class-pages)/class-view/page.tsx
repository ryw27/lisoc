import { getClasses, classColumns, Class, deleteClasses } from './class-helpers'
import DataTable from "@/app/admintest/components/data-table";
import { PlusIcon } from "lucide-react";
import Link from 'next/link';
import HorizontalNav from '@/components/horizontal-nav';
import { FilterableColumn } from '@/app/admintest/components/columns/column-types';
import { parseFilter } from '@/app/lib/data-actions';
import { ParsedFilter } from '@/app/lib/data-actions';

//--------------------------------
//-- Types and Helpers 
//--------------------------------

type SearchParams = {
    page: string | undefined;
    pageSizes: string | undefined;
    sortBy: string | undefined;
    sortOrder: 'asc' | 'desc' | undefined
    match: 'any' | 'all' | undefined
    [key: string]: string | undefined; // Allow for additional query parameters
}


//--------------------------------
//-- Page Component for classes
//--------------------------------

export default async function ClassesPage({ 
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

    // Sorting queries
    const sortBy = params.sortBy || undefined
    const sortOrder = params.sortOrder || undefined;

    // Matching query
    const match = params.match || 'all';

    // Build query
    const query: ParsedFilter[] = parseFilter(params);

    // Fetch only the data needed for the current page
    const { classes, totalCount } = await getClasses(
        validPage,
        validPageSize,
        match,
        sortBy,
        sortOrder,
        query
    );


    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">View Classes</h1>
                <Link 
                    href="/admintest/dashboard/class-view/add-class" 
                    className="flex items-center gap-2 mr-4 text-sm text-white bg-blue-600 font-medium px-3 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
                >
                    <PlusIcon className="w-4 h-4" /> Add Class
                </Link>
            </div>
            <HorizontalNav
                tabs={[
                { label: 'Classes', href: '/admintest/dashboard/classes' },
                { label: 'Classrooms', href: '/admintest/dashboard/classrooms' },
                ]}
                activeHref={`/admintest/dashboard/class-view`}
            />
            <div className="flex items-center px-4 py-2 gap-1">
                <p className="text-lg font-bold">All classes </p>
                <span className="text-sm text-gray-500">({totalCount})</span>
            </div>
            
            <DataTable 
                data={classes as Class[]} 
                columns={classColumns as FilterableColumn<Class>[]}
                totalCount={totalCount}
                tableName="Classes"
                primaryKey="classid"
                deleteAction={deleteClasses}
            />
        </div>
    )
}