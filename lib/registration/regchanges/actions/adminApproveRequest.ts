import { db } from "@/lib/db";
import { regchangerequest, familybalance } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { toESTString } from "@/lib/utils";
import { famBalanceInsert } from "@/lib/shared/types";
import { requireRole } from "@/app/lib/auth-lib/auth-actions";


export async function adminApproveRequest(requestid: number, registerid: number) {
    const user = await requireRole(["ADMIN"]);
    await db.transaction(async (tx) => {
        const orgReq = await tx.query.regchangerequest.findFirst({
            where: (rgr, { eq }) => eq(rgr.requestid, requestid)
        });
        if (!orgReq) {
            throw new Error("Cannot find request");
        }

        const orgReg = await tx.query.classregistration.findFirst({
            where: (cr, { eq }) => eq(cr.regid, registerid)
        });
        if (!orgReg) {
            throw new Error("Cannot find registration");
        }

        const orgArr = await tx.query.arrangement.findFirst({
            where: (arr, { eq }) => eq(arr.arrangeid, orgReg.arrangeid)
        });
        if (!orgArr){
            throw new Error("Arrangement not found");
        }


        const adminuser = await tx.query.adminuser.findFirst({
            where: (u, { eq }) => eq(u.userid, user.user.userid)
        });

        if (!adminuser) {
            throw new Error("Admin does not exist");
        }

        await tx
            .update(regchangerequest)
            .set({
                regstatusid: 2,
                processdate: toESTString(new Date()),
                adminuserid: String(adminuser.adminid)
            })
            .where(eq(regchangerequest.requestid, requestid))
        
        
        const fullPrice = orgReg.isyearclass ? 
                            Number(orgArr.tuitionW) + Number(orgArr.bookfeeW) + Number(orgArr.specialfeeW)
                            : Number(orgArr.tuitionH) + Number(orgArr.bookfeeH) + Number(orgArr.specialfeeH);
        const balanceValues: famBalanceInsert = {
            familyid: orgReg.familyid,
            seasonid: orgReg.seasonid,
            yearclass: orgReg.isyearclass ? 1 : 0,
            yearclass4child: orgReg.isyearclass ? 1 : 0,
            semesterclass: orgReg.isyearclass ? 0 : 1,
            semesterclass4child: orgReg.isyearclass ? 0 : 1,
            childnum: 1,
            studentnum: 1,
            registerdate: orgReg.registerdate,
            tuition: (-fullPrice).toString(),
            totalamount: (-fullPrice).toString(),
            typeid: 9, // Drop out
            statusid: 2,
            regfee: "0",
            earlyregdiscount: "0",
            lateregfee: "0",
            extrafee4newfamily: "0",
            managementfee: "0",
            dutyfee: "0",
            cleaningfee: "0", 
            otherfee: "0",
            notes: "Drop out after registering",
            groupdiscount: "0",
            processfee: "0"
        };

        await tx
            .insert(familybalance)
            .values(balanceValues)
    })
}