import React from 'react';
import SideNav from '@/components/sidenav';
import Header from '@/components/header';
import { HomeIcon, UserIcon, FileTextIcon, BookOpenIcon, DollarSign, Mail, LogOut } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { FaChalkboardTeacher } from "react-icons/fa";

const DASHBOARD = "/dashboard";
interface NavItem {
    label: string;
    href: string[];
    icon: React.ReactNode;
}

interface NavSection {
    header: string;
    items: NavItem[];
}

const navItems: NavSection[] = [
    {
        header: "Dashboard",
        items: [
            {
                label: "Home(首页)",
                href: [DASHBOARD],
                icon: <HomeIcon className="w-4 h-4" />,
            },
            {
                label: "Register（注册）",
                href: [`${DASHBOARD}/register`],
                icon: <FaChalkboardTeacher className="w-4 h-4" />,
            },
            {
                label: "Manage Students（更新学生）",
                href: [`${DASHBOARD}/students`],
                icon: <UserIcon className="w-4 h-4" />,
            },
            {
                label: "Manage Family（更新家庭）",
                href: [`${DASHBOARD}/family`],
                icon: <UserIcon className="w-4 h-4" />,
            },

            {
                 label: "Parent Duty（家长值班）",
                 href: [`${DASHBOARD}/parentduty`],
                 icon: <UserIcon className="w-4 h-4" />,
             },
        ],
    },
    {
        header: "Content",
        items: [
            {
                label: "Course List（课程列表）",
                href: [`${DASHBOARD}/courselist`],
                icon: <BookOpenIcon className="w-4 h-4" />,
            },
            {
                label: "Registration History（注册记录）",
                href: [`${DASHBOARD}/reghistory`],
                icon: <FileTextIcon className="w-4 h-4" />,
            },
            {
                label: "Balance History（缴费记录）",
                href: [`${DASHBOARD}/balhistory`],
                icon: <DollarSign className="w-4 h-4" />,
            },
        ],
    },
    {
        header: "Other",
        items: [
            {
                label: "Contact us（联系我们）",
                href: [`${DASHBOARD}/contact`],
                icon: <Mail className="w-4 h-4" />,
            },
            {
                label: "Logout（退出）",
                href: [`${DASHBOARD}/logout`],
                icon: <LogOut className="w-4 h-4" />,
            },
        ],
    },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const user = await requireRole(["FAMILY"]);
    return (
        <div className="flex h-screen">
            <div className="fixed h-screen">
                <SideNav items={navItems} />
            </div>
            <div className="flex flex-col flex-1 overflow-hidden ml-64">
                <Header user={user.user} />
                <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-blue-100 via-white to-blue-300">
                    {children}
                </main>
            </div>
        </div>
    );
}