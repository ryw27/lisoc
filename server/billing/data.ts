import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { family, familybalance, familybalancestatus, familybalancetype } from "@/lib/db/schema";
import { billingJoin, BillingRow, BillingSummary, FamilyRow } from "@/types/billing.types";
import { FAMILYBALANCE_TYPE_PAYMENT } from "@/lib/utils";
import fetchCurrentSeasons from "@/server/seasons/data";

export function selectFamilyName(names: {
    fatherlasten: string | null;
    fatherfirsten: string | null;
    motherlasten: string | null;
    motherfirsten: string | null;
    fathernamecn: string | null;
    mothernamecn: string | null;
}) {
    const cnName = [names.fathernamecn?.trim(), names.mothernamecn?.trim()]
        .filter(Boolean)
        .filter(Boolean)
        .join("-");
    if (cnName) return cnName;

    // Doesn't join with a space if there is only one element
    const getFullName = (first: string | null, last: string | null) =>
        [first?.trim(), last?.trim()].filter(Boolean).join(" ");

    const enName = [
        getFullName(names.fatherfirsten, names.fatherlasten),
        getFullName(names.motherfirsten, names.motherlasten),
    ]
        .filter(Boolean)
        .join("-");

    return enName.trim() ?? "Unknown";
}

const seasonColumns = {
    seasonid: true,
    seasonnamecn: true,
    seasonnameeng: true,
    earlyregdate: true,
    enddate: true,
} as const;

/**
 * Seasons for the accounting season dropdowns, newest first, plus the default selection:
 * the active fall/spring season, falling back to the latest season.
 */
export async function getLedgerSeasons() {
    const seasons = await db.query.seasons.findMany({
        columns: seasonColumns,
        orderBy: (s, { desc }) => desc(s.seasonid),
    });

    let defaultSeasonId: number | undefined;
    try {
        const current = await fetchCurrentSeasons();
        defaultSeasonId =
            current.fall.status === "Active" ? current.fall.seasonid : current.spring.seasonid;
    } catch {
        defaultSeasonId = seasons[0]?.seasonid;
    }

    const defaultSeason = seasons.find((s) => s.seasonid === defaultSeasonId) ?? seasons[0];
    return { seasons, defaultSeason };
}

export type BalanceTypeTotal = {
    key: string; // typeid, plus "-online"/"-offline" for the split Payment type
    typeid: number;
    online: boolean | null; // null = not split by online/offline
    label: string;
    total: number;
};

// Payments are split into online (PayPal) and offline (check/cash) rows
const onlineGroup = sql<
    boolean | null
>`case when ${familybalance.typeid} = ${sql.raw(String(FAMILYBALANCE_TYPE_PAYMENT))} then coalesce(${familybalance.isonlinepayment}, false) end`;

// Sum of familybalance.totalamount per balance type for one season
export async function getBalanceTypeTotals(seasonid: number): Promise<BalanceTypeTotal[]> {
    const rows = await db
        .select({
            typeid: familybalancetype.typeid,
            typenameen: familybalancetype.typenameen,
            online: onlineGroup,
            total: sql<string>`coalesce(sum(${familybalance.totalamount}), 0)`,
        })
        .from(familybalance)
        .innerJoin(familybalancetype, eq(familybalance.typeid, familybalancetype.typeid))
        .where(eq(familybalance.seasonid, seasonid))
        .groupBy(familybalancetype.typeid, familybalancetype.typenameen, onlineGroup)
        .orderBy(familybalancetype.typeid, desc(onlineGroup));

    return rows.map((r) => {
        const name = r.typenameen ?? `Type ${r.typeid}`;
        const suffix = r.online === null ? "" : r.online ? "online" : "offline";
        return {
            key: suffix ? `${r.typeid}-${suffix}` : String(r.typeid),
            typeid: r.typeid,
            online: r.online,
            label: suffix ? `${name} (${r.online ? "Online" : "Offline"})` : name,
            total: Number(r.total),
        };
    });
}

export type BalanceRecord = {
    balanceid: number;
    familyid: number;
    familyname: string;
    registerdate: string;
    paiddate: string;
    totalamount: number;
    status: string | null;
    checkno: string | null;
    transactionno: string | null;
    reference: string | null;
    notes: string | null;
    userid: string | null;
};

