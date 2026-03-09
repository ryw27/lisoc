import Header from "@/components/header";
import SideNav from "@/components/sidenav";
import { requireRole } from "@/server/auth/actions";
import { Home, UserIcon } from "lucide-react";
import React from "react";
import { FaChalkboardTeacher } from "react-icons/fa";

const navItems = [
    {
        header: "Content(Teacher)",
        items: [
            {
                label: "Home",
                href: ["/teacher"],
                icon: <Home className="h-4 w-4" />,
                tip: "首页",
            },
            {
                label: "Teacher Management",
                href: ["/teacher/updateTeacher"],
                icon: <FaChalkboardTeacher className="h-4 w-4" />,
                tip: "更新教师",
            },
            {
                label: "UpDate Password",
                href: ["/teacher/updatePassword"],
                icon: <UserIcon className="h-4 w-4" />,
                tip: "重置密码",
            },
        ],
    },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const user = await requireRole(["TEACHER"]);

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
