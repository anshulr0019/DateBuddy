'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RANDOM_CHAT_POLL_MS,
  SAFETY_CHECK_AFTER_MESSAGES,
} from '@/lib/random-chat-config';
import type {
  ClientPhase,
  RandomChatPrefs,
  RandomChatSession,
  SessionMessage,
  SessionPoll,
} from './types';

function makeLocalId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `local-${crypto.randomUUID()}`;
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface ConnectionState {
  requestedByMe: boolean;
  requestedByPartner: boolean;
  isMutual: boolean;
}

export interface UseRandomChatResult {
  phase: ClientPhase;
  session: RandomChatSession | null;
  messages: Array<SessionMessage & { idKey: string }>;
  connection: ConnectionState;
  myAlias: string;
  searchingVibe: string | null;
  error: string | null;
  busy: boolean;
  pending: string | null;
  messageCount: number;
  safetySeen: boolean;
  join: (prefs: RandomChatPrefs) => Promise<void>;
  leave: () => Promise<void>;
  end: () => Promise<void>;
  send: (content: string) => Promise<boolean>;
  setConnection: (want: boolean) => Promise<void>;
  report: (reason: string, details?: string | null) => Promise<void>;
  block: () => Promise<void>;
  dismissPreview: () => void;
  reload: () => Promise<boolean>;
  goHome: () => void;
}

function statusOf(poll: SessionPoll | null): RandomChatSession['status'] | null {
  if (!poll || poll.status === 'none' || poll.status === 'searching') return null;
  return poll.session.status;
}

function parsePoll(data: unknown): SessionPoll | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (d.success !== true) return null;
  if (d.status === 'none') return { status: 'none' };
  if (d.status === 'searching' && d.searching) {
    return { status: 'searching', searching: d.searching as { vibe: string } };
  }
  if (d.status === 'ended' && d.session) {
    return { status: 'ended', session: d.session as RandomChatSession };
  }
  if (d.status === 'matched' && d.session) {
    return { status: 'matched', session: d.session as RandomChatSession };
  }
  return null;
}

