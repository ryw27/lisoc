import React from 'react';
import SideNav from '@/components/sidenav';
import Header from '@/components/header';
import { HomeIcon, UserIcon, SettingsIcon, FileTextIcon, BookOpenIcon } from 'lucide-react';

const DASHBOARD = "/dashboard";
const navItems = [
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
        icon: <UserIcon className="w-4 h-4" />,
      },
      {
        label: "Course List",
        href: [`${DASHBOARD}/courselist`],
        icon: <BookOpenIcon className="w-4 h-4" />,
      },
    ],
  },
  {
    header: "Content",
    items: [
      {
        label: "Registration History",
        href: [`${DASHBOARD}/registration_history`],
        icon: <FileTextIcon className="w-4 h-4" />,
      },
      {
        label: "Settings",
        href: [`${DASHBOARD}/settings`],
        icon: <SettingsIcon className="w-4 h-4" />,
      },
    ],
  },
];

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