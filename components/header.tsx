'use client';
import React from "react";
import LanguageToggle from "./language-toggle";
import { ChevronRight, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { type DefaultSession } from "next-auth"
import { usePathname } from "next/navigation";
import { BREADCRUMB_LABELS } from "@/lib/breadcrumps-map";
import { validate as isUUID } from "uuid";

export function useBreadCrumbs(): string[] {
    const pathname = usePathname();
    // Get all segments and filter out empty parts
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 1 && (segments[0] === "admin" || segments[0] === "teacher")) {
        return ["Home"]
    }

    let filteredSegments = segments
    if (segments[0] === "admin" || segments[0] === "teacher") {
        filteredSegments = segments.slice(1,);
    }

    return filteredSegments 
        .map((segment) => {
            if (!isNaN(Number(segment)) || isUUID(segment)) {
                return "Details"
            }

            return BREADCRUMB_LABELS[segment] || segment;
        })

}


export default function Header({ user }: { user: DefaultSession["user"] }) {
    const breadcrumbs = useBreadCrumbs()
    return (
        <header className="h-16 w-full border-b border-brand-brass/10 bg-background/95 backdrop-blur-sm flex items-center justify-between px-8 z-40 shrink-0 font-heritage">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[12px] font-bold tracking-[0.12em] text-muted-foreground/60">
                {breadcrumbs.map((crumb: string, idx: number) => (
                    <React.Fragment key={idx}>
                        <span className={cn("uppercase", idx === breadcrumbs.length - 1 && "text-brand-navy")}>
                            {crumb}
                        </span>
                        {idx < breadcrumbs.length - 1 && <ChevronRight size={12} className="opacity-40" />}
                    </React.Fragment>
                ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
                        <LanguageToggle /> 

                <div className="h-4 w-px bg-brand-brass/20 mx-2" />

                <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                    <div className="text-right hidden sm:block">
                        <p className="text-[11px] font-black text-brand-navy leading-tight mb-0.5 tracking-tight">
                            ADMIN PORTAL
                        </p>
                        <p className="text-[10px] text-brand-brass font-bold uppercase leading-tight italic">
                            {user?.name ?? "Registrar"}
                                        </p>
                                    </div>
                    <div className="w-10 h-10 rounded-full bg-brand-navy flex items-center justify-center text-brand-gold ring-2 ring-brand-gold/20 group-hover:ring-brand-gold transition-all duration-300">
                        <UserCircle size={26} />
                    </div>
                </div>
            </div>
        </header>
    );
}