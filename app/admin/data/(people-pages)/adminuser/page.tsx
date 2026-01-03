import { InferSelectModel } from "drizzle-orm";
import { adminuser } from "@/lib/db/schema";
import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";
import { type SearchParams } from "@/types/dataview.types";
import { pageRows } from "@/server/data-view/actions/pageRows";
import { parseParams } from "@/server/data-view/actions/parseParams";
import { type AdminUserJoined } from "@/server/data-view/entity-configs/(people)/adminuser";
import { UserObject } from "@/server/data-view/entity-configs/(people)/users";
import DataDashboard from "@/components/data-view/data-table/data-dashboard";
import HorizontalNav from "@/components/horizontal-nav";

export default async function AdministratorsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const { page, pageSize, sortBy, sortOrder, match, query } = await parseParams(searchParams);

    const response = await pageRows("adminuser", {
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

    type JoinedRow = { users: UserObject; adminuser: InferSelectModel<typeof adminuser> };
    const flattenedRows = Array.isArray(rows)
        ? (rows as JoinedRow[]).map((row) => ({
              ...(row.adminuser ?? {}),
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
                data={flattenedRows as AdminUserJoined[]}
                totalCount={totalCount as number}
                entity="adminuser"
            />
        </div>
    );
}
