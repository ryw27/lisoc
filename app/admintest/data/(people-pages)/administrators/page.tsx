import { administratorColumns, administratorObject } from './admin-helpers'
import DataDashboard from "@/components/data-dashboard"
import { deleteAdministratorRows, pageAdministratorRows } from './admin-helpers'
import { parseParams, type SearchParams } from '@/app/lib/handle-params'

//--------------------------------
//-- Page Component for administrators
//--------------------------------

export default async function AdministratorsPage({ 
    searchParams 
}: { 
    searchParams: Promise<SearchParams> 
}) {

    // Parse all parameters using the utility function
    const { page, pageSize, sortBy, sortOrder, match, query } = await parseParams(searchParams);

    // Fetch only the data needed for the current page
    const { rows, totalCount } = await pageAdministratorRows({
        page,
        pageSize,
        match,
        sortBy,
        sortOrder,
        query
    });

    return (
        <DataDashboard
            data={rows as administratorObject[]}
            columns={administratorColumns}
            totalCount={totalCount}
            tableName="adminuser"
            addLink="/admintest/dashboard/data/administrators/add-administrator"
            addText="Add Administrator"
            deleteAction={deleteAdministratorRows}
            primaryKey="adminid"
            navTabs={[
                { label: 'Administrators', href: '/admintest/dashboard/data/administrators' },
                { label: 'Families', href: '/admintest/dashboard/data/families' },
                { label: 'Students', href: '/admintest/dashboard/data/students' },
                { label: 'Teachers', href: '/admintest/dashboard/data/teachers' },
            ]}
        />
    )
}