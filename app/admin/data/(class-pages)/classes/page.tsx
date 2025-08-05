import { classColumns, classObject } from './class-helpers'
import DataDashboard from "@/components/data-view/data-dashboard"
import { deleteClassRows, pageClassRows } from './class-helpers'
import { type SearchParams } from '@/lib/data-view/types'
import { parseParams } from '@/lib/data-view/'

//--------------------------------
//-- Page Component for classes
//--------------------------------

export default async function ClassesPage({ 
    searchParams 
}: { 
    searchParams: Promise<SearchParams> 
}) {

    // Parse all parameters using the utility function
    const { page, pageSize, sortBy, sortOrder, match, query } = await parseParams(searchParams);

    // Fetch only the data needed for the current page
    const { rows, totalCount } = await pageClassRows({
        page,
        pageSize,
        match,
        sortBy,
        sortOrder,
        query
    });

    return (
        <DataDashboard
            data={rows as classObject[]}
            columns={classColumns}
            totalCount={totalCount}
            tableName="classes"
            addLink="/admin/dashboard/data/classes/add"
            addText="Add Class"
            deleteAction={deleteClassRows}
            primaryKey="classid"
            navTabs={[
                { label: 'Classes', href: '/admin/dashboard/classes' },
                { label: 'Classrooms', href: '/admin/dashboard/classrooms' },
            ]}
        />
    )
}