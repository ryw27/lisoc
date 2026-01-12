"use client";

import { FamilyLoginForm } from "@/components/auth/family-login-form";

export default function Page() {
    return (
        <div className="bg-background text-foreground flex min-h-screen w-full flex-col justify-between font-sans">
            <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-6xl space-y-8 p-4 md:p-12">
                    {/* Header Section */}
                    <div className="flex flex-col items-center justify-center gap-6">
                        <h1 className="flex items-center justify-center">
                            <img
                                src="./Banner_lisoc.jpg"
                                alt="LISOC Icon"
                                // mix-blend-multiply hides the white background on parchment
                                className="inline-block h-auto mix-blend-multiply"
                            />
                        </h1>

                        {/* The decorative line separator */}
                        <div className="flex w-full justify-center">
                            <BannerLine />
                        </div>
                    </div>

                    {/* Login Form Container */}
                    <div className="flex justify-center">
                        <FamilyLoginForm />
                    </div>

                    {/* Footer */}
                    <div className="text-muted-foreground mt-12 text-center text-xs font-bold tracking-wider uppercase">
                        &copy; {new Date().getFullYear()} Long Island School of Chinese. All rights
                        reserved.
                    </div>
                </div>
            </div>
        </div>
    );

    function BannerLine() {
        // const date_options: Intl.DateTimeFormatOptions = {
        //     weekday: "long",
        //     year: "numeric",
        //     month: "long",
        //     day: "numeric",
        // };

        return (
            <div className="flex w-full max-w-4xl items-center gap-4">
                {/* Left Line */}
                <div className="via-secondary/50 to-secondary h-[1px] flex-1 bg-gradient-to-r from-transparent"></div>

                {/* Optional decorative center dot or small icon */}
                <div className="bg-secondary h-2 w-2 rounded-full shadow-sm"></div>

                {/* Right Line */}
                <div className="from-secondary via-secondary/50 h-[1px] flex-1 bg-gradient-to-r to-transparent"></div>
            </div>
        );
    }
}
