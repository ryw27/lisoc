"use client";
import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";


export default function LanguageToggle() {
    const [pending, start] = useTransition();
    const pathname = usePathname();
    const locale = useLocale();

    const toggleLocale = async () => {
        start(async () => {
            const switchTo = locale === "en" ? "zh" : "en";
            await setLocale(switchTo, pathname);
        });
    }

    return (
        <button
            onClick={toggleLocale}
            disabled={pending}
            className={cn(
                "w-16 h-8 flex items-center justify-center rounded-md text-[11px] font-black cursor-pointer tracking-widest transition-all",
                "text-brand-navy border border-brand-navy/10 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-gold/5"
            )}
        >
            {locale === 'en' ? '中文' : 'ENG'}
        </button>
    );
}