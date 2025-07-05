import { db } from "@/app/lib/db";
import RegClassForm from "../components/reg-class-form";
import { getCurrentSeason } from "@/app/lib/semester/sem-actions";
import { requireRole } from "@/app/lib/auth-lib/auth-actions";

export default async function RegistrationPage() {
    // Check auth 
    const user = await requireRole(["FAMILY"], { redirect: true });
    // TODO: fix the user object returned by next-auth

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
        const season = await db.query.seasons.findFirst({
            where: (season, { eq }) => eq(season.open4Register, true)
        });

        if (!season) {
            throw new Error("No active season found");
        }
        
        const arrangements = await getCurrentSeason(active.seasonid); 
        const students = await db.query.student.findMany({
            where: (student, { eq }) => eq(student.familyid, Number(user.user.id))
        });
        return (
                <RegClassForm
                    season={season}
                    arrangements={arrangements}
                    students={students}
                />
            )
    } catch (error) {
        return (
            <div className="flex justify-center items-center">
                No active terms found.
            </div>
        )
    }

    
} 