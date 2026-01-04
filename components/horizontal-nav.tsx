"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface secionTabs {
    label: string;
    href: string;
}
type HorizontalNavProps = {
    tabs: readonly secionTabs[];
};

export default function HorizontalNav({ tabs }: HorizontalNavProps) {
    const pathname = usePathname();
    return (
        <nav className="mb-4 flex space-x-6 border-b text-sm font-medium text-gray-500">
            {tabs.map((tab) => (
                <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                        "cursor-pointer border-b-2 border-transparent px-1 py-3 font-bold transition-colors",
                        pathname === tab.href && "border-blue-500 text-blue-600"
                    )}
                >
                    {tab.label}
                </Link>
            ))}
        </nav>
    );
}
