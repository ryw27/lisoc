import { db } from "@/lib/db";
import { selectFamilyName } from "@/server/billing/data";
import { notFound } from "next/navigation";
import { Suspense, type FC } from "react";
import ApplyButton from "./apply-button";
import BalanceTable from "./balance-table";

interface FamilyIDPageProps {
    params: Promise<{ familyid: string }>;
}

const fetchFamilyData = async (familyid: number) => {
    const fam = await db.query.family.findFirst({
        where: (f, { eq }) => eq(f.familyid, familyid),
        with: {
            user: {},
        },
    });
    if (!fam) return null;

    const studentsInFamily = await db.query.student.findMany({
        where: (s, { eq }) => eq(s.familyid, familyid),
        orderBy: (s, { asc }) => [asc(s.studentid)],
    });

    // Get registrations for all students in this family
    const studentIds = studentsInFamily.map((s) => s.studentid);
    const registrations = studentIds.length
        ? await db.query.classregistration.findMany({
              where: (reg, { inArray }) => inArray(reg.studentid, studentIds),
              // with: {
              //     arrangement: {}
              // },
          })
        : [];

    const balances = await db.query.familybalance.findMany({
        where: (fb, { eq }) => eq(fb.familyid, fam.familyid),
        orderBy: (fb, { desc }) => [desc(fb.registerdate)],
    });

    return { fam, studentsInFamily, registrations, balances };
};

const FamilyDetails: FC<{ familyid: number }> = async ({ familyid }) => {
    const data = await fetchFamilyData(familyid);
    if (!data) return notFound();

    const { fam, studentsInFamily, registrations, balances } = data;

    const balanceData = await Promise.all(
        balances.map(async (balance) => {
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
        <div className="mx-auto max-w-7xl p-6">
            <h1 className="mb-4 text-2xl font-bold">Family: {selectFamilyName(fam)}</h1>
            <h2 className="mb-4 text-1xl font-bold">FamilyID: {fam.familyid}</h2>

            <div className="mb-6">
                <h2 className="text-lg font-semibold">Contact</h2>
                <div className="text-gray-700">
                    <div>
                        Email:{" "}
                        {fam.user!.email || <span className="text-gray-400 italic">N/A</span>}
                    </div>
                    <div>
                        Phone:{" "}
                        {fam.user!.phone || <span className="text-gray-400 italic">N/A</span>}
                    </div>
                </div>
            </div>
            <div className="mb-6">
                <h2 className="text-lg font-semibold">Students</h2>
                {studentsInFamily.length === 0 ? (
                    <div className="text-gray-500">No students found for this family.</div>
                ) : (
                    <ul className="list-disc pl-5">
                        {studentsInFamily.map((student) => (
                            <li key={student.studentid}>
                                {student.namefirsten} {student.namelasten} ({student.namecn})
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div>
                {registrations.length === 0 ? (
                    <div className="text-gray-500">No class registrations found.</div>
                ) : (
                    <BalanceTable balanceData={balanceData} />
                )}
            </div>

            <ApplyButton family={fam} />
        </div>
    );
};

export default async function Page({ params }: FamilyIDPageProps) {
    const { familyid } = await params;
    if (!familyid) return notFound();

    return (
        <Suspense
            fallback={<div className="p-8 text-center text-gray-500">Loading family data...</div>}
        >
            <FamilyDetails familyid={Number(familyid)} />
        </Suspense>
    );
}
