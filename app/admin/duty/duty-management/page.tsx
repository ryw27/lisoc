import ArrangeDutyView from "@/components/duty/arrange-duty-view";
import DutyManagementTable from "@/components/duty/duty-management-table";
import DutySeasonFilter from "@/components/duty/duty-season-filter";
import DutyTabs, { type DutyTab } from "@/components/duty/duty-tabs";
import { type DutyTerm } from "@/types/duty.types";
import {
    fetchDutyAssignments,
    fetchDutyDates,
    fetchDutyRoster,
    fetchSeasonFilterOptions,
} from "@/server/duty/data";

export default async function DutyManagementPage({
    searchParams,
}: {
    searchParams: Promise<{ year?: string; term?: string; tab?: string }>;
}) {
    const { year, term, tab } = await searchParams;
    const { years, currentBeginSeasonId } = await fetchSeasonFilterOptions();

    // Default to the academic year holding the active season (newest otherwise) and Fall.
    const requestedYear = Number(year);
    const selectedYear =
        years.find((y) => y.beginseasonid === requestedYear)?.beginseasonid ??
        years.find((y) => y.beginseasonid === currentBeginSeasonId)?.beginseasonid ??
        years[0]?.beginseasonid ??
        null;
    const selectedTerm: DutyTerm = term === "spring" ? "spring" : "fall";
    const activeTab: DutyTab = tab === "management" ? "management" : "assign";

    const yearOption = years.find((y) => y.beginseasonid === selectedYear);
    const seasonid =
        (selectedTerm === "spring" ? yearOption?.springseasonid : yearOption?.fallseasonid) ?? null;

    const [roster, dutydates, assignments] = await Promise.all([
        fetchDutyRoster(seasonid),
        fetchDutyDates(selectedYear),
        fetchDutyAssignments(seasonid),
    ]);

    return (
        <div className="p-4">
            <h1 className="mb-4 text-2xl font-bold">Duty Management (值日管理)</h1>

            <DutySeasonFilter
                years={years}
                selectedYear={selectedYear}
                selectedTerm={selectedTerm}
            />

            <DutyTabs
                activeTab={activeTab}
                assign={
                    <>
                        <p className="text-muted-foreground mb-4 text-sm">
                            {roster.seasonname
                                ? `${roster.seasonname} — ${roster.rows.length} registration${
                                      roster.rows.length === 1 ? "" : "s"
                                  } available · ${roster.assignedcount} assigned`
                                : "No semester found for this selection"}
                        </p>
                        <ArrangeDutyView
                            key={`view-${seasonid ?? "none"}`}
                            seasonid={seasonid}
                            dutydates={dutydates}
                            rows={roster.rows}
                        />
                    </>
                }
                management={
                    <>
                        <p className="text-muted-foreground mb-4 text-sm">
                            {assignments.seasonname
                                ? `${assignments.seasonname} — ${assignments.rows.length} duty assignment${
                                      assignments.rows.length === 1 ? "" : "s"
                                  }`
                                : "No semester found for this selection"}
                        </p>
                        <DutyManagementTable
                            key={`table-${seasonid ?? "none"}`}
                            rows={assignments.rows}
                        />
                    </>
                }
            />
        </div>
    );
}
