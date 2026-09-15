'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { SafeImage } from '../../components/shared';
import chatStyles from './chat.module.css';
import { Ic } from '../../components/icons';
import { dayLabel, isSameDay, formatLastSeen } from '../../lib/time';
import { useCurrentUser } from '../../lib/useCurrentUser';
import { useKeyboardInset } from '../../lib/useKeyboardInset';
import { useChat } from './useChat';
import type { ChatMessage, ReplyTarget } from './chatTypes';
import { MessageBubble } from './components/MessageBubble';
import { Composer } from './components/Composer';
import type { DrawerTab } from './components/MediaDrawer';
import { VibeCheckBanner } from './components/VibeCheckBanner';
import { MemoryLaneCard } from './components/MemoryLaneCard';
import AIWingman from '../../components/AIWingman';
import { hapticLight } from '../../lib/haptics';

const MediaDrawer = dynamic(() => import('./components/MediaDrawer').then((mod) => mod.MediaDrawer), { ssr: false });
const Lightbox = dynamic(() => import('./components/Overlays').then((mod) => mod.Lightbox), { ssr: false });
const SafetySheet = dynamic(() => import('./components/Overlays').then((mod) => mod.SafetySheet), { ssr: false });
const MessageReactionsOverlay = dynamic(
  () => import('./components/MessageReactionsOverlay').then((mod) => mod.MessageReactionsOverlay),
  { ssr: false }
);
const CallModal = dynamic(() => import('../../components/CallModal').then((mod) => mod.CallModal), { ssr: false });
const PartnerProfileSheet = dynamic(
  () => import('../../components/PartnerProfileSheet').then((mod) => mod.PartnerProfileSheet),
  { ssr: false }
);
const MiniGamesDrawer = dynamic(
  () => import('./components/MiniGamesDrawer').then((mod) => mod.MiniGamesDrawer),
  { ssr: false }
);
const DatePlannerDrawer = dynamic(
  () => import('./components/DatePlannerDrawer').then((mod) => mod.DatePlannerDrawer),
  { ssr: false }
);

const ICEBREAKERS = [
  'Hey! Great to match with you ✨',
  'Coffee or chai? ☕',
  'Two truths and a lie — go! 🎲',
];

const NEAR_BOTTOM_PX = 120;
const LOAD_OLDER_PX = 200;

