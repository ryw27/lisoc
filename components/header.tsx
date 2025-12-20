'use client';
import React from "react";
import LanguageToggle from "./language-toggle";
import { ChevronRight, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { type DefaultSession } from "next-auth"



export default function Header({ breadcrumbs = ["Management", "Semester"], user }: { breadcrumbs: string[], user: DefaultSession["user"] }) {
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