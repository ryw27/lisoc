import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import BalanceHistoryTable from "@/components/family/historic_balances";





export default async function BalanceHistoryPage() {
    const user = await requireRole(["FAMILY"]);
    const userRow = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, user.user.id)
    });

    const familyRow = await db.query.family.findFirst({
        where: (family, { eq }) => eq(family.userid, userRow?.id as string)
    });

    const history = await db.query.familybalance.findMany({
        where: (familybalance, { eq }) => eq(familybalance.familyid, familyRow?.familyid as number)
    });

    if (!history?.length) {
        return (
        <div className="text-gray-500 text-center py-8">
            No balance history found.
        </div>
        );
    }
    return (
        <main className="max-w-3xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Balance History</h1>
            <Suspense fallback={<div className="text-center py-8">Loading balance history...</div>}>
                <BalanceHistoryTable history={history} />
            </Suspense>
        </main>
    );
}