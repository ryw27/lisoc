import { requireRole } from "@/lib/auth/actions/requireRole"
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { eq, sum } from "drizzle-orm";
import { familybalance } from "@/lib/db/schema";

export default async function Dashboard() {
    // Check if allowed here.
    const auth = await requireRole(["FAMILY"]);

    const userInfo = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, auth.user.id)
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

    const famStudents = await db.query.student.findMany({
        where: (s, { eq }) => eq(s.familyid, familyInfo.familyid)
    });

    const currentBalance = await db.select({ total: sum(familybalance.totalamount) })
                                    .from(familybalance)
                                    .where(eq(familybalance.familyid, familyInfo.familyid));

    let balanceTotal = 0.0;
    if (currentBalance && currentBalance.length > 0) {  
        const tmp = currentBalance[0].total || 0.0;  
        balanceTotal = Number(tmp);
    }  

    return  (
        <div className="flex flex-col w-full gap-4">
            <div className="container mx-auto text-3xl font-bold mb-10 max-w-5xl">
                Welcome to the LISOC online registration system.
            </div>
            <div className="rounded-md shadow-md border-gray-300 border-1 p-8 max-w-5xl container mx-auto">
                <div className="container mx-auto w-full flex flex-col justify-center items-center font-bold text-lg">
                    家庭信息 Family Information
                </div>
                <div className="flex flex-col space-y-3">
                    <div className="grid grid-cols-[220px_1fr] gap-x-4 items-start">
                        <label className="font-bold text-right pr-2">Father / Legal Guardian:</label>
                        <div>
                            {`${familyInfo.fatherfirsten} ${familyInfo.fatherlasten} ${familyInfo.fathernamecn}`}
                        </div>
                    </div>
                    <div className="grid grid-cols-[220px_1fr] gap-x-4 items-start">
                        <label className="font-bold text-right pr-2">Mother / Legal Guardian:</label>
                        <div>
                            {`${familyInfo?.motherfirsten} ${familyInfo.motherlasten} ${familyInfo.mothernamecn}`}
                        </div>
                    </div>
                    <div className="grid grid-cols-[220px_1fr] gap-x-4 items-start">
                        <label className="font-bold text-right pr-2">Mailing Address:</label>
                        <div>
                            {`${userInfo.address}, ${userInfo.city}, ${userInfo.state} ${userInfo.zip}`}
                        </div>
                    </div>
                    <div className="grid grid-cols-[220px_1fr] gap-x-4 items-start">
                        <label className="font-bold text-right pr-2">Phone:</label>
                        <div className="flex flex-col gap-1">
                            {userInfo.phone && (
                                <span>{userInfo.phone}</span>
                            )}
                            {familyInfo.cellphone && (
                                <span>{`${familyInfo.cellphone} (cell)`}</span>
                            )}
                            {familyInfo.officephone && (
                                <span>{`${familyInfo.officephone} (office)`}</span>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-[220px_1fr] gap-x-4 items-start">
                        <label className="font-bold text-right pr-2">Email:</label>
                        <div className="flex flex-col gap-1">
                            {userInfo.email && (
                                <span>{userInfo.email}</span>
                            )}
                            {familyInfo.email2 && (
                                <span>{familyInfo.email2}</span>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-[220px_1fr] gap-x-4 items-start">
                        <label className="font-bold text-right pr-2">Family ID:</label>
                        <div>
                            {`${familyInfo.familyid}`}
                        </div>
                    </div>
                    <div className="grid grid-cols-[220px_1fr] gap-x-4 items-start">
                        <label className="font-bold text-right pr-2">账号金额 Account Balance:</label>
                        <div className={`text-black ${balanceTotal < 0 ? 'text-red-500' : 'text-green-500'}`}>
                             {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD'
                                }).format(balanceTotal)
                             }
                        </div>
                    </div>

                </div>
            </div>


            <div className="rounded-md shadow-md p-8 max-w-5xl container mx-auto border-gray-300 border-1 ">
                <div className="container mx-auto w-full flex flex-col justify-center items-center font-bold text-md">
                    学生信息 Student 
                </div>

                <div className="container mx-auto flex flex-col max-w-5xl space-y-3">
                    <div className="flex flex-col space-y-2">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                             <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">中文名</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birth Day</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg Date</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {famStudents.map((student) => (
                                    <tr key={student.studentid}>
                                        <td className="px-6 py-4 whitespace-nowrap">{student.studentid}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{student.namefirsten} {student.namelasten}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{student.namecn}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{student.gender}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{student.ageof}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(student.dob).toLocaleDateString("en-US")}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(student.createddate).toLocaleDateString("en-US")}</td>
                                    </tr>
                            ))}
                        </tbody>
                     </table>

                    </div>
                </div>
            </div>


            <div className="rounded-md shadow-md p-8 max-w-5xl container mx-auto border-gray-300 border-1 ">
                <div className="container mx-auto w-full flex flex-col justify-center items-center font-bold text-md">
                    家庭信息 Registration info
                </div>
                <div className="container mx-auto flex flex-col max-w-5xl mt-5">
                    <div className="flex flex-col space-y-2">
                        <Link
                            href="/dashboard/register"
                            className="text-blue-600"
                        >
                            Register Here
                        </Link>
                        <Link
                            href="/dashboard/reghistory"
                            className="text-blue-600"
                        >
                            查看所有注册记录 View All Registration History
                        </Link>

                    </div>
                </div>
            </div>


            <div className="rounded-md shadow-md p-8 max-w-5xl container mx-auto border-gray-300 border-1 ">
                <div className="container mx-auto w-full flex flex-col justify-center items-center font-bold text-md">
                    已付款注册记录及收据 View Processed Registration and Receipts 
                </div>
                <div className="container mx-auto flex flex-col max-w-5xl mt-5">
                    <div className="flex flex-col space-y-2">
                        <Link
                            href="/dashboard/balhistory"
                            className="text-blue-600"
                        >
                            已付款注册记录及收据 View Processed Registration and Receipts 
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
