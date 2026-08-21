'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { AuroraBackground, SafeImage } from '../../components/shared';
import { Ic } from '../../components/icons';
import { dayLabel, isSameDay } from '../../lib/time';
import { useCurrentUser } from '../../lib/useCurrentUser';
import { useKeyboardInset } from '../../lib/useKeyboardInset';
import { useChat } from './useChat';
import type { ChatMessage } from './chatTypes';
import { MessageBubble } from './components/MessageBubble';
import { Composer } from './components/Composer';
import { MediaDrawer, type DrawerTab } from './components/MediaDrawer';
import { Lightbox, MessageActionSheet, SafetySheet } from './components/Overlays';
import { CallModal } from '../../components/CallModal';
import { PartnerProfileSheet } from '../../components/PartnerProfileSheet';
import { MiniGamesDrawer } from './components/MiniGamesDrawer';
import AIWingman from '../../components/AIWingman';

const ICEBREAKERS = [
  'Hey! Great to match with you ✨',
  'Coffee or chai? ☕',
  'Two truths and a lie — go! 🎲',
];

const NEAR_BOTTOM_PX = 120;
const LOAD_OLDER_PX = 200;

export default function ChatPage() {
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

  const chat = useChat(validMatchId, myId);
  const { partner, messages, composerError, clearComposerError } = chat;

  const [inputText, setInputText] = useState('');
  const [drawerTab, setDrawerTab] = useState<DrawerTab | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);
  const [showNewChip, setShowNewChip] = useState(false);
  const [actionMessage, setActionMessage] = useState<ChatMessage | null>(null);
  const [safetyOpen, setSafetyOpen] = useState(false);

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

  const feedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nearBottomRef = useRef(true);
  const didInitialScrollRef = useRef(false);
  const restoreScrollRef = useRef<number | null>(null);

  /* Composer validation errors dismiss themselves. */
  useEffect(() => {
    if (!composerError) return;
    const t = setTimeout(clearComposerError, 4000);
    return () => clearTimeout(t);
  }, [composerError, clearComposerError]);

  /* Listen for incoming WebRTC video/audio call signals */
  useEffect(() => {
    if (!validMatchId || callState.isOpen) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/calls/signal?matchId=${validMatchId}`);
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.signals)) {
          for (const sig of data.signals) {
            if (sig.type === 'offer') {
              setCallState({
                isOpen: true,
                callType: sig.callType || 'video',
                mode: 'incoming',
                incomingOfferData: sig.data,
              });
              break;
            }
          }
        }
      } catch {
        /* silent polling */
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [validMatchId, callState.isOpen]);

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
    chat.sendText(inputText);
    setInputText('');
    setDrawerTab(null);
  }, [chat, inputText]);

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

  const isLoading = auth.status === 'loading' || (auth.status === 'authenticated' && chat.phase === 'loading');

  return (
    <div
      className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans"
      style={{ paddingBottom: keyboardInset }}
    >
      <div className="relative h-full w-full max-w-[440px] sm:max-w-[480px] md:max-w-[540px] flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-gray-200/60 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-col h-full w-full z-10 overflow-hidden">

            {/* ── HEADER ── */}
            <div className="flex-shrink-0 z-40 px-4 pt-[max(3.25rem,calc(2.5rem+env(safe-area-inset-top,0px)))] pb-3 bg-white/95 backdrop-blur-2xl border-b border-gray-200/70 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => router.back()}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[#1E293B] hover:bg-gray-100 active:scale-90 transition-all duration-200 cursor-pointer"
                  aria-label="Back to chats"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                {partner ? (
                  <button
                    onClick={() => setProfileSheetOpen(true)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer active:opacity-70 transition-opacity"
                    aria-label={`View ${partner.name}'s profile`}
                  >
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-[#FF6B9D]/40 shadow-2xs ring-2 ring-[#FF6B9D]/10">
                      <SafeImage src={partner.photo ?? undefined} name={partner.name} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="flex items-center gap-1 text-[15px] font-bold text-[#1E293B] leading-tight truncate">
                        {partner.name}
                        {partner.verified && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#F43F5E" aria-label="Verified profile" className="flex-shrink-0">
                            <path d="M12 2l2.4 2.4 3.3-.5.6 3.3 3 1.5-1.5 3 1.5 3-3 1.5-.6 3.3-3.3-.5L12 22l-2.4-2.4-3.3.5-.6-3.3-3-1.5 1.5-3-1.5-3 3-1.5.6-3.3 3.3.5z" />
                            <path d="M9.5 12.2l1.8 1.8 3.6-3.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                        )}
                      </h1>
                      <p className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Online
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 animate-pulse" />
                    <div className="h-3.5 w-24 rounded-full bg-gray-100 animate-pulse" />
                  </div>
                )}
              </div>

              {partner && (
                <div className="flex items-center gap-1.5">
                  {/* Games Button */}
                  <button
                    onClick={() => setGamesOpen(true)}
                    className="flex h-9 px-2.5 items-center justify-center gap-1 rounded-full bg-purple-50 text-[#7B68EE] border border-purple-200/60 font-bold text-[12px] active:scale-90 transition-all cursor-pointer shadow-2xs"
                    title="Play Mini Games"
                    aria-label="Play mini games"
                  >
                    <span>🎮</span>
                    <span className="hidden sm:inline">Games</span>
                  </button>

                  {/* Audio Call */}
                  <button
                    onClick={() => setCallState({ isOpen: true, callType: 'audio', mode: 'outgoing' })}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100/90 text-[#7B68EE] hover:bg-[#7B68EE]/10 active:scale-90 transition-all cursor-pointer shadow-2xs"
                    title="Audio Call"
                    aria-label="Start audio call"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
                    </svg>
                  </button>
                  {/* Video Call */}
                  <button
                    onClick={() => setCallState({ isOpen: true, callType: 'video', mode: 'outgoing' })}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white shadow-sm active:scale-90 transition-all cursor-pointer"
                    title="Video Call"
                    aria-label="Start video call"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSafetyOpen(true)}
                    aria-label="Conversation options: report or block"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100/90 text-[#1E293B] hover:bg-gray-200 active:scale-90 transition-all cursor-pointer shadow-2xs"
                  >
                    <Ic.Dots />
                  </button>
                </div>
              )}
            </div>

            {/* Offline banner */}
            {!chat.isOnline && (
              <div role="status" className="flex-shrink-0 z-30 px-4 py-2 bg-amber-50/95 backdrop-blur-xl border-b border-amber-200/70 text-center">
                <span className="text-[12px] font-semibold text-amber-700">
                  You&apos;re offline — messages will send when you reconnect
                </span>
              </div>
            )}

            {/* ── FEED ── */}
            {isLoading ? (
              <div className="flex-1 min-h-0 px-4 pt-6 space-y-4" role="status" aria-label="Loading conversation">
                <div className="h-14 w-3/5 rounded-[20px] rounded-tl-[4px] bg-white/70 animate-pulse" />
                <div className="h-14 w-3/5 rounded-[20px] rounded-tr-[4px] bg-[#FFF0F4]/70 animate-pulse ml-auto" />
                <div className="h-10 w-2/5 rounded-[20px] rounded-tl-[4px] bg-white/70 animate-pulse" />
                <div className="h-20 w-3/5 rounded-[20px] rounded-tr-[4px] bg-[#FFF0F4]/70 animate-pulse ml-auto" />
              </div>
            ) : chat.phase === 'notfound' || validMatchId === null ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 mb-4 shadow-sm text-2xl" aria-hidden>
                  💔
                </div>
                <h2 className="text-[18px] font-bold text-[#1A1A2E] mb-1">This conversation isn&apos;t available</h2>
                <p className="text-[14px] text-[#1A1A2E]/55 max-w-[260px] leading-relaxed mb-6">
                  The match may have ended, or the link is wrong.
                </p>
                <button
                  onClick={() => router.replace('/messages')}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[14px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  Back to Chats
                </button>
              </div>
            ) : chat.phase === 'error' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 mb-4 shadow-sm text-2xl" aria-hidden>
                  ⚠️
                </div>
                <h2 className="text-[18px] font-bold text-[#1A1A2E] mb-1">Couldn&apos;t load this chat</h2>
                <p className="text-[14px] text-[#1A1A2E]/55 max-w-[260px] leading-relaxed mb-6">
                  Check your connection and try again.
                </p>
                <button
                  onClick={chat.reload}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[14px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
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
                className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pt-4 pb-4 space-y-3.5"
              >
                {messages.length === 0 && partner ? (
                  /* New match — honest empty state with icebreakers */
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[#F9C0D0]/60 shadow-md mb-4">
                      <SafeImage src={partner.photo ?? undefined} name={partner.name} alt="" className="h-full w-full object-cover" />
                    </div>
                    <h2 className="text-[18px] font-bold text-[#1A1A2E] mb-1">You matched with {partner.name}!</h2>
                    <p className="text-[14px] text-[#1A1A2E]/55 max-w-[260px] leading-relaxed mb-5">
                      Say hi and get the conversation going 👋
                    </p>
                    <div className="flex flex-col gap-2 w-full max-w-[280px]">
                      {ICEBREAKERS.map((line) => (
                        <button
                          key={line}
                          onClick={() => {
                            setInputText(line);
                            inputRef.current?.focus();
                          }}
                          className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-[#F9C0D0]/50 text-[13px] font-semibold text-[#2D1B28] hover:bg-[#FFF0F4] active:scale-95 transition-all cursor-pointer shadow-2xs"
                        >
                          {line}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* End-to-End Encryption Notice */}
                    <div className="flex justify-center my-2 select-none">
                      <div className="flex items-center gap-2 max-w-[320px] rounded-2xl bg-amber-500/10 border border-amber-400/25 px-3.5 py-2 text-center shadow-2xs backdrop-blur-md">
                        <span className="text-[14px]">🔒</span>
                        <p className="text-[11px] font-semibold text-amber-900/80 leading-snug">
                          Messages &amp; calls are end-to-end encrypted. No one outside of this chat can read or listen to them.
                        </p>
                      </div>
                    </div>

                    {chat.loadingOlder && (
                      <div className="flex justify-center py-1" role="status" aria-label="Loading earlier messages">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#F43F5E]" />
                      </div>
                    )}
                    {feedItems.map((item) =>
                      item.kind === 'divider' ? (
                        <div key={item.key} className="flex justify-center my-2">
                          <span className="rounded-full bg-white/90 border border-gray-200/80 backdrop-blur-md px-3.5 py-0.5 text-[11px] font-semibold text-gray-400 tracking-wide shadow-2xs">
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
                  className="absolute -top-14 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#F43F5E] to-[#FB7185] px-4 py-2 text-[12px] font-bold text-white shadow-[0_4px_16px_-6px_rgba(244,63,94,0.6)] hover:shadow-[0_6px_20px_-6px_rgba(244,63,94,0.7)] active:scale-95 transition-all cursor-pointer animate-popover-enter"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  New messages
                </button>
              </div>
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
                <div className="px-3.5 pt-1 bg-white/95 backdrop-blur-xl border-t border-gray-100">
                  <AIWingman
                    partnerName={partner?.name || 'Match'}
                    onSelectOpener={(opener) => {
                      setInputText(opener);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                  />
                </div>
                <Composer
                  value={inputText}
                  onChange={setInputText}
                  onSend={handleSend}
                  onPickFile={chat.sendPhoto}
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
        </AuroraBackground>
      </div>

      {/* ── OVERLAYS ── */}
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
      {actionMessage && (
        <MessageActionSheet
          message={actionMessage}
          isMine={actionMessage.senderId === myId}
          onClose={() => setActionMessage(null)}
        />
      )}
      {safetyOpen && partner && <SafetySheet partner={partner} onClose={() => setSafetyOpen(false)} />}
      {gamesOpen && partner && (
        <MiniGamesDrawer
          isOpen={gamesOpen}
          partnerName={partner.name}
          onSendGameMessage={(gameMsg) => {
            chat.sendText(gameMsg);
          }}
          onClose={() => setGamesOpen(false)}
        />
      )}
      {validMatchId && partner && myId && callState.isOpen && (
        <CallModal
          key={`call-${callState.callType}-${callState.mode}-${Date.now()}`}
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
      {partner && (
        <PartnerProfileSheet
          isOpen={profileSheetOpen}
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
