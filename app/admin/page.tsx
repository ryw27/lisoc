import Logo from "@/components/logo";
import { db } from "@/lib/db";
import { classes, classregistration, familybalance } from "@/lib/db/schema";
import { formatCurrency, HIGHEST_GRADE, LOWEST_GRADE, monthAbbrevMap } from "@/lib/utils";
import { requireRole } from "@/server/auth/actions";
import { selectFamilyName } from "@/server/billing/data";
import fetchCurrentSeasons from "@/server/seasons/data";
import { threeSeasons } from "@/types/seasons.types";
import { and, asc, between, countDistinct, desc, eq, gt, ne, sum } from "drizzle-orm";
import {
    Activity,
    ArrowRight,
    CreditCard,
    DollarSign,
    FileText,
    GraduationCap,
    Plus,
    Users,
} from "lucide-react";
import { DefaultSession } from "next-auth";
import Link from "next/link";

import {
    REGSTATUS_DROPOUT,
    REGSTATUS_DROPOUT_SPRING,
} from "@/lib/utils";


const formatBillingDate = (date: string) => {
    const dateObj = new Date(date);
    const abbrev = monthAbbrevMap[dateObj.getMonth()];

    let day = dateObj.getDate().toString();
    if (day.length == 1) {
        day = "0" + day;
    }

    return [abbrev + " " + day, dateObj.getFullYear()];
};

const gradeToDisplay: Record<number, string> = {
    [-1]: "Pre-K",
    0: "KG",
    1: "G1",
    2: "G2",
    3: "G3",
    4: "G4",
    5: "G5",
    6: "G6",
    7: "G7",
    8: "G8",
    9: "G9",
    10: "G10",
    11: "G11",
    12: "G12",
} as const;

function NoSeasonState({ user }: { user: DefaultSession["user"] }) {
    return (
        <div className="bg-background relative flex min-h-screen w-full flex-col font-sans">
            <div className="-mt-20 flex flex-1 flex-col items-center justify-center space-y-6 p-6 text-center">
                <Logo />
                <div className="max-w-md space-y-2">
                    <h2 className="text-primary text-2xl">
                        Welcome {user?.name?.split(" ")[0] ?? "Admin"}
                    </h2>
                    <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                        There is no active semester currently in session. <br />
                        Initialize a new term to begin enrollment.
                    </p>
                </div>

                {/* Minimal Action */}
                <button className="group flex items-center gap-2 border-b border-[var(--brand-navy)] pb-0.5 text-sm font-bold tracking-wider text-[var(--brand-navy)] uppercase transition-all hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]">
                    <Plus size={14} />
                    <Link href="/admin/management/semester">Initialize Semester</Link>
                    <ArrowRight
                        size={14}
                        className="-ml-2 opacity-0 transition-all duration-300 group-hover:ml-0 group-hover:opacity-100"
                    />
                </button>
            </div>
        </div>
    );
}

