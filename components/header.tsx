"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, UserCircle } from "lucide-react";
import { type DefaultSession } from "next-auth";
import { signOut } from "next-auth/react";
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
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu if clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        signOut({
            callbackUrl: "/",
        });
    };
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

            <div className="flex items-center gap-4">
                <LanguageToggle />

                <div className="bg-secondary/20 mx-2 h-4 w-px" />

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="group flex cursor-pointer items-center gap-3 pl-2 outline-none"
                    >
                        <div className="hidden text-right sm:block">
                            <p className="text-primary mb-0.5 text-[11px] leading-tight font-black tracking-tight">
                                ADMIN PORTAL
                            </p>
                            <p className="text-secondary text-[10px] leading-tight font-bold uppercase italic">
                                {user?.name ?? "Registrar"}
                            </p>
                        </div>

                        <div className="relative">
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full ring-2 transition-all duration-300 ${
                                    isOpen
                                        ? "bg-accent text-primary ring-accent"
                                        : "bg-primary text-accent ring-accent/20 group-hover:ring-accent"
                                }`}
                            >
                                <UserCircle size={26} strokeWidth={1.5} />
                            </div>
                        </div>
                    </button>

                    {isOpen && (
                        <div className="absolute top-full right-0 z-50 mt-2 w-56 origin-top-right rounded-none border shadow-sm">
                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="group/logout text-destructive hover:bg-muted focus:bg-muted flex w-full cursor-pointer items-center gap-3 rounded-none px-4 py-3 text-sm font-bold transition-colors hover:text-red-700 focus:outline-none"
                            >
                                <LogOut
                                    size={16}
                                    className="opacity-70 group-hover/logout:opacity-100"
                                />
                                Log Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
