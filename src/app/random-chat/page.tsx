'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuroraBackground } from '../components/shared';
import { hapticLight, hapticSuccess } from '../lib/haptics';
import { useRandomChat } from './useRandomChat';
import { EntryScreen } from './components/EntryScreen';
import { RadarScreen } from './components/RadarScreen';
import { PreviewScreen } from './components/PreviewScreen';
import { AnonymousChat } from './components/AnonymousChat';
import { ConnectedScreen } from './components/ConnectedScreen';
import { EndedScreen } from './components/EndedScreen';
import type { RandomChatOverview } from './types';

export default function RandomChatPage() {
  const router = useRouter();
  const rc = useRandomChat();

  const [overview, setOverview] = useState<RandomChatOverview | null>(null);
  const overviewRef = useRef<RandomChatOverview | null>(null);
  overviewRef.current = overview;

  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/random-chat/overview');
      const data = await res.json();
      if (res.ok && data?.success) {
        setOverview({ ...data, prefill: data.prefill });
      }
    } catch {
      /* numbers stay "—" */
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // Refresh live numbers whenever the user is back at the entry screen.
  useEffect(() => {
    if (rc.phase === 'entry') {
      const t = setInterval(loadOverview, 60_000);
      return () => clearInterval(t);
    }
  }, [rc.phase, loadOverview]);

  /* Haptics on meaningful state changes. */
  const prevPhase = useRef(rc.phase);
  useEffect(() => {
    const from = prevPhase.current;
    const to = rc.phase;
    prevPhase.current = to;
    if (from === 'searching' && (to === 'preview' || to === 'chat')) hapticSuccess();
    if (from === 'chat' && to === 'connected') hapticSuccess();
    if (from === 'preview' && to === 'connected') hapticSuccess();
    if (to === 'ended') hapticLight();
  }, [rc.phase]);

  const handleJoin = useCallback(
    async (prefs: Parameters<typeof rc.join>[0]) => {
      await rc.join(prefs);
      if (rc.phase !== 'searching' && rc.phase !== 'preview' && rc.phase !== 'chat') {
        void loadOverview();
      }
    },
    [rc, loadOverview]
  );

  const handleLeave = useCallback(async () => {
    await rc.leave();
    void loadOverview();
  }, [rc, loadOverview]);

  const handleEnd = useCallback(async () => {
    await rc.end();
    void loadOverview();
  }, [rc, loadOverview]);

  const handleFindSomeoneNew = useCallback(async () => {
    const p = overviewRef.current?.prefill;
    await rc.join({
      vibe: 'chill',
      ageMin: p?.ageMin ?? 18,
      ageMax: p?.ageMax ?? 30,
      genderPref: (p?.lookingFor as Parameters<typeof rc.join>[0]['genderPref']) ?? 'everyone',
      interests: p?.interests ?? [],
    });
  }, [rc, overviewRef]);

  const handleGoToChat = useCallback(async () => {
    const matchId = rc.session?.match?.matchId;
    await rc.end();
    if (matchId) {
      router.push(`/chat/${matchId}`);
    } else {
      router.push('/messages');
    }
  }, [rc, router]);

  const handleGoHome = useCallback(async () => {
    await rc.end();
    router.push('/home');
  }, [rc, router]);

  const session = rc.session;

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans select-none">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-gray-200/60 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-col h-full w-full z-10 overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 z-20 px-4 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-3 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between shadow-2xs">
              <button
                onClick={() => { void rc.end(); router.push('/home'); }}
                aria-label="Back to home"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#1E293B] hover:bg-gray-100 active:scale-90 transition-all duration-200 cursor-pointer"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-extrabold tracking-tight text-[#1E293B]">Anonymous Chat</h1>
              </div>
              <div className="h-9 w-9" />
            </div>

            {/* Body */}
            {rc.phase === 'loading' && (
              <div className="flex-1 min-h-0 flex items-center justify-center px-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
                <div className="flex flex-col items-center gap-3">
                  <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#F43F5E]" />
                  <p className="text-[12.5px] text-[#1E293B]/50 font-medium">Loading anonymous chat…</p>
                </div>
              </div>
            )}

            {rc.phase === 'entry' && (
              <EntryScreen overview={overview} onStart={handleJoin} busy={rc.busy} />
            )}

            {rc.phase === 'searching' && (
              <RadarScreen
                vibe={rc.searchingVibe}
                onlineCount={overview?.onlineCount ?? 0}
                onCancel={handleLeave}
                busy={rc.busy}
              />
            )}

            {rc.phase === 'preview' && session && (
              <PreviewScreen
                session={session}
                onStartChatting={rc.dismissPreview}
                onConnect={() => rc.setConnection(true)}
                onEnd={handleEnd}
                busy={rc.busy}
                connected={rc.connection.requestedByMe}
              />
            )}

            {rc.phase === 'chat' && session && (
              <AnonymousChat
                session={session}
                messages={rc.messages}
                connection={rc.connection}
                myAlias={rc.myAlias}
                pending={rc.pending}
                onSend={(content) => void rc.send(content)}
                onSetConnection={(want) => void rc.setConnection(want)}
                onEnd={handleEnd}
                onReport={(reason, details) => void rc.report(reason, details)}
                onBlock={() => void rc.block()}
                busy={rc.busy}
                error={rc.error}
              />
            )}

            {rc.phase === 'connected' && session && (
              <ConnectedScreen
                session={session}
                onGoToChat={handleGoToChat}
                onFindSomeoneNew={() => void handleFindSomeoneNew()}
                onGoHome={handleGoHome}
                busy={rc.busy}
              />
            )}

            {rc.phase === 'ended' && (
              <EndedScreen
                session={session}
                onFindSomeoneNew={() => void handleFindSomeoneNew()}
                onGoHome={handleGoHome}
                busy={rc.busy}
              />
            )}

            {rc.phase === 'error' && (
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center px-8 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
                <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 mb-4 text-2xl">⚠️</div>
                <h2 className="text-[18px] font-bold text-[#1A1A2E] mb-1">Couldn&apos;t load anonymous chat</h2>
                <p className="text-[13px] text-[#1A1A2E]/55 max-w-[260px] leading-relaxed mb-6">{rc.error ?? 'Check your connection and try again.'}</p>
                <button
                  onClick={() => void rc.reload()}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[14px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        </AuroraBackground>
      </div>
    </div>
  );
}
