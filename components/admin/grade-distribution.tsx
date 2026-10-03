"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type GradeOverview, type GradeStudent } from "@/server/registration/grade-overview";
import { getGradeOverviewAction } from "@/server/registration/actions/gradeOverview";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type GradeDistributionProps = {
    counts: { grade: number; count: number }[]; // lowest grade first
    gradeLabels: Record<number, string>;
};

// Last grade clicked, remembered per browser
const STORAGE_KEY = "lisoc.admin.home.grade";

function readStoredGrade(): number | null {
    try {
        const v = window.localStorage.getItem(STORAGE_KEY);
        return v === null ? null : Number(v);
    } catch {
        return null;
    }
}

function storeGrade(grade: number) {
    try {
        window.localStorage.setItem(STORAGE_KEY, String(grade));
    } catch {
        // storage unavailable (private mode); selection just isn't remembered
    }
}

const DROPPED_TAB = -1;

export default function GradeDistribution({ counts, gradeLabels }: GradeDistributionProps) {
    const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
    const [overview, setOverview] = useState<GradeOverview | null>(null);
    const [tab, setTab] = useState<number>(0); // arrangeid, or DROPPED_TAB
    const [error, setError] = useState<string | null>(null);
    const [pending, start] = useTransition();

    const maxCount = Math.max(1, ...counts.map((c) => c.count));

    const loadGrade = (grade: number) => {
        setSelectedGrade(grade);
        setError(null);
        start(async () => {
            try {
                const data = await getGradeOverviewAction(grade);
                setOverview(data);
                // Open the first class that has students
                const first = data.classes.find((c) => c.students.length > 0);
                setTab(first ? first.arrangeid : DROPPED_TAB);
            } catch {
                setOverview(null);
                setError("Failed to load classes for this grade.");
            }
        });
    };

    // On mount: last clicked grade from this browser, else the lowest grade
    useEffect(() => {
        const stored = readStoredGrade();
        const initial = counts.some((c) => c.grade === stored) ? stored! : counts[0]?.grade;
        if (initial !== undefined) loadGrade(initial);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectGrade = (grade: number) => {
        if (grade === selectedGrade) return;
        storeGrade(grade);
        loadGrade(grade);
    };

    const shownOverview = overview?.grade === selectedGrade ? overview : null;
    // Classes with no enrolled students get no tab
    const visibleClasses = shownOverview?.classes.filter((c) => c.students.length > 0) ?? [];
    const activeClass = visibleClasses.find((c) => c.arrangeid === tab);
    const tabStudents =
        tab === DROPPED_TAB ? (shownOverview?.dropped ?? []) : (activeClass?.students ?? []);

    return (
        <div className="space-y-4">
            {/* Horizontal bars, lowest grade on top */}
            <div className="border-border bg-card space-y-0.5 border p-4 shadow-sm">
                {counts.map((item) => {
                    const isSelected = item.grade === selectedGrade;
                    return (
                        <button
                            key={item.grade}
                            type="button"
                            onClick={() => selectGrade(item.grade)}
                            aria-pressed={isSelected}
                            title={`${gradeLabels[item.grade]}: ${item.count} students`}
                            className={cn(
                                "grid w-full cursor-pointer grid-cols-[4.5rem_1fr] items-center gap-3 rounded-sm px-1 py-0.5 text-left",
                                "hover:bg-muted focus-visible:ring-ring outline-none focus-visible:ring-2",
                                isSelected && "bg-primary/10 hover:bg-primary/10"
                            )}
                        >
                            <span className="truncate text-sm font-bold text-blue-700 underline underline-offset-4 dark:text-blue-400">
                                {gradeLabels[item.grade]}
                            </span>
                            <span className="flex h-5 items-center pr-10">
                                <span
                                    className={cn(
                                        "relative block h-full rounded-r bg-blue-600 dark:bg-blue-500",
                                        item.count > 0 && "min-w-0.5"
                                    )}
                                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                                >
                                    <span className="text-muted-foreground absolute top-1/2 left-full ml-1.5 -translate-y-1/2 font-mono text-xs whitespace-nowrap tabular-nums">
                                        {item.count}
                                    </span>
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Classes of the selected grade */}
            {selectedGrade !== null && (
                <div className="border-border bg-card border shadow-sm">
                    <div className="flex items-center gap-2 px-4 pt-3">
                        <h3 className="text-primary text-sm font-bold tracking-wider uppercase">
                            {gradeLabels[selectedGrade]} Classes
                        </h3>
                        {pending && <Loader2 size={14} className="animate-spin opacity-50" />}
                    </div>

                    {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}

                    {shownOverview &&
                        visibleClasses.length === 0 &&
                        shownOverview.dropped.length === 0 && (
                            <p className="text-muted-foreground px-4 py-3 text-sm">
                                No students enrolled in this grade.
                            </p>
                        )}

                    {shownOverview &&
                        (visibleClasses.length > 0 || shownOverview.dropped.length > 0) && (
                            <div className={cn("transition-opacity", pending && "opacity-50")}>
                                <nav className="border-border flex flex-wrap gap-x-5 border-b px-4">
                                    {visibleClasses.map((c) => (
                                        <TabButton
                                            key={c.arrangeid}
                                            active={tab === c.arrangeid}
                                            onClick={() => setTab(c.arrangeid)}
                                            label={c.classnamecn}
                                            count={c.students.length}
                                        />
                                    ))}
                                    <TabButton
                                        active={tab === DROPPED_TAB}
                                        onClick={() => setTab(DROPPED_TAB)}
                                        label="Dropped"
                                        count={shownOverview.dropped.length}
                                    />
                                </nav>

                                {activeClass && (
                                    <div className="text-muted-foreground grid grid-cols-3 gap-2 px-4 py-2 text-sm">
                                        <span>Teacher: {activeClass.teacher || "N/A"}</span>
                                        <span>Room: {activeClass.roomno || "N/A"}</span>
                                        <span>Seat Limit: {activeClass.seatlimit ?? "N/A"}</span>
                                    </div>
                                )}

                                <StudentList
                                    students={tabStudents}
                                    showClass={tab === DROPPED_TAB}
                                />
                            </div>
                        )}
                </div>
            )}
        </div>
    );
}

function TabButton({
    active,
    onClick,
    label,
    count,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    count: number;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "-mb-px cursor-pointer border-b-2 border-transparent px-1 py-2.5 text-sm transition-colors",
                active
                    ? "border-blue-500 text-blue-600"
                    : "text-muted-foreground hover:text-foreground"
            )}
        >
            {label} <span className="text-xs tabular-nums">({count})</span>
        </button>
    );
}

function StudentList({
    students,
    showClass,
}: {
    students: (GradeStudent & { classnamecn?: string })[];
    showClass: boolean;
}) {
    if (students.length === 0) {
        return <p className="text-muted-foreground px-4 py-4 text-sm">No students</p>;
    }
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>English Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Family ID</TableHead>
                    {showClass && <TableHead>Class</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Notes</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {students.map((s) => (
                    <TableRow key={s.regid}>
                        <TableCell className="font-mono">{s.studentid}</TableCell>
                        <TableCell>{s.namecn}</TableCell>
                        <TableCell>
                            {[s.namefirsten, s.namelasten].filter(Boolean).join(" ")}
                        </TableCell>
                        <TableCell>{s.gender}</TableCell>
                        <TableCell className="font-mono">
                            <Link
                                href={`/admin/other/find-family?familyid=${s.familyid}`}
                                className="font-bold text-blue-700 underline underline-offset-4 dark:text-blue-400"
                            >
                                {s.familyid}
                            </Link>
                        </TableCell>
                        {showClass && <TableCell>{s.classnamecn}</TableCell>}
                        <TableCell>{s.status}</TableCell>
                        <TableCell>{s.registerdate.slice(0, 10)}</TableCell>
                        <TableCell className="max-w-xs truncate" title={s.notes ?? ""}>
                            {s.notes}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
