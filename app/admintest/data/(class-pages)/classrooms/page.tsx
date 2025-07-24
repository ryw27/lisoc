import { classroomColumns, classroomObject } from './classroom-helpers'
import DataDashboard from "@/components/data-dashboard"
import { deleteClassroomRows, pageClassroomRows } from './classroom-helpers'
import { parseParams, type SearchParams } from '@/app/lib/handle-params'

//--------------------------------
//-- Page Component for classrooms
//--------------------------------

export default async function ClassroomsPage({ 
    searchParams 
}: { 
    searchParams: Promise<SearchParams> 
}) {

    // Parse all parameters using the utility function
    const { page, pageSize, sortBy, sortOrder, match, query } = await parseParams(searchParams);

    // Fetch only the data needed for the current page
    const { rows, totalCount } = await pageClassroomRows({
        page,
        pageSize,
        match,
        sortBy,
        sortOrder,
        query
    });

    return (
        <DataDashboard
            data={rows as classroomObject[]}
            columns={classroomColumns}
            totalCount={totalCount}
            tableName="classrooms"
            addLink="/admintest/dashboard/data/classrooms/add"
            addText="Add Classroom"
            deleteAction={deleteClassroomRows}
            primaryKey="roomid"
            navTabs={[
                { label: 'Classes', href: '/admintest/dashboard/data/classes' },
                { label: 'Classrooms', href: '/admintest/dashboard/data/classrooms' },
            ]}
        />
    )
}