export default async function HomePage() {
    const user = await requireRole(["ADMIN"]);
    let lastSeason: threeSeasons | undefined;
    let active_season: threeSeasons["fall"] | threeSeasons["spring"] | undefined;
    try {
        const res = await fetchCurrentSeasons();
        lastSeason = res;
        active_season = res.fall.status === "Active" ? res.fall : res.spring;


    } catch {
        return <NoSeasonState user={user.user} />;
    }

    const recentActivity = await db.query.familybalance.findMany({
        limit: 5,
        orderBy: (fb, { desc }) => desc(fb.balanceid),
        where: (fb, { eq }) => eq(fb.seasonid, active_season.seasonid),
        with: {
            family: {
                columns: {
                    fatherlasten: true,
                    fatherfirsten: true,
                    fathernamecn: true,
                    motherlasten: true,
                    motherfirsten: true,
                    mothernamecn: true,
                },
            },
        },
    });

    const grades = Array.from(
        { length: HIGHEST_GRADE - LOWEST_GRADE + 1 },
        (_, i) => LOWEST_GRADE + i
    );

    const subQuery = await db.selectDistinctOn([classregistration.studentid],{
        regid: classregistration.regid,
        studentid: classregistration.studentid,
        statusid: classregistration.statusid,
        classid: classregistration.classid,
        seasonid: classregistration.seasonid,
    }).from(classregistration)
    .where(eq(classregistration.seasonid, active_season.seasonid))
    .orderBy(asc(classregistration.studentid), desc(classregistration.regid))
    .as('subQuery');

    const results = await db
        .select({
            grade: classes.classno,
            count: countDistinct(subQuery.studentid),
        })
        .from(subQuery)
        .innerJoin(classes, eq(subQuery.classid, classes.classid))
        .where(
            and(
                ne(subQuery.statusid, REGSTATUS_DROPOUT),
                ne(subQuery.statusid, REGSTATUS_DROPOUT_SPRING),
                eq(subQuery.seasonid, active_season.seasonid),
                between(classes.classno, LOWEST_GRADE.toString(), HIGHEST_GRADE.toString()) // Should still work
            )
        )
        .groupBy(classes.classno);

    let totalCount = 0;
    const countsByGrade = new Map(results.map((r) => [Number(r.grade), r.count]));
    const finalCount = grades.map((grade) => {
        totalCount += countsByGrade.get(grade) || 0;
        return {
            grade,
            count: countsByGrade.get(grade) || 0,
        };
    });

    const isSpring = lastSeason.spring.status === "Active";

    // Collected
    const result = await db
        .select({ total: sum(familybalance.totalamount) })
        .from(familybalance)
        .where(
            and(
                eq(familybalance.seasonid, active_season.seasonid),
                gt(familybalance.totalamount, "0")
            )
        );

    const collectedRevenue = Number(result[0].total ?? 0);

    return (
        <div className="bg-background text-foreground min-h-screen w-full p-6 md:p-10">
            <div className="mx-auto max-w-7xl space-y-10">
                {/* Header */}
                <header className="border-border flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-end">
                    <div className="space-y-2">
                        <h1 className="text-primary text-4xl font-bold tracking-tight">
                            Welcome, {user.user.name?.split(" ")[0] ?? "Administrator"}
                        </h1>
                        <div className="flex items-center gap-3 text-sm tracking-wide">
                            <span className="text-secondary text-xs font-semibold tracking-widest uppercase">
                                {isSpring
                                    ? lastSeason.spring.seasonnamecn
                                    : lastSeason.fall.seasonnamecn}
                            </span>

                            {/* Separator Dot */}
                            <span className="bg-muted-foreground/40 h-1 w-1 rounded-full"></span>

                            {/* Live Indicator */}
                            <div className="flex items-center gap-2 rounded-full py-0.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-600 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 uppercase">
                                    Session Active
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-muted/30 flex items-center gap-2 rounded-sm px-3 py-1.5">
                        <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                            System Version {process.env.NEXT_PUBLIC_APP_VERSION}
                        </span>
                    </div>
                </header>

                {/* Cards */}
                <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Enrollment */}
                    <div className="group border-border border-t-primary bg-card relative overflow-hidden rounded-none border border-t-4 p-6 shadow-sm transition-shadow hover:shadow-md">
                        <div className="mb-4 flex items-start justify-between">
                            <div className="text-primary flex items-center gap-2">
                                <GraduationCap size={18} />
                                <span className="text-xs font-bold tracking-widest uppercase">
                                    Total Enrollment
                                </span>
                            </div>
                            <Users
                                className="text-primary opacity-10 transition-transform duration-500 group-hover:scale-110"
                                size={48}
                            />
                        </div>
                        <div>
                            <span className="text-primary block text-6xl font-medium tracking-tighter tabular-nums">
                                {totalCount}
                            </span>
                            <span className="text-muted-foreground mt-1 block text-sm">
                                Active students registered
                            </span>
                        </div>
                    </div>

                    {/* Revenue */}
                    <div className="group border-border border-t-accent bg-card relative overflow-hidden rounded-none border border-t-4 p-6 shadow-sm transition-shadow hover:shadow-md">
                        <div className="mb-4 flex items-start justify-between">
                            <div className="text-secondary flex items-center gap-2">
                                <CreditCard size={18} />
                                <span className="text-xs font-bold tracking-widest uppercase">
                                    Revenue Collected
                                </span>
                            </div>
                            <DollarSign
                                className="text-accent opacity-40 transition-transform duration-500 group-hover:scale-110"
                                size={48}
                            />
                        </div>
                        <div>
                            <span className="text-primary block text-6xl font-medium tracking-tighter tabular-nums">
                                {formatCurrency(collectedRevenue).replace(".00", "")}
                            </span>
                            <span className="text-muted-foreground mt-1 block text-sm">
                                Net collection year-to-date
                            </span>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
                    {/* Capacity */}
                    <div className="space-y-4 lg:col-span-2">
                        <div className="border-border flex items-center justify-between gap-2 border-b pb-2">
                            <div className="inline-flex items-center gap-2">
                                <Activity size={16} className="text-primary" />
                                <h2 className="text-md text-primary font-bold tracking-wider uppercase">
                                    Class Distribution
                                </h2>
                            </div>
                            <div>
                                <Link
                                    href="/admin/management/semester"
                                    className="text-secondary hover:text-primary text-[10px] font-bold tracking-widest uppercase underline-offset-4 transition-colors hover:underline"
                                >
                                    View More
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {finalCount.map((item, index) => (
                                <div
                                    key={index}
                                    className="group border-border bg-card hover:border-accent rounded-none border p-4 transition-all duration-200 hover:shadow-sm"
                                >
                                    <div className="flex h-full flex-col justify-between">
                                        <span className="text-primary group-hover:text-secondary mb-2 text-2xl font-medium transition-colors">
                                            {gradeToDisplay[item.grade]}
                                        </span>
                                        <div className="space-y-2">
                                            <span className="text-muted-foreground text-xs font-medium">
                                                {item.count} Students
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ledger */}
                    <div className="space-y-4 lg:col-span-1">
                        <div className="border-border flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2">
                                <FileText size={16} className="text-primary" />
                                <h2 className="text-md text-primary font-bold tracking-wider uppercase">
                                    Ledger
                                </h2>
                            </div>
                            <Link
                                href="/admin/accounting/billing"
                                className="text-secondary hover:text-primary text-[10px] font-bold tracking-widest uppercase underline-offset-4 transition-colors hover:underline"
                            >
                                View All
                            </Link>
                        </div>

                        <div className="border-border bg-card overflow-hidden rounded-none border shadow-sm">
                            <div className="divide-border divide-y">
                                {recentActivity.map((tx, i) => (
                                    <div
                                        key={i}
                                        className="group hover:bg-muted/50 flex items-center justify-between p-4 transition-colors"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-primary text-sm font-bold">
                                                {selectFamilyName(tx.family)}
                                            </p>
                                            <p className="text-muted-foreground group-hover:text-primary/70 font-mono text-[10px] tracking-wider uppercase">
                                                REF: {tx.balanceid}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-primary font-mono text-sm font-medium">
                                                {formatCurrency(Number(tx.totalamount))}
                                            </p>
                                            <p className="text-muted-foreground text-[10px]">
                                                {formatBillingDate(tx.lastmodify).join(" ")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {recentActivity.length === 0 && (
                                    <div className="text-muted-foreground p-8 text-center text-sm italic">
                                        No recent transactions
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
