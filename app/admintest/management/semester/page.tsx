import { db } from "@/app/lib/db";
import Logo from "@/components/logo";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import SemesterView from "../components/sem-view";


export default async function SemesterPage() {
    const active = await db.query.seasons.findFirst({
        where: (seasons, { eq }) => eq(seasons.status, "Active")
    });

    if (!active) {
        return (
            <div className="flex flex-col">
                <h1 className="text-3xl font-bold mb-6">
                    Current academic year 
                </h1>
                <div className="flex flex-col items-center justify-center min-h-full p-8">
                    <div className="flex flex-col items-center space-y-6 max-w-md text-center">
                        <Logo />
                        <h2 className="text-2xl font-semibold text-gray-800">
                            No active academic years
                        </h2>
                        <p className="text-gray-600">
                            There are no current active academic years. Get started by starting an academic year 
                        </p>
                        <Link 
                            href="semester/start-semester"
                            className="flex items-center px-4 py-2 gap-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                            <PlusIcon className="w-5 h-5" /> Start academic year 
                        </Link>
                    </div>
                </div>
            </div>
        )
    } 


    return (
        <SemesterView 
            season={active}
        />
    )

}