'use client';

import React from 'react';
import SideNav from '@/components/sidenav';
import { Home, User, Users, School, CreditCard, Settings } from 'lucide-react';
import LogoutButton from '@/components/logout-button';
import { FaChalkboardTeacher } from 'react-icons/fa';
import Header from '@/components/header';


const navItems = [
    {
        header: "Admin",
        items: [
            {
                label: "Dashboard",
                href: ["/admintest/dashboard"],
                icon: <Home className="w-4 h-4 " />
            },
            {
                label: "Registrations",
                href: ["/admintest/dashboard/registrations", "/admintest/dashboard/registrations/students"],
                icon: <Users className="w-4 h-4 " />
            },
            {
                label: "Class View",
                href: ["/admintest/dashboard/classes", "/admintest/dashboard/classrooms"],
                icon: <School className="w-4 h-4" />
            },
            {
                label: "Teacher View",
                href: ["/admintest/dashboard/teachers", "/admintest/dashboard/teachers/students"],
                icon: <FaChalkboardTeacher className="w-4 h-4 " />
            },
            {
                label: "Parent View",
                href: ["/admintest/dashboard/parents", "/admintest/dashboard/parents/students"],
                icon: <User className="w-4 h-4 " />
            }
        ]
    },  
    {
        header: "Transactions",
        items: [
            {
                label: "Transactions",
                href: ["/admintest/dashboard/transactions", "/admintest/dashboard/transactions/students"],
                icon: <CreditCard className="w-4 h-4 " />
            }
        ]
    },
    {
        header: "Settings",
        items: [
            {
                label: "Settings",
                href: ["/admintest/dashboard/settings", "/admintest/dashboard/settings/users"],
                icon: <Settings className="w-4 h-4 " />
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
            <SideNav items={navItems} />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-auto p-6 bg-white">
                    {children}
                </main>
            </div>
        </div>
    );
} 