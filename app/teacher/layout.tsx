import React from 'react';
import SideNav from '@/components/sidenav';
import { Home, Calendar } from 'lucide-react';
import Header from '@/components/header';


const navItems = [
    {
        header: "Management",
        items: [
            {
                label: "Home",
                href: ["/teacher"],
                icon: <Home className="w-4 h-4 " />
            },
            {
                label: "Semester Management",
                href: ["/teacher/class"],
                icon: <Calendar className="w-4 h-4" />
            }
        ]
    }
]
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen">
            <div className="fixed h-screen">
                <SideNav items={navItems} />
            </div>
            <div className="flex flex-col flex-1 overflow-hidden ml-64">
                <Header />
                <main className="flex-1 overflow-auto p-6 bg-white">
                    {children}
                </main>
            </div>
        </div>
    );
} 