'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Ic } from './icons';
import { useNotifications } from '../context/NotificationContext';
import { prefetchFeed } from '../lib/feedCache';

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
  const { unreadCount } = useNotifications();

  // Warm the Discover deck while the user is elsewhere so entering
  // /discover renders instantly. No-op when already cached or in flight.
  useEffect(() => {
    if (!pathname.startsWith('/discover')) prefetchFeed();
  }, [pathname]);

  // Hide floating nav on standalone flow pages (onboarding, chat, meetups, etc.)
  const HIDDEN_PREFIXES = ['/onboarding', '/chat', '/meetups', '/verify-otp', '/verification', '/welcome', '/settings', '/premium'];
  const isHidden = HIDDEN_PREFIXES.some(prefix => pathname.startsWith(prefix)) || pathname === '/';

  if (isHidden) return null;

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
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 pb-[calc(0.35rem+env(safe-area-inset-bottom,0px))] pt-1">
      <div className="pointer-events-auto relative flex w-full max-w-[390px] items-center justify-between rounded-[24px] border border-white/80 bg-white/90 px-2 py-1.5 shadow-[0_8px_30px_-8px_rgba(26,26,46,0.15)] backdrop-blur-xl overflow-hidden">
        
        {/* Sliding indicator with spring animation */}
        <div
          className="absolute top-1.5 h-[calc(100%-12px)] rounded-[20px] bg-gradient-to-r from-[#F43F5E] to-[#FB7185] opacity-15 shadow-2xs transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
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
              className="relative z-10 flex min-h-[44px] flex-1 flex-col items-center justify-center py-1 transition-all duration-300 active:scale-90 cursor-pointer select-none"
            >
              <span className={`transition-all duration-300 ${
                isActive ? 'scale-110 text-[#F43F5E]' : 'scale-100 text-[#1A1A2E]/40 hover:text-[#1A1A2E]/70'
              }`}>
                {tab.icon(isActive)}
              </span>
              <span className={`text-[10px] font-semibold tracking-tight transition-all duration-300 ${
                isActive ? 'opacity-100 scale-100 text-[#F43F5E] mt-0.5' : 'opacity-0 scale-90 h-0 overflow-hidden'
              }`}>
                {tab.label}
              </span>
              
              {/* Unread badge indicator — only shows if unread messages/notifications exist */}
              {tab.id === 'messages' && !isActive && unreadCount > 0 && (
                <div className="absolute right-3.5 top-2.5 h-2 w-2 rounded-full bg-[#F43F5E] ring-2 ring-white shadow-2xs" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
