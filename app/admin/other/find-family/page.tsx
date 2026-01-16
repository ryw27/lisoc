import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Input } from "@/components/ui/input";

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

export default function FindFamily() {
    return (
        <form
            action={redirectFamily}
            className="border-input bg-card mx-auto flex w-full max-w-[300px] flex-col gap-3 rounded-md border p-6 shadow-sm"
        >
            <h2 className="text-muted-foreground mb-2 text-center text-xs font-bold tracking-widest uppercase">
                Find Family Record
            </h2>

            <Input
                id="familyid"
                name="familyid"
                type="number"
                min={1}
                placeholder="Family ID"
                autoComplete="off"
                className="border-input h-9 w-full rounded-sm text-sm"
            />

            <div className="relative flex items-center justify-center">
                <span className="bg-card text-muted-foreground px-2 text-[10px] uppercase">or</span>
                <div className="absolute inset-0 -z-10 flex items-center">
                    <div className="border-input w-full border-t"></div>
                </div>
            </div>

            <Input
                id="phone"
                name="phone"
                type="text"
                placeholder="Phone Number"
                className="border-input h-9 w-full rounded-sm text-sm"
            />

            <div className="relative flex items-center justify-center">
                <span className="bg-card text-muted-foreground px-2 text-[10px] uppercase">or</span>
                <div className="absolute inset-0 -z-10 flex items-center">
                    <div className="border-input w-full border-t"></div>
                </div>
            </div>

            <Input
                id="regno"
                name="regno"
                type="number"
                placeholder="Registration No"
                className="border-input h-9 w-full rounded-sm text-sm"
            />

            <button
                type="submit"
                className="bg-primary hover:bg-primary/90 mt-2 h-9 w-full rounded-sm text-xs font-bold tracking-widest text-white uppercase transition-colors"
            >
                Search
            </button>
        </form>
    );
}
