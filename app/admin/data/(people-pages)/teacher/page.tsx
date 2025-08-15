import DataDashboard from "@/components/data-view/data-table/data-dashboard";
import { type SearchParams } from "@/lib/data-view/types";
import { parseParams } from "@/lib/data-view/";
import { pageRows } from "@/lib/data-view/actions/pageRows";
import HorizontalNav from "@/components/horizontal-nav";
import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";
import { UserObject } from "@/lib/data-view/entity-configs/(people)/users";
import { InferSelectModel } from "drizzle-orm";
import { teacher } from "@/lib/db/schema";
import { TeacherJoined } from "@/lib/data-view/entity-configs/(people)/teacher";

export default async function TeachersPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	const { page, pageSize, sortBy, sortOrder, match, query } = await parseParams(
		searchParams
	);

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
			<DataDashboard data={flattenedRows as TeacherJoined[]} totalCount={totalCount as number} entity="teacher" />
		</div>
	);
}