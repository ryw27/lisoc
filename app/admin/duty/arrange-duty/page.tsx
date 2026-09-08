import ArrangeDutyView from "@/components/duty/arrange-duty-view";
import DutySeasonFilter from "@/components/duty/duty-season-filter";
import { type DutyTerm } from "@/types/duty.types";
import { fetchDutyDates, fetchDutyRoster, fetchSeasonFilterOptions } from "@/server/duty/data";

export default async function ArrangeDutyPage({
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

    const [{ seasonname, assignedcount, rows }, dutydates] = await Promise.all([
        fetchDutyRoster(seasonid),
        fetchDutyDates(selectedYear),
    ]);

    return (
        <div className="p-4">
            <h1 className="mb-4 text-2xl font-bold">Arrange Duty (安排值日)</h1>

            <DutySeasonFilter
                years={years}
                selectedYear={selectedYear}
                selectedTerm={selectedTerm}
            />

            <p className="text-muted-foreground mb-4 text-sm">
                {seasonname
                    ? `${seasonname} — ${rows.length} registration${
                          rows.length === 1 ? "" : "s"
                      } available · ${assignedcount} assigned`
                    : "No semester found for this selection"}
            </p>

            <ArrangeDutyView
                key={`view-${seasonid ?? "none"}`}
                seasonid={seasonid}
                dutydates={dutydates}
                rows={rows}
            />
        </div>
    );
}
