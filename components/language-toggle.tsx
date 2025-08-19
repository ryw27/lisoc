"use client";
import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/";
import { Button } from "./ui/button";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";


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
        <Button
            onClick={toggleLocale}
            disabled={pending}
            className="text-gray-500 text-sm cursor-pointer hover:text-gray-700 p-2 rounded-md hover:bg-blue-50 transition-colors"
        >
            {locale === 'en' ? '中文' : 'English'}
            <span className="sr-only">Toggle language</span>
        </Button>

    )
}