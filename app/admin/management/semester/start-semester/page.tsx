import { db } from "@/lib/db";
import { getPreviousSeason } from "@/server/seasons/actions/getPreviousSeason";
import { getSelectOptions } from "@/server/seasons/actions/getSelectOptions";
import StartSemesterForm from "@/components/registration/admin/form-semester-start";

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

    if (active) {
        return (
            <div className="container mx-auto flex flex-col justify-center">
                There is already an active semester. If you think this is a mistake, please contact
            </div>
        );
    }
    const { lastSeason } = await getPreviousSeason();

    const { options, idMaps } = await getSelectOptions();

    // const allArrangements = [
    //     ...lastSeasonArrangements.yearRows,
    //     ...lastSeasonArrangements.fallRows,
    //     ...lastSeasonArrangements.springRows,
    // ];

    return (
        <div className="container mx-auto w-3/4">
            <StartSemesterForm
                // drafts={allArrangements}
                selectOptions={options}
                idMaps={idMaps}
                lastSeason={lastSeason}
            />
        </div>
    );
}
