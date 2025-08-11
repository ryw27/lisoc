"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";


interface secionTabs {
    label: string;
    href: string;
}
type HorizontalNavProps = {
    tabs: readonly secionTabs[];
}

export default function HorizontalNav({ tabs }: HorizontalNavProps) {
    const pathname = usePathname();
    return (
        <nav className="flex border-b space-x-6 text-sm font-medium text-gray-500 mb-4">
            {tabs.map((tab) => (
                <Link
                    key={tab.href} 
                    href={tab.href}
                    className={cn(
                        "border-b-2 border-transparent py-3 px-1 transition-colors cursor-pointer font-bold",
                        pathname === tab.href && "border-blue-500 text-blue-600"
                    )}
                >
                    {tab.label}
                </Link>
            ))}         
        </nav>
    )
}