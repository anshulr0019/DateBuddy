'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessage, Partner, SendStatus } from './chatTypes';

const POLL_INTERVAL_MS = 5_000;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export type ChatPhase = 'loading' | 'ready' | 'notfound' | 'error';

interface ServerMessage {
  id: number;
  senderId: number;
  receiverId: number;
  type?: string;
  content: string;
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
    status: m.senderId === myId ? (m.isRead ? 'seen' : 'sent') : undefined,
  };
}

export function useChat(matchId: number | null, myId: number | null) {
  const [phase, setPhase] = useState<ChatPhase>('loading');
  const [partner, setPartner] = useState<Partner | null>(null);
  const [serverMessages, setServerMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<ChatMessage[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

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
      const res = await fetch(`/api/messages?matchId=${matchId}`, { signal: opts.signal });
      if (res.status === 404) return 'notfound';
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || !Array.isArray(data.messages)) return 'error';

      const raw = data.messages as ServerMessage[];
      const mapped = raw.map((m) => mapServerMessage(m, myId));
      const oldestInPage = raw.length > 0 ? raw[0].id : null;

      // Keep referential equality across polls when nothing changed so memoized
      // bubbles don't re-render and scroll effects don't re-fire every tick.
      const signature = (list: ChatMessage[]) => list.map((m) => `${m.id}:${m.status ?? ''}`).join('|');
      setServerMessages((prev) => {
        // This only returns the newest page; older pages the user already
        // scrolled back to must survive the merge.
        const older = oldestInPage === null ? [] : prev.filter((m) => Number(m.id) < oldestInPage);
        const merged = [...older, ...mapped];
        return signature(prev) === signature(merged) ? prev : merged;
      });

      // Only the initial load defines the back-scroll boundary; polls refetch
      // the newest page and know nothing about how far back the user has gone.
      if (opts.initial) setHasMore(Boolean(data.hasMore));

      // Confirmed server messages supersede any optimistic copies still in flight bookkeeping.
      const serverIds = new Set(raw.map((m) => String(m.id)));
      setPending((prev) => prev.filter((p) => !serverIds.has(p.id)));

      const hasUnreadFromPartner = raw.some((m) => m.senderId !== myId && !m.isRead);
      if (hasUnreadFromPartner) markRead();
      return 'ok';
    },
    [matchId, myId, markRead]
  );

  /* Fetches the page immediately older than what we already hold. */
  const loadOlder = useCallback(async () => {
    if (!matchId || myId === null) return;
    if (loadingOlderRef.current || !hasMore) return;

    const oldest = serverMessages[0];
    if (!oldest) return;
    const cursor = Number(oldest.id);
    if (!Number.isInteger(cursor)) return;

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
    if (!matchId || myId === null) return;
    setPhase('loading');

    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    const { signal } = controller;

    try {
      const [matchesRes, messagesResult] = await Promise.all([
        fetch('/api/matches', { signal }),
        fetchMessages({ signal, initial: true }),
      ]);

      if (messagesResult === 'notfound') {
        setPhase('notfound');
        return;
      }
      if (messagesResult === 'error') {
        setPhase('error');
        return;
      }

      const matchesData = await matchesRes.json().catch(() => null);
      if (!matchesRes.ok || !matchesData?.success || !Array.isArray(matchesData.matches)) {
        setPhase('error');
        return;
      }

      const found = matchesData.matches.find((m: { id: number }) => m.id === matchId);
      if (!found) {
        setPhase('notfound');
        return;
      }

      setPartner({
        matchId,
        partnerId: found.partnerId,
        name: found.name ?? 'Match',
        photo: found.photo ?? null,
        verified: Boolean(found.verified),
      });
      setPhase('ready');
    } catch {
      // An abort means a newer load (or unmount) superseded this one.
      if (signal.aborted) return;
      setPhase('error');
    }
  }, [matchId, myId, fetchMessages]);

  useEffect(() => {
    load();
  }, [load]);

  /* Drop any request still in flight when the chat changes or unmounts. */
  useEffect(() => {
    return () => {
      loadAbortRef.current?.abort();
      olderAbortRef.current?.abort();
    };
  }, [matchId]);

  /* Poll for new messages and read-receipt changes while the tab is visible. */
  useEffect(() => {
    if (phase !== 'ready') return;
    const timer = setInterval(() => {
      if (document.hidden || !navigator.onLine) return;
      if (sendsInFlightRef.current > 0) return;
      fetchMessages().catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
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

        // Photos upload first; the message row then stores the hosted URL.
        const file = filesRef.current.get(msg.id);
        if (msg.type === 'photo' && file) {
          let url = uploadedUrlsRef.current.get(msg.id);
          if (!url) {
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
          body: JSON.stringify({ matchId, content, type: msg.type }),
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
      } catch {
        const offline = typeof navigator !== 'undefined' && !navigator.onLine;
        setPendingStatus(msg.id, offline ? 'queued' : 'failed');
      } finally {
        sendsInFlightRef.current -= 1;
      }
    },
    [matchId, myId, setPendingStatus]
  );

  const sendText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || myId === null) return;
      const online = typeof navigator === 'undefined' || navigator.onLine;
      const msg: ChatMessage = {
        id: makeClientId(),
        senderId: myId,
        type: 'text',
        content: trimmed,
        createdAt: new Date().toISOString(),
        status: online ? 'sending' : 'queued',
      };
      setPending((prev) => [...prev, msg]);
      if (online) doSend(msg);
    },
    [myId, doSend]
  );

  const sendPhoto = useCallback(
    (file: File) => {
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

  /* Online/offline tracking + flushing the queue on reconnect. */
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

  /* Release preview object URLs if the user leaves mid-send. */
  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const messages = useMemo(() => [...serverMessages, ...pending], [serverMessages, pending]);

  const clearComposerError = useCallback(() => setComposerError(null), []);

  return {
    phase,
    partner,
    messages,
    isOnline,
    composerError,
    clearComposerError,
    hasMore,
    loadingOlder,
    loadOlder,
    sendText,
    sendPhoto,
    retry,
    reload: load,
  };
}
