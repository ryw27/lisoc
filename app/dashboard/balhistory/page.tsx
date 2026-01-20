import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/actions";
import BalanceHistoryTable from "@/components/familymanagement/historic_balances";
import { TableSkeleton } from "@/components/familymanagement/table-skeleton";

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
        orderBy: (familybalance, { desc }) => desc(familybalance.balanceid),
    });

    if (!history?.length) {
        return <div className="py-8 text-center text-gray-500">No balance history found.</div>;
    }

    const balanceData = await Promise.all(
        history.map(async (balance) => {
            const season = await db.query.seasons.findFirst({
                where: (s, { eq }) => eq(s.seasonid, balance.seasonid),
            });
            return {
                balanceid: balance.balanceid,
                regdate: balance.registerdate,
                semester: season?.seasonnamecn || "N/A",
                amount: Number(balance.totalamount),
                check_no: balance.checkno || "N/A",
                paiddate: balance.paiddate,
                note: balance.notes || "",
            };
        })
    );

    return (
        <main className="mx-auto px-4 py-8">
            <h1 className="mb-6 text-2xl font-bold">Balance History/缴费记录</h1>
            <Suspense fallback={<TableSkeleton />}>
                <BalanceHistoryTable history={balanceData} />
            </Suspense>
        </main>
    );
}
