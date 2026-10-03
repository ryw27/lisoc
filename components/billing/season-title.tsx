"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type BillingSeasonInfo = {
    seasonid: number;
    seasonnamecn: string;
    seasonnameeng: string;
    earlyregdate: string;
    enddate: string;
};

type SeasonTitleProps = {
    title: string;
    seasons: BillingSeasonInfo[];
    selectedSeason: BillingSeasonInfo;
    pending?: boolean;
    onSelect: (season: BillingSeasonInfo) => void;
};

export default function SeasonTitle({
    title,
    seasons,
    selectedSeason,
    pending = false,
    onSelect,
}: SeasonTitleProps) {
    return (
        <div className="flex items-baseline gap-4">
            <h1 className="text-primary text-3xl font-bold tracking-tight uppercase md:text-4xl">
                {title}
            </h1>
            <span className="text-muted-foreground/40 hidden text-3xl font-light italic md:inline">
                /
            </span>
            <div className="group relative">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild disabled={pending}>
                        <button
                            className={cn(
                                "flex items-center gap-2 text-3xl font-normal tracking-tight transition-all outline-none md:text-3xl",
                                // Color logic: Primary when active, muted when pending
                                pending
                                    ? "text-muted-foreground cursor-wait"
                                    : "text-secondary hover:opacity-80"
                            )}
                        >
                            {selectedSeason.seasonnameeng}

                            {/* Swap Chevron for Spinner */}
                            {pending ? (
                                <Loader2 size={24} className="mt-1 animate-spin opacity-50" />
                            ) : (
                                <ChevronDown size={24} className="mt-1 stroke-[3] opacity-50" />
                            )}
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="start"
                        className="bg-background max-h-[300px] w-[200px] overflow-y-auto"
                    >
                        {seasons.map((season) => (
                            <DropdownMenuItem
                                key={season.seasonid}
                                onClick={() => onSelect(season)}
                                className="cursor-pointer text-lg"
                            >
                                {season.seasonnamecn}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
