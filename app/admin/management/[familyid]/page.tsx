import { db } from "@/lib/db";
import { classregistration, student } from "@/lib/db/schema";
import { regStatusMap } from "@/lib/utils";
import { selectFamilyName } from "@/server/billing/data";
import { format } from "date-fns";
import { InferSelectModel } from "drizzle-orm";
import { Suspense, type FC } from "react";
import BalanceTabs from "./balance-tabs";
import { adminFamilyRegView } from "./registration-table";

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
    /*const studentIds = studentsInFamily.map((s) => s.studentid);
    const registrations = studentIds.length
        ? await db.query.classregistration.findMany({
              where: (reg, { inArray }) => inArray(reg.studentid, studentIds),
              // with: {
              //     arrangement: {}
              // },
          })
        : [];
    */
    const balances = await db.query.familybalance.findMany({
        where: (fb, { eq }) => eq(fb.familyid, fam.familyid),
        orderBy: (fb, { desc }) => [desc(fb.registerdate)],
    });

    return { fam, studentsInFamily, balances };
};


const fetchRegistration = async (familyid: number,students: InferSelectModel<typeof student>[]) => {

    const studentMap = students.reduce<Record<number, (typeof students)[number]>>((acc, s) => {
        acc[s.studentid] = s;
        return acc;
    }, {});

    // Get registrations
    const historicRegistrations = await db.query.classregistration.findMany({
        where: (reg, { eq }) => eq(reg.familyid, familyid),
        orderBy: (reg, { desc }) => desc(reg.registerdate),
    });


    const getfullInfo = async (reg: InferSelectModel<typeof classregistration>) => {
        const arr = await db.query.arrangement.findFirst({
            where: (a, { and, or, eq }) =>
                or(
                    and(eq(a.classid, reg.classid), eq(a.seasonid, reg.seasonid)),
                    eq(a.arrangeid, reg.arrangeid)
                ),
            with: {
                class: {
                    columns: {
                        classid: true,
                    },
                },
                teacher: {
                    columns: {
                        teacherid: true,
                        namecn: true,
                        namefirsten: true,
                        namelasten: true,
                    },
                },
            },
        });
        if (!arr) {
            return {
                regid: undefined,
                nameen: undefined,
                namecn: undefined,
                regdate: undefined,
                classid: undefined,
                seasonid: undefined,
                teacherid: undefined,
                statusid: undefined,
            };
        }
        const regClass = await db.query.classes.findFirst({
            where: (c, { eq }) => eq(c.classid, arr.class.classid as number),
        });


        const arrSeason = await db.query.seasons.findFirst({
            where: (s, { eq }) => eq(s.seasonid, arr.seasonid),
        });

        const regStudent = studentMap[reg.studentid];

        const detailArrObj = {
            regid: reg.regid,
            nameen: `${regStudent?.namefirsten ?? ""} ${regStudent?.namelasten ?? ""}`.trim(),
            namecn: regStudent?.namecn ?? "",
            regdate: new Date(reg.registerdate).toISOString().split("T")[0] ,
            classid: regClass? regClass.classnamecn : "unknown",
            seasonid: arrSeason ? arrSeason.seasonnamecn : "unknown",
            teacherid: arr.teacher.namecn ??  `${arr.teacher.namefirsten ?? ""} ${arr.teacher.namelasten ?? ""}`.trim(), 
            statusid: regStatusMap[reg.statusid as keyof typeof regStatusMap] ?? "Unknown/未知",

        };

        return detailArrObj;
    };

    const allReg = await Promise.all(
        historicRegistrations.map(async (r) => {
            const arrangement = await getfullInfo(r);
            return arrangement;
        })
    );
    
    const result = allReg.filter((r) => r.regid !== undefined);
    return result ;

}

const FamilyDetails: FC<{ familyid: number }> = async ({ familyid }) => {
    const data = await fetchFamilyData(familyid);
    if (!data) 
    {
        return ( 
            <div>
                <div className="text-5xl text-red-500 text-center">Family not found</div>
            </div>    
        );
    }

    const { fam, studentsInFamily, balances } = data;

    const balanceData = await Promise.all(
        balances.map(async (balance) => {
            const season = await db.query.seasons.findFirst({
                where: (s, { eq }) => eq(s.seasonid, balance.seasonid),
            });
            return {
                balanceid: balance.balanceid,
                regdate: format(balance.registerdate, "yyyy-MM-dd"),
                semester: season?.seasonnamecn || "N/A",
                amount: Number(balance.totalamount),
                check_no: balance.checkno || "N/A",
                paiddate: balance.paiddate ? format(balance.paiddate, "yyyy-MM-dd") : "",
                note: balance.notes || "",
            };
        })
    );

    const registrationData: adminFamilyRegView[] = await fetchRegistration(familyid, studentsInFamily);

    return (
        <div className="mx-auto max-w-7xl p-6">
            <h1 className="mb-4 text-2xl font-bold">Family: {selectFamilyName(fam)}</h1>
            <h2 className="text-1xl mb-4 font-bold">FamilyID: {fam.familyid}</h2>

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
            <BalanceTabs balanceData={balanceData} hasRegistrations={registrationData.length > 0} family={fam} registrations={registrationData} />

            {/*<ApplyButton family={fam} />*/}
        </div>
    );
};

export default async function Page({ params }: FamilyIDPageProps) {
    const { familyid } = await params;
    if (!familyid) {
        return <div>Family ID not provided</div>
    }
    return (
        <Suspense
            fallback={<div className="p-8 text-center text-gray-500">Loading family data...</div>}
        >
            <FamilyDetails familyid={Number(familyid)} />
        </Suspense>
    );
}
