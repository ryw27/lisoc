import { db } from "@/app/lib/db";
import RegClassForm from "../components/reg-class-form";
import { getCurrentSeason } from "@/app/lib/semester/sem-actions";
import { requireRole } from "@/app/lib/auth-lib/auth-actions";
import { threeSeason } from "@/app/lib/semester/sem-schemas";

export default async function CourseListPage() {
    // Check auth 
    const user = await requireRole(["FAMILY"], { redirect: true });

    // Check if there is an active season
    const active = await db.query.seasons.findFirst({
        where: (seasons, { eq }) => eq(seasons.status, "Active")
    });

    if (!active) {
        return (
            <div className="flex justify-center items-center">
                No active terms.
            </div>
        )
    } 

    // Get all arrangements for the active season
    try {
        const season = await db.query.seasons.findMany({
            where: (season, { eq }) => eq(season.status, "Active"),
            orderBy: (season, { asc }) => [asc(season.seasonid)]
        });

        const academicYear = season[0];
        const fall = season[1]; // TODO: CHANGE THIS 
        const spring = await db.query.seasons.findFirst({
            where: (season, { eq }) => eq(season.seasonid, academicYear.relatedseasonid)
        });

        // TODO: FIX THIS
        if (!spring) {
            throw new Error("FIX THIS");
        }

       
        const arrangementsYear = await getCurrentSeason(academicYear.seasonid); 
        const arrangementsFall = await getCurrentSeason(fall.seasonid)
        const arrangementsSpring = await getCurrentSeason(spring.seasonid)

        const familyOfUser = await db.query.family.findFirst({
            where: (family, { eq }) => eq(family.userid, user.user.userid)
        });

        if (!familyOfUser) {
            throw new Error("NO FAMILY????");
        }
        
        const students = await db.query.student.findMany({
            where: (student, { eq }) => eq(student.familyid, familyOfUser?.familyid)
        });;


        if (!students) {
            throw new Error("No students found");
        }


        const allArrangements = [...arrangementsYear, ...arrangementsFall, ...arrangementsSpring];
        const allSeasons = { year: academicYear, fall: fall, spring: spring } satisfies threeSeason

        return (
                <RegClassForm
                    season={allSeasons}
                    arrangements={allArrangements}
                    students={students}
                    family={familyOfUser}
                />
            )
    } catch (error) {
        console.error(error);
        return (
            <div className="flex justify-center items-center">
                Error occured. Please report to ...
            </div>
        )
    }

    
} 