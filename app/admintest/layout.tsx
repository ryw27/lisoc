import React from 'react';
import SideNav from '@/components/sidenav';
import { Home, Users, School, CreditCard, Settings, MessageCircle, FileText, Calendar, DollarSign, Receipt, Book } from 'lucide-react';
import LogoutButton from '@/components/logout-button';
import { FaChalkboardTeacher } from 'react-icons/fa';
import Header from '@/components/header';


const navItems = [
    {
        header: "Management",
        items: [
            {
                label: "Home",
                href: ["/admintest/dashboard"],
                icon: <Home className="w-4 h-4 " />
            },
            {
                label: "Semester Management",
                href: ["/admintest/dashboard/management/semester"],
                icon: <Calendar className="w-4 h-4" />
            },
            {
                label: "Feedback",
                href: ["/admintest/dashboard/management/feedback"],
                icon: <MessageCircle className="w-4 h-4" />
            }
        ],
    },
    {

        header: "Accounting",
        items: [
            {
                label: "Billing", // Collect Money and payments, payment for this semester, processing refunds, family balance
                href: ["/admintest/dashboard/accounting/billing"],
                icon: <CreditCard className="w-4 h-4 " />
            }, 
            {
                label: "Payments", // Invoices for this semester, creating fees owed to the school
                href: ["/admintest/dashboard/accounting/payments"],
                icon: <FileText className="w-4 h-4 " />
            },
            {
                label: "Transaction Reports", // Comprehensive financial transactions, including analysis, payments, refunds, family balnaces, and school balances
                href: ["/admintest/dashboard/accounting/transaction-reports"],
                icon: <Receipt className="w-4 h-4 " />
            }, 
        ],
    },
    {
        header: "Data",
        items: [ 
            {
                label: "Class View",
                href: ["/admintest/dashboard/data/classes", "/admintest/dashboard/data/classrooms"],
                icon: <School className="w-4 h-4" />
            },
            {
                label: "People View",
                href: ["/admintest/dashboard/data/teachers", "/admintest/dashboard/data/students", "/admintest/dashboard/data/families", "/admintest/dashboard/data/administrators"],
                icon: <Users className="w-4 h-4 " />
            },
            {
                label: "Semester View",
                href: ["/admintest/dashboard/data/semesters", "/admintest/dashboard/data/arrangements"],
                icon: <FaChalkboardTeacher className="w-4 h-4" />
            },
            {
                label: "Transactions View",
                href: ["/admintest/dashboard/data/transactions"],
                icon: <DollarSign className="w-4 h-4" />
            }
        ]
    },  
    {
        header: "Settings",
        items: [
            {
                label: "Settings",
                href: ["/admintest/dashboard/settings"],
                icon: <Settings className="w-4 h-4 " />
            },
            {
                label: "Site Guide",
                href: ["/admintest/dashboard/site-guide"],
                icon: <Book className="w-4 h-4" />
            },
            {
                label: "Logout",
                href: ["/logout"],
                icon: <LogoutButton />
            }
        ]
    }, 
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