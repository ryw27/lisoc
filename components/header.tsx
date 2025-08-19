'use client';
import { useState } from "react";
import { ChevronDown, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { type DefaultSession } from "next-auth"
import LanguageToggle from "./language-toggle";
// import LogoutButton from "./LEGACY_logout-button";


export default function Header({ user }: { user: DefaultSession["user"] }) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleLogout = () => {
        signOut({
            callbackUrl: "/",
        });
    };



    return (
        <header className="bg-white border-gray-200 sticky top-0 z-10">
            <div className="px-4">
                <div className="flex items-center h-16 w-full">
                    {/* Center with search bar */}
                    {/* ...search bar code omitted for brevity... */}

                    {/* Right side with actions */}
                    <div className="flex items-center space-x-4 ml-auto">
                        {/* Language toggle */}
                        <LanguageToggle /> 

                        {/* Profile dropdown */}
                        <div className="relative ml-3">
                            <div>
                                <button
                                    onClick={() => setIsProfileOpen((open) => !open)}
                                    className="flex cursor-pointer text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                            <User className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <ChevronDown className={`ml-1 h-4 w-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                            </div>

                            {/* Profile dropdown menu */}
                            {isProfileOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100">
                                    <div className="flex flex-col px-4 py-2 gap-0.5">
                                        <p className="text-base font-semibold text-gray-900">
                                            {user?.name ?? "Username"}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {user?.email ?? "Email"}
                                        </p>
                                    </div>
                                    <div className="border-t border-gray-800 my-1" />
                                    <div className="pb-1">
                                        <button
                                            onClick={handleLogout}
                                            className={cn(
                                                'flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors cursor-pointer w-full group',
                                                'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100'
                                            )}
                                        >
                                            <div className="flex-shrink-0 flex items-center justify-center">
                                                <LogOut className="w-5 h-5 text-gray-600" />
                                            </div>
                                            <span className="text-gray-600">Log out</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}