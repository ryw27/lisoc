"use client";

import React, { useState } from "react";
import { Check, Filter, Mail, MoreHorizontal, Printer, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types & Mock Data ---
type BillingStatus = "Paid" | "Unpaid" | "Partial" | "Overdue";

interface Family {
    id: number;
    name: string;
    students: string[];
    balance: number;
    lastAction: string;
    status: BillingStatus;
}

const FAMILIES: Family[] = [
    {
        id: 1,
        name: "Wang",
        students: ["David (G5)", "Sarah (G2)"],
        balance: 0,
        lastAction: "Check #442 cleared",
        status: "Paid",
    },
    {
        id: 2,
        name: "Chen",
        students: ["Michael (KG)"],
        balance: 600,
        lastAction: "Inv #102 Sent",
        status: "Partial",
    },
    {
        id: 3,
        name: "Smith-Li",
        students: ["Jennifer (G8)", "Eric (G6)"],
        balance: 2800,
        lastAction: "Payment Failed",
        status: "Overdue",
    },
    {
        id: 4,
        name: "Zhang",
        students: ["Kevin (G1)"],
        balance: 0,
        lastAction: "Paid in Cash",
        status: "Paid",
    },
    {
        id: 5,
        name: "Wu",
        students: ["Lisa (G3)"],
        balance: 400,
        lastAction: "Extension req",
        status: "Partial",
    },
    {
        id: 6,
        name: "Liu",
        students: ["Grace (G4)"],
        balance: 1200,
        lastAction: "Inv #105 Sent",
        status: "Unpaid",
    },
];

const MACRO_STATS = {
    revenue: 125000,
    outstanding: 26500,
    collectionRate: 82,
};

// --- Sub-Components ---

// 1. The "Ink Stamp" - Pure CSS visual flair
const StatusStamp = ({ status }: { status: BillingStatus }) => {
    if (status === "Paid") {
        return (
            <div className="border-brand-navy/20 text-brand-navy/20 mask-image-grunge pointer-events-none absolute top-10 right-10 -rotate-12 border-4 px-6 py-2 text-4xl font-black tracking-[0.2em] uppercase opacity-50 mix-blend-multiply select-none">
                PAID IN FULL
            </div>
        );
    }
    if (status === "Overdue") {
        return (
            <div className="pointer-events-none absolute top-10 right-10 -rotate-12 border-4 border-red-900/20 px-6 py-2 text-4xl font-black tracking-[0.2em] text-red-900/20 uppercase opacity-50 mix-blend-multiply select-none">
                OVERDUE
            </div>
        );
    }
    return null;
};

// 2. The Invoice Item Row
const LineItem = ({ label, sub, amount }: { label: string; sub?: string; amount: number }) => (
    <div className="border-brand-brass/10 group hover:bg-brand-brass/5 -mx-4 flex items-baseline justify-between rounded-md border-b px-4 py-4 transition-colors last:border-0">
        <div>
            <p className="text-brand-navy font-bold">{label}</p>
            {sub && (
                <p className="text-brand-navy/50 mt-1 text-xs font-medium tracking-wide uppercase">
                    {sub}
                </p>
            )}
        </div>
        <div className="text-brand-navy font-mono text-lg font-medium tabular-nums">
            {amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
        </div>
    </div>
);

export default function BillingWorkspace() {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const selectedFamily = FAMILIES.find((f) => f.id === selectedId);

    // Dummy context props

    return (
        <div className="bg-background font-heritage text-brand-navy flex h-screen w-full overflow-hidden">
            <div className="flex h-full min-w-0 flex-1 flex-col">
                {/* --- MASTER-DETAIL SPLIT VIEW --- */}
                <main className="flex flex-1 overflow-hidden">
                    {/* --- PANE 1: THE REGISTRY (List) --- */}
                    <div className="border-brand-brass/20 relative z-20 flex w-[400px] flex-col border-r bg-[#FCF9F2] shadow-xl">
                        {/* List Header */}
                        <div className="shrink-0 p-6 pb-2">
                            <h2 className="text-brand-brass mb-4 text-xs font-black tracking-[0.25em] uppercase">
                                Registry // Fall 2025
                            </h2>
                            <div className="group relative">
                                <Search
                                    size={16}
                                    className="text-brand-navy/40 group-focus-within:text-brand-gold absolute top-1/2 left-0 -translate-y-1/2 transition-colors"
                                />
                                <input
                                    type="text"
                                    placeholder="Find family..."
                                    className="border-brand-brass/20 text-brand-navy placeholder:text-brand-navy/20 focus:border-brand-navy w-full border-b-2 bg-transparent py-3 pl-8 font-serif text-xl transition-all focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Scrollable List */}
                        <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-3">
                            {FAMILIES.map((family) => {
                                const isSelected = selectedId === family.id;
                                return (
                                    <button
                                        key={family.id}
                                        onClick={() => setSelectedId(family.id)}
                                        className={cn(
                                            "group relative w-full overflow-hidden rounded-lg border border-transparent p-4 text-left transition-all duration-300",
                                            isSelected
                                                ? "border-brand-brass/20 scale-[1.02] bg-white shadow-[0_4px_20px_-12px_rgba(0,0,0,0.2)]"
                                                : "hover:bg-brand-navy/5 hover:pl-5"
                                        )}
                                    >
                                        <div className="mb-1 flex items-start justify-between">
                                            <span
                                                className={cn(
                                                    "font-serif text-lg font-bold transition-colors",
                                                    isSelected
                                                        ? "text-brand-navy"
                                                        : "text-brand-navy/80"
                                                )}
                                            >
                                                <span className="mr-1 font-normal italic opacity-50">
                                                    The
                                                </span>{" "}
                                                {family.name}s
                                            </span>
                                            {family.balance > 0 ? (
                                                <span className="rounded bg-red-100/50 px-2 py-0.5 font-mono text-sm font-bold text-red-900">
                                                    ${family.balance}
                                                </span>
                                            ) : (
                                                <Check size={16} className="text-brand-navy/30" />
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-brand-navy/50 max-w-[180px] overflow-hidden font-medium tracking-wider text-ellipsis whitespace-nowrap uppercase">
                                                {family.students.join(", ")}
                                            </span>
                                            <span
                                                className={cn(
                                                    "h-2 w-2 rounded-full",
                                                    family.status === "Paid"
                                                        ? "bg-brand-navy/20"
                                                        : family.status === "Overdue"
                                                          ? "animate-pulse bg-red-500"
                                                          : "bg-brand-gold"
                                                )}
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Bottom Filter Bar */}
                        <div className="border-brand-brass/10 bg-brand-brass/5 text-brand-navy/50 flex items-center justify-between border-t p-4 text-[10px] font-black tracking-widest uppercase">
                            <span>Sort: Status</span>
                            <button className="hover:text-brand-navy flex items-center gap-1">
                                <Filter size={12} /> Filter
                            </button>
                        </div>
                    </div>

                    {/* --- PANE 2: THE WORKSPACE (Dynamic) --- */}
                    <div className="relative flex flex-1 flex-col bg-white">
                        {/* SCENARIO A: NO SELECTION (Macro Dashboard) */}
                        {!selectedId && (
                            <div className="flex flex-1 flex-col items-center justify-center bg-[url('/noise.png')] p-12 opacity-100">
                                <div className="w-full max-w-2xl space-y-12">
                                    <div className="space-y-2 text-center">
                                        <h1 className="text-brand-navy font-serif text-5xl font-medium italic">
                                            Semester Overview
                                        </h1>
                                        <p className="text-brand-brass text-xs font-bold tracking-[0.2em] uppercase">
                                            Financial Health Report // Fall 2025
                                        </p>
                                    </div>

                                    <div className="bg-brand-brass/20 border-brand-brass/20 grid grid-cols-2 gap-px border">
                                        <div className="hover:bg-brand-brass/5 group flex cursor-default flex-col items-center justify-center bg-white p-12 transition-colors">
                                            <span className="text-brand-navy/40 group-hover:text-brand-gold mb-4 text-sm font-black tracking-widest uppercase transition-colors">
                                                Total Revenue
                                            </span>
                                            <span className="text-brand-navy font-serif text-6xl tracking-tighter tabular-nums">
                                                {(MACRO_STATS.revenue / 1000).toFixed(0)}
                                                <span className="text-brand-navy/40 mt-2 inline-block align-top text-2xl">
                                                    k
                                                </span>
                                            </span>
                                        </div>
                                        <div className="group flex cursor-default flex-col items-center justify-center bg-white p-12 transition-colors hover:bg-red-50/50">
                                            <span className="text-brand-navy/40 mb-4 text-sm font-black tracking-widest uppercase transition-colors group-hover:text-red-900/60">
                                                Outstanding
                                            </span>
                                            <span className="font-serif text-6xl tracking-tighter text-red-900 tabular-nums">
                                                {(MACRO_STATS.outstanding / 1000).toFixed(1)}
                                                <span className="mt-2 inline-block align-top text-2xl text-red-900/40">
                                                    k
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-brand-navy/50 font-serif text-sm italic">
                                            "The collection rate is currently at{" "}
                                            <strong className="text-brand-navy not-italic">
                                                {MACRO_STATS.collectionRate}%
                                            </strong>
                                            . There are{" "}
                                            <strong className="text-brand-navy not-italic">
                                                {FAMILIES.filter((f) => f.balance > 0).length}{" "}
                                                families
                                            </strong>{" "}
                                            requiring attention."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SCENARIO B: FAMILY SELECTED (The Folio) */}
                        {selectedFamily && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 flex h-full flex-1 flex-col duration-500">
                                {/* Toolbar */}
                                <div className="border-brand-brass/10 flex h-16 shrink-0 items-center justify-between border-b bg-white px-8">
                                    <div className="text-brand-navy/50 flex items-center gap-4 text-xs font-bold tracking-widest uppercase">
                                        <span className="text-brand-navy">
                                            Folio #00{selectedFamily.id}
                                        </span>
                                        <span className="bg-brand-brass/30 h-4 w-px" />
                                        <span>Last Activity: {selectedFamily.lastAction}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="hover:bg-brand-navy/5 text-brand-navy/60 hover:text-brand-navy rounded-full p-2 transition-colors">
                                            <Printer size={18} />
                                        </button>
                                        <button className="hover:bg-brand-navy/5 text-brand-navy/60 hover:text-brand-navy rounded-full p-2 transition-colors">
                                            <Mail size={18} />
                                        </button>
                                        <button className="hover:bg-brand-navy/5 text-brand-navy/60 hover:text-brand-navy rounded-full p-2 transition-colors">
                                            <MoreHorizontal size={18} />
                                        </button>
                                        <button
                                            onClick={() => setSelectedId(null)}
                                            className="ml-4 rounded-full p-2 text-red-900/60 transition-colors hover:bg-red-50 hover:text-red-900"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* The "Paper" Content */}
                                <div className="custom-scrollbar flex-1 overflow-y-auto bg-[#FCF9F2]/30 p-12">
                                    <div className="border-brand-brass/10 relative mx-auto min-h-[800px] max-w-3xl border bg-white p-16 shadow-[0_20px_50px_-12px_rgba(10,25,47,0.1)]">
                                        {/* The Stamp Graphic */}
                                        <StatusStamp status={selectedFamily.status} />

                                        {/* Letterhead */}
                                        <div className="mb-16 space-y-4 text-center">
                                            <div className="bg-brand-navy text-brand-gold border-brand-gold/30 mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-double font-serif text-2xl font-bold">
                                                L
                                            </div>
                                            <h1 className="text-brand-navy font-serif text-4xl">
                                                Tuition Statement
                                            </h1>
                                            <p className="text-brand-brass text-sm font-bold tracking-[0.2em] uppercase">
                                                Fall Semester 2025
                                            </p>
                                        </div>

                                        {/* Bill To Section */}
                                        <div className="border-brand-navy mb-16 flex items-end justify-between border-b-2 pb-8">
                                            <div>
                                                <p className="text-brand-navy/40 mb-2 text-[10px] font-black tracking-widest uppercase">
                                                    Bill To
                                                </p>
                                                <h2 className="text-brand-navy font-serif text-2xl font-bold">
                                                    The {selectedFamily.name} Family
                                                </h2>
                                                <p className="text-brand-navy/60 mt-1 text-sm">
                                                    123 Heritage Lane, Syosset NY
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-brand-navy/40 mb-1 text-[10px] font-black tracking-widest uppercase">
                                                    Amount Due
                                                </p>
                                                <p
                                                    className={cn(
                                                        "font-mono text-4xl font-bold tracking-tight",
                                                        selectedFamily.balance > 0
                                                            ? "text-red-900"
                                                            : "text-brand-navy"
                                                    )}
                                                >
                                                    {selectedFamily.balance.toLocaleString(
                                                        "en-US",
                                                        { style: "currency", currency: "USD" }
                                                    )}
                                                </p>
                                                <p className="mt-1 text-xs font-bold tracking-wider text-red-900 uppercase">
                                                    Due by Oct 15th
                                                </p>
                                            </div>
                                        </div>

                                        {/* Line Items */}
                                        <div className="mb-16 space-y-2">
                                            <p className="text-brand-navy/40 mb-4 text-[10px] font-black tracking-widest uppercase">
                                                Itemized Charges
                                            </p>

                                            {selectedFamily.students.map((student, idx) => (
                                                <React.Fragment key={idx}>
                                                    <LineItem
                                                        label={`Tuition: ${student.split("(")[1].replace(")", "")}`}
                                                        sub={`Student: ${student.split("(")[0]}`}
                                                        amount={600}
                                                    />
                                                    <LineItem
                                                        label="Material Fee"
                                                        sub="Standard Pack"
                                                        amount={50}
                                                    />
                                                </React.Fragment>
                                            ))}

                                            {/* Deductions */}
                                            {selectedFamily.status !== "Unpaid" && (
                                                <div className="text-brand-navy/60 -mx-4 flex items-baseline justify-between px-4 py-4 italic">
                                                    <span>Payment Received (Check #4402)</span>
                                                    <span className="font-mono tabular-nums">
                                                        - $650.00
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Total Calculation */}
                                        <div className="border-brand-brass/20 flex justify-end border-t pt-8">
                                            <div className="w-64 space-y-4">
                                                <div className="text-brand-navy/60 flex justify-between text-sm font-bold tracking-wider uppercase">
                                                    <span>Subtotal</span>
                                                    <span>
                                                        $
                                                        {(
                                                            selectedFamily.students.length * 650
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="text-brand-navy/60 flex justify-between text-sm font-bold tracking-wider uppercase">
                                                    <span>Credits</span>
                                                    <span>
                                                        -$
                                                        {(selectedFamily.balance === 0
                                                            ? selectedFamily.students.length * 650
                                                            : 0
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="text-brand-navy border-brand-navy flex justify-between border-t-2 pt-4 text-xl font-black">
                                                    <span>Total Due</span>
                                                    <span>
                                                        ${selectedFamily.balance.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
