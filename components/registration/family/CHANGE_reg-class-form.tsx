import RegClassBox from "./CHANGE_reg-class-box";
import { type threeSeasons, type uiClasses } from "@/lib/registration/types";
import { studentObject } from "@/app/admintest/data/(people-pages)/students/student-helpers";
import { db } from "@/lib/db";
import { InferSelectModel } from "drizzle-orm";
import { family } from "@/lib/db/schema";


type regClassFormProps = {
    arrangements: uiClasses[];
    students: studentObject[];
    season: threeSeasons;
    family: InferSelectModel<typeof family>
}
// TODO: Change this to the reg history
export default async function RegClassForm({
    arrangements,
    students,
    season,
    family
}: regClassFormProps) {
    const historicRegistrations = await db.query.classregistration.findMany({
        where: (reg, { eq }) => eq(reg.familyid, family.familyid)
    });

    const currentRegistrations = await db.query.classregistration.findMany({
        where: (reg, { eq, and }) => and(eq(reg.familyid, family.familyid), eq(reg.seasonid, season.year.seasonid))
    });

    const familyBalance = await db.query.familybalance.findFirst({
        where: (balance, { eq, and, or }) => and(eq(balance.familyid, family.familyid), 
        or(eq(balance.seasonid, season.year.seasonid), eq(balance.seasonid, season.fall.seasonid), eq(balance.seasonid, season.spring.seasonid)))
    });


    const user = await db.query.users.findFirst({
        where: (user, { eq }) => eq(user.id, family.userid!)
    });
    if (!user) {
        throw new Error("User not found");
    }
    
    // const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // const isNewFamily = new Date(user.createon!) > oneDayAgo;

    // TODO: Needed? How to calculate totalamount? 
    // const calculateBalance = (balance: InferSelectModel<typeof familybalance>) => {
    //     return Number(balance.childnumRegfee)
    //         + Number(balance.regfee) 
    //         - Number(balance.earlyregdiscount) 
    //         + Number(balance.lateregfee)
    //         + Number(isNewFamily ? balance.extrafee4newfamily : 0)
    //         + Number(balance.managementfee)
    //         + Number(balance.dutyfee)
    //         + Number(balance.cleaningfee)
    //         + Number(balance.otherfee)
    //         + Number(balance.tuition)
    // }

    // const calculateTotalBalance = (balances: InferSelectModel<typeof familybalance>[]) => {
    //     return balances.reduce((acc, balance) => acc + Number(balance.totalamount) , 0);
    // }

    return (
        <div className="flex flex-col container mx-auto">
            <h1 className="font-bold text-lg">{season.year.seasonnamecn} class registration</h1>
            <div className="flex flex-col border-1 border-gray-500 rounded-sm w-1/2">
                {arrangements.map((data, index) => (
                    <div key={index} className="p-2 border-1 border-gray-500">
                        <RegClassBox classData={data} students={students} season={season} family={family}/>
                    </div>
                ))}
            </div>
            <h1 className="font-bold text-lg">Current Registrations</h1>
            <div className="flex flex-col border-2 border-gray-500 rounded-sm w-1/2">
                <h1 className="font-bold text-lg">Current Registrations</h1>
                <span>{JSON.stringify(currentRegistrations)}</span>
                <h1 className="font-bold text-lg">Historic Registrations</h1>
                <span>{JSON.stringify(historicRegistrations)}</span>
                <h1 className="font-bold text-lg">Students</h1>
                <span>{JSON.stringify(students)}</span>
                <h1 className="font-bold text-lg">Family Balance</h1>
                <span>{familyBalance ? familyBalance.totalamount : 0}</span>
                {/* {students.map((student, index) => (
                    <div key={index} className="p-2 border-1 border-gray-500">
                        <p>{student.namecn}</p>
                    </div>
                ))} */}
            </div>
        </div>
    )
}