import { studentColumns, studentObject } from './student-helpers'
import DataDashboard from "@/components/data-view/data-dashboard"
import { deleteStudentRows, pageStudentRows } from './student-helpers'
import { type SearchParams } from '@/lib/data-view/types'
import { parseParams } from '@/lib/data-view/'

//--------------------------------
//-- Page Component for students
//--------------------------------

export default async function StudentsPage({ 
    searchParams 
}: { 
    searchParams: Promise<SearchParams> 
}) {

    // Parse all parameters using the utility function
    const { page, pageSize, sortBy, sortOrder, match, query } = await parseParams(searchParams);

    // Fetch only the data needed for the current page
    const { rows, totalCount } = await pageStudentRows({
        page,
        pageSize,
        match,
        sortBy,
        sortOrder,
        query
    });

    return (
        <DataDashboard
            data={rows as studentObject[]}
            columns={studentColumns}
            totalCount={totalCount}
            tableName="student"
            addLink="/admintest/dashboard/data/students/add-student"
            addText="Add Student"
            deleteAction={deleteStudentRows}
            primaryKey="studentid"
            navTabs={[
                { label: 'Administrators', href: '/admintest/dashboard/data/administrators' },
                { label: 'Families', href: '/admintest/dashboard/data/families' },
                { label: 'Students', href: '/admintest/dashboard/data/students' },
                { label: 'Teachers', href: '/admintest/dashboard/data/teachers' },
            ]}
        />
    )
}