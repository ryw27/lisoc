'use client';

import { useState } from "react";
import { Search, Bell, HelpCircle, ChevronDown, Sun, Moon, Settings, User, LogOut } from "lucide-react";
import LogoutButton from "./logout-button";

export default function Header() {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [language, setLanguage] = useState('en');
    const [theme, setTheme] = useState('light');
    
    // Toggle language
    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'zh' : 'en');
    };

    return (
        <header className="bg-white border-gray-200 sticky top-0 z-10">
            <div className="px-4">
                <div className="flex items-center h-16 w-full">


                    {/* Center with search bar */}
                    <div className="flex-1 max-w-2xl px-4 mx-auto">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input 
                                type="text" 
                                placeholder={language === 'en' ? "Search..." : "搜索..."}
                                className="block w-full bg-gray-100 pl-10 pr-3 py-2 border border-white rounded-md text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Right side with actions */}
                    <div className="flex items-center space-x-4 ml-auto">
                        {/* Language toggle */}
                        <button 
                            onClick={toggleLanguage}
                            className="text-gray-500 text-sm cursor-pointer hover:text-gray-700 p-2 rounded-md hover:bg-blue-50 transition-colors"
                        >
                            {language === 'en' ? '中文' : 'English'}
                            <span className="sr-only">Toggle language</span>
                        </button>

                        {/* Help button */}
                        {/* <button className="cursor-pointer text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-blue-50 transition-colors">
                            <HelpCircle className="h-5 w-5" />
                            <span className="sr-only">Help</span>
                        </button>*/}

                        {/* Notifications */}
                        {/* <button className="cursor-pointer text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-blue-50 transition-colors relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1 right-1 bg-blue-600 rounded-full w-2 h-2"></span>
                            <span className="sr-only">Notifications</span>
                        </button>

                        {/* Profile dropdown */}
                        <div className="relative ml-3">
                            <div>
                                <button 
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
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
                                    <div className="py-1">
                                        <p className="px-4 py-2 text-sm text-gray-700 font-medium">User Name</p>
                                        <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">
                                            <User className="mr-3 h-4 w-4 text-gray-400" />
                                            <span>Your Profile</span>
                                        </a>
                                        <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">
                                            <Settings className="mr-3 h-4 w-4 text-gray-400" />
                                            <span>Settings</span>
                                        </a>
                                        <button 
                                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                                        >
                                            {theme === 'light' ? 
                                                <Moon className="mr-3 h-4 w-4 text-gray-400" /> : 
                                                <Sun className="mr-3 h-4 w-4 text-gray-400" />
                                            }
                                            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                                        </button>
                                    </div>
                                    <div className="py-1">
                                        <LogoutButton />
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