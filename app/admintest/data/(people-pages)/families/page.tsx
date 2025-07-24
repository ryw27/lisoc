import { familyColumns, familyObject } from './family-helpers'
import DataDashboard from "@/components/data-dashboard"
import { deleteFamilyRows, pageFamilyRows } from './family-helpers'
import { parseParams, type SearchParams } from '@/app/lib/handle-params'

//--------------------------------
//-- Page Component for families
//--------------------------------

export default async function FamiliesPage({ 
    searchParams 
}: { 
    searchParams: Promise<SearchParams> 
}) {

    // Parse all parameters using the utility function
    const { page, pageSize, sortBy, sortOrder, match, query } = await parseParams(searchParams);

    // Fetch only the data needed for the current page
    const { rows, totalCount } = await pageFamilyRows({
        page,
        pageSize,
        match,
        sortBy,
        sortOrder,
        query
    });

    return (
        <DataDashboard
            data={rows as familyObject[]}
            columns={familyColumns}
            totalCount={totalCount}
            tableName="family"
            addLink="/admintest/dashboard/data/families/add-family"
            addText="Add Family"
            deleteAction={deleteFamilyRows}
            primaryKey="familyid"
            navTabs={[
                { label: 'Administrators', href: '/admintest/dashboard/data/administrators' },
                { label: 'Families', href: '/admintest/dashboard/data/families' },
                { label: 'Students', href: '/admintest/dashboard/data/students' },
                { label: 'Teachers', href: '/admintest/dashboard/data/teachers' },
            ]}
        />
    )
}