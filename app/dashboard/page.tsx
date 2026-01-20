import { db } from "@/lib/db";
import { familybalance } from "@/lib/db/schema";
import { requireRole } from "@/server/auth/actions";
import { eq, sum } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Dashboard() {
    // Check if allowed here.
    const auth = await requireRole(["FAMILY"]);

    const userInfo = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, auth.user.id),
    });
    if (!userInfo) {
        redirect("/forbidden");
    }

    const familyInfo = await db.query.family.findFirst({
        where: (family, { eq }) => eq(family.userid, userInfo.id),
    });
    if (!familyInfo) {
        redirect("/forbidden");
    }

    const famStudents = await db.query.student.findMany({
        where: (s, { eq }) => eq(s.familyid, familyInfo.familyid),
    });

    const currentBalance = await db
        .select({ total: sum(familybalance.totalamount) })
        .from(familybalance)
        .where(eq(familybalance.familyid, familyInfo.familyid));

    let balanceTotal = 0.0;
    if (currentBalance && currentBalance.length > 0) {
        const tmp = currentBalance[0].total || 0.0;
        balanceTotal = Number(tmp);
    }

    const names = [
        familyInfo.fatherfirsten?.trim() || familyInfo.fathernamecn?.trim(),
        familyInfo.motherfirsten?.trim() || familyInfo.mothernamecn?.trim(),
    ]
        .filter(Boolean)
        .join(" and ");

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 bg-gray-50/50 p-4 md:p-8">
            {/* Header Section */}
            <div className="mb-4">
                <h1 className="text-primary text-3xl font-bold tracking-tight">
                    Welcome{names ? ", " + names : ""}
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    LISOC Online Registration System(长岛中文学校在线注册系统)
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    {/* Family Info Card */}
                    <div className="border-border overflow-hidden rounded-md border shadow-sm">
                        <div className="bg-muted/30 border-b px-6 py-4">
                            <h2 className="text-primary flex items-center gap-2 text-lg font-bold">
                                <span className="bg-secondary h-4 w-1 rounded-full"></span>
                                Family Information / 家庭信息
                            </h2>
                        </div>
                        <div className="grid gap-y-4 p-6 md:grid-cols-2 md:gap-x-8">
                            <div className="space-y-1">
                                <label className="text-muted-foreground text-xs font-semibold uppercase">
                                    Father / Legal Guardian(父亲/监护人)
                                </label>
                                <div className="text-foreground font-medium">
                                    {`${familyInfo.fatherfirsten} ${familyInfo.fatherlasten} ${familyInfo.fathernamecn}`}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-muted-foreground text-xs font-semibold uppercase">
                                    Mother / Legal Guardian（母亲/监护人)
                                </label>
                                <div className="text-foreground font-medium">
                                    {`${familyInfo?.motherfirsten} ${familyInfo.motherlasten} ${familyInfo.mothernamecn}`}
                                </div>
                            </div>

                            <div className="space-y-1 md:col-span-2">
                                <label className="text-muted-foreground text-xs font-semibold uppercase">
                                    Mailing Address（邮寄地址)
                                </label>
                                <div className="text-foreground font-medium">
                                    {`${userInfo.address}, ${userInfo.city}, ${userInfo.state} ${userInfo.zip}`}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-muted-foreground text-xs font-semibold uppercase">
                                    Phone Contacts（联系电话)
                                </label>
                                <div className="flex flex-col text-sm font-medium">
                                    {userInfo.phone && <span>{userInfo.phone}</span>}
                                    {familyInfo.cellphone && (
                                        <span className="text-muted-foreground">{`${familyInfo.cellphone} (cell)`}</span>
                                    )}
                                    {familyInfo.officephone && (
                                        <span className="text-muted-foreground">{`${familyInfo.officephone} (office)`}</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-muted-foreground text-xs font-semibold uppercase">
                                    Email Contacts(电子邮件)
                                </label>
                                <div className="flex flex-col text-sm font-medium">
                                    {userInfo.email && <span>{userInfo.email}</span>}
                                    {familyInfo.email2 && (
                                        <span className="text-muted-foreground">
                                            {familyInfo.email2}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-muted-foreground text-xs font-semibold uppercase">
                                    Family ID（家庭编号)
                                </label>
                                <div className="text-primary font-mono font-bold">{`${familyInfo.familyid}`}</div>
                            </div>
                        </div>
                    </div>

                    {/* Student Info Card */}
                    <div className="border-border overflow-hidden rounded-md border shadow-sm">
                        <div className="bg-muted/30 flex items-center justify-between border-b px-6 py-4">
                            <h2 className="text-primary flex items-center gap-2 text-lg font-bold">
                                <span className="bg-secondary h-4 w-1 rounded-full"></span>
                                Student Information / 学生信息
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-muted-foreground bg-gray-50 text-xs font-semibold uppercase">
                                    <tr>
                                        <th className="px-6 py-4">ID<br/>编号</th>
                                        <th className="px-6 py-4">Name<br/>姓名</th>
                                        <th className="px-6 py-4">chinese Name<br/>中文名</th>
                                        <th className="px-6 py-4">Gender<br/>性别</th>
                                        <th className="px-6 py-4">Age<br/>年龄</th>
                                        <th className="px-6 py-4">DOB<br/>生日</th>
                                        <th className="px-6 py-4">Reg Date<br/>注册日期</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {famStudents.map((student) => (
                                        <tr
                                            key={student.studentid}
                                            className="transition-colors hover:bg-gray-50/80"
                                        >
                                            <td className="px-6 py-4 font-mono text-xs">
                                                {student.studentid}
                                            </td>
                                            <td className="text-primary px-6 py-4 font-medium">
                                                {student.namefirsten} {student.namelasten}
                                            </td>
                                            <td className="px-6 py-4">{student.namecn}</td>
                                            <td className="px-6 py-4">{student.gender}</td>
                                            <td className="px-6 py-4">{student.ageof}</td>
                                            <td className="text-muted-foreground px-6 py-4">
                                                {new Date(student.dob).toLocaleDateString("en-US")}
                                            </td>
                                            <td className="text-muted-foreground px-6 py-4">
                                                {new Date(student.createddate).toLocaleDateString(
                                                    "en-US"
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Balance Card */}
                    <div className="border-border bg-primary text-primary-foreground relative overflow-hidden rounded-md border shadow-lg">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <div className="h-32 w-32 rounded-full"></div>
                        </div>
                        <div className="relative z-10 p-6">
                            <h3 className="text-background text-sm font-medium opacity-90">
                                Account Balance / 账号金额
                            </h3>
                            <div
                                className={`mt-2 text-4xl font-bold tracking-tight ${balanceTotal < 0 ? "text-red-300" : "text-green-300"}`}
                            >
                                {new Intl.NumberFormat("en-US", {
                                    style: "currency",
                                    currency: "USD",
                                }).format(balanceTotal)}
                            </div>
                            <p className="mt-2 text-xs opacity-75">
                                Please ensure your balance is up to date.
                            </p>
                        </div>
                    </div>

                    {/* Quick Actions Grid */}
                    <div className="grid gap-4">
                        <h3 className="text-sm font-bold tracking-wider text-gray-500 uppercase">
                            Actions
                        </h3>

                        <Link
                            href="/dashboard/register"
                            className="group hover:border-primary flex flex-col items-start gap-2 rounded-md border border-gray-200 p-5 shadow-sm transition-all hover:shadow-md"
                        >
                            <span className="text-primary font-bold decoration-2 underline-offset-4 group-hover:underline">
                                Register Here
                            </span>
                            <span className="text-muted-foreground text-xs">
                                Start a new registration for classes.
                            </span>
                        </Link>

                        <Link
                            href="/dashboard/reghistory"
                            className="group hover:border-primary flex flex-col items-start gap-2 rounded-md border border-gray-200 p-5 shadow-sm transition-all hover:shadow-md"
                        >
                            <span className="text-primary font-bold decoration-2 underline-offset-4 group-hover:underline">
                                View History / 注册记录
                            </span>
                            <span className="text-muted-foreground text-xs">
                                See all past registration activities.
                            </span>
                        </Link>

                        <Link
                            href="/dashboard/balhistory"
                            className="group hover:border-primary flex flex-col items-start gap-2 rounded-md border border-gray-200 p-5 shadow-sm transition-all hover:shadow-md"
                        >
                            <span className="text-primary font-bold decoration-2 underline-offset-4 group-hover:underline">
                                Receipts / 已付款收据
                            </span>
                            <span className="text-muted-foreground text-xs">
                                View processed payments and receipts.
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
