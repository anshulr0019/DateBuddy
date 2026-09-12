'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPusherClient } from '@/lib/pusher-client';
import { compressImageForUpload } from '@/lib/image-compress';
import type { ChatMessage, Partner, SendStatus, ReplyTarget } from './chatTypes';

const FALLBACK_POLL_INTERVAL_MS = 5_000;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export type ChatPhase = 'loading' | 'ready' | 'notfound' | 'error';

interface ServerMessage {
  id: number;
  senderId: number;
  receiverId: number;
  type?: string;
  content: string;
  metadata?: any;
  isRead?: boolean | null;
  createdAt: string;
}

function makeClientId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `local-${crypto.randomUUID()}`;
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function mapServerMessage(m: ServerMessage, myId: number): ChatMessage {
  return {
    id: String(m.id),
    senderId: m.senderId,
    type: (m.type as ChatMessage['type']) || 'text',
    content: m.content,
    createdAt: m.createdAt,
    metadata: m.metadata || null,
    status: m.senderId === myId ? (m.isRead ? 'seen' : 'sent') : undefined,
  };
}

export function useChat(matchId: number | null, myId: number | null) {
  const [phase, setPhase] = useState<ChatPhase>('loading');
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [serverMessages, setServerMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<ChatMessage[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  const filesRef = useRef<Map<string, File>>(new Map());
  const objectUrlsRef = useRef<Map<string, string>>(new Map());
  const uploadedUrlsRef = useRef<Map<string, string>>(new Map());
  const sendsInFlightRef = useRef(0);
  const pendingRef = useRef<ChatMessage[]>([]);
  pendingRef.current = pending;
  const loadAbortRef = useRef<AbortController | null>(null);
  const olderAbortRef = useRef<AbortController | null>(null);
  const loadingOlderRef = useRef(false);

  const markRead = useCallback(() => {
    if (!matchId) return;
    fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId }),
    }).catch(() => {});
  }, [matchId]);

  const fetchMessages = useCallback(
    async (opts: { signal?: AbortSignal; initial?: boolean } = {}): Promise<'ok' | 'notfound' | 'error'> => {
      if (!matchId || myId === null) return 'error';
      const res = await fetch(`/api/messages?matchId=${matchId}${opts.initial ? '&includePartner=true' : ''}`, { signal: opts.signal });
      if (res.status === 404) return 'notfound';
      const data = await res.json().catch(() => null);
      if (opts.signal?.aborted) return 'error';
      if (!res.ok || !data?.success || !Array.isArray(data.messages)) return 'error';
      if (opts.initial) {
        if (!data.partner || Number(data.partner.matchId) !== matchId) return 'error';
        setPartner(data.partner as Partner);
      }

      const raw = data.messages as ServerMessage[];
      const mapped = raw.map((m) => mapServerMessage(m, myId));
      const oldestInPage = raw.length > 0 ? raw[0].id : null;

      const signature = (list: ChatMessage[]) =>
        list.map((m) => `${m.id}:${m.status ?? ''}:${JSON.stringify(m.metadata?.reactions ?? '')}`).join('|');
      setServerMessages((prev) => {
        const older = oldestInPage === null ? [] : prev.filter((m) => Number(m.id) < oldestInPage);
        const merged = [...older, ...mapped];
        return signature(prev) === signature(merged) ? prev : merged;
      });

      if (opts.initial) setHasMore(Boolean(data.hasMore));

      const serverIds = new Set(raw.map((m) => String(m.id)));
      setPending((prev) => prev.filter((p) => !serverIds.has(p.id)));

      const hasUnreadFromPartner = raw.some((m) => m.senderId !== myId && !m.isRead);
      if (hasUnreadFromPartner && !document.hidden) {
        markRead();
      }

      return 'ok';
    },
    [matchId, myId, markRead]
  );

  const loadOlder = useCallback(async () => {
    if (!matchId || myId === null || loadingOlderRef.current || !hasMore) return;
    const cursor = serverMessages[0]?.id;
    if (!cursor) return;

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    olderAbortRef.current?.abort();
    const controller = new AbortController();
    olderAbortRef.current = controller;

    try {
      const res = await fetch(`/api/messages?matchId=${matchId}&before=${cursor}`, {
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || !Array.isArray(data.messages)) return;

      const older = (data.messages as ServerMessage[]).map((m) => mapServerMessage(m, myId));
      setServerMessages((prev) => {
        const known = new Set(prev.map((m) => m.id));
        const fresh = older.filter((m) => !known.has(m.id));
        return fresh.length ? [...fresh, ...prev] : prev;
      });
      setHasMore(Boolean(data.hasMore));
    } catch {
      /* Leave hasMore set so the user can try scrolling up again. */
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [matchId, myId, hasMore, serverMessages]);

  const load = useCallback(async () => {
    if (!matchId || myId === null) {
      setPhase('notfound');
      return;
    }

    setPhase('loading');
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    const signal = controller.signal;

    try {
      const msgResult = await fetchMessages({ signal, initial: true });
      if (signal.aborted) return;
      if (msgResult === 'notfound') {
        setPhase('notfound');
        return;
      }
      if (msgResult === 'error') {
        setPhase('error');
        return;
      }

      setPhase('ready');
    } catch {
      if (signal.aborted) return;
      setPhase('error');
    }
  }, [matchId, myId, fetchMessages]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      loadAbortRef.current?.abort();
      olderAbortRef.current?.abort();
    };
  }, [matchId]);

  /* Real-time Pusher updates */
  useEffect(() => {
    if (!matchId || myId === null) return;
    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `chat-${matchId}`;
    const channel = pusher.subscribe(channelName);

    const handleNewMessage = (data: ServerMessage) => {
      const confirmed = mapServerMessage(data, myId);
      setPending((prev) => prev.filter((p) => p.id !== confirmed.id));
      setServerMessages((prev) => {
        if (prev.some((s) => s.id === confirmed.id)) return prev;
        return [...prev, confirmed];
      });
      if (confirmed.senderId !== myId) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setIsPartnerTyping(false);
        setPartner((prev) => (prev ? { ...prev, online: true, lastActiveAt: new Date().toISOString() } : prev));
        markRead();
      }
    };

    const handleMessagesRead = ({ readerId }: { readerId: number }) => {
      if (readerId !== myId) {
        setPartner((prev) => (prev ? { ...prev, online: true, lastActiveAt: new Date().toISOString() } : prev));
        setServerMessages((prev) =>
          prev.map((m) => (m.senderId === myId ? { ...m, status: 'seen' as const } : m))
        );
      }
    };

    const handleTyping = (data: { senderId: number; isTyping: boolean }) => {
      if (data.senderId !== myId) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (data.isTyping) {
          setIsPartnerTyping(true);
          setPartner((prev) => (prev ? { ...prev, online: true, lastActiveAt: new Date().toISOString() } : prev));
          typingTimeoutRef.current = setTimeout(() => setIsPartnerTyping(false), 4000);
        } else {
          setIsPartnerTyping(false);
        }
      }
    };

    const handleReaction = (data: { messageId: number; reactions: Record<string, string> }) => {
      setServerMessages((prev) =>
        prev.map((m) =>
          Number(m.id) === Number(data.messageId)
            ? {
                ...m,
                metadata: {
                  ...(m.metadata || {}),
                  reactions: data.reactions,
                },
              }
            : m
        )
      );
    };

    channel.bind('new-message', handleNewMessage);
    channel.bind('messages-read', handleMessagesRead);
    channel.bind('typing', handleTyping);
    channel.bind('message-reaction', handleReaction);

    return () => {
      channel.unbind('new-message', handleNewMessage);
      channel.unbind('messages-read', handleMessagesRead);
      channel.unbind('typing', handleTyping);
      channel.unbind('message-reaction', handleReaction);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [matchId, myId, markRead]);

  /* Immediate sync on window focus / tab visibility */
  useEffect(() => {
    if (phase !== 'ready') return;
    const handleFocus = () => {
      if (!document.hidden && navigator.onLine) {
        fetchMessages().catch(() => {});
        markRead();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [phase, fetchMessages, markRead]);

  /* Background poll */
  useEffect(() => {
    if (phase !== 'ready') return;
    let polling = false;
    const controller = new AbortController();
    const pusher = getPusherClient();
    const timer = setInterval(async () => {
      if (document.hidden || !navigator.onLine) return;
      if (pusher?.connection.state === 'connected') return;
      if (sendsInFlightRef.current > 0 || polling) return;
      polling = true;
      try {
        await fetchMessages({ signal: controller.signal });
      } catch { /* Retry on the next poll. */ }
      finally { polling = false; }
    }, FALLBACK_POLL_INTERVAL_MS);
    return () => { clearInterval(timer); controller.abort(); };
  }, [phase, fetchMessages]);

  const setPendingStatus = useCallback((id: string, status: SendStatus) => {
    setPending((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }, []);

  const doSend = useCallback(
    async (msg: ChatMessage) => {
      if (!matchId || myId === null) return;
      sendsInFlightRef.current += 1;
      try {
        let content = msg.content;

        // Photos upload first
        const rawFile = filesRef.current.get(msg.id);
        if (msg.type === 'photo' && rawFile) {
          let url = uploadedUrlsRef.current.get(msg.id);
          if (!url) {
            const file = await compressImageForUpload(rawFile);
            const fd = new FormData();
            fd.append('file', file);
            const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
            const upData = await upRes.json().catch(() => null);
            if (!upRes.ok || !upData?.success || !upData.url) {
              throw new Error(upData?.message || 'Upload failed');
            }
            url = upData.url as string;
            uploadedUrlsRef.current.set(msg.id, url);
          }
          content = url;
        }

        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId, content, type: msg.type, metadata: msg.metadata || undefined }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success || !data.message) {
          throw new Error(data?.message || 'Send failed');
        }

        const confirmed = mapServerMessage(data.message as ServerMessage, myId);
        setPending((prev) => prev.filter((p) => p.id !== msg.id));
        setServerMessages((prev) =>
          prev.some((s) => s.id === confirmed.id) ? prev : [...prev, confirmed]
        );

        filesRef.current.delete(msg.id);
        uploadedUrlsRef.current.delete(msg.id);
        const objectUrl = objectUrlsRef.current.get(msg.id);
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrlsRef.current.delete(msg.id);
        }
      } catch (err) {
        console.error('[CHAT] Send failed:', err);
        const offline = typeof navigator !== 'undefined' && !navigator.onLine;
        setPendingStatus(msg.id, offline ? 'queued' : 'failed');
      } finally {
        sendsInFlightRef.current -= 1;
      }
    },
    [matchId, myId, setPendingStatus]
  );

  const sendText = useCallback(
    (text: string, replyTo?: ReplyTarget | null) => {
      const trimmed = text.trim();
      if (!trimmed || myId === null) return;
      const online = typeof navigator === 'undefined' || navigator.onLine;
      const msg: ChatMessage = {
        id: makeClientId(),
        senderId: myId,
        type: 'text',
        content: trimmed,
        createdAt: new Date().toISOString(),
        metadata: replyTo ? { replyTo } : null,
        status: online ? 'sending' : 'queued',
      };
      setPending((prev) => [...prev, msg]);
      if (online) doSend(msg);
    },
    [myId, doSend]
  );

  const sendPhoto = useCallback(
    (file: File, replyTo?: ReplyTarget | null) => {
      if (myId === null) return;
      if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
        setComposerError('Only JPEG, PNG, WebP and HEIC images are supported.');
        return;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setComposerError('Images must be smaller than 8MB.');
        return;
      }

      const id = makeClientId();
      const objectUrl = URL.createObjectURL(file);
      filesRef.current.set(id, file);
      objectUrlsRef.current.set(id, objectUrl);

      const online = typeof navigator === 'undefined' || navigator.onLine;
      const msg: ChatMessage = {
        id,
        senderId: myId,
        type: 'photo',
        content: objectUrl,
        createdAt: new Date().toISOString(),
        metadata: replyTo ? { replyTo } : null,
        status: online ? 'sending' : 'queued',
      };
      setPending((prev) => [...prev, msg]);
      if (online) doSend(msg);
    },
    [myId, doSend]
  );

  const retry = useCallback(
    (id: string) => {
      const msg = pendingRef.current.find((p) => p.id === id);
      if (!msg) return;
      setPendingStatus(id, 'sending');
      doSend({ ...msg, status: 'sending' });
    },
    [doSend, setPendingStatus]
  );

  const reactToMessage = useCallback(
    async (messageId: string, emoji: string) => {
      if (!matchId || myId === null) return;
      const numId = Number(messageId);
      if (!numId) return;

      // Optimistic update
      setServerMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId) {
            const currentReactions: Record<string, string> = { ...(m.metadata?.reactions || {}) };
            if (currentReactions[String(myId)] === emoji) {
              delete currentReactions[String(myId)];
            } else {
              currentReactions[String(myId)] = emoji;
            }
            return {
              ...m,
              metadata: {
                ...(m.metadata || {}),
                reactions: currentReactions,
              },
            };
          }
          return m;
        })
      );

      try {
        await fetch('/api/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId,
            messageId: numId,
            reaction: emoji,
          }),
        });
      } catch (err) {
        console.error('[REACT] Failed to update reaction:', err);
      }
    },
    [matchId, myId]
  );

  /* Send a GIF or sticker by URL */
  const sendGif = useCallback(
    (url: string) => {
      if (!url.trim() || myId === null) return;
      const online = typeof navigator === 'undefined' || navigator.onLine;
      const msg: ChatMessage = {
        id: makeClientId(),
        senderId: myId,
        type: 'gif',
        content: url,
        createdAt: new Date().toISOString(),
        status: online ? 'sending' : 'queued',
      };
      setPending((prev) => [...prev, msg]);
      if (online) doSend(msg);
    },
    [myId, doSend]
  );

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => {
      setIsOnline(true);
      pendingRef.current
        .filter((p) => p.status === 'queued')
        .forEach((p) => {
          setPendingStatus(p.id, 'sending');
          doSend({ ...p, status: 'sending' });
        });
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [doSend, setPendingStatus]);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const messages = useMemo(() => [...serverMessages, ...pending], [serverMessages, pending]);
  const clearComposerError = useCallback(() => setComposerError(null), []);

  const notifyTyping = useCallback(() => {
    if (!matchId) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;

    fetch('/api/messages/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, isTyping: true }),
    }).catch(() => {});
  }, [matchId]);

  return {
    phase,
    partner,
    messages,
    isOnline,
    isPartnerTyping,
    composerError,
    clearComposerError,
    hasMore,
    loadingOlder,
    loadOlder,
    sendText,
    sendPhoto,
    sendGif,
    notifyTyping,
    retry,
    reactToMessage,
    reload: load,
  };
}
