'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils'; // assuming shadcn setup
// import LogoutButton from './logout-button';
import { ArrowLeftToLine, ArrowRightToLine } from 'lucide-react';
// import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

interface SideNavProps {
  items: {
    header: string;
    items: {
      label: string;
      href: string;
      icon: React.ReactNode;
    }[];
  }[];
}

export default function SideNav({ items }: SideNavProps) {
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [subSectionCollapsed, setSubSectionCollapsed] = useState<boolean[]>(Array(items.length).fill(false));

  const pathname = usePathname();

  return (
    <aside className={`h-screen bg-gray-50 p-1 space-y-2 transition-all duration-300 ease-in-out ${navCollapsed ? 'w-16' : 'w-64'}`}>
      {!navCollapsed ? (
        <div className="flex items-center justify-between w-full hover:bg-gray-100 rounded-md px-2 py-1 cursor-pointer ">
        <p className="text-sm text-gray-500">User</p>
        <button 
          onClick={() => setNavCollapsed(!navCollapsed)} 
          className="bg-transparent text-gray-500 hover:bg-gray-200 rounded-md p-2 transition-all duration-300 ease-in-out cursor-pointer"
        >
            <ArrowLeftToLine className="w-4 h-4" />
        </button>
      </div>
      ) : (
        <div className="flex items-center justify-center w-full hover:bg-gray-100 rounded-md px-2 py-1 cursor-pointer ">
          <button 
            onClick={() => setNavCollapsed(!navCollapsed)} 
            className="bg-transparent text-gray-500 hover:bg-gray-200 rounded-md p-2 transition-all duration-300 ease-in-out cursor-pointer"
          >
            <ArrowRightToLine className="w-4 h-4" />
          </button>
        </div>
      )}
      {!navCollapsed ? (
      <nav className="space-y-8">
          {items.map((item, index) => (
            <div key={item.header}>
              <div className="flex justify-start">
                <button 
                  onClick={() => setSubSectionCollapsed([...subSectionCollapsed, !subSectionCollapsed[index]])} 
                  className="cursor-pointer text-sm text-gray-300 font-light hover:bg-gray-100 rounded-sm px-2 py-[.35rem] w-full text-left"
                >
                  {item.header}
                </button>
              </div>
              {!subSectionCollapsed[index] && (
                <div className="">
                  {item.items.map((section) => (
                    <Link 
                      key={section.href} 
                      href={section.href}
                      className={cn(
                        'px-3 py-[.35rem] flex items-center gap-2 block text-gray-500 rounded-sm text-sm font-medium transition-colors',
                        pathname === section.href
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                    <div className="flex items-center gap-2">
                      {section.icon}
                      <p className="text-gray-500">{section.label}</p>
                    </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        ) : (
          <nav className="bg-gray-200 w-1/2 h-px space-y-8">
            {items.map((item, index) => (
              <div key={item.header}>
                {item.items.map((section) => (
                  <Link key={section.href} href={section.href}>
                    {section.icon}
                  </Link>
                ))}
              </div>
            ))}
          </nav>

        )}
    </aside>
  );
}
