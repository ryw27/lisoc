import DataDashboard from "@/components/data-view/data-table/data-dashboard";
import { type SearchParams } from "@/lib/data-view/types";
import { parseParams } from "@/lib/data-view/";
import { pageRows } from "@/lib/data-view/actions/pageRows";
import HorizontalNav from "@/components/horizontal-nav";
import { ADMIN_DATAVIEW_LINK } from "@/lib/utils";
import { StudentObject } from "@/lib/data-view/entity-configs/(people)/student";

export default async function StudentsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	const { page, pageSize, sortBy, sortOrder, match, query } = await parseParams(
		searchParams
	);

	const response = await pageRows("student", {
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
		{ label: "Administrators", href: `${ADMIN_DATAVIEW_LINK}/adminuser` },
		{ label: "Families", href: `${ADMIN_DATAVIEW_LINK}/family` },
		{ label: "Students", href: `${ADMIN_DATAVIEW_LINK}/student` },
		{ label: "Teachers", href: `${ADMIN_DATAVIEW_LINK}/teacher` },
	];

	return (
		<div className="flex flex-col gap-4">
			<HorizontalNav tabs={navTabs} />
			<DataDashboard data={rows as StudentObject[]} totalCount={totalCount as number} entity="student" />
		</div>
	);
}