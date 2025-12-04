'use client' ;
import { FamilyLoginForm } from "@/components/auth/family-login-form"

export default function Page() {
  return (
    <div className="flex flex-col min-h-[100vh] w-full justify-between">
      <div className="flex flex-col items-center justify-center flex-1 p-6 md:p-10">
        <div className="w-full max-w-6xl p-12">
          <h1 className="text-3xl font-bold text-center mb-4 text-blue-700 flex items-center justify-center gap-3">
            <img src="./Banner_lisoc.jpg" alt="LISOC Icon" className="w-336 h-26 inline-block" />
          </h1>
          <div className="w-full flex justify-center mb-8">
            <BannerLine />
          </div>
          <FamilyLoginForm />
          <div className="mt-8 text-xs text-gray-400 text-center font-bold">
            &copy; {new Date().getFullYear()} Long Island School of Chinese. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  )

function BannerLine() {
  
  const date_options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  const date = new Date().toLocaleDateString('en-US', date_options);
  return (
    <div className="w-full h-10 bg-gradient-to-r from-blue-400 via-blue-200 to-blue-400 flex items-center justify-between rounded-lg shadow px-6">
    <span className="text-white text-base font-medium tracking-wide text-left">{date}</span>
    <span className="text-white text-base font-medium tracking-wide text-right">Online Registration Help or Feedback: regadmingroup@lisoc.org  </span>
    </div>
  )
}
}
