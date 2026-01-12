"use client";

export function TableSkeleton() {
    return (
        <div className="border-primary/20 bg-background w-full overflow-hidden rounded-xs border">
            {/* 1. Header Simulation 
        Matches the real table's header height and background (muted).
        Border-b-2 creates that thick 'header separation' line.
      */}
            <div className="border-primary/20 bg-muted flex items-center gap-4 border-b-2 px-4 py-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-primary/10 h-3 w-24 animate-pulse rounded-xs" />
                ))}
            </div>

            {/* 2. Body Simulation (The Ledger Lines)
        We render 5 empty rows to mimic the table structure.
        Uses 'divide-y' with a very faint color to look like ruled paper lines.
      */}
            <div className="divide-muted-foreground/20 flex flex-col divide-y">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-4">
                        {/* Data Cells: 
               Sharp corners (rounded-xs or none) to reject the 'soft SaaS' look.
               Color is 'muted' to sit quietly on the 'background' (parchment).
            */}
                        <div className="bg-muted h-4 w-1/6 animate-pulse rounded-xs" />
                        <div className="bg-muted h-4 w-2/6 animate-pulse rounded-xs" />
                        <div className="bg-muted h-4 w-1/6 animate-pulse rounded-xs" />
                        <div className="bg-muted h-4 w-2/6 animate-pulse rounded-xs" />
                    </div>
                ))}
            </div>
        </div>
    );
}