export function useRandomChat(): UseRandomChatResult {
  const [phase, setPhase] = useState<ClientPhase>('loading');
  const [poll, setPoll] = useState<SessionPoll | null>(null);
  const [messages, setMessages] = useState<Array<SessionMessage & { idKey: string }>>([]);
  const [connection, setConnectionState] = useState<ConnectionState>({
    requestedByMe: false,
    requestedByPartner: false,
    isMutual: false,
  });
  const [myAlias, setMyAlias] = useState('');
  const [searchingVibe, setSearchingVibe] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [safetySeen, setSafetySeen] = useState(false);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const pollRef = useRef(poll);
  pollRef.current = poll;
  const previewSeenForRef = useRef<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const safetySeenForRef = useRef<number | null>(null);

  const applyPoll = useCallback((next: SessionPoll) => {
    setPoll(next);
    setError(null);

    if (next.status === 'none') {
      setPhase('entry');
      return;
    }
    if (next.status === 'searching') {
      setSearchingVibe(next.searching.vibe);
      setPhase('searching');
      return;
    }
    if (next.status === 'ended') {
      setPhase('ended');
      return;
    }
    // matched
    const s = next.session;
    setMyAlias(s.myAlias);
    setConnectionState(s.connection);
    setMessageCount(s.messages.length);

    const serverIds = new Set(s.messages.map((m) => String(m.id)));
    setMessages((prev) => {
      // Keep optimistic local messages that the server hasn't confirmed yet.
      const kept = prev.filter((m) => m.idKey.startsWith('local-') && !serverIds.has(m.idKey));
      const merged = [
        ...kept,
        ...s.messages.map((m) => ({ ...m, idKey: String(m.id) })),
      ];
      merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return merged;
    });

    if (s.status === 'connected') {
      setPhase('connected');
      return;
    }
    // active
    if (previewSeenForRef.current === s.id) {
      setPhase('chat');
    } else {
      previewSeenForRef.current = s.id;
      setPhase('preview');
    }

    // One-time safety nudge after N messages exchanged.
    if (s.messages.length >= SAFETY_CHECK_AFTER_MESSAGES && safetySeenForRef.current !== s.id) {
      setSafetySeen(false);
    }
  }, []);

  const fetchSession = useCallback(async (): Promise<boolean> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const res = await fetch('/api/random-chat/session', { signal: controller.signal });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError('Could not reach the anonymous chat servers.');
        return false;
      }
      const next = parsePoll(data);
      if (!next) {
        setError('Unexpected response from the anonymous chat servers.');
        return false;
      }
      applyPoll(next);
      return true;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return false;
      setError('Network problem while checking your session.');
      return false;
    }
  }, [applyPoll]);

  /* Initial load. */
  useEffect(() => {
    fetchSession();
    return () => controllerRef.current?.abort();
  }, [fetchSession]);

  /* Poll while searching or mid-conversation; stop once settled. */
  useEffect(() => {
    if (phase !== 'searching' && phase !== 'preview' && phase !== 'chat') return;
    const timer = setInterval(() => {
      if (document.hidden || !navigator.onLine) return;
      fetchSession();
    }, RANDOM_CHAT_POLL_MS);
    return () => clearInterval(timer);
  }, [phase, fetchSession]);

  const join = useCallback(
    async (prefs: RandomChatPrefs) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch('/api/random-chat/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prefs),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          setError(data?.message ?? 'Could not start searching.');
          return;
        }
        if (data.status === 'matched') {
          await fetchSession();
        } else {
          setSearchingVibe(prefs.vibe);
          setPhase('searching');
        }
      } catch {
        setError('Network error while joining the queue.');
      } finally {
        setBusy(false);
      }
    },
    [fetchSession]
  );

  const leave = useCallback(async () => {
    setBusy(true);
    try {
      await fetch('/api/random-chat/leave', { method: 'POST' });
      setPhase('entry');
      setPoll({ status: 'none' });
    } finally {
      setBusy(false);
    }
  }, []);

  const end = useCallback(async () => {
    const s = pollRef.current;
    if (!s || s.status === 'none' || s.status === 'searching') return;
    const id = s.session.id;
    setBusy(true);
    try {
      await fetch(`/api/random-chat/${id}/end`, { method: 'POST' });
      await fetchSession();
    } catch {
      setError('Could not end the conversation.');
    } finally {
      setBusy(false);
    }
  }, [fetchSession]);

  const send = useCallback(
    async (content: string): Promise<boolean> => {
      const s = pollRef.current;
      if (!s || s.status !== 'matched' || s.session.status !== 'active') return false;
      if (pending) return false;
      const id = s.session.id;
      const local: SessionMessage & { idKey: string } = {
        id: 0,
        idKey: makeLocalId(),
        senderIsMe: true,
        content,
        createdAt: new Date().toISOString(),
      };
      setPending(local.idKey);
      setMessages((prev) => [...prev, local]);
      try {
        const res = await fetch(`/api/random-chat/${id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          if (res.status === 409) {
            await fetchSession();
          } else {
            setMessages((prev) => prev.filter((m) => m.idKey !== local.idKey));
            setError(data?.message ?? 'Could not send that message.');
          }
          return false;
        }
        const confirmed = data.message as SessionMessage;
        setMessages((prev) => [
          ...prev.filter((m) => m.idKey !== local.idKey),
          { ...confirmed, idKey: String(confirmed.id) },
        ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        return true;
      } catch {
        setMessages((prev) => prev.filter((m) => m.idKey !== local.idKey));
        setError('Network error while sending.');
        return false;
      } finally {
        setPending(null);
      }
    },
    [pending, fetchSession]
  );

  const setConnection = useCallback(
    async (want: boolean) => {
      const s = pollRef.current;
      if (!s || s.status !== 'matched') return;
      const id = s.session.id;
      setBusy(true);
      try {
        const res = await fetch(`/api/random-chat/${id}/connection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connected: want }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.success) {
          if (data.matched === true) {
            await fetchSession();
          } else {
            // Reflect the optimistic request immediately; poll reconciles.
            setConnectionState((prev) => ({ ...prev, requestedByMe: want }));
            setPoll((prevPoll) => {
              if (!prevPoll || prevPoll.status !== 'matched') return prevPoll;
              const s2 = prevPoll.session;
              return {
                status: 'matched',
                session: {
                  ...s2,
                  connection: {
                    requestedByMe: want,
                    requestedByPartner: s2.connection.requestedByPartner,
                    isMutual: want && s2.connection.requestedByPartner,
                  },
                },
              };
            });
            void fetchSession();
          }
        } else {
          setError(data?.message ?? 'Could not update the connection request.');
        }
      } catch {
        setError('Network error while updating the connection request.');
      } finally {
        setBusy(false);
      }
    },
    [fetchSession]
  );

  const report = useCallback(
    async (reason: string, details?: string | null) => {
      const s = pollRef.current;
      if (!s || s.status !== 'matched') return;
      const id = s.session.id;
      setBusy(true);
      try {
        const res = await fetch(`/api/random-chat/${id}/report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason, details: details ?? null }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.message ?? 'Could not submit the report.');
          return;
        }
        await fetchSession();
      } catch {
        setError('Network error while submitting the report.');
      } finally {
        setBusy(false);
      }
    },
    [fetchSession]
  );

  const block = useCallback(async () => {
    const s = pollRef.current;
    if (!s || s.status !== 'matched') return;
    const id = s.session.id;
    setBusy(true);
    try {
      const res = await fetch(`/api/random-chat/${id}/block`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? 'Could not block this person.');
        return;
      }
      await fetchSession();
    } catch {
      setError('Network error while blocking.');
    } finally {
      setBusy(false);
    }
  }, [fetchSession]);

  const dismissPreview = useCallback(() => {
    setPhase('chat');
  }, []);

  const goHome = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/home';
    }
  }, []);

  return {
    phase,
    session: poll && (poll.status === 'matched' || poll.status === 'ended') ? poll.session : null,
    messages,
    connection,
    myAlias,
    searchingVibe,
    error,
    busy,
    pending,
    messageCount,
    safetySeen,
    join,
    leave,
    end,
    send,
    setConnection,
    report,
    block,
    dismissPreview,
    reload: fetchSession,
    goHome,
  };
}
