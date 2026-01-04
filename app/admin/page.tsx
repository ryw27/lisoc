"use client";

import React from "react";
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    FileText,
    GraduationCap,
    TrendingUp,
    UserPlus,
    Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Mock Data ---
const SYSTEM_STATUS = {
    semester: "Fall 2025",
    status: "active", // options: 'active', 'setup', 'closed'
    daysOpen: 14,
};

const HUD_DATA = {
    // Left Side: Ops
    studentsEnrolled: 342,
    seatsAvailable: 58,
    // Right Side: Finance
    revenueCollected: 142500,
    outstanding: 12400,
    dailyRevenue: 4200,
};

const CAPACITY_GRID = [
    { grade: "KG", enrolled: 48, capacity: 50, status: "critical" },
    { grade: "G1", enrolled: 45, capacity: 50, status: "warning" },
    { grade: "G2", enrolled: 42, capacity: 50, status: "healthy" },
    { grade: "G3", enrolled: 50, capacity: 50, status: "full" },
    { grade: "G4", enrolled: 38, capacity: 50, status: "healthy" },
    { grade: "G5", enrolled: 41, capacity: 50, status: "healthy" },
];

const RECENT_PAYMENTS = [
    { id: "TX-901", family: "Wang Family", amount: 4800, time: "10m ago", method: "Wire" },
    { id: "TX-902", family: "Smith Family", amount: 250, time: "45m ago", method: "CC" },
    { id: "TX-903", family: "Chen Family", amount: 1200, time: "1h ago", method: "Check" },
    { id: "TX-904", family: "Kumar Family", amount: 250, time: "2h ago", method: "CC" },
];

const MIXED_TRIAGE = [
    {
        id: 1,
        category: "ops",
        title: "New Registration",
        desc: "Lisa M. (G5) pending approval",
        priority: "high",
        icon: UserPlus,
    },
    {
        id: 2,
        category: "finance",
        title: "Partial Payment",
        desc: "Wu Family requests approval",
        priority: "medium",
        icon: DollarSign,
    },
    {
        id: 3,
        category: "ops",
        title: "Waitlist Movement",
        desc: "2 spots opened in G3",
        priority: "low",
        icon: Clock,
    },
    {
        id: 4,
        category: "finance",
        title: "Failed Auto-Pay",
        desc: "3 families (Overnight)",
        priority: "high",
        icon: AlertCircle,
    },
];

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(amount);

