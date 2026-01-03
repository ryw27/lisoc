"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, UserCircle } from "lucide-react";
import { type DefaultSession } from "next-auth";
import { validate as isUUID } from "uuid";
import { BREADCRUMB_LABELS, cn } from "@/lib/utils";
import LanguageToggle from "./language-toggle";

export function useBreadCrumbs(): string[] {
    const pathname = usePathname();
    // Get all segments and filter out empty parts
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 1 && (segments[0] === "admin" || segments[0] === "teacher")) {
        return ["Home"];
    }

    let filteredSegments = segments;
    if (segments[0] === "admin" || segments[0] === "teacher") {
        filteredSegments = segments.slice(1);
    }

    return filteredSegments.map((segment) => {
        if (!isNaN(Number(segment)) || isUUID(segment)) {
            return "Details";
        }

        return BREADCRUMB_LABELS[segment] || segment;
    });
}

export default function Header({ user }: { user: DefaultSession["user"] }) {
    const breadcrumbs = useBreadCrumbs();
    return (
        <header className="border-brand-brass/10 bg-background/95 font-heritage z-40 flex h-16 w-full shrink-0 items-center justify-between border-b px-8 backdrop-blur-sm">
            {/* Breadcrumbs */}
            <div className="text-muted-foreground/60 flex items-center gap-2 text-[12px] font-bold tracking-[0.12em]">
                {breadcrumbs.map((crumb: string, idx: number) => (
                    <React.Fragment key={idx}>
                        <span
                            className={cn(
                                "uppercase",
                                idx === breadcrumbs.length - 1 && "text-brand-navy"
                            )}
                        >
                            {crumb}
                        </span>
                        {idx < breadcrumbs.length - 1 && (
                            <ChevronRight size={12} className="opacity-40" />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
                <LanguageToggle />

                <div className="bg-brand-brass/20 mx-2 h-4 w-px" />

                <div className="group flex cursor-pointer items-center gap-3 pl-2">
                    <div className="hidden text-right sm:block">
                        <p className="text-brand-navy mb-0.5 text-[11px] leading-tight font-black tracking-tight">
                            ADMIN PORTAL
                        </p>
                        <p className="text-brand-brass text-[10px] leading-tight font-bold uppercase italic">
                            {user?.name ?? "Registrar"}
                        </p>
                    </div>
                    <div className="bg-brand-navy text-brand-gold ring-brand-gold/20 group-hover:ring-brand-gold flex h-10 w-10 items-center justify-center rounded-full ring-2 transition-all duration-300">
                        <UserCircle size={26} />
                    </div>
                </div>
            </div>
        </header>
    );
}
