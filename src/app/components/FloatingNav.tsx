'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Ic } from './icons';
import messagesStyles from '../messages/messages.module.css';
import { useNotifications } from '../context/NotificationContext';
import { prefetchFeed } from '../lib/feedCache';
import { hapticLight } from '../lib/haptics';

type NavTab = 'discover' | 'home' | 'connections' | 'messages' | 'profile';

const NAV_TABS: { id: NavTab; icon: (active: boolean) => React.ReactNode; label: string; path: string }[] = [
  { id: 'discover',    icon: () => <Ic.Compass />,                     label: 'Discover', path: '/discover' },
  { id: 'home',        icon: () => <Ic.Home />,                        label: 'Home',     path: '/home' },
  { id: 'connections', icon: (a: boolean) => <Ic.Heart filled={a} />,  label: 'Connect',  path: '/matches' },
  { id: 'messages',    icon: () => <Ic.Chat />,                        label: 'Messages', path: '/messages' },
  { id: 'profile',     icon: () => <Ic.User />,                        label: 'Profile',  path: '/profile' },
];

// Edge px threshold — swipe must START within this distance of the left or
// right screen edge to be treated as a tab-change gesture. This avoids
// conflicting with card/scroll interactions in the center of the screen.
const EDGE_PX = 28;
const MIN_SWIPE_PX = 60;
const HIDDEN_PREFIXES = ['/onboarding', '/chat', '/meetups', '/verify-otp', '/verification', '/welcome', '/settings', '/premium', '/likes', '/terms', '/privacy', '/random-chat'];

export default function FloatingNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const isStandalonePage = HIDDEN_PREFIXES.some(prefix => pathname.startsWith(prefix)) || pathname === '/';
  // Keep a ref to pathname so the touch handler always has the latest value
  // without being re-registered on every navigation.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // Warm the primary route bundles before a tab is tapped.
  useEffect(() => {
    NAV_TABS.forEach((tab) => {
      router.prefetch(tab.path);
    });
  }, [router]);

  useEffect(() => {
    if (!pathname.startsWith('/discover')) prefetchFeed();
  }, [pathname]);

  // Edge-swipe tab navigation — only fires when the touch started within
  // EDGE_PX pixels of the left or right screen edge, so it never interferes
  // with card swiping on Discover or horizontal scrollers on Home.
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startEdge: 'left' | 'right' | null = null;

    const TAB_PATHS = NAV_TABS.map((t) => t.path);

    const onTouchStart = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      startX = x;
      startY = e.touches[0].clientY;
      if (x <= EDGE_PX) startEdge = 'left';
      else if (x >= window.innerWidth - EDGE_PX) startEdge = 'right';
      else startEdge = null;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!startEdge) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const dx = endX - startX;
      const dy = endY - startY;

      // Must be a clear horizontal swipe.
      if (Math.abs(dx) < MIN_SWIPE_PX) return;
      if (Math.abs(dy) > Math.abs(dx) * 0.65) return;

      const current = pathnameRef.current;
      if (current === '/discover') return;
      const idx = TAB_PATHS.findIndex((p) => current.startsWith(p));
      if (idx === -1) return;

      // Left-edge + swipe right → go to the previous tab (navigate left).
      // Right-edge + swipe left → go to the next tab (navigate right).
      if (startEdge === 'left' && dx > 0 && idx > 0) {
        hapticLight();
        router.push(TAB_PATHS[idx - 1]);
      } else if (startEdge === 'right' && dx < 0 && idx < TAB_PATHS.length - 1) {
        hapticLight();
        router.push(TAB_PATHS[idx + 1]);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [router]);

  const [hasModal, setHasModal] = useState(false);

  useEffect(() => {
    // Hidden navigation need not scan chat messages or standalone screens.
    if (isStandalonePage) return;
    const checkModal = () => {
      const modal = document.querySelector('[role="dialog"], [data-modal="true"], [aria-modal="true"], .animate-sheet-up');
      setHasModal(Boolean(modal));
    };
    checkModal();
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [isStandalonePage]);


  // Hide floating nav on standalone flow pages or when any modal/lightbox is open
  const isHidden = isStandalonePage || hasModal;

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

  if (pathname === '/messages') {
    return <nav className={`${messagesStyles.nav} infyn-nav-theme`} aria-label="Main navigation"><div className={messagesStyles.navInner}>
      {NAV_TABS.map(tab => <button key={tab.id} className={messagesStyles.navTab} onClick={() => { hapticLight(); router.push(tab.path); }} aria-current={tab.id === active ? 'page' : undefined}>
        <span className={messagesStyles.navIcon}>{tab.icon(tab.id === active)}</span><span>{tab.label}</span>
        {tab.id === 'messages' && unreadCount > 0 && <span key={unreadCount} className={`${messagesStyles.navUnread} animate-attention-pop`} aria-label={`${unreadCount} unread messages`} />}
      </button>)}
    </div></nav>;
  }

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 pb-[calc(0.35rem+env(safe-area-inset-bottom,0px))] pt-1">
      <div className="pointer-events-auto relative flex w-full max-w-[390px] sm:max-w-[440px] md:max-w-[500px] items-center justify-between rounded-[24px] border border-infyn-border/80 bg-infyn-surface/90 px-2 py-1.5 shadow-[0_8px_30px_-8px_rgba(32,26,22,0.15)] backdrop-blur-xl overflow-hidden">

        {/* Sliding indicator with spring animation */}
        <div
          className="absolute top-1.5 h-[calc(100%-12px)] rounded-[20px] bg-gradient-to-r from-infyn-rose to-infyn-rose opacity-15 shadow-2xs transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
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
              onClick={() => { hapticLight(); router.push(tab.path); }}
              className="relative z-10 flex min-h-[48px] flex-1 flex-col items-center justify-center py-1.5 transition-all duration-300 active:scale-90 cursor-pointer select-none"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={`transition-all duration-300 ${
                isActive ? 'scale-110 text-infyn-rose' : 'scale-100 text-infyn-ink/40'
              }`}>
                {tab.icon(isActive)}
              </span>
              <span className={`text-[10px] font-semibold tracking-tight transition-all duration-300 ${
                isActive ? 'opacity-100 scale-100 text-infyn-rose mt-0.5' : 'opacity-0 scale-90 h-0 overflow-hidden'
              }`}>
                {tab.label}
              </span>

              {/* Unread badge indicator */}
              {tab.id === 'messages' && !isActive && unreadCount > 0 && (
                <div key={unreadCount} className="animate-attention-pop absolute right-3.5 top-2.5 h-2 w-2 rounded-full bg-infyn-rose ring-2 ring-white shadow-2xs" aria-label={`${unreadCount} unread messages`} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
