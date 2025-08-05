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
        <div className="flex h-screen">
            <div className="fixed h-screen">
                <SideNav items={navItems} />
            </div>
            <div className="flex flex-col flex-1 overflow-hidden ml-64">
                <Header user={user.user} />
                <main className="flex-1 overflow-auto p-6 bg-white">
                    {children}
                </main>
            </div>
        </div>
    );
} 