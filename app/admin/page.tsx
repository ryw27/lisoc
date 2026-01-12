import Link from "next/link";
import { and, between, count, eq, gt, sum } from "drizzle-orm";
import {
    Activity,
    ArrowRight,
    CalendarDays,
    CreditCard,
    DollarSign,
    FileText,
    GraduationCap,
    Plus,
    Users,
} from "lucide-react";
import { DefaultSession } from "next-auth";
import { db } from "@/lib/db";
import { classes, classregistration, familybalance } from "@/lib/db/schema";
import { formatCurrency, HIGHEST_GRADE, LOWEST_GRADE, monthAbbrevMap } from "@/lib/utils";
import { threeSeasons } from "@/types/seasons.types";
import { requireRole } from "@/server/auth/actions";
import { selectFamilyName } from "@/server/billing/data";
import fetchCurrentSeasons from "@/server/seasons/data";
import Logo from "@/components/logo";

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
                    <h2 className="text-2xl text-[var(--brand-navy)]">
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
    try {
        const res = await fetchCurrentSeasons();
        lastSeason = res;
    } catch {
        return <NoSeasonState user={user.user} />;
    }

    const recentActivity = await db.query.familybalance.findMany({
        limit: 5,
        orderBy: (fb, { desc }) => desc(fb.balanceid),
        where: (fb, { eq }) => eq(fb.seasonid, lastSeason.year.seasonid),
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
    const results = await db
        .select({
            grade: classes.classno,
            count: count(),
        })
        .from(classregistration)
        .innerJoin(classes, eq(classregistration.classid, classes.classid))
        .where(
            and(
                eq(classregistration.seasonid, lastSeason.year.seasonid),
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
                eq(familybalance.seasonid, lastSeason.year.seasonid),
                gt(familybalance.totalamount, "0")
            )
        );

    const collectedRevenue = Number(result[0].total ?? 0);

    return (
        <div className="min-h-screen w-full p-6 md:p-10">
            <div className="mx-auto max-w-7xl space-y-10">
                {/* 1. HEADER: The Letterhead */}
                <header className="flex flex-col justify-between gap-4 border-b border-[var(--brand-brass)]/20 pb-6 md:flex-row md:items-end">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-medium tracking-tight text-[var(--brand-navy)]">
                            Welcome, {user.user.name?.split(" ")[0] ?? "Administrator"}
                        </h1>
                        <div className="flex items-center gap-3 text-sm tracking-wide">
                            <span className="text-xs font-semibold tracking-widest text-[var(--brand-brass)] uppercase">
                                {isSpring
                                    ? lastSeason.spring.seasonnamecn
                                    : lastSeason.fall.seasonnamecn}
                            </span>
                            <span className="text-[var(--border)]">|</span>
                            <div className="flex items-center gap-2 rounded-full border border-[var(--brand-navy)]/10 bg-[var(--brand-navy)]/5 px-2 py-0.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand-gold)] opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--brand-gold)]"></span>
                                </span>
                                <span className="text-[10px] font-bold text-[var(--brand-navy)] uppercase">
                                    Session Active
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-white/50 px-3 py-1.5 text-[var(--muted-foreground)]">
                        <CalendarDays size={14} />
                        <span className="text-xs font-medium tracking-wider uppercase">
                            Day {} of Semester
                        </span>
                    </div>
                </header>

                {/* 2. HUD: The "Dual-Pulse" Cards */}
                <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* LEFT: Enrollment (Navy Accent) */}
                    <div className="group relative overflow-hidden rounded-xl border border-t-4 border-[var(--border)] border-t-[var(--brand-navy)] bg-white p-6 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)]">
                        <div className="mb-4 flex items-start justify-between">
                            <div className="flex items-center gap-2 text-[var(--brand-navy)]">
                                <GraduationCap size={18} />
                                <span className="text-xs font-bold tracking-widest uppercase">
                                    Total Enrollment
                                </span>
                            </div>
                            <Users
                                className="text-[var(--brand-navy)] opacity-10 transition-transform duration-500 group-hover:scale-110"
                                size={48}
                            />
                        </div>
                        <div>
                            <span className="block text-6xl font-medium tracking-tighter text-[var(--brand-navy)] tabular-nums">
                                {totalCount}
                            </span>
                            <span className="mt-1 block text-sm text-[var(--muted-foreground)]">
                                Active students registered
                            </span>
                        </div>
                    </div>

                    {/* RIGHT: Revenue (Gold Accent) */}
                    <div className="group relative overflow-hidden rounded-xl border border-t-4 border-[var(--border)] border-t-[var(--brand-gold)] bg-white p-6 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)]">
                        <div className="mb-4 flex items-start justify-between">
                            <div className="flex items-center gap-2 text-[var(--brand-brass)]">
                                <CreditCard size={18} />
                                <span className="text-xs font-bold tracking-widest uppercase">
                                    Revenue Collected
                                </span>
                            </div>
                            <DollarSign
                                className="text-[var(--brand-gold)] opacity-20 transition-transform duration-500 group-hover:scale-110"
                                size={48}
                            />
                        </div>
                        <div>
                            <span className="block text-6xl font-medium tracking-tighter text-[var(--brand-navy)] tabular-nums">
                                {formatCurrency(collectedRevenue).replace(".00", "")}
                            </span>
                            <span className="mt-1 block text-sm text-[var(--muted-foreground)]">
                                Net collection year-to-date
                            </span>
                        </div>
                    </div>
                </section>

                {/* 3. MAIN GRID: Capacity & Ledger */}
                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
                    {/* A. Capacity Heatmap (2/3 width) */}
                    <div className="space-y-4 lg:col-span-2">
                        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
                            <div>
                                <Activity size={16} className="text-[var(--brand-navy)]" />
                                <h2 className="text-sm font-bold tracking-wider text-[var(--brand-navy)] uppercase">
                                    Class Distribution
                                </h2>
                            </div>
                            <div>
                                <Link
                                    href="/admin/management/semester"
                                    className="text-[10px] font-bold tracking-widest text-[var(--brand-brass)] uppercase transition-colors hover:text-[var(--brand-navy)]"
                                >
                                    View More
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {finalCount.map((item, index) => (
                                <div
                                    key={index}
                                    className="group rounded-lg border border-[var(--border)] bg-white p-4 transition-all duration-200 hover:border-[var(--brand-gold)] hover:shadow-sm"
                                >
                                    <div className="flex h-full flex-col justify-between">
                                        <span className="mb-2 text-2xl font-medium text-[var(--brand-navy)] transition-colors group-hover:text-[var(--brand-brass)]">
                                            {gradeToDisplay[item.grade]}
                                        </span>
                                        <div className="space-y-2">
                                            {/* Subtle visual bar */}
                                            {/* <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                                                <div
                                                    className="h-full rounded-full bg-[var(--brand-navy)] opacity-80"
                                                    style={{ width: "40%" }}
                                                ></div>
                                            </div> */}
                                            <span className="text-xs font-medium text-[var(--muted-foreground)]">
                                                {item.count} Students
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* B. Live Ledger (1/3 width) */}
                    <div className="space-y-4 lg:col-span-1">
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                            <div className="flex items-center gap-2">
                                <FileText size={16} className="text-[var(--brand-brass)]" />
                                <h2 className="text-sm font-bold tracking-wider text-[var(--brand-navy)] uppercase">
                                    Ledger
                                </h2>
                            </div>
                            <Link
                                href="/admin/billing"
                                className="text-[10px] font-bold tracking-widest text-[var(--brand-brass)] uppercase transition-colors hover:text-[var(--brand-navy)]"
                            >
                                View All
                            </Link>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm">
                            <div className="divide-y divide-[var(--border)]">
                                {recentActivity.map((tx, i) => (
                                    <div
                                        key={i}
                                        className="group flex items-center justify-between p-4 transition-colors hover:bg-[var(--brand-parchment)]"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-[var(--brand-navy)]">
                                                {selectFamilyName(tx.family)}
                                            </p>
                                            <p className="font-mono text-[10px] tracking-wider text-[var(--muted-foreground)] uppercase">
                                                REF: {tx.balanceid}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono text-sm font-medium text-[var(--brand-navy)]">
                                                +{formatCurrency(Number(tx.totalamount))}
                                            </p>
                                            <p className="text-[10px] text-[var(--muted-foreground)]">
                                                {formatBillingDate(tx.lastmodify).join(" ")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {recentActivity.length === 0 && (
                                    <div className="p-8 text-center text-sm text-[var(--muted-foreground)] italic">
                                        No recent transactions
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-[var(--border)] bg-[var(--muted)]/30 p-2 text-center">
                                <span className="text-[10px] font-medium tracking-widest text-[var(--muted-foreground)] uppercase">
                                    Real-time Data
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
