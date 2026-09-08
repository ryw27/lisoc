import DutyManagementTable from "@/components/duty/duty-management-table";
import DutySeasonFilter from "@/components/duty/duty-season-filter";
import { type DutyTerm } from "@/types/duty.types";
import { fetchDutyAssignments, fetchSeasonFilterOptions } from "@/server/duty/data";

export default async function DutyManagementPage({
    searchParams,
}: {
    searchParams: Promise<{ year?: string; term?: string }>;
}) {
    const { year, term } = await searchParams;
    const { years, currentBeginSeasonId } = await fetchSeasonFilterOptions();

    // Default to the academic year holding the active season (newest otherwise) and Fall.
    const requestedYear = Number(year);
    const selectedYear =
        years.find((y) => y.beginseasonid === requestedYear)?.beginseasonid ??
        years.find((y) => y.beginseasonid === currentBeginSeasonId)?.beginseasonid ??
        years[0]?.beginseasonid ??
        null;
    const selectedTerm: DutyTerm = term === "spring" ? "spring" : "fall";

    const yearOption = years.find((y) => y.beginseasonid === selectedYear);
    const seasonid =
        (selectedTerm === "spring" ? yearOption?.springseasonid : yearOption?.fallseasonid) ?? null;

    const { seasonname, rows } = await fetchDutyAssignments(seasonid);

    return (
        <div className="p-4">
            <h1 className="mb-4 text-2xl font-bold">Duty Management (值日管理)</h1>

            <DutySeasonFilter
                years={years}
                selectedYear={selectedYear}
                selectedTerm={selectedTerm}
            />

            <p className="text-muted-foreground mb-4 text-sm">
                {seasonname
                    ? `${seasonname} — ${rows.length} duty assignment${rows.length === 1 ? "" : "s"}`
                    : "No semester found for this selection"}
            </p>

            <DutyManagementTable key={`table-${seasonid ?? "none"}`} rows={rows} />
        </div>
    );
}
