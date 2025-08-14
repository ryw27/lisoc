import DataDashboard from "@/components/data-view/data-table/data-dashboard"
import { type SearchParams } from '@/lib/data-view/types'
import { parseParams } from '@/lib/data-view/'
import { pageRows } from '@/lib/data-view/actions/pageRows'
import HorizontalNav from '@/components/horizontal-nav'
import { ADMIN_DATAVIEW_LINK } from '@/lib/utils'
import { ClassObject } from "@/lib/data-view/entity-configs/(classes)/classes"


export default async function ClassesPage({ 
    searchParams 
}: { 
    searchParams: Promise<SearchParams> 
}) {
    // Parse all parameters using the utility function
    const { page, pageSize, sortBy, sortOrder, match, query } = await parseParams(searchParams);
    // Fetch only the data needed for the current page
    const response = await pageRows("classes", {
        page,
        pageSize,
        match,
        sortBy,
        sortOrder,
        query
    });
    if (!response.ok) {
        return <div>Error: {response.message}</div>
    } 

    const { rows, totalCount } = response;

    const navTabs = [
        { label: 'Classes', href: `${ADMIN_DATAVIEW_LINK}/classes` },
        { label: 'Classrooms', href: `${ADMIN_DATAVIEW_LINK}/classrooms` },
    ]

    return (
        <div className="flex flex-col gap-4">
            <HorizontalNav
                tabs={navTabs}
            />
            <DataDashboard
                data={rows as ClassObject[]}
                totalCount={totalCount as number}
                entity="classes"
            />
        </div>
    )
}