import React from "react";
import {
    BookOpenIcon,
    DollarSign,
    FileTextIcon,
    HomeIcon,
    LogOut,
    Mail,
    UserIcon,
} from "lucide-react";
import { FaChalkboardTeacher } from "react-icons/fa";
import { requireRole } from "@/server/auth/actions";
import Header from "@/components/header";
import SideNav from "@/components/sidenav";

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
                icon: <HomeIcon className="h-4 w-4" />,
            },
            {
                label: "Register（注册）",
                href: [`${DASHBOARD}/register`],
                icon: <FaChalkboardTeacher className="h-4 w-4" />,
            },
            {
                label: "Manage Students（更新学生）",
                href: [`${DASHBOARD}/students`],
                icon: <UserIcon className="h-4 w-4" />,
            },
            {
                label: "Manage Family（更新家庭）",
                href: [`${DASHBOARD}/family`],
                icon: <UserIcon className="h-4 w-4" />,
            },

            {
                label: "Parent Duty（家长值班）",
                href: [`${DASHBOARD}/parentduty`],
                icon: <UserIcon className="h-4 w-4" />,
            },
        ],
    },
    {
        header: "Content",
        items: [
            {
                label: "Course List（课程列表）",
                href: [`${DASHBOARD}/courselist`],
                icon: <BookOpenIcon className="h-4 w-4" />,
            },
            {
                label: "Registration History（注册记录）",
                href: [`${DASHBOARD}/reghistory`],
                icon: <FileTextIcon className="h-4 w-4" />,
            },
            {
                label: "Balance History（缴费记录）",
                href: [`${DASHBOARD}/balhistory`],
                icon: <DollarSign className="h-4 w-4" />,
            },
        ],
    },
    {
        header: "Other",
        items: [
            {
                label: "Contact us（联系我们）",
                href: [`${DASHBOARD}/contact`],
                icon: <Mail className="h-4 w-4" />,
            },
            {
                label: "Logout（退出）",
                href: [`${DASHBOARD}/logout`],
                icon: <LogOut className="h-4 w-4" />,
            },
        ],
    },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const user = await requireRole(["FAMILY"]);

    return (
        <div className="bg-background flex h-screen w-full overflow-hidden">
            {/* SideNav */}
            <SideNav items={navItems} />
            {/* Header + Content */}
            <div className="relative flex h-full min-w-0 flex-1 flex-col">
                {/* Header */}
                <Header user={user.user} />
                <main className="custom-scrollbar flex-1 overflow-y-auto p-8">
                    <div className="mx-auto w-full max-w-[1400px]">{children}</div>
                </main>
            </div>
        </div>
    );
}
