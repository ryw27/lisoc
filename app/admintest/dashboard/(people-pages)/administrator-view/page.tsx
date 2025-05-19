import { getAdmins, adminColumns, Admin, deleteAdmins } from '@/app/admintest/dashboard/(people-pages)/administrator-view/admin-helpers'
import DataTable from "@/app/admintest/components/data-table";
import { PlusIcon } from "lucide-react";
import Link from 'next/link';
import HorizontalNav from '@/components/horizontal-nav';
import { FilterableColumn } from '@/app/admintest/components/columns/column-types';

//--------------------------------
//-- Types and Helpers 
//--------------------------------

type SearchParams = {
    page?: string;
    pageSizes?: string;
    query?: string;
    [key: string]: string | undefined; // Allow for additional query parameters
}

function handleFilterQuery(query: string) {
    return Object.entries(query)
        .filter(([key]) => key !== 'page' && key !== 'pageSizes')
        .map(([key, val]) => `${key}=${val}`)
        .join('&') || '';
}


//--------------------------------
//-- Page Component for administrators
//--------------------------------

export default async function AdministratorsPage({ 
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

    // Build query
    const query = handleFilterQuery(params.query || '');

    // Fetch only the data needed for the current page
    const { administrators, totalCount } = await getAdmins(
        validPage,
        validPageSize,
        query
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">View Administrators</h1>
                <Link 
                    href="/admintest/dashboard/add-administrator" 
                    className="flex items-center gap-2 mr-4 text-sm text-white bg-blue-600 font-medium px-3 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
                >
                    <PlusIcon className="w-4 h-4" /> Add Administrator
                </Link>
            </div>
            <HorizontalNav
                tabs={[
                { label: 'Teachers', href: '/admintest/dashboard/teacher-view' },
                { label: 'Students', href: '/admintest/dashboard/student-view' },
                { label: 'Families', href: '/admintest/dashboard/family-view' },
                { label: 'Administrators', href: '/admintest/dashboard/administrator-view' },
                ]}
                activeHref={`/admintest/dashboard/administrator-view`}
            />
            <div className="flex items-center px-4 py-2 gap-1">
                <p className="text-lg font-bold">All administrators </p>
                <span className="text-sm text-gray-500">({totalCount})</span>
            </div>
            
            <DataTable 
                data={administrators as Admin[]} 
                columns={adminColumns as FilterableColumn<Admin>[]}
                totalCount={totalCount}
                tableName="Administrators"
                primaryKey="userid"
                deleteAction={deleteAdmins}
            />
        </div>
    )
}