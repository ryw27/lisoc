import { db } from "@/lib/db"
import { 
    BillingRow, 
    BillingSummary, 
    FamilyRow 
} from "./page"
import { InferSelectModel } from "drizzle-orm"
import { familybalance } from "@/lib/db/schema"

type billingJoin = Omit<InferSelectModel<typeof familybalance>, "family"> &
{
    family: {
        familyid: number,
        fatherlasten: string | null,
        fatherfirsten: string | null,
        motherlasten: string | null,
        motherfirsten: string | null,
        fathernamecn: string | null,
        mothernamecn: string | null
        students: {
            namecn: string,
            namefirsten: string,
            namelasten: string,
        }[]
    },
    familybalancetype: {
        typenameen: string | null
    }
}


export async function getLedgerData(
    sid: number
): Promise<{
    familyRows: FamilyRow[]
    globalRows: BillingRow[]
    summary: BillingSummary
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
                            }
                        }
                    }
                },
                familybalancetype: {
                    columns: {
                        typenameen: true,
                    }
                }
            },
            orderBy: (fbrow, { desc }) => desc(fbrow.lastmodify)
        })

        const selectFamilyName = (names: { fatherlasten: string | null, fatherfirsten: string | null, motherlasten: string | null, motherfirsten: string | null, fathernamecn: string | null, mothernamecn: string | null }) => {
            const cnName = [names.fathernamecn?.trim(), names.mothernamecn?.trim()]
                .filter(Boolean)
                .filter(Boolean)
                .join("-")
            if (cnName) return cnName

            // Doesn't join with a space if there is only one element
            const getFullName = (first: string | null, last: string | null) =>
                    [first?.trim(), last?.trim()].filter(Boolean).join(" ");
            
            const enName = [
                getFullName(names.fatherfirsten, names.fatherlasten),
                getFullName(names.motherfirsten, names.motherlasten)
            ].filter(Boolean).join("-");

            if (names.fatherfirsten === "Kun") {
                console.log(enName)
            }

            return enName.trim() ?? "Unknown"
        }

        const calculatePaid = (row: billingJoin) => {
            return -Math.min(Number(row.totalamount), 0);
        }

        const calculateBilled = (row: billingJoin) => {
            return Math.max(0, Number(row.totalamount));
        }

        // Transform
        const summary: BillingSummary = {
            billed: 0,
            collected: 0,
            outstanding: 0,
            progress: 0, 
        }
        const familyRec: Record<string, FamilyRow> = {}
        const globalRows: BillingRow[] = []
        let unknownCount = 0;
        for (let i = 0; i < fbdata.length; i++) {
            const row = fbdata[i];
            if (row.familyid === 1013) {
                console.log(row);
            }

            // Calculate money 
            const amtPaid = calculatePaid(row);
            const amtBilled = calculateBilled(row);

            // Update summary
            summary.billed += amtBilled
            summary.collected += amtPaid
            summary.outstanding += (amtBilled - amtPaid)

            const billingRow = {
                tid: row.balanceid,
                date: row.lastmodify,
                family: selectFamilyName(row.family),
                familyid: row.familyid,
                desc: row.familybalancetype.typenameen ?? "Unknown",
                amount: Number(row.totalamount),
                // type: row.isonlinepayment ? "PayPal" : "Check",
            }
            globalRows.push(billingRow);

            if (billingRow.family === "Unknown") {
                // Make sure separation doesn't get lost
                billingRow.family = "Unknown " + `${unknownCount}`
                unknownCount += 1;
            }
            const familyName = billingRow.family;
            if (!familyRec[familyName]) {
                familyRec[familyName] = {
                    fid: row.familyid,
                    family: familyName,
                    students: (row.family.students).map((studentObj) => {
                        return {
                            namecn: studentObj.namecn.trim(),
                            namefirsten: studentObj.namefirsten.trim(),
                            namelasten: studentObj.namelasten.trim(),
                        }
                    }),
                    billed: amtBilled,
                    paid: amtPaid,
                    status: "paid", // Calculate after loop
                    lastActive: row.lastmodify,
                    lastActivity: [billingRow],
                }
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

        Object.values(familyRec).forEach(rec => {
            if (rec.paid >= rec.billed) {
                rec.status = "paid";
            } else if (rec.paid > 0 ) {
                rec.status = "partial";
            } else {
                rec.status = "unpaid";
            }
        })

        
        summary.progress = summary.billed === 0 
            ? 100 
            : (summary.collected / summary.billed) * 100;

        const familyRows = Object.values(familyRec);
        return {
            familyRows,
            globalRows,
            summary
        }
    })
}