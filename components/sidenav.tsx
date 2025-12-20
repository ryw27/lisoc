'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowLeftToLine, ArrowRightToLine } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { signOut } from 'next-auth/react';

interface SideNavProps {
    items: {
		header: string;
		items: {
			label: string;
			href: string[];
			icon: React.ReactNode;
		}[];
    }[],
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
        <aside className={cn(
            "bg-brand-navy h-full shadow-2xl transition-all duration-500 ease-in-out relative flex flex-col z-50",
            navCollapsed ? "w-20" : "w-64"
        )}>
            {/* Heritage Border */}
            <div className="pointer-events-none absolute inset-2 z-10 border border-brand-gold/70 rounded-xl transition-all duration-500" />

            <div className="relative z-20 h-full flex flex-col overflow-hidden">
                {/* Brand Section */}
                <div className="pt-8 pb-6 px-6 h-24">
                    <div className={cn("flex items-center", navCollapsed ? "justify-center" : "justify-between")}>
                        <div className={cn(
                            "flex items-center gap-3 overflow-hidden transition-all duration-500",
                            navCollapsed ? "opacity-0 w-0 -translate-x-5" : "opacity-100 w-auto translate-x-0"
                        )}>
                            <Image src="/lisoc.png" alt="Logo" width={32} height={32} className="brightness-110 shrink-0" />
                            <span className="text-lg font-bold text-brand-gold tracking-tight whitespace-nowrap font-heritage">
                                长岛中文学校
                            </span>
                        </div>
                        <button
                            onClick={() => setNavCollapsed(!navCollapsed)}
                            className="text-brand-gold/60 hover:text-brand-gold transition-colors p-1 shrink-0"
                        >
                            {navCollapsed ? <ArrowRightToLine size={22}/> : <ArrowLeftToLine size={18}/>}
                        </button>
                    </div>
            </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-4 py-2 space-y-8 overflow-y-auto no-scrollbar font-heritage">
                    {items.map((group, idx) => (
                        <div key={idx} className="space-y-2">
                            <p className={cn(
                                "px-4 text-[11px] font-black text-brand-brass uppercase tracking-[0.25em] transition-all duration-500 overflow-hidden",
                                navCollapsed ? "opacity-0 h-0" : "opacity-80 h-auto"
                            )}>
                                {group.header}
                            </p>
                                <div className="space-y-1">
                                {group.items.map((item: any, itemIdx: number) => {
                                    const isActive = item.href.includes(pathname);
                                    const isLogout = item.label === "Logout";
                                    
                                    const iconElement = React.isValidElement(item.icon) 
                                        ? React.cloneElement(item.icon as React.ReactElement<any>, { size: 20 }) : null;

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
                                            <div className={cn("shrink-0 transition-all duration-300", isActive ? "" : "text-brand-gold group-hover:scale-110")}>
                                                {iconElement}
                                            </div>
                                            <span className={cn(
                                                "text-[15px] tracking-wide whitespace-nowrap transition-all duration-500 overflow-hidden",
                                                navCollapsed ? "opacity-0 w-0 -translate-x-3" : "opacity-100 w-auto translate-x-0"
                                            )}>
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
