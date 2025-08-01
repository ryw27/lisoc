import { teacherColumns, teacherObject } from './teacher-helpers'
import DataDashboard from "@/components/data-view/data-dashboard"
import { deleteTeacherRows, pageTeacherRows } from './teacher-helpers'
import { type SearchParams } from '@/lib/data-view/types'
import { parseParams } from '@/lib/data-view/'

//--------------------------------
//-- Page Component for teachers
//--------------------------------

export default async function TeachersPage({ 
    searchParams 
}: { 
    searchParams: Promise<SearchParams> 
}) {

    // Parse all parameters using the utility function
    const { page, pageSize, sortBy, sortOrder, match, query } = await parseParams(searchParams);

    // Fetch only the data needed for the current page
    const { rows, totalCount } = await pageTeacherRows({
        page,
        pageSize,
        match,
        sortBy,
        sortOrder,
        query
    });

    return (
        <DataDashboard
            data={rows as teacherObject[]}
            columns={teacherColumns}
            totalCount={totalCount}
            tableName="teacher"
            addLink="/admintest/dashboard/data/teachers/add-teacher"
            addText="Add Teacher"
            deleteAction={deleteTeacherRows}
            primaryKey="teacherid"
            navTabs={[
                { label: 'Administrators', href: '/admintest/dashboard/data/administrators' },
                { label: 'Families', href: '/admintest/dashboard/data/families' },
                { label: 'Students', href: '/admintest/dashboard/data/students' },
                { label: 'Teachers', href: '/admintest/dashboard/data/teachers' },
            ]}
        />
    )
}