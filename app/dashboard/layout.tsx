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
                label: "Home",
                href: [DASHBOARD],
                icon: <HomeIcon className="w-4 h-4" />,
            },
            {
                label: "Register",
                href: [`${DASHBOARD}/register`],
                icon: <FaChalkboardTeacher className="w-4 h-4" />,
            },
            {
                label: "Manage Students",
                href: [`${DASHBOARD}/students`],
                icon: <UserIcon className="w-4 h-4" />,
            },
            // {
            //     label: "Parent Duty",
            //     href: [`${DASHBOARD}/parentduty`],
            //     icon: <GrGroup className="w-4 h-4" />,
            // },
        ],
    },
    {
        header: "Content",
        items: [
            {
                label: "Course List",
                href: [`${DASHBOARD}/courselist`],
                icon: <BookOpenIcon className="w-4 h-4" />,
            },
            {
                label: "Registration History",
                href: [`${DASHBOARD}/reghistory`],
                icon: <FileTextIcon className="w-4 h-4" />,
            },
            {
                label: "Balance History",
                href: [`${DASHBOARD}/balhistory`],
                icon: <DollarSign className="w-4 h-4" />,
            },
        ],
    },
    {
        header: "Other",
        items: [
            {
                label: "Contact us",
                href: [`${DASHBOARD}/contact`],
                icon: <Mail className="w-4 h-4" />,
            },
            {
                label: "Logout",
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
				<main className="flex-1 overflow-auto p-6 bg-white">
					{children}
				</main>
			</div>
		</div>
	);
}