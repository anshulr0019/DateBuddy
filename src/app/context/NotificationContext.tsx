'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { hapticLight, hapticSuccess } from '../lib/haptics';
import { Ic } from '../components/icons';
import { useCurrentUser } from '../lib/useCurrentUser';
import { getPusherClient } from '@/lib/pusher-client';

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

      {/* Notifications Bottom Sheet */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in select-none"
        >
          <div onClick={closeNotifications} className="absolute inset-0" />

          <div
            className="relative z-10 w-full max-w-[440px] sm:max-w-[480px] bg-infyn-paper rounded-t-[32px] sm:rounded-[32px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.35)] border border-infyn-border/80 overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[80vh] animate-sheet-up"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-infyn-ink/[0.06] bg-infyn-surface/80">
              <div className="flex items-center gap-2">
                <h3 className="text-[17px] font-extrabold text-infyn-ink">Notifications</h3>
                {unreadCount > 0 && (
                  <span key={unreadCount} className="animate-attention-pop px-2 py-0.5 rounded-full bg-infyn-rose text-white text-[10px] font-black">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11.5px] font-bold text-infyn-rose hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={closeNotifications}
                  className="h-8 w-8 rounded-full bg-infyn-ink/[0.05] flex items-center justify-center text-infyn-ink/60 hover:text-infyn-ink cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-2.5">
              {notifications.length === 0 ? (
                <div className="animate-soft-arrive py-12 text-center text-infyn-ink/40 text-[13px]">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-infyn-rose-line/70 bg-infyn-blush text-infyn-rose">
                    <Ic.Bell />
                  </div>
                  <p className="font-semibold">No notifications yet</p>
                  <p className="text-[11.5px] mt-1">Likes, matches, and messages will appear here</p>
                </div>
              ) : (
                notifications.map((notif, index) => {
                  const isUnread = !notif.read && !notif.isRead;
                  const isLike = notif.type === 'like' || notif.title.toLowerCase().includes('liked');
                  const isMatch = notif.type === 'match' || notif.title.toLowerCase().includes('match');
                  const isCall = notif.type === 'call';
                  const isEvent = notif.type === 'event' || notif.type === 'event_request' || notif.type === 'meetup';

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`animate-soft-arrive p-3.5 rounded-2xl border transition-all cursor-pointer active:scale-[0.98] ${
                        isUnread
                          ? 'bg-infyn-surface border-infyn-rose/30 shadow-xs ring-1 ring-infyn-rose/15'
                          : 'bg-infyn-surface/60 border-infyn-border/60'
                      }`}
                      style={{ animationDelay: `${Math.min(index, 6) * 45}ms` }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${
                            isMatch
                              ? 'border-infyn-rose bg-infyn-rose text-white shadow-xs'
                              : isLike
                              ? 'border-infyn-rose-line bg-infyn-blush text-infyn-rose'
                              : 'border-infyn-border bg-infyn-surface-soft text-infyn-secondary'
                          }`}
                        >
                          {isMatch || isLike ? (
                            <Ic.Heart filled={isMatch} />
                          ) : isCall ? (
                            <Ic.Phone className="h-5 w-5" />
                          ) : isEvent ? (
                            <Ic.Calendar className="h-5 w-5" />
                          ) : notif.type === 'message' ? (
                            <Ic.Chat />
                          ) : (
                            <Ic.Bell />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`text-[13.5px] leading-tight truncate ${isUnread ? 'font-extrabold text-infyn-ink' : 'font-bold text-infyn-ink/80'}`}>
                              {notif.title}
                            </p>
                            {isUnread && (
                              <span className="animate-attention-pop h-2 w-2 rounded-full bg-infyn-rose flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[12px] text-infyn-ink/60 leading-snug mt-0.5 line-clamp-2">
                            {notif.message || notif.body || (isLike ? 'Tap to view who liked you' : 'Tap to open')}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-infyn-ink/40">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[10.5px] font-bold text-infyn-rose">
                              {isLike ? 'View in Who Liked You →' : isMatch ? 'Chat now →' : 'View →'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  return context || defaultContext;
}
