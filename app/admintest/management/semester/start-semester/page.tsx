import StartSemesterForm from "@/components/start-semester-form" 
import { startSemester, getPreviousSeason, getSelectOptions } from '@/app/lib/semester/sem-actions';
import { db } from "@/app/lib/db";
import { requireRole } from "@/app/lib/auth-lib/auth-actions";
import { redirect } from "next/navigation";




export default async function StartSemesterPage() {

    // const user = await requireRole(["ADMIN"], { redirect: true });
    // if (!user) {
    //     redirect("/forbidden");
    // }

    const active = await db.query.seasons.findFirst({
        where: (seasons, { eq }) => eq(seasons.status, 'Active')
    });

    if (active) {
        return (
            <div className="container mx-auto flex flex-col justify-center">
                There is already an active semester. If you think this is a mistake, please contact 
            </div>
        )
    }
    const drafts = await getPreviousSeason();

    const { options, idMaps } = await getSelectOptions();

    
    
    return (
        <div className="container mx-auto w-3/4">
            <StartSemesterForm drafts={drafts} startSemester={startSemester} selectOptions={options} idMaps={idMaps}/>
        </div>
    )
}