// All familybalance rows of one balance type for one season, newest first
// `online` narrows the split Payment type; null means any
export async function getBalanceRecords(
    seasonid: number,
    typeid: number,
    online: boolean | null = null
): Promise<BalanceRecord[]> {
    const rows = await db
        .select({
            balanceid: familybalance.balanceid,
            familyid: familybalance.familyid,
            fatherlasten: family.fatherlasten,
            fatherfirsten: family.fatherfirsten,
            motherlasten: family.motherlasten,
            motherfirsten: family.motherfirsten,
            fathernamecn: family.fathernamecn,
            mothernamecn: family.mothernamecn,
            registerdate: familybalance.registerdate,
            paiddate: familybalance.paiddate,
            totalamount: familybalance.totalamount,
            status: familybalancestatus.statusen,
            checkno: familybalance.checkno,
            transactionno: familybalance.transactionno,
            reference: familybalance.reference,
            notes: familybalance.notes,
            userid: familybalance.userid,
        })
        .from(familybalance)
        .leftJoin(family, eq(familybalance.familyid, family.familyid))
        .leftJoin(familybalancestatus, eq(familybalance.statusid, familybalancestatus.statusid))
        .where(
            and(
                eq(familybalance.seasonid, seasonid),
                eq(familybalance.typeid, typeid),
                online === null
                    ? undefined
                    : sql`coalesce(${familybalance.isonlinepayment}, false) = ${online}`
            )
        )
        .orderBy(desc(familybalance.registerdate), desc(familybalance.balanceid));

    return rows.map((r) => ({
        balanceid: r.balanceid,
        familyid: r.familyid,
        familyname: selectFamilyName(r),
        registerdate: r.registerdate,
        paiddate: r.paiddate,
        totalamount: Number(r.totalamount),
        status: r.status,
        checkno: r.checkno,
        transactionno: r.transactionno,
        reference: r.reference,
        notes: r.notes,
        userid: r.userid,
    }));
}

export async function getLedgerData(sid: number): Promise<{
    familyRows: FamilyRow[];
    globalRows: BillingRow[];
    summary: BillingSummary;
}> {
    return await db.transaction(async () => {
        // Fetch data
        const fbdata = await db.query.familybalance.findMany({
            where: (fb, { eq }) => eq(fb.seasonid, sid),
            with: {
                family: {
                    columns: {
                        familyid: true,
                        fatherlasten: true,
                        fatherfirsten: true,
                        motherlasten: true,
                        motherfirsten: true,
                        mothernamecn: true,
                        fathernamecn: true,
                    },
                    with: {
                        students: {
                            columns: {
                                namecn: true,
                                namefirsten: true,
                                namelasten: true,
                            },
                        },
                    },
                },
                familybalancetype: {
                    columns: {
                        typenameen: true,
                    },
                },
            },
            orderBy: (fbrow, { desc }) => desc(fbrow.lastmodify),
        });

        const calculatePaid = (row: billingJoin) => {
            return -Math.min(Number(row.totalamount), 0);
        };

        const calculateBilled = (row: billingJoin) => {
            return Math.max(0, Number(row.totalamount));
        };

        // Transform
        const summary: BillingSummary = {
            billed: 0,
            collected: 0,
            outstanding: 0,
            progress: 0,
        };
        const familyRec: Record<string, FamilyRow> = {};
        const globalRows: BillingRow[] = [];
        let unknownCount = 0;
        for (let i = 0; i < fbdata.length; i++) {
            const row = fbdata[i];

            // Calculate money
            const amtPaid = calculatePaid(row);
            const amtBilled = calculateBilled(row);

            // Update summary
            summary.billed += amtBilled;
            summary.collected += amtPaid;
            summary.outstanding += amtBilled - amtPaid;

            const billingRow = {
                tid: row.balanceid,
                date: row.lastmodify,
                family: selectFamilyName(row.family),
                familyid: row.familyid,
                desc: row.familybalancetype.typenameen ?? "Unknown",
                amount: Number(row.totalamount),
                // type: row.isonlinepayment ? "PayPal" : "Check",
            };
            globalRows.push(billingRow);

            if (billingRow.family === "Unknown") {
                // Make sure separation doesn't get lost
                billingRow.family = "Unknown " + `${unknownCount}`;
                unknownCount += 1;
            }
            const familyName = billingRow.family;
            if (!familyRec[familyName]) {
                familyRec[familyName] = {
                    fid: row.familyid,
                    family: familyName,
                    students: row.family.students.map((studentObj) => {
                        return {
                            namecn: studentObj.namecn.trim(),
                            namefirsten: studentObj.namefirsten.trim(),
                            namelasten: studentObj.namelasten.trim(),
                        };
                    }),
                    billed: amtBilled,
                    paid: amtPaid,
                    status: "paid", // Calculate after loop
                    lastActive: row.lastmodify,
                    lastActivity: [billingRow],
                };
            } else {
                const rec = familyRec[familyName];
                rec.billed += amtBilled;
                rec.paid += amtPaid;

                if (new Date(row.lastmodify) > new Date(rec.lastActive)) {
                    rec.lastActive = row.lastmodify;
                }

                rec.lastActivity.push(billingRow);
                if (rec.lastActivity.length > 2) rec.lastActivity.shift();
            }
        }

        Object.values(familyRec).forEach((rec) => {
            if (rec.paid >= rec.billed) {
                rec.status = "paid";
            } else if (rec.paid > 0) {
                rec.status = "partial";
            } else {
                rec.status = "unpaid";
            }
        });

        summary.progress = summary.billed === 0 ? 100 : (summary.collected / summary.billed) * 100;

        const familyRows = Object.values(familyRec);
        return {
            familyRows,
            globalRows,
            summary,
        };
    });
}
