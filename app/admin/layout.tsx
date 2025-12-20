import React from 'react';
import SideNav from '@/components/sidenav';
import { Home, Users, School, CreditCard, MessageCircle, Calendar, Receipt, Book, Search, LogOut } from 'lucide-react';
import { FaChalkboardTeacher } from 'react-icons/fa';
import Header from '@/components/header';
import { requireRole } from '@/lib/auth';


const beginlink = "/admin"
const navItems = [
    {
        header: "Management",
        items: [
            {
                label: "Home",
                href: [beginlink],
                icon: <Home className="w-4 h-4 " />
            },
            {
                label: "Semester Management",
                href: [`${beginlink}/management/semester`],
                icon: <Calendar className="w-4 h-4" />
            },
            {
                label: "Feedback",
                href: [`${beginlink}/management/feedback`],
                icon: <MessageCircle className="w-4 h-4" />
            },

        ],
    },
    {

        header: "Accounting",
        items: [
            {
                label: "Billing", // Collect Money and payments, payment for this semester, processing refunds, family balance
                href: [`${beginlink}/accounting/billing`],
                icon: <CreditCard className="w-4 h-4 " />
            }, 
            // {
            //     label: "Payments", // Invoices for this semester, creating fees owed to the school
            //     href: [`${beginlink}/accounting/payments`],
            //     icon: <FileText className="w-4 h-4 " />
            // },
            {
                label: "Transaction Reports", // Comprehensive financial transactions, including analysis, payments, refunds, family balnaces, and school balances
                href: [`${beginlink}/accounting/transaction-reports`],
                icon: <Receipt className="w-4 h-4 " />
            }, 
        ],
    },
    {
        header: "Data",
        items: [ 
            {
                label: "Class View",
                href: [`${beginlink}/data/classes`, `${beginlink}/data/classrooms`],
                icon: <School className="w-4 h-4" />
            },
            {
                label: "People View",
                href: [`${beginlink}/data/teacher`, `${beginlink}/data/student`, `${beginlink}/data/family`, `${beginlink}/data/adminuser`],
                icon: <Users className="w-4 h-4 " />
            },
            {
                label: "Semester View",
                href: [`${beginlink}/data/seasons`, `${beginlink}/data/arrangements`, `${beginlink}/data/classregistration`, `${beginlink}/data/parentduty`, `${beginlink}/data/regchangerequest`],
                icon: <FaChalkboardTeacher className="w-4 h-4" />
            },
        ]
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
                icon: <Search className="w-4 h-4" />
            },
            {
                label: "Site Guide",
                href: [`${beginlink}/other/site-guide`],
                icon: <Book className="w-4 h-4" />
            },
            {
                label: "Logout",
                href: [`${beginlink}/logout`],
                icon: <LogOut className="w-4 h-4" />
            }
        ]
    }, 
]   
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const user = await requireRole(["ADMIN"]);

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