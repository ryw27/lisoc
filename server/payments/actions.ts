"use server";

import { db } from "@/lib/db";
import { familybalance, familybalanceSave } from "@/lib/db/schema";
import { operatorUserid } from "@/lib/utils";
import { requireFamily, requireRole } from "@/server/auth/actions";
import { applyPaymentToBalance } from "@/server/payments/applyPayment";
import { checkApplySchema } from "@/server/payments/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";

/*function isFullPayment(originalFB: InferSelectModel<typeof familybalance>) {
    const total =
        Number(originalFB.childnumRegfee) +
        Number(originalFB.regfee) -
        Number(originalFB.earlyregdiscount) +
        Number(originalFB.lateregfee) +
        Number(originalFB.extrafee4newfamily) +
        Number(originalFB.managementfee) +
        Number(originalFB.dutyfee) +
        Number(originalFB.cleaningfee) +
        Number(originalFB.otherfee) +
        Number(originalFB.tuition);
    return total;
}
*/

export async function applyCheck(
    data: z.infer<typeof checkApplySchema>,
    familyid: number,
    fromAdmin = false
) {
    // 1. Auth and parse
    const session = await requireRole(["ADMIN", "FAMILY"]);
    if (session.user.role === "FAMILY") {
        const { family: userFamily } = await requireFamily();
        if (userFamily.familyid !== familyid) {
            throw new Error("Forbidden");
        }
    }

    // Audit stamp: whoever applied the payment (admin, or the family themselves).
    // Machine-driven payments (PayPal capture) go through applyPaymentToBalance
    // directly with SYSTEM_USERID instead.
    await applyPaymentToBalance(data, familyid, {
        userid: operatorUserid(session.user),
        fromAdmin,
    });
}

export async function removeBalance(balanceid: number) {
    // 1. Auth and parse
    const session = await requireRole(["ADMIN"], { redirect: false });
    const id = z.number().int().positive().parse(balanceid);
    const deletedby = session.user.email || session.user.id;

    const familyid = await db.transaction(async (tx) => {
        // 2. Find old family balance vals
        const oldFB = await tx.query.familybalance.findFirst({
            where: (fb, { eq }) => eq(fb.balanceid, id),
        });

        if (!oldFB) {
            throw new Error("No family balance found");
        }

        // 3. Copy to the recycle bin, then hard delete (same transaction)
        await tx.insert(familybalanceSave).values({ ...oldFB, deletedby });
        await tx.delete(familybalance).where(eq(familybalance.balanceid, id));
        return oldFB.familyid;
    });

    revalidatePath(`/admin/management/${familyid}`);
}
