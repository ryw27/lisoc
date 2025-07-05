import RegClassBox from "./reg-class-box";
import { draftClasses } from "@/app/lib/semester/sem-schemas";
import { studentObject } from "@/app/admintest/dashboard/data/(people-pages)/students/student-helpers";
import { seasons } from "@/app/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";


type regClassFormProps = {
    arrangements: draftClasses[]
    students: studentObject[]
    season: InferSelectModel<typeof seasons> 
}

export default async function RegClassForm({
    arrangements,
    students,
    season
}: regClassFormProps) {

    return (
        <div className="flex flex-col container mx-auto">
            <h1 className="font-bold text-lg">{arrangements[0].season.seasonnamecn} class registration</h1>
            <div className="flex flex-col border-2 border-gray-500 rounded-sm w-1/2">
                {arrangements.map((data, index) => (
                    <div key={index} className="p-2 border-2 border-gray-500">
                        <RegClassBox classData={data} students={students} season={season}/>
                    </div>
                ))}
            </div>
        </div>
    )
}