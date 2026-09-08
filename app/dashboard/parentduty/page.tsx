import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { dutyStatusLabel } from "@/lib/utils";
import { fetchFamilyDutyAssignments } from "@/server/duty/data";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
});

/** `YYYY-MM-DD` as e.g. `Sep 7, 2025`; parsed as UTC so the day can't shift. */
function formatDutyDate(dutydate: string) {
    const parsed = new Date(`${dutydate}T00:00:00Z`);
    return Number.isNaN(parsed.getTime()) ? dutydate : dateFormatter.format(parsed);
}

export default async function ParentDuty() {
    const rows = await fetchFamilyDutyAssignments();

    return (
        <div className="p-4">
            <h1 className="mb-4 text-2xl font-bold">Parent Duty (家长值日)</h1>

            <div className="custom-scrollbar overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Semester</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Duty Date</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-muted-foreground text-center"
                                >
                                    No duty assignments yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row) => (
                                <TableRow key={row.dutyassignid}>
                                    <TableCell>{row.seasonname}</TableCell>
                                    <TableCell>{row.studentname}</TableCell>
                                    <TableCell>{formatDutyDate(row.dutydate)}</TableCell>
                                    <TableCell>{dutyStatusLabel(row.dutystatus)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
