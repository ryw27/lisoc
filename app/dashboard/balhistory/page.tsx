import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/actions";
import BalanceHistoryTable from "@/components/familymanagement/historic_balances";

export default async function BalanceHistoryPage() {
    const user = await requireRole(["FAMILY"]);
    const userRow = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, user.user.id),
    });

    const familyRow = await db.query.family.findFirst({
        where: (family, { eq }) => eq(family.userid, userRow?.id as string),
    });

    const history = await db.query.familybalance.findMany({
        where: (familybalance, { eq }) => eq(familybalance.familyid, familyRow?.familyid as number),
    });

    if (!history?.length) {
        return <div className="py-8 text-center text-gray-500">No balance history found.</div>;
    }
    return (
        <main className="mx-auto max-w-3xl px-4 py-8">
            <h1 className="mb-6 text-2xl font-bold">Balance History</h1>
            <Suspense fallback={<div className="py-8 text-center">Loading balance history...</div>}>
                <BalanceHistoryTable history={history} />
            </Suspense>
        </main>
    );
}
