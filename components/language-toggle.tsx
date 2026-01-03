"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { setLocale } from "@/server/i18n/setLocale";

export default function LanguageToggle() {
    const [pending, start] = useTransition();
    const pathname = usePathname();
    const locale = useLocale();

    const toggleLocale = async () => {
        start(async () => {
            const switchTo = locale === "en" ? "zh" : "en";
            await setLocale(switchTo, pathname);
        });
    };

    return (
        <button
            onClick={toggleLocale}
            disabled={pending}
            className={cn(
                "flex h-8 w-16 cursor-pointer items-center justify-center rounded-md text-[11px] font-black tracking-widest transition-all",
                "text-brand-navy border-brand-navy/10 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-gold/5 border"
            )}
        >
            {locale === "en" ? "中文" : "ENG"}
        </button>
    );
}
