import React from 'react';
import SideNav from '@/components/sidenav';
import { Home, Calendar } from 'lucide-react';
import Header from '@/components/header';
import { requireRole } from '@/lib/auth';
import { FaChalkboardTeacher } from 'react-icons/fa';

const navItems = [
    {
        header: "Content",
        items: [
            {
                label: "Home",
                href: ["/teacher"],
                icon: <Home className="w-4 h-4 " />
            },
            {
                label: "Class Management",
                href: ["/teacher/class"],
                icon: <FaChalkboardTeacher className="w-4 h-4" />
            },
            {
                label: "Previous Classes",
                href: ["/teacher/previous-classes"],
                icon: <Calendar className="w-4 h-4" />
            }
        ]
    }
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const user = await requireRole(["TEACHER"]);

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            {/* SideNav */}
                <SideNav items={navItems} />
            { /* Header + Content */ }
            <div className="flex flex-col flex-1 min-w-0 h-full relative">
                {/* Header */}
                <Header user={user.user} />
                <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="max-w-[1400px] mx-auto w-full">
                    {children}
                    </div>
                </main>
            </div>
        </div>
    );
}