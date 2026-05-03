"use client";

import ApplyButton from "@/app/admin/management/[familyid]/apply-button";
import { cn } from "@/lib/utils";
import { familyObj } from "@/types/shared.types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BalanceTable from "./balance-table";
import FamilyRegistrationTable, { adminFamilyRegView } from "./registration-table";

interface BalanceTabsProps {
    balanceData: {
        balanceid: number;
        regdate: string;
        semester: string;
        amount: number;
        check_no: string;
        paiddate: string;
        note: string;
    }[];
    hasRegistrations: boolean;
    family: familyObj;

    registrations: adminFamilyRegView[];
    feeTypeIdMap: Record<number, string>;
}

export default function BalanceTabs({
    balanceData,
    hasRegistrations,
    family,
    registrations,
    feeTypeIdMap,
}: BalanceTabsProps) {
    return (
        <Tabs defaultValue="balances" className="w-full">
            <TabsList>
                <TabsTrigger
                    value="balances"
                    className="text-lg text-blue-100 data-[state=active]:text-green-600"
                >
                    Balances/缴款
                </TabsTrigger>
                <TabsTrigger
                    value="registrations"
                    className="text-lg text-blue-100 data-[state=active]:text-green-600"
                >
                    Registration/注册
                </TabsTrigger>
            </TabsList>
            <TabsContent
                value="balances"
                className={cn("mt-4 rounded-md border-4 border-green-500 p-4")}
            >
                {hasRegistrations ? (
                    <BalanceTable balanceData={balanceData} />
                ) : (
                    <div className="text-gray-500">No class registrations found.</div>
                )}
                <ApplyButton family={family} feeTypeIdMap={feeTypeIdMap} />
            </TabsContent>
            <TabsContent
                value="registrations"
                className={cn("mt-4 rounded-md border-4 border-green-500 p-4")}
            >
                <FamilyRegistrationTable registrations={registrations} />
            </TabsContent>
        </Tabs>
    );
}