export default function ExecutiveDigest() {
    return (
        <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground min-h-screen w-full p-8 font-serif">
            <div className="mx-auto max-w-7xl space-y-8">
                {/* 1. Header & Status Context */}
                <header className="border-border flex items-start justify-between border-b pb-4">
                    <div className="space-y-1">
                        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
                            Welcome, user
                        </h1>
                        <div className="flex items-center gap-3 font-sans text-sm">
                            <span className="text-muted-foreground font-bold">
                                {SYSTEM_STATUS.semester}
                            </span>
                            <div className="bg-border h-3 w-px"></div>

                            {/* Status Badge */}
                            <div
                                className={cn(
                                    "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-black tracking-wider uppercase",
                                    SYSTEM_STATUS.status === "active"
                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                                        : "border-amber-500/20 bg-amber-500/10 text-amber-600"
                                )}
                            >
                                <div
                                    className={cn(
                                        "h-1.5 w-1.5 animate-pulse rounded-full",
                                        SYSTEM_STATUS.status === "active"
                                            ? "bg-emerald-500"
                                            : "bg-amber-500"
                                    )}
                                ></div>
                                {SYSTEM_STATUS.status === "active"
                                    ? "Registration Open"
                                    : "System Paused"}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-muted-foreground mb-1 text-xs font-black tracking-widest uppercase">
                            Current Period
                        </p>
                        <p className="font-sans text-sm font-medium">
                            Day {SYSTEM_STATUS.daysOpen} of Enrollment
                        </p>
                    </div>
                </header>

                {/* 2. The "Dual-Pulse" HUD - Operations vs Finance */}
                <section className="bg-card border-border flex flex-col overflow-hidden rounded-xl border shadow-sm md:flex-row">
                    {/* LEFT: Operations (People) */}
                    <div className="border-border group relative flex-1 border-b p-6 md:border-r md:border-b-0">
                        <div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
                            <Users size={80} />
                        </div>
                        <div className="text-primary mb-4 flex items-center gap-2">
                            <GraduationCap size={18} />
                            <span className="text-xs font-black tracking-widest uppercase">
                                Enrollment Pulse
                            </span>
                        </div>
                        <div className="flex items-baseline gap-4">
                            <span className="text-foreground text-5xl font-bold tracking-tight tabular-nums">
                                {HUD_DATA.studentsEnrolled}
                            </span>
                            <span className="text-muted-foreground font-sans text-sm font-medium">
                                Students Confirmed
                            </span>
                        </div>
                        <div className="text-muted-foreground mt-4 flex items-center gap-2 font-sans text-sm">
                            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                            {HUD_DATA.seatsAvailable} seats remaining for Fall
                        </div>
                    </div>

                    {/* RIGHT: Finance (Money) */}
                    <div className="group relative flex-1 p-6">
                        <div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
                            <DollarSign size={80} />
                        </div>
                        <div className="text-secondary mb-4 flex items-center gap-2">
                            <CreditCard size={18} />
                            <span className="text-xs font-black tracking-widest uppercase">
                                Revenue Pulse
                            </span>
                        </div>
                        <div className="flex items-baseline gap-4">
                            <span className="text-foreground text-5xl font-bold tracking-tight tabular-nums">
                                {formatCurrency(HUD_DATA.revenueCollected)}
                            </span>
                            <span className="text-muted-foreground font-sans text-sm font-medium">
                                Collected YTD
                            </span>
                        </div>
                        <div className="mt-4 flex items-center gap-4 font-sans text-sm">
                            <span className="flex items-center gap-1 font-bold text-emerald-600">
                                <TrendingUp size={14} /> +{formatCurrency(HUD_DATA.dailyRevenue)}{" "}
                                Today
                            </span>
                            <span className="text-muted-foreground">
                                {formatCurrency(HUD_DATA.outstanding)} Outstanding
                            </span>
                        </div>
                    </div>
                </section>

                {/* 3. Main Content Grid */}
                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
                    {/* LEFT COLUMN (2/3 width) */}
                    <div className="space-y-8 lg:col-span-2">
                        {/* A. Capacity Heatmap (Ops) */}
                        <section>
                            <div className="mb-4 flex items-center justify-between px-1">
                                <h2 className="text-foreground flex items-center gap-2 text-lg font-bold">
                                    <Activity size={18} className="text-primary" /> Class Capacity
                                    Map
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                                {CAPACITY_GRID.map((item, index) => {
                                    const percentage = Math.round(
                                        (item.enrolled / item.capacity) * 100
                                    );
                                    let colorClass = "bg-primary";
                                    if (item.status === "critical" || item.status === "full")
                                        colorClass = "bg-destructive";
                                    if (item.status === "warning") colorClass = "bg-secondary";
                                    if (item.status === "healthy") colorClass = "bg-emerald-500";

                                    return (
                                        <div
                                            key={index}
                                            className="bg-card border-border relative overflow-hidden rounded-lg border p-4 shadow-sm transition-all hover:shadow-md"
                                        >
                                            <div className="mb-2 flex items-baseline justify-between">
                                                <span className="text-foreground font-serif text-xl font-bold">
                                                    {item.grade}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "rounded px-1.5 py-0.5 text-xs font-black tracking-wider uppercase",
                                                        item.status === "full"
                                                            ? "bg-destructive/10 text-destructive"
                                                            : "text-muted-foreground"
                                                    )}
                                                >
                                                    {item.status === "full"
                                                        ? "Full"
                                                        : `${percentage}%`}
                                                </span>
                                            </div>
                                            <div className="bg-muted mb-2 h-1.5 w-full overflow-hidden rounded-full">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        colorClass
                                                    )}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-muted-foreground font-sans text-xs">
                                                <strong className="text-foreground">
                                                    {item.enrolled}
                                                </strong>{" "}
                                                / {item.capacity} Students
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* B. Live Ledger Feed (Finance) */}
                        <section className="bg-muted/20 border-border overflow-hidden rounded-xl border">
                            <div className="border-border bg-card flex items-center justify-between border-b px-6 py-4">
                                <h2 className="text-foreground flex items-center gap-2 text-sm font-bold tracking-wide">
                                    <FileText size={16} className="text-secondary" /> Recent
                                    Transactions
                                </h2>
                                <button className="text-muted-foreground hover:text-foreground text-[10px] font-black tracking-widest uppercase">
                                    View Ledger
                                </button>
                            </div>
                            <div className="bg-card divide-border divide-y">
                                {RECENT_PAYMENTS.map((tx, i) => (
                                    <div
                                        key={i}
                                        className="hover:bg-muted/30 flex items-center justify-between px-6 py-3 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-600">
                                                $
                                            </div>
                                            <div>
                                                <div className="text-foreground text-sm font-bold">
                                                    {tx.family}
                                                </div>
                                                <div className="text-muted-foreground font-sans text-xs">
                                                    {tx.method} • {tx.id}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-emerald-700 tabular-nums">
                                                +{formatCurrency(tx.amount)}
                                            </div>
                                            <div className="text-muted-foreground font-sans text-[10px]">
                                                {tx.time}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN (1/3 width): The "Triage" Sidebar */}
                    <div className="space-y-6 lg:col-span-1">
                        <section className="bg-card border-border sticky top-6 overflow-hidden rounded-xl border shadow-sm">
                            <div className="border-border bg-muted/50 border-b p-5">
                                <h2 className="text-foreground flex items-center gap-2 text-sm font-bold tracking-wide">
                                    <CheckCircle2 size={16} className="text-primary" /> Triage
                                    Required
                                </h2>
                                <p className="text-muted-foreground mt-1 font-sans text-xs">
                                    Items requiring manual review
                                </p>
                            </div>
                            <div className="divide-border divide-y font-sans">
                                {MIXED_TRIAGE.map((task) => (
                                    <button
                                        key={task.id}
                                        className="hover:bg-muted/40 group w-full p-4 text-left transition-colors"
                                    >
                                        <div className="mb-1 flex items-start justify-between">
                                            <span
                                                className={cn(
                                                    "rounded border px-1.5 py-0.5 text-[10px] font-black tracking-wider uppercase",
                                                    task.category === "finance"
                                                        ? "bg-secondary/10 text-secondary border-secondary/20"
                                                        : "bg-primary/10 text-primary border-primary/20"
                                                )}
                                            >
                                                {task.category === "finance" ? "Finance" : "Ops"}
                                            </span>
                                            {task.priority === "high" && (
                                                <span className="bg-destructive h-2 w-2 animate-pulse rounded-full"></span>
                                            )}
                                        </div>
                                        <h3 className="text-foreground group-hover:text-primary mt-2 text-sm font-bold transition-colors">
                                            {task.title}
                                        </h3>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            {task.desc}
                                        </p>
                                    </button>
                                ))}
                            </div>
                            <div className="bg-muted/20 border-border border-t p-4">
                                <button className="bg-foreground text-background w-full rounded py-2 text-xs font-bold tracking-wider uppercase transition-opacity hover:opacity-90">
                                    Process Queue (4)
                                </button>
                            </div>
                        </section>

                        {/* Secondary Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <button className="bg-muted/30 border-border hover:bg-card hover:border-primary/30 group rounded-lg border p-4 text-left transition-all">
                                <UserPlus
                                    size={20}
                                    className="text-muted-foreground group-hover:text-primary mb-2 transition-colors"
                                />
                                <div className="text-foreground text-xs font-bold">Add Student</div>
                            </button>
                            <button className="bg-muted/30 border-border hover:bg-card hover:border-secondary/30 group rounded-lg border p-4 text-left transition-all">
                                <DollarSign
                                    size={20}
                                    className="text-muted-foreground group-hover:text-secondary mb-2 transition-colors"
                                />
                                <div className="text-foreground text-xs font-bold">Record Pay</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
