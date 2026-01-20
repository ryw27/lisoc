import Header from "@/components/header";
import SideNav from "@/components/sidenav";
import { requireRole } from "@/server/auth/actions";
import {
    BookOpenIcon,
    DollarSign,
    FileTextIcon,
    HomeIcon,
    LogOut,
    Mail,
    UserIcon,
} from "lucide-react";
import React from "react";
import { FaChalkboardTeacher } from "react-icons/fa";

const DASHBOARD = "/dashboard";
interface NavItem {
    label: string;
    href: string[];
    icon: React.ReactNode;
    tip: string|undefined;
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
                tip: "首页",
            },
            {
                label: "Register（注册）",
                href: [`${DASHBOARD}/register`],
                icon: <FaChalkboardTeacher className="h-4 w-4" />,
                tip: "注册",
            },
            {
                label: "Manage Students（更新学生）",
                href: [`${DASHBOARD}/students`],
                icon: <UserIcon className="h-4 w-4" />,
                tip: "更新学生",
            },
            {
                label: "Manage Family（更新家庭）",
                href: [`${DASHBOARD}/family`],
                icon: <UserIcon className="h-4 w-4" />,
                tip: "更新家庭",
            },
            
            {
                label: "Reset Password/重置密码",
                href: [`${DASHBOARD}/updatepassword`],
                icon: <UserIcon className="w-4 h-4" />,
                tip: "重置密码"
            },
            
            {
                label: "Parent Duty（家长值班）",
                href: [`${DASHBOARD}/parentduty`],
                icon: <UserIcon className="h-4 w-4" />,
                tip: "家长值班",
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
                 tip: "课程列表"
            },
            {
                label: "Registration History（注册记录）",
                href: [`${DASHBOARD}/reghistory`],
                icon: <FileTextIcon className="h-4 w-4" />,
                 tip: "注册记录"},
            {
                label: "Balance History（缴费记录）",
                href: [`${DASHBOARD}/balhistory`],
                icon: <DollarSign className="h-4 w-4" />,
                tip: "缴费记录"
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
                tip: "联系我们"
            },
            {
                label: "Logout（退出）",
                href: [`${DASHBOARD}/logout`],
                icon: <LogOut className="h-4 w-4" />,
                tip: "退出"
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
