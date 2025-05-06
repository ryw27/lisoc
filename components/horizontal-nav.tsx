import { cn } from "@/lib/utils";
import Link from "next/link";


type HorizontalNavProps = {
    tabs: {label: string, value: string}[];
    selectedTab: string;
    setSelectedTab: (tab: string) => void;
}
export default function HorizontalNav(
    {tabs, selectedTab, setSelectedTab}: HorizontalNavProps
) {
    return (
        <nav className="flex border-b space-x-6 text-sm font-medium text-gray-500">
            {tabs.map((tab) => (
                <Link 
                    key={tab.value} 
                    href={`/admintest/dashboard/${tab.value}`}
                    onClick={() => setSelectedTab(tab.value)}
                    className={cn(
                        "border-b-2 border-transparent py-3 px-1 transition-colors",
                        selectedTab === tab.value && "border-blue-500 text-blue-600"
                    )}
                >
                    {tab.label}
                </Link>
            ))}         
        </nav>
    )
}