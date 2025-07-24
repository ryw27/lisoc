import { requireRole } from "@/app/lib/auth-lib/auth-actions"
import { redirect } from "next/navigation";
import { db } from "../lib/db";
import { or } from "drizzle-orm";

export default async function Dashboard() {
    // Check if allowed here.
    const auth = await requireRole(["FAMILY"], { redirect: false });
    if (!auth) {
        redirect("/forbidden");
    }

    const userInfo = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, auth.user.email as string)
    })


    if (!userInfo) {
        redirect("/forbidden")
    }

    const familyInfo = await db.query.family.findFirst({
        where: (family, { eq }) => eq(family.userid, userInfo.id)
    })

    if (!familyInfo) {
        redirect("/forbidden");
    }
    
    
    return (
        <div className="flex flex-col space-y-2 container mx-auto w-full">
            <h1 className="">User Info</h1>
            {userInfo && Object.entries(userInfo).map(([key, value]) => {
                return (
                    key !== "password" && (
                        <div key={key} className="flex gap-2">
                            <label className="font-bold">
                                {key}
                            </label>
                            <div className="">
                                {value}
                            </div>
                        </div>
                    )
                )                
            })}
            <h1 className="">User Info</h1>
            {familyInfo && Object.entries(familyInfo).map(([key, value]) => {
                return (
                    key !== "password" && (
                        <div key={key} className="flex gap-2">
                            <label className="font-bold">
                                {key}
                            </label>
                            <div className="">
                                {value}
                            </div>
                        </div>
                    )
                )                
            })}
 
        </div>
    );
}
