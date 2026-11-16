'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { hapticLight, hapticSuccess } from '../lib/haptics';
import { Ic } from '../components/icons';
import { useCurrentUser } from '../lib/useCurrentUser';
import { getPusherClient } from '@/lib/pusher-client';
import { BottomSheet } from '../components/BottomSheet';

export interface AppNotification {
  id: number;
  userId?: number;
  type: 'like' | 'match' | 'message' | 'call' | 'system' | 'event' | 'event_request' | 'meetup' | string;
  title: string;
  message?: string;
  body?: string;
  avatar?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown> | null;
  read?: boolean;
  isRead?: boolean;
  createdAt: string;
}

interface NotificationContextType {
  isOpen: boolean;
  unreadCount: number;
  notifications: AppNotification[];
  openNotifications: () => void;
  closeNotifications: () => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt'>) => void;
  markAllRead: () => void;
  handleNotificationClick: (notif: AppNotification) => void;
}

const defaultContext: NotificationContextType = {
  isOpen: false,
  unreadCount: 0,
  notifications: [],
  openNotifications: () => {},
  closeNotifications: () => {},
  addNotification: () => {},
  markAllRead: () => {},
  handleNotificationClick: () => {},
};

const NotificationContext = createContext<NotificationContextType>(defaultContext);
const NOTIFICATION_POLL_MS = 60_000;
const CONNECTED_SAFETY_INTERVAL_MS = 2 * 60_000;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const auth = useCurrentUser();
  const myId = auth.status === 'authenticated' ? auth.userId : null;
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const lastFetchedAtRef = React.useRef(0);

  // Fetch real notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        lastFetchedAtRef.current = Date.now();
      }
    } catch {
      /* Non-critical */
    }
  }, []);

  useEffect(() => {
    if (!myId) return;
    const refreshWhenActive = () => {
      if (document.hidden || !navigator.onLine) return;
      void fetchNotifications();
    };

    refreshWhenActive();
    const interval = setInterval(() => {
      const pusher = getPusherClient();
      if (pusher?.connection.state === 'connected' &&
          Date.now() - lastFetchedAtRef.current < CONNECTED_SAFETY_INTERVAL_MS) return;
      refreshWhenActive();
    }, NOTIFICATION_POLL_MS);
    document.addEventListener('visibilitychange', refreshWhenActive);
    window.addEventListener('online', refreshWhenActive);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenActive);
      window.removeEventListener('online', refreshWhenActive);
    };
  }, [fetchNotifications, myId]);

  useEffect(() => {
    if (!myId) return;
    const pusher = getPusherClient();
    if (!pusher) return;
    const channel = pusher.subscribe(`user-${myId}`);
    const onNotification = () => { void fetchNotifications(); };
    channel.bind('notification', onNotification);
    channel.bind('new-match', onNotification);
    return () => {
      channel.unbind('notification', onNotification);
      channel.unbind('new-match', onNotification);
      pusher.unsubscribe(`user-${myId}`);
    };
  }, [myId, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read && !n.isRead).length;

  const openNotifications = () => {
    hapticLight();
    setIsOpen(true);
  };

  const closeNotifications = () => {
    setIsOpen(false);
  };

  const addNotification = useCallback((newNotif: Omit<AppNotification, 'id' | 'createdAt'>) => {
    const item: AppNotification = {
      ...newNotif,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      read: false,
      isRead: false,
    };
    setNotifications((prev) => [item, ...prev]);
  }, []);

  const markAllRead = async () => {
    hapticSuccess();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
    } catch {
      /* ignore */
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    hapticLight();
    setIsOpen(false);

    // Mark as read locally
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true, isRead: true } : n))
    );

    // Dynamic intelligent routing based on notification intent:
    // 1. SQUAD / MEETUP JOIN REQUEST -> Go directly to the squad host review page!
    const meta = (notif.metadata || {}) as Record<string, unknown>;
    if (
      notif.type === 'event_request' ||
      notif.type === 'meetup' ||
      meta.meetupId ||
      notif.title.toLowerCase().includes('join request') ||
      notif.title.toLowerCase().includes('squad')
    ) {
      if (meta.actionUrl && typeof meta.actionUrl === 'string') {
        router.push(meta.actionUrl);
        return;
      }
      if (meta.meetupId) {
        router.push(`/meetups/${meta.meetupId}`);
        return;
      }
      if (notif.actionUrl) {
        router.push(notif.actionUrl);
        return;
      }
      router.push('/discover/meetups');
      return;
    }

    // 2. ONE-WAY LIKE -> Go to /likes (Who Liked You section)
    if (notif.type === 'like' || notif.actionUrl === '/likes' || notif.title.toLowerCase().includes('liked')) {
      router.push('/likes');
      return;
    }

    // 3. MUTUAL MATCH / CONNECTION -> Go to the conversation / messages so they can chat!
    if (notif.type === 'match' || notif.title.toLowerCase().includes('match')) {
      if (notif.actionUrl && notif.actionUrl.startsWith('/chat')) {
        router.push(notif.actionUrl);
      } else {
        router.push('/messages');
      }
      return;
    }

    // 4. Specific Action URL or fallback
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    } else if (meta.actionUrl && typeof meta.actionUrl === 'string') {
      router.push(meta.actionUrl);
    } else if (notif.type === 'message') {
      router.push('/messages');
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        isOpen,
        unreadCount,
        notifications,
        openNotifications,
        closeNotifications,
        addNotification,
        markAllRead,
        handleNotificationClick,
      }}
    >
      {children}

      {/* Notifications */}
      <BottomSheet
        open={isOpen}
        onClose={closeNotifications}
        title={unreadCount > 0 ? `Notifications · ${unreadCount} new` : 'Notifications'}
        footer={unreadCount > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            className="w-full min-h-[48px] rounded-full border border-infyn-border bg-infyn-surface text-[15px] font-semibold text-infyn-ink active:bg-infyn-surface-soft transition-colors cursor-pointer"
          >
            Mark all as read
          </button>
        ) : undefined}
      >
        {notifications.length === 0 ? (
          <div className="animate-soft-arrive py-10 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-infyn-surface border border-infyn-border text-infyn-rose" aria-hidden>
              <Ic.Bell />
            </div>
            <p className="font-display text-[22px] text-infyn-ink">You’re all caught up</p>
            <p className="mt-1 text-[14px] text-infyn-secondary">Likes, matches and messages will appear here.</p>
          </div>
        ) : (
          <ul className="-mx-2">
            {notifications.map((notif, index) => {
              const isUnread = !notif.read && !notif.isRead;
              const isLike = notif.type === 'like' || notif.title.toLowerCase().includes('liked');
              const isMatch = notif.type === 'match' || notif.title.toLowerCase().includes('match');
              const isCall = notif.type === 'call';
              const isEvent = notif.type === 'event' || notif.type === 'event_request' || notif.type === 'meetup';
              return (
                <li key={notif.id} className="animate-soft-arrive" style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notif)}
                    className="w-full flex items-start gap-3 rounded-2xl px-2 py-3 text-left active:bg-infyn-surface-soft transition-colors cursor-pointer"
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full [&_svg]:h-[18px] [&_svg]:w-[18px] ${
                        isMatch ? 'bg-infyn-rose text-[#fff8f0]' : isLike ? 'bg-infyn-blush text-infyn-rose' : 'bg-infyn-surface border border-infyn-border text-infyn-secondary'
                      }`}
                      aria-hidden
                    >
                      {isMatch || isLike ? <Ic.Heart filled={isMatch} /> : isCall ? <Ic.Phone /> : isEvent ? <Ic.Calendar /> : notif.type === 'message' ? <Ic.Chat /> : <Ic.Bell />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={`truncate text-[15px] ${isUnread ? 'font-semibold text-infyn-ink' : 'text-infyn-ink'}`}>{notif.title.replace(/\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\uFE0F?/gu, '')}</span>
                        {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-infyn-rose" aria-label="Unread" />}
                      </span>
                      <span className="mt-0.5 block text-[14px] leading-snug text-infyn-secondary line-clamp-2">
                        {notif.message || notif.body || (isLike ? 'See who liked you' : 'Tap to open')}
                      </span>
                      <span className="mt-1 block text-[12px] text-infyn-muted">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </BottomSheet>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  return context || defaultContext;
}
