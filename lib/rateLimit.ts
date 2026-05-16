// In-memory sliding-window rate limiter.
//
// This is a per-process counter. For multi-instance deployments (Vercel,
// horizontal autoscaling, etc.) this should be backed by Redis / Upstash
// so the buckets are shared across instances. Until then, the limits below
// give defense-in-depth on a single process and still meaningfully slow
// down credential-stuffing or brute-force OTP attempts.

import { headers as nextHeaders } from "next/headers";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
    if (now - lastSweep < 60_000) return;
    lastSweep = now;
    for (const [key, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(key);
    }
}

export interface RateLimitOptions {
    max: number;
    windowMs: number;
}

export interface RateLimitOk {
    ok: true;
    remaining: number;
    resetAt: number;
}

export interface RateLimitDenied {
    ok: false;
    remaining: 0;
    retryAfterMs: number;
}

export type RateLimitResult = RateLimitOk | RateLimitDenied;

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
    const now = Date.now();
    sweep(now);
    const b = buckets.get(key);
    if (!b || b.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
        return { ok: true, remaining: opts.max - 1, resetAt: now + opts.windowMs };
    }
    if (b.count >= opts.max) {
        return { ok: false, remaining: 0, retryAfterMs: b.resetAt - now };
    }
    b.count += 1;
    return { ok: true, remaining: opts.max - b.count, resetAt: b.resetAt };
}

export class RateLimitError extends Error {
    readonly retryAfterMs: number;
    readonly code = "rate-limited";
    constructor(retryAfterMs: number, message = "Too many requests. Please try again later.") {
        super(message);
        this.name = "RateLimitError";
        this.retryAfterMs = retryAfterMs;
    }
}

export function enforceRateLimit(key: string, opts: RateLimitOptions): void {
    const res = rateLimit(key, opts);
    if (!res.ok) {
        throw new RateLimitError(res.retryAfterMs);
    }
}

export async function clientIp(): Promise<string> {
    try {
        const h = await nextHeaders();
        const xff = h.get("x-forwarded-for");
        if (xff) {
            const first = xff.split(",")[0]?.trim();
            if (first) return first;
        }
        const realIp = h.get("x-real-ip");
        if (realIp) return realIp;
    } catch {
        // headers() can throw outside a request scope; fall through.
    }
    return "unknown";
}

// Test-only: clear all buckets. Not exported for production use elsewhere.
export function __resetRateLimitForTests() {
    buckets.clear();
    lastSweep = 0;
}
