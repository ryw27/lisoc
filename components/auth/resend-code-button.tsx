"use client";
import { z } from 'zod/v4';
import { emailSchema } from '@/lib/auth/validation';
import { useState, useRef, useEffect } from 'react';

type resendCodeProps = {
    resendCode: (data: z.infer<typeof emailSchema>) => Promise<void>;
    email: string;
    // defaultCooldown: number;
}
export default function ResendCodeButton({resendCode, email}: resendCodeProps) {
    const [remain, setRemain] = useState<number>(0);
    const [busy, setBusy]= useState<boolean>(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const expiryRef = useRef<number | null>(null);

    const clearTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        expiryRef.current = null;
        setRemain(0);
    }

    const startCountdown = (seconds: number) => {
        // Clear any existing interval
        if (seconds <= 0) return;

        expiryRef.current = (Date.now() + seconds * 1000);
        setRemain(seconds);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        
        timerRef.current = setInterval(() => {
            if (!expiryRef.current) return;

            const left = Math.max(0, Math.ceil((expiryRef.current - Date.now()) / 1000))
            setRemain(left);
            if (left === 0) clearTimer();
        }, 1000)
    };

    useEffect(() => {
        return () => clearTimer();
    }, [])


    const onResend = async () => {
        // Start countdown immediately to prevent multiple clicks
        if (busy || remain > 0) {
            return;
        }
        setBusy(true);
        
        try {
            await resendCode({ email });
            startCountdown(30);
        } catch (error) {
            // Reset countdown on error so user can try again
            setRemain(0);
            console.error(error);
        } finally {
            setBusy(false);
        }
    }
    
    const disabled = remain > 0 || busy;
    return (
        <button
            disabled={disabled}
            className={`mt-2 container mx-auto underline ${
                disabled ? "text-gray-400 cursor-not-allowed" : "text-blue-600 cursor-pointer"
            }`}
            onClick={onResend}
        >
            {remain > 0 ? `Resend in ${remain} seconds` : disabled ? "Sending..." : "Resend Code(重新发送验证码)"}
        </button>
    )
}