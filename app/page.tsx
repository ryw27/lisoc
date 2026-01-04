"use client";

import { FamilyLoginForm } from "@/components/auth/family-login-form";

export default function Page() {
    return (
        <div className="flex min-h-[100vh] w-full flex-col justify-between">
            <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-6xl p-12">
                    <h1 className="mb-4 flex items-center justify-center gap-3 text-center text-3xl font-bold text-blue-700">
                        <img
                            src="./Banner_lisoc.jpg"
                            alt="LISOC Icon"
                            className="inline-block h-26 w-336"
                        />
                    </h1>
                    <div className="mb-8 flex w-full justify-center">
                        <BannerLine />
                    </div>
                    <FamilyLoginForm />
                    <div className="mt-8 text-center text-xs font-bold text-gray-400">
                        &copy; {new Date().getFullYear()} Long Island School of Chinese. All rights
                        reserved.
                    </div>
                </div>
            </div>
        </div>
    );

    function BannerLine() {
        const date_options: Intl.DateTimeFormatOptions = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        };

        const date = new Date().toLocaleDateString("en-US", date_options);
        return (
            <div className="flex h-10 w-full items-center justify-between rounded-lg bg-gradient-to-r from-blue-400 via-blue-200 to-blue-400 px-6 shadow">
                <span className="text-left text-base font-medium tracking-wide text-white">
                    {date}
                </span>
                <span className="text-right text-base font-medium tracking-wide text-white">
                    Online Registration Help or Feedback: regadmingroup@lisoc.org{" "}
                </span>
            </div>
        );
    }
}
