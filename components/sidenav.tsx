"use client";

import { cn } from "@/lib/utils";
import { ArrowLeftToLine, ArrowRightToLine } from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

interface SideNavProps {
    items: {
        header: string;
        items: {
            label: string;
            href: string[];
            icon: React.ReactNode;
            tip: string|undefined;
        }[];
    }[];
}

export default function SideNav({ items }: SideNavProps) {
    const [navCollapsed, setNavCollapsed] = useState(false);
    const pathname = usePathname();

    const handleLogout = () => {
        signOut({
            callbackUrl: "/",
        });
    };

    return (
        <aside
            className={cn(
                "bg-brand-navy relative z-50 flex h-full flex-col shadow-2xl transition-all duration-500 ease-in-out",
                navCollapsed ? "w-20" : "w-72"
            )}
        >
            {/* Heritage Border */}
            <div className="border-brand-gold/70 pointer-events-none absolute inset-2 z-10 rounded-xl border transition-all duration-500" />

            <div className="relative z-20 flex h-full flex-col overflow-hidden">
                {/* Brand Section */}
                <div className="h-24 px-6 pt-8 pb-6">
                    <div
                        className={cn(
                            "flex items-center",
                            navCollapsed ? "justify-center" : "justify-between"
                        )}
                    >
                        <div
                            className={cn(
                                "flex items-center gap-3 overflow-hidden transition-all duration-500",
                                navCollapsed
                                    ? "w-0 -translate-x-5 opacity-0"
                                    : "w-auto translate-x-0 opacity-100"
                            )}
                        >
                            <Image
                                src="/lisoc.png"
                                alt="Logo"
                                width={32}
                                height={32}
                                className="shrink-0 brightness-110"
                            />
                            <span className="text-brand-gold font-heritage text-lg font-bold tracking-tight whitespace-nowrap">
                                长岛中文学校
                            </span>
                        </div>
                        <button
                            onClick={() => setNavCollapsed(!navCollapsed)}
                            className="text-brand-gold/60 hover:text-brand-gold shrink-0 p-1 transition-colors"
                        >
                            {navCollapsed ? (
                                <ArrowRightToLine size={22} />
                            ) : (
                                <ArrowLeftToLine size={18} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="no-scrollbar font-heritage flex-1 space-y-8 overflow-y-auto px-4 py-2">
                    {items.map((group, idx) => (
                        <div key={idx} className="space-y-2">
                            <p
                                className={cn(
                                    "text-brand-brass overflow-hidden px-4 text-[11px] font-black tracking-[0.25em] uppercase transition-all duration-500",
                                    navCollapsed ? "h-0 opacity-0" : "h-auto opacity-80"
                                )}
                            >
                                {group.header}
                            </p>
                            <div className="space-y-1">
                                {group.items.map((item, itemIdx: number) => {
                                    const isActive = item.href.includes(pathname);
                                    const isLogout = item.label.startsWith("Logout");

                                    // Shared Tailwind classes for both Link and Button
                                    const itemClasses = cn(
                                        "group flex items-center px-4 py-3 rounded-lg transition-all duration-300 border-l-2 border-transparent w-full text-left cursor-pointer",
                                        isActive
                                            ? "bg-brand-gold text-brand-navy shadow-lg border-brand-brass font-bold"
                                            : "text-white/70 hover:bg-brand-gold/10 hover:text-brand-gold",
                                        navCollapsed ? "justify-center gap-0" : "gap-3"
                                    );

                                    // Shared Inner Content
                                    const itemContent = (
                                        <>
                                            <div
                                                className={cn(
                                                    "shrink-0 transition-all duration-300",
                                                    isActive
                                                        ? ""
                                                        : "text-brand-gold group-hover:scale-110"
                                                )}
                                            >
                                                {item.icon}
                                            </div>
                                            <span
                                                className={cn(
                                                    "overflow-hidden text-[15px] tracking-wide whitespace-nowrap transition-all duration-500",
                                                    navCollapsed
                                                        ? "w-0 -translate-x-3 opacity-0"
                                                        : "w-auto translate-x-0 opacity-100"
                                                )}
                                            >
                                                {item.label}
                                            </span>
                                        </>
                                    );

                                    return isLogout ? (
                                        <button
                                            key={itemIdx}
                                            onClick={handleLogout}
                                            className={itemClasses}
                                        >
                                            {itemContent}
                                        </button>
                                    ) : (
                                        <Link
                                            key={itemIdx}
                                            href={item.href[0]}
                                            className={itemClasses}
                                            title={item.tip}
                                        >
                                            {itemContent}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
