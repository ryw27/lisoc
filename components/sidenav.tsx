'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils'; // assuming shadcn setup
import { ArrowLeftToLine, ArrowRightToLine } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface SideNavProps {
  items: {
    header: string;
    items: {
      label: string;
      href: string[];
      icon: React.ReactNode;
    }[];
  }[];
}

export default function SideNav({ items }: SideNavProps) {
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [language, setLanguage] = useState('en');
  const pathname = usePathname();

  return (
    <aside className={`h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${navCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Top section with user and controls */}
      <div className="border-b border-gray-200 py-4 px-4">
        {!navCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/lisoc.png" alt="LISOC Logo" width={48} height={48} className="w-8 h-8" />   
              <p className="text-sm font-bold text-gray-600">长岛中文学校</p>
            </div>
            <div className="flex items-center gap-3">
              {/* <button 
                className="text-xs text-gray-500 hover:text-blue-600 transition-colors cursor-pointer hover:bg-blue-50 p-2 rounded-md"
                onClick={() => {language === 'en' ? setLanguage('cn') : setLanguage('en')}}
              >
                <Globe className="w-4 h-4" />
              </button>   */}
              <button 
                onClick={() => setNavCollapsed(!navCollapsed)} 
                className="text-gray-500 hover:text-blue-600 transition-colors cursor-pointer hover:bg-blue-50 p-2 rounded-md"
              >
                <ArrowLeftToLine className="w-4 h-4" />
              </button>
           </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button 
              onClick={() => setNavCollapsed(!navCollapsed)} 
              className="text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors p-2 rounded-md cursor-pointer"
            >
              <ArrowRightToLine className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation items */}
      <div className="py-4">
        {!navCollapsed ? (
          <nav className="px-2 space-y-6">
            {items.map((item, index) => (
              <div key={`expanded-${item.header}-${index}`} className="space-y-1">
                <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {item.header}
                </p>
                <div className="space-y-1">
                  {item.items.map((section, sectionIndex) => (
                    <Link 
                      key={`expanded-${section.href}-${sectionIndex}`} 
                      href={section.href[0]}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        section.href.includes(pathname)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-blue-100 hover:text-blue-700'
                      )}
                    >
                      <div className="flex-shrink-0" style={{
                        color: section.href.includes(pathname)
                          ? '#2563eb' // blue-600
                          : '#9ca3af' // gray-400
                      }}>
                        {section.icon}
                      </div>
                      <span>{section.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        ) : (
          <nav className="flex flex-col items-center space-y-6 px-2">
            {items.map((item, index) => (
              <div key={`collapsed-${item.header}-${index}`} className="space-y-3 w-full">
                {index !== 0 && <div className="h-px bg-gray-200 w-full"/>}
                {item.items.map((section, sectionIndex) => (
                  <Link 
                    key={`collapsed-${section.href}-${sectionIndex}`} 
                    href={section.href[0]}
                    className={
                      section.href.includes(pathname)
                        ? 'flex justify-center py-2 rounded-md transition-colors bg-blue-50'
                        : 'flex justify-center py-2 rounded-md transition-colors hover:bg-blue-100'
                    }
                    title={section.label}
                  >
                    <div style={{
                      color: section.href.includes(pathname)
                        ? '#2563eb' // blue-600
                        : '#9ca3af' // gray-400
                    }}>
                      {section.icon}
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        )}
      </div>
    </aside>
  );
}
