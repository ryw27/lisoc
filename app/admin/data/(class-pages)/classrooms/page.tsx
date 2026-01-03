import { InferSelectModel } from "drizzle-orm";
import { classrooms } from "@/lib/db/schema";
import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";
import { type SearchParams } from "@/types/dataview.types";
import { pageRows } from "@/server/data-view/actions/pageRows";
import { parseParams } from "@/server/data-view/actions/parseParams";
import DataDashboard from "@/components/data-view/data-table/data-dashboard";
import HorizontalNav from "@/components/horizontal-nav";

export default async function ClassesPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    // Parse all parameters using the utility function
    const { page, pageSize, sortBy, sortOrder, match, query } = await parseParams(searchParams);
    // Fetch only the data needed for the current page
    const response = await pageRows("classrooms", {
        page,
        pageSize,
        match,
        sortBy,
        sortOrder,
        query,
    });
    if (!response.ok) {
        return <div>Error: {response.message}</div>;
    }

    const { rows, totalCount } = response;

    const navTabs = [
        { label: "Classes", href: `${ADMIN_DATAVIEW_LINK}/classes` },
        { label: "Classrooms", href: `${ADMIN_DATAVIEW_LINK}/classrooms` },
    ];

    return (
        <div className="flex flex-col gap-4">
            <HorizontalNav tabs={navTabs} />
            <DataDashboard
                data={rows as InferSelectModel<typeof classrooms>[]}
                totalCount={totalCount as number}
                entity="Classrooms"
            />
        </div>
    );
}
