'use client';

import React from 'react';
import SideNav from '@/components/sidenav';
import Header from '@/components/header';
import { HomeIcon, UserIcon, SettingsIcon, FileTextIcon, LayoutDashboardIcon } from 'lucide-react';

const navItems = [
  {
    header: "Main",
    items: [
      {
        label: "Dashboard",
        href: ["/dashboard"],
        icon: <LayoutDashboardIcon className="w-4 h-4" />,
      },
      {
        label: "Profile",
        href: ["/dashboard/profile"],
        icon: <UserIcon className="w-4 h-4" />,
      },
    ],
  },
  {
    header: "Content",
    items: [
      {
        label: "Pages",
        href: ["/dashboard/pages"],
        icon: <FileTextIcon className="w-4 h-4" />,
      },
      {
        label: "Settings",
        href: ["/dashboard/settings"],
        icon: <SettingsIcon className="w-4 h-4" />,
      },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <SideNav items={navItems} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
} 