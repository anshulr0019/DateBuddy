'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Ic } from '../components/icons';
import { SafeImage } from '../components/shared';
import styles from './messages.module.css';
import { useNotifications } from '../context/NotificationContext';
import { formatListTime } from '../lib/time';
import { useCurrentUser } from '../lib/useCurrentUser';
import { getPusherClient } from '@/lib/pusher-client';
import { hapticLight } from '../lib/haptics';
import {
  type ConversationSummary,
  getCachedConversations,
  setCachedConversations,
  subscribeConversationCache,
  updateConversationPreview,
} from '../lib/conversationCache';

const PartnerProfileSheet = dynamic(
  () => import('../components/PartnerProfileSheet').then((mod) => mod.PartnerProfileSheet),
  { ssr: false }
);

type Conversation = ConversationSummary;

type LoadPhase = 'loading' | 'ready' | 'error';
type Filter = 'all' | 'unread' | 'active';

const POLL_INTERVAL_MS = 30_000;
const CONNECTED_SAFETY_INTERVAL_MS = 90_000;

function isThisWeek(timestamp: string) {
  const time = new Date(timestamp).getTime();
  if (!Number.isFinite(time)) return true;
  return Date.now() - time < 7 * 24 * 60 * 60 * 1000;
}

export default function MessagesPage() {
  const router = useRouter();
  const auth = useCurrentUser();
  const myId = auth.status === 'authenticated' ? auth.userId : null;
  const { openNotifications } = useNotifications();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(() => getCachedConversations() || []);
  const [phase, setPhase] = useState<LoadPhase>(() => getCachedConversations() ? 'ready' : 'loading');
  const abortRef = useRef<AbortController | null>(null);
  const lastLoadedAtRef = useRef(0);
  // Subscription membership changes only when chats are added or removed,
  // not whenever a preview, unread count, or polling timestamp changes.
  const conversationIds = useMemo(() => conversations.map(c => c.id).sort((a, b) => a - b).join(','), [conversations]);
  const recentChatIds = conversations.slice(0, 5).map(c => c.id).join(',');

  useEffect(() => {
    // Prefetch route code only: opening the screen still performs the normal
    // authenticated message request, and prefetching never marks a chat read.
    recentChatIds.split(',').filter(Boolean).forEach(id => router.prefetch(`/chat/${id}`));
  }, [recentChatIds, router]);

  const loadConversations = useCallback(async (isRetry = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (isRetry && !getCachedConversations()) setPhase('loading');

    try {
      const res = await fetch('/api/conversations', { signal: controller.signal });
      if (res.status === 401) {
        router.replace('/welcome');
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.success || !Array.isArray(data.conversations)) {
        throw new Error(data.message || 'Failed to load conversations');
      }
      const sorted = [...data.conversations].sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
      setCachedConversations(sorted);
      lastLoadedAtRef.current = Date.now();
      setPhase('ready');
    } catch {
      if (controller.signal.aborted) return;
      setPhase((prev) => (prev === 'ready' || getCachedConversations() ? 'ready' : 'error'));
    }
  }, [router]);

  useEffect(() => subscribeConversationCache((items) => {
    setConversations(items);
    setPhase('ready');
  }), []);

  useEffect(() => {
    loadConversations();
    const refreshOnVisible = () => {
      if (!document.hidden && navigator.onLine) loadConversations();
    };
    document.addEventListener('visibilitychange', refreshOnVisible);
    window.addEventListener('online', refreshOnVisible);
    const timer = setInterval(() => {
      if (document.hidden || !navigator.onLine) return;
      const pusher = getPusherClient();
      if (pusher?.connection.state === 'connected' &&
          Date.now() - lastLoadedAtRef.current < CONNECTED_SAFETY_INTERVAL_MS) return;
      loadConversations();
    }, POLL_INTERVAL_MS);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshOnVisible);
      window.removeEventListener('online', refreshOnVisible);
      abortRef.current?.abort();
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!myId) return;
    const pusher = getPusherClient();
    if (!pusher) return;
    const channel = pusher.subscribe(`user-${myId}`);
    const refreshOnMatch = () => { void loadConversations(); };
    channel.bind('new-match', refreshOnMatch);
    return () => { channel.unbind('new-match', refreshOnMatch); };
  }, [myId, loadConversations]);

  useEffect(() => {
    if (!conversationIds) return;
    const pusher = getPusherClient();
    if (!pusher) return;
    const channels: string[] = [];

    conversationIds.split(',').map(Number).forEach((id) => {
      const channelName = `chat-${id}`;
      channels.push(channelName);
      const channel = pusher.subscribe(channelName);

      channel.bind('new-message', (data: any) => {
        let displayMsg = data.content;
        if (typeof data.content === 'string' && data.content.startsWith('CALL_EVENT:')) {
          try {
            const parsed = JSON.parse(data.content.replace('CALL_EVENT:', ''));
            const isVideo = parsed.callType === 'video';
            const isMissed = ['missed', 'declined', 'cancelled'].includes(parsed.status);
            displayMsg = isMissed
              ? isVideo ? '📹 Missed video call' : '📞 Missed audio call'
              : isVideo ? '📹 Video call' : '📞 Audio call';
          } catch {
            displayMsg = '📞 Call';
          }
        } else {
          const byType: Record<string, string> = {
            photo: '📷 Photo', voice: '🎙️ Voice Note', location: '📍 Location', gif: '🎬 GIF',
          };
          displayMsg = byType[data.type] ?? data.content;
        }
        updateConversationPreview(id, displayMsg, data.createdAt || new Date().toISOString(), {
          incrementUnread: data.senderId !== myId,
        });
      });
    });

    return () => channels.forEach((ch) => pusher.unsubscribe(ch));
  }, [conversationIds, myId]);

  const query = search.trim().toLowerCase();
  const filtered = useMemo(() => conversations.filter((conversation) => {
    const matchesQuery = !query || [conversation.name, conversation.lastMsg]
      .some((value) => (value ?? '').toLowerCase().includes(query));
    const matchesFilter = filter === 'all'
      || (filter === 'unread' && conversation.unread > 0)
      || (filter === 'active' && conversation.online);
    return matchesQuery && matchesFilter;
  }), [conversations, filter, query]);

  const activePeople = useMemo(() => conversations.filter((conversation) => conversation.online).slice(0, 5), [conversations]);
  const unreadTotal = conversations.reduce((total, conversation) => total + conversation.unread, 0);
  const groups = useMemo(() => [
    { label: 'THIS WEEK', rows: filtered.filter((conversation) => isThisWeek(conversation.time)) },
    { label: 'EARLIER', rows: filtered.filter((conversation) => !isThisWeek(conversation.time)) },
  ].filter((group) => group.rows.length > 0), [filtered]);

  const renderConversation = (conversation: Conversation) => (
    <div
      key={conversation.id}
      role="listitem"
      className={`${styles.conversation} ${conversation.unread > 0 ? styles.conversationUnread : ''}`}
      onClick={() => { hapticLight(); router.push(`/chat/${conversation.id}`); }}
    >
      <button
        type="button"
        className={styles.avatarButton}
        onClick={(event) => { event.stopPropagation(); hapticLight(); setSelectedConv(conversation); }}
        aria-label={`View ${conversation.name}'s profile`}
      >
        <span className={`${styles.avatar} ${styles.avatarSmall}`}>
          <SafeImage src={conversation.photo} name={conversation.name} alt={conversation.name} width={160} className={styles.avatarImage} />
          {conversation.online && <span className={styles.onlineDot} aria-label="Online now" />}
        </span>
      </button>
      <div className={styles.details}>
        <div className={styles.nameLine}>
          <h2 className={styles.name}>{conversation.name}</h2>
          <span className={`${styles.time} ${conversation.unread > 0 ? styles.timeUnread : ''}`}>{formatListTime(conversation.time)}</span>
        </div>
        <div className={styles.previewLine}>
          <p className={`${styles.preview} ${conversation.unread > 0 ? styles.previewUnread : ''}`}>{conversation.lastMsg}</p>
          {conversation.unread > 0 && (
            <span className={styles.unreadBadge} aria-label={`${conversation.unread} unread messages`}>
              {conversation.unread > 99 ? '99+' : conversation.unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.root}>
      <div className={`${styles.shell} infyn-screen-arrive`}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.titleCluster}>
              <h1 className={styles.title}>Messages</h1>
              {unreadTotal > 0 && <span key={unreadTotal} className={`${styles.countBadge} animate-attention-pop`}>{unreadTotal > 99 ? '99+' : unreadTotal}</span>}
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => { hapticLight(); openNotifications(); }}
                aria-label="Open notifications"
              >
                <Ic.Bell />
              </button>
            </div>
          </div>

          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}><Ic.Search /></span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search names or chats…"
              aria-label="Search names or chats"
              enterKeyHint="search"
              className={styles.searchInput}
            />
            {search && <button type="button" className={styles.clearButton} onClick={() => setSearch('')} aria-label="Clear search">×</button>}
          </div>

          <div className={styles.filters} role="tablist" aria-label="Message filters">
            {([
              ['all', 'All'], ['unread', 'Unread'], ['active', 'Active'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filter === value}
                className={`${styles.filterChip} ${filter === value ? styles.filterChipActive : ''}`}
                onClick={() => { hapticLight(); setFilter(value); }}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <main className={styles.scroll}>
          {phase === 'loading' ? (
            <div className={styles.skeletonStack} aria-label="Loading messages" role="status">
              {[1, 2, 3, 4, 5].map((item) => <div key={item} className={styles.skeleton} />)}
            </div>
          ) : phase === 'error' ? (
            <div className={styles.error} role="alert">
              <div className={styles.emptyIcon} aria-hidden><Ic.Chat /></div>
              <h2 className={styles.emptyTitle}>Couldn’t load your messages</h2>
              <p className={styles.emptyText}>Check your connection and try again. Your conversations will be right here.</p>
              <button type="button" className={styles.primaryButton} onClick={() => loadConversations(true)}>Try again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon} aria-hidden><Ic.Chat /></div>
              <h2 className={styles.emptyTitle}>{query || filter !== 'all' ? 'No conversations found' : 'No messages yet'}</h2>
              <p className={styles.emptyText}>
                {query ? `Nothing matches “${search}”. Try another name or phrase.` : filter !== 'all' ? 'You’re all caught up. New conversations will appear here.' : 'Start discovering people and your conversations will appear here.'}
              </p>
              {query || filter !== 'all' ? (
                <button type="button" className={styles.primaryButton} onClick={() => { setSearch(''); setFilter('all'); }}>Show all messages</button>
              ) : (
                <button type="button" className={styles.primaryButton} onClick={() => router.push('/discover')}>Start discovering</button>
              )}
            </div>
          ) : (
            <>
              {activePeople.length > 0 && (
                <section className={styles.activeSection} aria-labelledby="active-heading">
                  <h2 id="active-heading" className={styles.sectionLabel}>ACTIVE NOW</h2>
                  <div className={styles.activeRow}>
                    {activePeople.map((person) => (
                      <button key={person.id} type="button" className={styles.activePerson} onClick={() => { hapticLight(); router.push(`/chat/${person.id}`); }} aria-label={`Message ${person.name}`}>
                        <span className={`${styles.avatar} ${styles.activeAvatar}`}>
                          <SafeImage src={person.photo} name={person.name} alt={person.name} width={160} className={styles.avatarImage} />
                          <span className={styles.onlineDot} aria-hidden />
                        </span>
                        <span className={styles.activeName}>{person.name}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {groups.map((group) => (
                <section key={group.label} className={styles.group} aria-labelledby={`group-${group.label}`}>
                  <h2 id={`group-${group.label}`} className={styles.sectionLabel}>{group.label}</h2>
                  <div className={styles.listCard} role="list" aria-label={`${group.label.toLowerCase()} conversations`}>
                    {group.rows.map(renderConversation)}
                  </div>
                </section>
              ))}
            </>
          )}
        </main>
      </div>

      {selectedConv && (
        <PartnerProfileSheet
          isOpen
          partnerId={selectedConv.partnerId}
          matchId={selectedConv.id}
          initialData={{ name: selectedConv.name, photo: selectedConv.photo }}
          onClose={() => setSelectedConv(null)}
          onAudioCall={() => router.push(`/chat/${selectedConv.id}?call=audio`)}
          onVideoCall={() => router.push(`/chat/${selectedConv.id}?call=video`)}
        />
      )}
    </div>
  );
}
