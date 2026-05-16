import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientIp, enforceRateLimit, RateLimitError } from "@/lib/rateLimit";
import { FAMILYBALANCE_TYPE_PAYMENT } from "@/lib/utils";
import { applyCheck } from "@/server/payments/actions";

const PAYPAL_API_URL = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

const paymentRequestSchema = z.object({
    orderID: z.string().min(1).max(64),
    balanceId: z.coerce.number().int().positive(),
});

async function getPayPalAccessToken(): Promise<string> {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error("PayPal credentials not configured");
    }
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });

    if (!response.ok) {
        throw new Error(`PayPal token request failed: ${response.status}`);
    }

    const data = (await response.json()) as { access_token?: string };
    if (!data.access_token) {
        throw new Error("PayPal token response missing access_token");
    }
    return data.access_token;
}

interface PayPalCapture {
    id?: string;
    status?: string;
    purchase_units?: Array<{
        payments?: {
            captures?: Array<{
                amount?: { value?: string; currency_code?: string };
            }>;
        };
    }>;
}

async function capturePayPalOrder(orderID: string, accessToken: string): Promise<PayPalCapture> {
    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
    });

    return (await response.json()) as PayPalCapture;
}

export async function POST(request: Request) {
    // 1. Authentication — middleware excludes /api/*, so we self-check here.
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const role = session.user.role;

    // 2. Rate limit per user and per IP. Either bucket can deny.
    try {
        enforceRateLimit(`payment:user:${userId}`, { max: 10, windowMs: 5 * 60_000 });
        const ip = await clientIp();
        enforceRateLimit(`payment:ip:${ip}`, { max: 30, windowMs: 5 * 60_000 });
    } catch (err) {
        if (err instanceof RateLimitError) {
            return NextResponse.json(
                { error: "Too many payment attempts. Please try again later." },
                {
                    status: 429,
                    headers: { "Retry-After": String(Math.ceil(err.retryAfterMs / 1000)) },
                }
            );
        }
        throw err;
    }

    // 3. Parse + validate body. Reject anything that isn't a shaped request.
    const raw = await request.json().catch(() => null);
    const parsed = paymentRequestSchema.safeParse(raw);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { orderID, balanceId } = parsed.data;

    // 4. Load the target balance row server-side. Never trust a client-sent
    //    familyId — derive it from the balance row, then verify the caller owns it.
    const target = await db.query.familybalance.findFirst({
        where: (fb, { eq }) => eq(fb.balanceid, balanceId),
    });
    if (!target) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (role === "FAMILY") {
        const fam = await db.query.family.findFirst({
            where: (f, { eq }) => eq(f.userid, userId),
        });
        if (!fam || fam.familyid !== target.familyid) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    } else if (role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 5. Idempotency: if we already recorded this PayPal order, don't double-credit.
    //    `checkno` stores the order ID for PayPal-originated rows.
    const existing = await db.query.familybalance.findFirst({
        where: (fb, { eq }) => eq(fb.checkno, orderID),
    });
    if (existing) {
        return NextResponse.json(
            {
                success: true,
                idempotent: true,
                message: "Payment already recorded",
                captureID: orderID,
            },
            { status: 200 }
        );
    }

    // 6. Capture via PayPal. Any error before this point is safe to retry.
    let captureData: PayPalCapture;
    try {
        const accessToken = await getPayPalAccessToken();
        captureData = await capturePayPalOrder(orderID, accessToken);
    } catch (err) {
        console.error("PayPal capture failed:", err);
        return NextResponse.json(
            { error: "Payment processor unavailable. Please try again." },
            { status: 502 }
        );
    }

    if (captureData.status !== "COMPLETED") {
        return NextResponse.json(
            { error: `Payment capture failed with status: ${captureData.status ?? "unknown"}` },
            { status: 400 }
        );
    }

    // 7. Use the AMOUNT FROM PAYPAL'S CAPTURE RESPONSE, never the client's request.
    const capturedUnit = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const capturedAmountStr = capturedUnit?.amount?.value;
    const capturedCurrency = capturedUnit?.amount?.currency_code;
    if (!capturedAmountStr || !capturedCurrency) {
        console.error("[PAYMENT-RECONCILE] PayPal capture response missing amount", captureData);
        return NextResponse.json(
            { error: "Could not verify captured amount", captureID: captureData.id },
            { status: 502 }
        );
    }
    if (capturedCurrency !== "USD") {
        return NextResponse.json(
            { error: `Unsupported currency: ${capturedCurrency}`, captureID: captureData.id },
            { status: 400 }
        );
    }

    const amountNumber = Number(capturedAmountStr);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
        return NextResponse.json(
            { error: "Invalid captured amount", captureID: captureData.id },
            { status: 400 }
        );
    }

    // 8. Record the credit. Bubble up any failure — never silently swallow:
    //    the customer's money has already been taken at this point.
    try {
        await applyCheck(
            {
                balanceid: balanceId,
                amount: amountNumber,
                checkNo: orderID,
                paidDate: new Date(),
                feeTypeId: FAMILYBALANCE_TYPE_PAYMENT,
                note: `PayPal Capture ID: ${captureData.id}`,
            },
            target.familyid
        );
    } catch (err) {
        // Critical: PayPal took the money but we failed to record the credit.
        // Log loud, return an error the client/operator can act on, and include
        // the capture ID so the row can be manually reconciled.
        console.error("[PAYMENT-RECONCILE] PayPal captured but DB write failed", {
            orderID,
            captureID: captureData.id,
            balanceId,
            amount: amountNumber,
            err,
        });
        return NextResponse.json(
            {
                error: "Payment was captured but failed to apply. Please contact the administrator with the Capture ID below; do not retry the payment.",
                captureID: captureData.id,
                needsManualReconciliation: true,
            },
            { status: 500 }
        );
    }

    return NextResponse.json(
        {
            success: true,
            message: "Payment captured successfully",
            captureID: captureData.id,
            captureStatus: captureData.status,
            amount: capturedAmountStr,
        },
        { status: 200 }
    );
}

export async function GET() {
    return NextResponse.json({ message: "Payment API endpoint" }, { status: 200 });
}
