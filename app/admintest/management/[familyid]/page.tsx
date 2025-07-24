import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { Suspense } from "react";
import { type FC } from 'react';
import BalanceTable from "./balance-table";
import ApplyButton from "./apply-button";

interface FamilyIDPageProps {
  params: { familyid: string }
}

const fetchFamilyData = async (familyid: number) => {
    const fam = await db.query.family.findFirst({
        where: (f, { eq }) => eq(f.familyid, familyid),
        with: {
            user: {}
        }
    });
    if (!fam) return null;

    const studentsInFamily = await db.query.student.findMany({
        where: (s, { eq }) => eq(s.familyid, familyid),
        orderBy: (s, { asc }) => [asc(s.studentid)],
    });

    // Get registrations for all students in this family
    const studentIds = studentsInFamily.map(s => s.studentid);
    const registrations = studentIds.length
        ? await db.query.classregistration.findMany({
            where: (reg, { inArray }) => inArray(reg.studentid, studentIds),
            // with: {
            //     arrangement: {}
            // },
        })
        : [];
    
    const balances = await db.query.familybalance.findMany({
        where: (fb, { eq }) => eq(fb.familyid, fam.familyid)
    });

    return { fam, studentsInFamily, registrations, balances };
};

const FamilyDetails: FC<{ familyid: number}> = async ({ familyid }) => {
    const data = await fetchFamilyData(familyid);
    if (!data) return notFound();

    const { fam, studentsInFamily, registrations, balances } = data;

    const balanceData = await Promise.all(balances.map(async balance => {
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
        }
    }));

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Family: {fam.fatherfirsten || fam.motherfirsten}</h1>
            <div className="mb-6">
                <h2 className="text-lg font-semibold">Contact</h2>
                <div className="text-gray-700">
                <div>Email: {fam.user!.email || <span className="italic text-gray-400">N/A</span>}</div>
                <div>Phone: {fam.user!.phone || <span className="italic text-gray-400">N/A</span>}</div>
                </div>
            </div>
            <div className="mb-6">
                <h2 className="text-lg font-semibold">Students</h2>
                {studentsInFamily.length === 0 ? (
                <div className="text-gray-500">No students found for this family.</div>
                ) : (
                <ul className="list-disc pl-5">
                    {studentsInFamily.map(student => (
                    <li key={student.studentid}>
                        {student.namefirsten} {student.namelasten} ({student.namecn})
                    </li>
                    ))}
                </ul>
                )}
            </div>
            <div>
                <h2 className="text-lg font-semibold">Registrations</h2>
                {registrations.length === 0 ? (
                    <div className="text-gray-500">No class registrations found.</div>
                ) : (
                    <BalanceTable balanceData={balanceData} />
                )}
            </div>

            <ApplyButton family={fam}/> 
        </div>
    );
};

export default async function Page({ params }: FamilyIDPageProps) {
  const { familyid } = await params;
  if (!familyid) return notFound();

  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading family data...</div>}>
        <FamilyDetails familyid={Number(familyid)} />
    </Suspense>
  );
}