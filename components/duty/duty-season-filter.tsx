"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { type DutyTerm, type SeasonYearOption } from "@/types/duty.types";

interface DutySeasonFilterProps {
    years: SeasonYearOption[];
    selectedYear: number | null;
    selectedTerm: DutyTerm;
}

export default function DutySeasonFilter({
    years,
    selectedYear,
    selectedTerm,
}: DutySeasonFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const push = (key: string, value: string) => {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.set(key, value);
        router.replace(`?${params.toString()}`);
    };

    const currentYear = years.find((y) => y.beginseasonid === selectedYear);

    return (
        <div className="mb-4 flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
                <label className="text-muted-foreground text-xs font-medium">Academic Year</label>
                <Select
                    value={selectedYear ? String(selectedYear) : undefined}
                    onValueChange={(value) => push("year", value)}
                >
                    <SelectTrigger className="w-56">
                        <SelectValue placeholder="Select a year" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((year) => (
                            <SelectItem key={year.beginseasonid} value={String(year.beginseasonid)}>
                                {year.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-muted-foreground text-xs font-medium">Semester</label>
                <Select value={selectedTerm} onValueChange={(value) => push("term", value)}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select a semester" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fall" disabled={!currentYear?.fallseasonid}>
                            Fall
                        </SelectItem>
                        <SelectItem value="spring" disabled={!currentYear?.springseasonid}>
                            Spring
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
