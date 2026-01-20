import { NextResponse } from "next/server";
//import { headers } from 'next/headers';
import { applyCheck } from "@/server/payments/actions";

interface PaymentData {
    name: string;
    email: string;
    amount: string;
    orderID: string;
    balanceId: string;
    paidDate: string; // optional, in case we want to pass it
    familyId: string; // optional, in case we want to pass it
}

const PAYPAL_API_URL = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken() {
    try {
        const auth = Buffer.from(
            `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
        ).toString("base64");

        //       const response = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
        const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "grant_type=client_credentials",
        });

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error("Error getting PayPal access token:", error);
        throw error;
    }
}

async function capturePayPalOrder(orderID: string, accessToken: string) {
    try {
        console.log(`Capturing order ${orderID} with token ${accessToken.substring(0, 10)}...`);

        const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
        });

        const data = await response.json();
        console.log("Capture response:", data);
        return data;
    } catch (error) {
        console.error("Error capturing PayPal order:", error);
        throw error;
    }
}

export async function POST(request: Request) {
    try {
        const data: PaymentData = await request.json();
        console.log("Received payment data:", data);

        // Validate the payment data
        if (!data.name || !data.email || !data.amount || !data.orderID) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get PayPal access token
        const accessToken = await getPayPalAccessToken();
        console.log("Got PayPal access token");

        // Capture the payment
        const captureData = await capturePayPalOrder(data.orderID, accessToken);
        console.log("PayPal capture response:", captureData);

        // Check if capture was successful
        if (captureData.status !== "COMPLETED") {
            console.log(`Invalid capture status: ${captureData.status}`);
            return NextResponse.json(
                { error: `Payment capture failed with status: ${captureData.status}` },
                { status: 400 }
            );
        }

        // now update our database accordingly
        const balanceId = data.balanceId;
        const amount = parseFloat(data.amount);
        const paidDate = data.paidDate ? new Date(data.paidDate) : new Date();
        const fid = parseInt(data.familyId);

        const paymentRecord = {
            balanceid: parseInt(balanceId),
            amount: amount,
            checkNo: `${data.orderID}`,
            paidDate: paidDate,
            note: `PayPal Capture ID: ${captureData.id}`,
        };

        try {
            await applyCheck(paymentRecord, fid);
        } catch (error) {
            console.error(error);
        }

        return NextResponse.json(
            {
                success: true,
                message: "Payment captured successfully",
                data: {
                    name: data.name,
                    email: data.email,
                    amount: data.amount,
                    orderID: data.orderID,
                    captureID: captureData.id,
                    captureStatus: captureData.status,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Payment processing error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: "Payment API endpoint" }, { status: 200 });
}
