"use client";

import { type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type DutyTab = "assign" | "management";

export default function DutyTabs({
    activeTab,
    assign,
    management,
}: {
    activeTab: DutyTab;
    assign: ReactNode;
    management: ReactNode;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Keep the tab in the URL so it survives season-filter changes and router.refresh().
    const onTabChange = (value: string) => {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.set("tab", value);
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    const triggerClass = "text-base data-[state=active]:text-green-600";

    return (
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList>
                <TabsTrigger value="assign" className={triggerClass}>
                    Assign (安排值日)
                </TabsTrigger>
                <TabsTrigger value="management" className={triggerClass}>
                    Management (值日管理)
                </TabsTrigger>
            </TabsList>
            <TabsContent value="assign" className="mt-2">
                {assign}
            </TabsContent>
            <TabsContent value="management" className="mt-2">
                {management}
            </TabsContent>
        </Tabs>
    );
}
