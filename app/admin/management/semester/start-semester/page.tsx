import ConfirmActiveSemester from "@/components/registration/admin/confirm-active-semester";
import StartSemesterForm from "@/components/registration/admin/form-semester-start";
import { db } from "@/lib/db";
import { getPreviousSeason } from "@/server/seasons/actions/getPreviousSeason";
import { getSelectOptions } from "@/server/seasons/actions/getSelectOptions";

// import { requireRole } from "@/lib/auth";
// import { redirect } from "next/navigation";

export default async function StartSemesterPage() {
    // const user = await requireRole(["ADMIN"], { redirect: true });
    // if (!user) {
    //     redirect("/forbidden");
    // }

    const active = await db.query.seasons.findFirst({
        where: (seasons, { eq }) => eq(seasons.status, "Active"),
    });

    const  {lastSeasonArrangements,lastSeason}  = await getPreviousSeason();

    const { options, idMaps } = await getSelectOptions();

    return (
        <ConfirmActiveSemester hasActive={!!active}>
            <div className="container mx-auto w-3/4">
                <StartSemesterForm
                    // drafts={allArrangements}
                    selectOptions={options}
                    idMaps={idMaps}
                    lastSeasonArrangement = {lastSeasonArrangements}
                    lastSeason={lastSeason}
                />
            </div>
        </ConfirmActiveSemester>
    );
}
