import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Input } from "@/components/ui/input";

export default function FindFamily() {
    async function redirectFamily(formData: FormData): Promise<void> {
        "use server";
        const familyid = formData.get("familyid");
        const phone = formData.get("phone");
        const regno = formData.get("regno");
        if (
            !familyid &&
            !phone &&
            !regno &&
            typeof familyid !== "string" &&
            typeof phone !== "string" &&
            typeof regno !== "string"
        ) {
            return;
        }
        let finalFamID = familyid;
        if (phone) {
            const user = await db.query.users.findFirst({
                where: (u, { eq }) => eq(u.phone, String(phone)),
                with: {
                    families: {
                        columns: {
                            familyid: true,
                        },
                    },
                },
            });
            if (!user || !user.families?.familyid) {
                return;
            } else {
                finalFamID = user.families.familyid.toString();
            }
        } else if (regno) {
            const reg = await db.query.classregistration.findFirst({
                where: (cr, { eq }) => eq(cr.regid, Number(regno)),
                with: {
                    family: {
                        columns: {
                            familyid: true,
                        },
                    },
                },
            });
            if (!reg) {
                return;
            } else {
                finalFamID = reg.family.familyid.toString();
            }
        }
        redirect(`/admin/management/${finalFamID}`);
    }
    return (
        <form action={redirectFamily} className="space-y-4">
            <Input
                id="familyid"
                name="familyid"
                type="number"
                min={1}
                placeholder="Enter Family ID"
                autoComplete="off"
            />
            <Input id="phone" name="phone" type="string" placeholder="Enter Phone" />
            <Input id="regno" name="regno" type="number" placeholder="Enter Reg No" />
            <button type="submit" className="rounded-md bg-blue-600 p-2 font-bold text-white">
                Submit
            </button>
        </form>
    );
}