function ChatContent() {
  const router = useRouter();
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const matchId = Number(rawId);
  const validMatchId = Number.isInteger(matchId) && matchId > 0 ? matchId : null;

  const auth = useCurrentUser();
  const myId = auth.status === 'authenticated' ? auth.userId : null;
  const keyboardInset = useKeyboardInset();

  useEffect(() => {
    if (auth.status === 'unauthenticated') router.replace('/welcome');
  }, [auth.status, router]);

    // Prefetch messages list so tapping Back is instantaneous (0ms lag)
  useEffect(() => {
    router.prefetch('/messages');
    router.prefetch('/profile');
  }, [router]);

  const chat = useChat(validMatchId, myId);
  const { partner, messages, isPartnerTyping, notifyTyping, composerError, clearComposerError } = chat;

  const [inputText, setInputText] = useState('');
  const [drawerTab, setDrawerTab] = useState<DrawerTab | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);
  const [datePlannerOpen, setDatePlannerOpen] = useState(false);
  const [showNewChip, setShowNewChip] = useState(false);
  const [actionMessage, setActionMessage] = useState<ChatMessage | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [callMenuOpen, setCallMenuOpen] = useState(false);
  const callMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!callMenuOpen) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!callMenuRef.current?.contains(event.target as Node)) setCallMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCallMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [callMenuOpen]);

  /* Enhanced typing indicator — track how long partner has been typing */
  const typingStartedAtRef = useRef<number | null>(null);
  const [isLongTyping, setIsLongTyping] = useState(false);

  useEffect(() => {
    if (isPartnerTyping) {
      if (!typingStartedAtRef.current) {
        typingStartedAtRef.current = Date.now();
      }
      const timer = setTimeout(() => {
        if (typingStartedAtRef.current && Date.now() - typingStartedAtRef.current >= 15000) {
          setIsLongTyping(true);
        }
      }, 15000);
      return () => clearTimeout(timer);
    } else {
      typingStartedAtRef.current = null;
      setIsLongTyping(false);
    }
  }, [isPartnerTyping]);

  const searchParams = useSearchParams();
  useEffect(() => {
    const action = searchParams?.get('action');
    if (action === 'block' || action === 'report') {
      setSafetyOpen(true);
    }
  }, [searchParams]);
  const [callState, setCallState] = useState<{
    isOpen: boolean;
    callType: 'audio' | 'video';
    mode: 'outgoing' | 'incoming';
    incomingOfferData?: any;
  }>({
    isOpen: false,
    callType: 'video',
    mode: 'outgoing',
  });

  useEffect(() => {
    if (callState.isOpen) window.dispatchEvent(new Event('infyn:call-interruption'));
  }, [callState.isOpen]);

  const feedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nearBottomRef = useRef(true);
  const didInitialScrollRef = useRef(false);
  const restoreScrollRef = useRef<number | null>(null);
  const handledCallIntentRef = useRef<string | null>(null);

  /* Calls launched from the Messages profile sheet arrive as a query intent. */
  useEffect(() => {
    const requestedCall = searchParams?.get('call');
    if (!partner || !validMatchId || callState.isOpen) return;
    if (requestedCall !== 'audio' && requestedCall !== 'video') return;

    const intentKey = `${validMatchId}:${requestedCall}`;
    if (handledCallIntentRef.current === intentKey) return;
    handledCallIntentRef.current = intentKey;
    setCallState({ isOpen: true, callType: requestedCall, mode: 'outgoing' });
    router.replace(`/chat/${validMatchId}`, { scroll: false });
  }, [callState.isOpen, partner, router, searchParams, validMatchId]);

  /* Composer validation errors dismiss themselves. */
  useEffect(() => {
    if (!composerError) return;
    const t = setTimeout(clearComposerError, 4000);
    return () => clearTimeout(t);
  }, [composerError, clearComposerError]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const feed = feedRef.current;
    if (feed) feed.scrollTo({ top: feed.scrollHeight, behavior });
    setShowNewChip(false);
  }, []);

  const handleFeedScroll = useCallback(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const nearBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < NEAR_BOTTOM_PX;
    nearBottomRef.current = nearBottom;
    if (nearBottom) setShowNewChip(false);

    if (feed.scrollTop < LOAD_OLDER_PX && chat.hasMore && !chat.loadingOlder) {
      // Remember the distance from the bottom: prepending older messages grows
      // scrollHeight, and matching that distance keeps the view visually still.
      restoreScrollRef.current = feed.scrollHeight - feed.scrollTop;
      chat.loadOlder();
    }
  }, [chat]);

  /* Re-anchor after an older page prepends. */
  const firstMessageId = messages[0]?.id;
  useLayoutEffect(() => {
    const feed = feedRef.current;
    const anchor = restoreScrollRef.current;
    if (!feed || anchor === null) return;
    restoreScrollRef.current = null;
    feed.scrollTop = feed.scrollHeight - anchor;
  }, [firstMessageId]);

  /* Auto-scroll only when the user is already at the bottom (or just sent
     something); otherwise offer a jump chip instead of yanking the view. */
  const lastMessage = messages[messages.length - 1];
  useEffect(() => {
    if (!lastMessage) return;
    if (!didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      scrollToBottom('auto');
      return;
    }
    if (nearBottomRef.current || lastMessage.senderId === myId) {
      scrollToBottom();
    } else {
      setShowNewChip(true);
    }
  }, [lastMessage, myId, scrollToBottom]);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    chat.sendText(inputText, replyingTo);
    setInputText('');
    setReplyingTo(null);
    setDrawerTab(null);
  }, [chat, inputText, replyingTo]);

  const handlePickFile = useCallback((file: File) => {
    chat.sendPhoto(file, replyingTo);
    setReplyingTo(null);
  }, [chat, replyingTo]);

  /* Interleave date dividers into the feed. */
  const feedItems = useMemo(() => {
    const items: Array<{ kind: 'divider'; label: string; key: string } | { kind: 'message'; message: ChatMessage }> = [];
    let prevDate: Date | null = null;
    for (const m of messages) {
      const d = new Date(m.createdAt);
      if (!prevDate || !isSameDay(prevDate, d)) {
        items.push({ kind: 'divider', label: dayLabel(m.createdAt), key: `divider-${m.id}` });
      }
      prevDate = d;
      items.push({ kind: 'message', message: m });
    }
    return items;
  }, [messages]);

  /* Bidirectional message counts for Vibe Check */
  const { myMessageCount, partnerMessageCount } = useMemo(() => {
    let mine = 0;
    let theirs = 0;
    for (const m of messages) {
      if (m.senderId === myId) mine++;
      else theirs++;
    }
    return { myMessageCount: mine, partnerMessageCount: theirs };
  }, [messages, myId]);

  const isLoading = auth.status === 'loading' || (auth.status === 'authenticated' && chat.phase === 'loading');

  return (
    <div className={chatStyles.root} style={{ paddingBottom: keyboardInset }}>
      <div className={chatStyles.shell}>
        <div className={chatStyles.content}>

            {/* ── HEADER ── */}
            <div className={chatStyles.header}>
              <div className={chatStyles.headerIdentity}>
                <button
                  onClick={() => { hapticLight(); router.back(); }}
                  className={chatStyles.headerBack}
                  aria-label="Back to chats"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                {partner ? (
                  <button
                    onClick={() => { hapticLight(); setProfileSheetOpen(true); }}
                    className={chatStyles.partnerButton}
                    aria-label={`View ${partner.name}'s profile`}
                  >
                    <div className={chatStyles.partnerAvatar}>
                      <SafeImage src={partner.photo ?? undefined} name={partner.name} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className={chatStyles.partnerCopy}>
                      <h1 className={chatStyles.partnerName}>
                        {partner.name}
                        {partner.verified && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--infyn-rose)" aria-label="Verified profile" className="flex-shrink-0">
                            <path d="M12 2l2.4 2.4 3.3-.5.6 3.3 3 1.5-1.5 3 1.5 3-3 1.5-.6 3.3-3.3-.5L12 22l-2.4-2.4-3.3.5-.6-3.3-3-1.5 1.5-3-1.5-3 3-1.5.6-3.3 3.3.5z" />
                            <path d="M9.5 12.2l1.8 1.8 3.6-3.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                        )}
                      </h1>
                      {(() => {
                        if (isPartnerTyping) {
                          return (
                            <p className={`${chatStyles.presence} ${chatStyles.typingPresence}`} aria-live="polite">
                              <span>{isLongTyping ? 'writing a long message' : 'typing'}</span>
                              <span className={chatStyles.typingDots} aria-hidden="true">
                                <span /><span /><span />
                              </span>
                            </p>
                          );
                        }
                        const presence = formatLastSeen(partner.lastActiveAt, partner.online);
                        if (presence.isOnline) {
                          return (
                            <p className={`${chatStyles.presence} ${chatStyles.presenceOnline}`}>
                              <span className={chatStyles.presenceDot} />
                              Online
                            </p>
                          );
                        }
                        return (
                            <p className={chatStyles.presence}>
                            {presence.label}
                          </p>
                        );
                      })()}
                    </div>
                  </button>
                ) : (
                  <div className={chatStyles.headerIdentity}>
                    <div className="h-10 w-10 rounded-full bg-infyn-surface-soft animate-pulse" />
                    <div className="h-3.5 w-24 rounded-full bg-infyn-surface-soft animate-pulse" />
                  </div>
                )}
              </div>

              {partner && (
                <div className={chatStyles.headerActions}>
                  {/* Minimalist Games Button */}
                  <button
                    onClick={() => { hapticLight(); setCallMenuOpen(false); setGamesOpen(true); }}
                    className={`${chatStyles.headerAction}`}
                    title="Mini Games"
                    aria-label="Play mini games"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="3" />
                      <line x1="6" y1="12" x2="10" y2="12" />
                      <line x1="8" y1="10" x2="8" y2="14" />
                      <circle cx="15" cy="12" r="1" fill="currentColor" />
                      <circle cx="18" cy="10" r="1" fill="currentColor" />
                    </svg>
                  </button>

                  {/* Date Planner Button */}
                  <button
                    onClick={() => { hapticLight(); setCallMenuOpen(false); setDatePlannerOpen(true); }}
                    className={`${chatStyles.headerAction}`}
                    title="Plan a Date"
                    aria-label="Plan a date"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </button>

                  {/* One compact call control reveals the existing audio/video actions. */}
                  <div className={chatStyles.callMenu} ref={callMenuRef}>
                    <button
                      onClick={() => { hapticLight(); setCallMenuOpen((open) => !open); }}
                      className={`${chatStyles.headerAction} ${callMenuOpen ? chatStyles.headerActionActive : ''}`}
                      title="Call"
                      aria-label="Call options"
                      aria-haspopup="menu"
                      aria-expanded={callMenuOpen}
                    >
                      <Ic.Phone className="h-[17px] w-[17px]" />
                    </button>
                    {callMenuOpen && (
                      <div className={chatStyles.callMenuPopover} role="menu" aria-label="Choose call type">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            hapticLight();
                            setCallMenuOpen(false);
                            setCallState({ isOpen: true, callType: 'audio', mode: 'outgoing' });
                          }}
                          className={chatStyles.callMenuOption}
                        >
                          <span className={chatStyles.callMenuOptionIcon}><Ic.Phone className="h-4 w-4" /></span>
                          <span>Audio</span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            hapticLight();
                            setCallMenuOpen(false);
                            setCallState({ isOpen: true, callType: 'video', mode: 'outgoing' });
                          }}
                          className={chatStyles.callMenuOption}
                        >
                          <span className={`${chatStyles.callMenuOptionIcon} ${chatStyles.callMenuVideoIcon}`}><Ic.Video className="h-4 w-4" /></span>
                          <span>Video</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { hapticLight(); setCallMenuOpen(false); setSafetyOpen(true); }}
                    aria-label="Conversation options: report or block"
                    className={`${chatStyles.headerAction}`}
                  >
                    <Ic.Dots />
                  </button>
                </div>
              )}
            </div>

            {/* Offline banner */}
            {!chat.isOnline && (
              <div role="status" className={chatStyles.offline}>
                <span className={chatStyles.offlineText}>
                  You&apos;re offline — messages will send when you reconnect
                </span>
              </div>
            )}

            {/* ── FEED ── */}
            {isLoading ? (
              <div className={chatStyles.loading} role="status" aria-label="Loading conversation">
                <div className="h-14 w-3/5 rounded-[20px] rounded-tl-[4px] bg-infyn-surface/70 animate-pulse" />
                <div className="h-14 w-3/5 rounded-[20px] rounded-tr-[4px] bg-infyn-blush/70 animate-pulse ml-auto" />
                <div className="h-10 w-2/5 rounded-[20px] rounded-tl-[4px] bg-infyn-surface/70 animate-pulse" />
                <div className="h-20 w-3/5 rounded-[20px] rounded-tr-[4px] bg-infyn-blush/70 animate-pulse ml-auto" />
              </div>
            ) : chat.phase === 'notfound' || validMatchId === null ? (
              <div className={chatStyles.state}>
                <div className={chatStyles.stateIcon} aria-hidden>
                  💔
                </div>
                <h2 className={chatStyles.stateTitle}>This conversation isn&apos;t available</h2>
                <p className={chatStyles.stateText}>
                  The match may have ended, or the link is wrong.
                </p>
                <button
                  onClick={() => { hapticLight(); router.replace('/messages'); }}
                  className={chatStyles.stateButton}
                >
                  Back to Chats
                </button>
              </div>
            ) : chat.phase === 'error' ? (
              <div className={chatStyles.state}>
                <div className={chatStyles.stateIcon} aria-hidden>
                  ⚠️
                </div>
                <h2 className={chatStyles.stateTitle}>Couldn&apos;t load this chat</h2>
                <p className={chatStyles.stateText}>
                  Check your connection and try again.
                </p>
                <button
                  onClick={() => { hapticLight(); chat.reload(); }}
                  className={chatStyles.stateButton}
                >
                  Try again
                </button>
              </div>
            ) : (
              <div
                ref={feedRef}
                onScroll={handleFeedScroll}
                role="log"
                aria-live="polite"
                aria-label={partner ? `Conversation with ${partner.name}` : 'Conversation'}
                className={chatStyles.feed}
              >
                {messages.length === 0 && partner ? (
                  /* New match — honest empty state with icebreakers */
                  <div className={`${chatStyles.state} ${chatStyles.newMatch}`}>
                    <div className={`${chatStyles.newMatchAvatar} mb-4`}>
                      <SafeImage src={partner.photo ?? undefined} name={partner.name} alt="" className="h-full w-full object-cover" />
                    </div>
                    <h2 className={chatStyles.stateTitle}>You matched with {partner.name}!</h2>
                    <p className={chatStyles.stateText}>
                      Say hi and get the conversation going 👋
                    </p>
                    <div className="flex flex-col gap-2 w-full max-w-[280px]">
                      {ICEBREAKERS.map((line) => (
                        <button
                          key={line}
                          onClick={() => {
                            hapticLight();
                            setInputText(line);
                            inputRef.current?.focus();
                          }}
                          className="w-full px-4 py-2.5 rounded-2xl bg-infyn-surface/80 border border-infyn-rose-line/50 text-[13px] font-semibold text-infyn-ink hover:bg-infyn-blush active:scale-95 transition-all cursor-pointer shadow-2xs"
                        >
                          {line}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* End-to-End Encryption Notice */}
                    <div className={chatStyles.encryption}>
                      <div className={chatStyles.encryptionCard}>
                        <span className="text-[14px]">🔒</span>
                        <p>
                          Messages &amp; calls are end-to-end encrypted. No one outside of this chat can read or listen to them.
                        </p>
                      </div>
                    </div>

                    {/* Memory Lane — surfaces after 7+ days of chatting */}
                    {partner && validMatchId && myId && (
                      <MemoryLaneCard
                        matchId={validMatchId}
                        messages={messages}
                        myId={myId}
                        partnerName={partner.name}
                        onSendMemory={(msg) => chat.sendText(msg)}
                      />
                    )}

                    {chat.loadingOlder && (
                      <div className="flex justify-center py-1" role="status" aria-label="Loading earlier messages">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-infyn-border border-t-infyn-rose" />
                      </div>
                    )}
                    {feedItems.map((item) =>
                      item.kind === 'divider' ? (
                        <div key={item.key} className={chatStyles.dateDivider}>
                          <span>
                            {item.label}
                          </span>
                        </div>
                      ) : (
                        <MessageBubble
                          key={item.message.id}
                          message={item.message}
                          isMine={item.message.senderId === myId}
                          partnerName={partner?.name ?? 'your match'}
                          onOpenActions={setActionMessage}
                          onOpenPhoto={setLightboxUrl}
                          onRetry={chat.retry}
                          onStartCall={(type) =>
                            setCallState({ isOpen: true, callType: type, mode: 'outgoing' })
                          }
                        />
                      )
                    )}
                  </>
                )}
              </div>
            )}

            {/* New messages chip — SVG arrow, proper button */}
            {showNewChip && (
              <div className="relative z-30 flex justify-center">
                <button
                  onClick={() => scrollToBottom()}
                  className={`${chatStyles.stateButton} absolute -top-14`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  New messages
                </button>
              </div>
            )}

            {/* ── VIBE CHECK ── */}
            {chat.phase === 'ready' && partner && validMatchId && (
              <VibeCheckBanner
                matchId={validMatchId}
                myMessageCount={myMessageCount}
                partnerMessageCount={partnerMessageCount}
                partnerName={partner.name}
                onSendVibeMessage={(msg) => chat.sendText(msg)}
              />
            )}

            {/* ── UNIFIED WHATSAPP-STYLE MEDIA DRAWER + COMPOSER ── */}
            {chat.phase === 'ready' && (
              <>
                {drawerTab !== null && (
                  <MediaDrawer
                    initialTab={drawerTab}
                    onPickEmoji={(emoji) => setInputText((prev) => prev + emoji)}
                    onPickGif={(url) => {
                      chat.sendGif(url);
                      setDrawerTab(null);
                    }}
                  />
                )}
                <div className={chatStyles.wingmanHost}>
                  <AIWingman
                    partnerName={partner?.name || 'Match'}
                    onSelectOpener={(opener) => {
                      setInputText(opener);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                  />
                </div>
                <Composer
                  key={validMatchId}
                  value={inputText}
                  onChange={(val) => {
                    setInputText(val);
                    if (val.trim()) notifyTyping();
                  }}
                  onSend={handleSend}
                  onSendVoice={(file, durationSec) => {
                    const accepted = chat.sendVoice(file, durationSec, replyingTo);
                    if (accepted) { setReplyingTo(null); setDrawerTab(null); }
                    return accepted;
                  }}
                  recordingBlocked={callState.isOpen}
                  onPickFile={handlePickFile}
                  replyingTo={replyingTo}
                  onCancelReply={() => setReplyingTo(null)}
                  emojiOpen={drawerTab === 'emoji'}
                  onToggleEmoji={() => {
                    setDrawerTab((prev) => (prev === 'emoji' ? null : 'emoji'));
                  }}
                  gifOpen={drawerTab === 'gif' || drawerTab === 'sticker'}
                  onToggleGif={() => {
                    setDrawerTab((prev) => (prev === 'gif' ? null : 'gif'));
                  }}
                  onFocusInput={() => setDrawerTab(null)}
                  error={composerError}
                  inputRef={inputRef}
                />
              </>
            )}

        </div>
      </div>

      {/* ── OVERLAYS ── */}
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
      {actionMessage && (
        <MessageReactionsOverlay
          isOpen={Boolean(actionMessage)}
          messageId={actionMessage.id}
          isMine={actionMessage.senderId === myId}
          messageContent={actionMessage.content}
          onReact={(msgId, emoji) => {
            chat.reactToMessage(msgId, emoji);
          }}
          onReply={(msgId) => {
            const target = chat.messages.find((m) => m.id === msgId);
            if (target) {
              setReplyingTo({
                id: target.id,
                senderName: target.senderId === myId ? 'You' : (partner?.name || 'Match'),
                content: target.content,
                type: target.type,
              });
              setTimeout(() => inputRef.current?.focus(), 80);
            }
          }}
          onClose={() => setActionMessage(null)}
        />
      )}
      {safetyOpen && partner && <SafetySheet partner={partner} onClose={() => setSafetyOpen(false)} />}
      {gamesOpen && partner && validMatchId && (
        <MiniGamesDrawer
          isOpen={gamesOpen}
          matchId={validMatchId}
          partnerName={partner.name}
          onSendGameMessage={(gameMsg) => {
            chat.sendText(gameMsg);
          }}
          onClose={() => setGamesOpen(false)}
        />
      )}
      {datePlannerOpen && partner && (
        <DatePlannerDrawer
          isOpen={datePlannerOpen}
          partnerName={partner.name}
          onSendPlan={(msg) => chat.sendText(msg)}
          onClose={() => setDatePlannerOpen(false)}
        />
      )}
      {validMatchId && partner && myId && callState.isOpen && (
        <CallModal
          key={`call-${validMatchId}-${callState.callType}-${callState.mode}`}
          isOpen={callState.isOpen}
          matchId={validMatchId}
          partnerId={partner.partnerId}
          partnerName={partner.name}
          partnerPhoto={partner.photo}
          myId={myId}
          initialCallType={callState.callType}
          initialMode={callState.mode}
          incomingOfferData={callState.incomingOfferData}
          onClose={() => setCallState((prev) => ({ ...prev, isOpen: false }))}
        />
      )}
      {/* Partner Profile Sheet — opens when tapping the partner avatar in the header */}
      {partner && profileSheetOpen && (
        <PartnerProfileSheet
          isOpen
          partnerId={partner.partnerId}
          matchId={validMatchId}
          initialData={{ name: partner.name, photo: partner.photo, verified: partner.verified }}
          onClose={() => setProfileSheetOpen(false)}
          onAudioCall={() => setCallState({ isOpen: true, callType: 'audio', mode: 'outgoing' })}
          onVideoCall={() => setCallState({ isOpen: true, callType: 'video', mode: 'outgoing' })}
        />
      )}

    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className={chatStyles.fallback}>
          <div className={chatStyles.fallbackSpinner} />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
