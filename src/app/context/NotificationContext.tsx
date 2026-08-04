'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SafeImage } from '../components/shared';

export interface NotificationItem {
  id: string;
  type: 'match' | 'like' | 'event' | 'community' | 'system';
  title: string;
  message: string;
  timestamp: string;
  avatar?: string;
  emoji?: string;
  read: boolean;
  actionUrl?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'match',
    title: 'New Connection! 🔥',
    message: 'Ananya Gupta liked you back! Say hi before her chai gets cold ☕',
    timestamp: '5m ago',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=faces',
    read: false,
    actionUrl: '/messages',
  },
  {
    id: '2',
    type: 'like',
    title: 'New Vibe Like ❤️',
    message: 'Rohan liked your prompt: "Farmers market, long drive, good book."',
    timestamp: '32m ago',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    read: false,
    actionUrl: '/matches',
  },
  {
    id: '3',
    type: 'event',
    title: 'Event Reminder ☕',
    message: 'Design & Coffee Meetup is happening tomorrow at 10am in Café Zoe.',
    timestamp: '2h ago',
    emoji: '☕',
    read: false,
    actionUrl: '/home',
  },
  {
    id: '4',
    type: 'community',
    title: 'Community Activity 🎨',
    message: 'New post in Design Minds: "What is your favorite mobile design pattern in 2026?"',
    timestamp: '5h ago',
    emoji: '🎨',
    read: true,
    actionUrl: '/home',
  },
];

interface NotificationContextType {
  isOpen: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  openNotifications: () => void;
  closeNotifications: () => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  addNotification: (item: { title: string; message: string; type?: NotificationItem['type']; avatar?: string; emoji?: string; actionUrl?: string }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread' | 'matches'>('all');
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = (item: { title: string; message: string; type?: NotificationItem['type']; avatar?: string; emoji?: string; actionUrl?: string }) => {
    const newNotif: NotificationItem = {
      id: Date.now().toString(),
      type: item.type || 'system',
      title: item.title,
      message: item.message,
      timestamp: 'Just now',
      avatar: item.avatar,
      emoji: item.emoji,
      read: false,
      actionUrl: item.actionUrl || '/messages',
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const openNotifications = () => {
    setIsMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimateIn(true);
        setIsOpen(true);
      });
    });
  };

  const closeNotifications = () => {
    setAnimateIn(false);
    setTimeout(() => {
      setIsOpen(false);
      setIsMounted(false);
    }, 350);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    closeNotifications();
    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'matches') return n.type === 'match' || n.type === 'like';
    return true;
  });

  return (
    <NotificationContext.Provider
      value={{
        isOpen,
        notifications,
        unreadCount,
        openNotifications,
        closeNotifications,
        markAllAsRead,
        markAsRead,
        clearAll,
        addNotification,
      }}
    >
      {children}

      {/* ── NOTIFICATION DRAWER OVERLAY ── */}
      {isMounted && (
        <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center p-0 sm:p-4 overflow-hidden pointer-events-auto">
          {/* Backdrop with 100% Smooth Hardware-Accelerated Blur & Opacity Transition */}
          <div
            onClick={closeNotifications}
            className={`absolute inset-0 bg-black/40 transition-all duration-350 ease-[cubic-bezier(0.32,1,0.32,1)] ${
              animateIn ? 'backdrop-blur-md opacity-100' : 'backdrop-blur-none opacity-0'
            }`}
            style={{ willChange: 'backdrop-filter, opacity' }}
          />

          {/* Sliding Sheet Container */}
          <div
            className={`relative z-10 w-full max-w-[440px] bg-[#FAFAF7] rounded-t-[32px] sm:rounded-[32px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.35)] border border-white/80 overflow-hidden flex flex-col max-h-[85dvh] transition-all duration-350 cubic-bezier(0.32,1.25,0.32,1) ${
              animateIn ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-full sm:translate-y-8 sm:scale-95 opacity-0'
            }`}
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Handle Bar */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-[#1A1A2E]/15" />
            </div>

            {/* Header */}
            <div className="px-6 py-3 flex items-center justify-between border-b border-[#1A1A2E]/[0.06]">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[20px] font-extrabold tracking-tight text-[#1A1A2E]">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="flex h-5 items-center justify-center rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] px-2 text-[10px] font-bold text-white shadow-sm">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[12px] font-semibold text-[#FF6B9D] active:opacity-60 transition-opacity"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={closeNotifications}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A2E]/5 text-[#1A1A2E]/60 active:scale-95 transition-transform"
                  aria-label="Close notifications"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-6 py-2.5 flex gap-2 border-b border-[#1A1A2E]/[0.04] bg-white/50 backdrop-blur-sm">
              {(['all', 'unread', 'matches'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`rounded-full px-3.5 py-1 text-[12px] font-medium capitalize transition-all ${
                    filter === t
                      ? 'bg-[#1A1A2E] text-white shadow-sm'
                      : 'bg-[#1A1A2E]/5 text-[#1A1A2E]/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-2.5">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-4xl mb-2">✨</div>
                  <p className="text-[15px] font-bold text-[#1A1A2E]">All caught up!</p>
                  <p className="text-[13px] text-[#1A1A2E]/45 mt-0.5">No notifications here right now.</p>
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`group relative flex items-start gap-3.5 rounded-[22px] p-3.5 transition-all active:scale-[0.98] ${
                      n.read
                        ? 'bg-white/60 border border-[#1A1A2E]/[0.04]'
                        : 'bg-white border border-[#FF6B9D]/20 shadow-[0_4px_16px_-4px_rgba(255,107,157,0.12)]'
                    }`}
                  >
                    {/* Icon or Avatar */}
                    <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-2xl">
                      {n.avatar ? (
                        <SafeImage src={n.avatar} name={n.title} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FF6B9D]/15 to-[#7B68EE]/15 text-xl">
                          {n.emoji || '🔔'}
                        </div>
                      )}
                    </div>

                    {/* Text content */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[14px] font-bold text-[#1A1A2E] leading-tight truncate">
                          {n.title}
                        </span>
                        <span className="text-[11px] font-medium text-[#1A1A2E]/40 flex-shrink-0">
                          {n.timestamp}
                        </span>
                      </div>
                      <p className="text-[12.5px] leading-snug text-[#1A1A2E]/65 line-clamp-2">
                        {n.message}
                      </p>
                    </div>

                    {/* Unread pink dot */}
                    {!n.read && (
                      <div className="absolute top-4 right-3.5 h-2 w-2 rounded-full bg-[#FF6B9D] shadow-[0_0_8px_rgba(255,107,157,0.6)]" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Clear All Footer */}
            {notifications.length > 0 && (
              <div className="p-3 text-center border-t border-[#1A1A2E]/[0.06] bg-white/40">
                <button
                  onClick={clearAll}
                  className="text-[12px] font-medium text-[#1A1A2E]/40 hover:text-[#1A1A2E]/70 active:opacity-60 transition-all"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
