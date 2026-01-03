import { InferSelectModel } from "drizzle-orm";
import { teacher } from "@/lib/db/schema";
import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";
import { type SearchParams } from "@/types/dataview.types";
import { pageRows } from "@/server/data-view/actions/pageRows";
import { parseParams } from "@/server/data-view/actions/parseParams";
import { TeacherJoined } from "@/server/data-view/entity-configs/(people)/teacher";
import { UserObject } from "@/server/data-view/entity-configs/(people)/users";
import DataDashboard from "@/components/data-view/data-table/data-dashboard";
import HorizontalNav from "@/components/horizontal-nav";

export default async function TeachersPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const { page, pageSize, sortBy, sortOrder, match, query } = await parseParams(searchParams);

    const response = await pageRows("teacher", {
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

    type JoinedRow = { users: UserObject; teacher: InferSelectModel<typeof teacher> };
    const flattenedRows = Array.isArray(rows)
        ? (rows as JoinedRow[]).map((row) => ({
              ...(row.teacher ?? {}),
              ...(row.users ?? {}),
          }))
        : [];

    const navTabs = [
        { label: "Administrators", href: `${ADMIN_DATAVIEW_LINK}/adminuser` },
        { label: "Families", href: `${ADMIN_DATAVIEW_LINK}/family` },
        { label: "Students", href: `${ADMIN_DATAVIEW_LINK}/student` },
        { label: "Teachers", href: `${ADMIN_DATAVIEW_LINK}/teacher` },
    ];

    return (
        <div className="flex flex-col gap-4">
            <HorizontalNav tabs={navTabs} />
            <DataDashboard
                data={flattenedRows as TeacherJoined[]}
                totalCount={totalCount as number}
                entity="teacher"
            />
        </div>
    );
}
