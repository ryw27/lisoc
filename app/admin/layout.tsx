import React from "react";
import {
    Book,
    Calendar,
    CreditCard,
    Home,
    LogOut,
    MessageCircle,
    Receipt,
    School,
    Search,
    Users,
} from "lucide-react";
import { FaChalkboardTeacher } from "react-icons/fa";
import { requireRole } from "@/server/auth/actions";
import Header from "@/components/header";
import SideNav from "@/components/sidenav";

const beginlink = "/admin";
const navItems = [
    {
        header: "Management",
        items: [
            {
                label: "Home",
                href: [beginlink],
                icon: <Home className="h-4 w-4" />,
                tip: "首页",
            },
            {
                label: "Semester Management",
                href: [`${beginlink}/management/semester`],
                icon: <Calendar className="h-4 w-4" />,
                tip: "学期管理",
            },
            {
                label: "Feedback",
                href: [`${beginlink}/management/feedback`],
                icon: <MessageCircle className="h-4 w-4" />,
                tip: "反馈",
            },
        ],
    },
    {
        header: "Accounting",
        items: [
            {
                label: "Billing", // Collect Money and payments, payment for this semester, processing refunds, family balance
                href: [`${beginlink}/accounting/billing`],
                icon: <CreditCard className="h-4 w-4" />,
                tip: "会计",
            },
            // {
            //     label: "Payments", // Invoices for this semester, creating fees owed to the school
            //     href: [`${beginlink}/accounting/payments`],
            //     icon: <FileText className="w-4 h-4 " />
            // },
            {
                label: "Transaction Reports", // Comprehensive financial transactions, including analysis, payments, refunds, family balnaces, and school balances
                href: [`${beginlink}/accounting/transaction-reports`],
                icon: <Receipt className="h-4 w-4" />,
                tip: "报告",
            },
        ],
    },
    {
        header: "Data",
        items: [
            {
                label: "Class View",
                href: [`${beginlink}/data/classes`, `${beginlink}/data/classrooms`],
                icon: <School className="h-4 w-4" />,
                tip: "课程",
            },
            {
                label: "People View",
                href: [
                    `${beginlink}/data/teacher`,
                    `${beginlink}/data/student`,
                    `${beginlink}/data/family`,
                    `${beginlink}/data/adminuser`,
                ],
                icon: <Users className="h-4 w-4" />,
                tip: "人员",
            },
            {
                label: "Semester View",
                href: [
                    `${beginlink}/data/seasons`,
                    `${beginlink}/data/arrangements`,
                    `${beginlink}/data/classregistration`,
                    `${beginlink}/data/parentduty`,
                    `${beginlink}/data/regchangerequest`,
                ],
                icon: <FaChalkboardTeacher className="h-4 w-4" />,
                tip: "学期",
            },
        ],
    },
    {
        header: "Other",
        items: [
            // {
            //     label: "Settings",
            //     href: [`${beginlink}/settings`],
            //     icon: <Settings className="w-4 h-4 " />
            // },
            {
                label: "Family Search",
                href: [`${beginlink}/other/find-family`],
                icon: <Search className="h-4 w-4" />,
                tip: "家庭搜索",
            },
            {
                label: "Site Guide",
                href: [`${beginlink}/other/site-guide`],
                icon: <Book className="h-4 w-4" />,
                tip: "网站指南",
            },
            {
                label: "Logout",
                href: [`${beginlink}/logout`],
                icon: <LogOut className="h-4 w-4" />,
                tip: "退出登录",
            },
        ],
    },
];
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const user = await requireRole(["ADMIN"]);

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
