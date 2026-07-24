'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Ic } from './icons';

type NavTab = 'discover' | 'home' | 'connections' | 'messages' | 'profile';

const NAV_TABS: { id: NavTab; icon: (active: boolean) => React.ReactNode; label: string; path: string }[] = [
  { id: 'discover',    icon: () => <Ic.Compass />,            label: 'Discover', path: '/discover' },
  { id: 'home',        icon: () => <Ic.Home />,               label: 'Home',     path: '/home' },
  { id: 'connections', icon: (a: boolean) => <Ic.Heart filled={a} />,  label: 'Connect',  path: '/matches' },
  { id: 'messages',    icon: () => <Ic.Chat />,               label: 'Messages', path: '/messages' },
  { id: 'profile',     icon: () => <Ic.User />,               label: 'Profile',  path: '/profile' },
];

export default function FloatingNav() {
  const router = useRouter();
  const pathname = usePathname();

  const getActiveTab = (): NavTab => {
    if (pathname.startsWith('/discover')) return 'discover';
    if (pathname.startsWith('/home')) return 'home';
    if (pathname.startsWith('/matches')) return 'connections';
    if (pathname.startsWith('/messages')) return 'messages';
    if (pathname.startsWith('/profile')) return 'profile';
    return 'discover';
  };

  const active = getActiveTab();
  const activeIndex = NAV_TABS.findIndex(t => t.id === active);

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="pointer-events-auto relative flex w-full max-w-[380px] items-center justify-between rounded-[24px] border border-white/80 bg-white/80 px-2 py-1.5 shadow-[0_8px_30px_-8px_rgba(26,26,46,0.12)] backdrop-blur-xl overflow-hidden">
        
        {/* Sliding indicator with spring animation */}
        <div
          className="nav-indicator-spring absolute top-1.5 h-[calc(100%-12px)] rounded-[20px] bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] opacity-15 shadow-sm"
          style={{
            width: `calc((100% - 16px) / ${NAV_TABS.length})`,
            left: 8,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        {NAV_TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.path)}
              className="relative z-10 flex min-h-[44px] flex-1 flex-col items-center justify-center py-1 transition-all duration-300 active:scale-95 cursor-pointer select-none"
            >
              <span className={`transition-all duration-300 ${
                isActive ? 'scale-110 text-[#FF6B9D]' : 'scale-100 text-[#1A1A2E]/40 hover:text-[#1A1A2E]/70'
              }`}>
                {tab.icon(isActive)}
              </span>
              <span className={`text-[10px] font-semibold tracking-tight transition-all duration-300 ${
                isActive ? 'opacity-100 scale-100 text-[#FF6B9D] mt-0.5' : 'opacity-0 scale-90 h-0 overflow-hidden'
              }`}>
                {tab.label}
              </span>
              
              {/* Unread badge indicator */}
              {tab.id === 'messages' && !isActive && (
                <div className="absolute right-3.5 top-2.5 h-2 w-2 rounded-full bg-[#FF6B9D] ring-2 ring-white shadow-sm" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
