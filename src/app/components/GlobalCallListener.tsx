'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCurrentUser } from '../lib/useCurrentUser';
import { getPusherClient } from '@/lib/pusher-client';
import { hapticSuccess, hapticMedium } from '../lib/haptics';
import { SafeImage } from './shared';
import { CallModal } from './CallModal';

interface IncomingCall {
  matchId: number;
  partnerId: number;
  partnerName: string;
  partnerPhoto: string | null;
  callType: 'audio' | 'video';
  offerData: any;
  signalId: string;
}

/* ── Global Incoming Call Banner + Modal ──
   Mounts inside the root layout so calls ring from any page in the app.
   On accept, opens CallModal directly — the offer data is never lost to navigation.
*/
export function GlobalCallListener() {
  const auth = useCurrentUser();
  const myId = auth.status === 'authenticated' ? auth.userId : null;

  const [pendingCall, setPendingCall] = useState<IncomingCall | null>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const processedRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Ringtone ── */
  const startRingtone = useCallback(() => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      let stopped = false;

      const beep = () => {
        if (stopped || !ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.28, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      };

      beep();
      const id = setInterval(beep, 1600);
      ringIntervalRef.current = id;
      return () => { stopped = true; clearInterval(id); ctx.close(); };
    } catch {
      return () => {};
    }
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }, []);

  /* ── Handle incoming offer signal ── */
  const handleOffer = useCallback(
    (sig: any) => {
      if (!sig || sig.type !== 'offer') return;
      if (!sig.id) return;
      if (processedRef.current.has(sig.id)) return;
      processedRef.current.add(sig.id);

      // If user is already on this specific chat page, let the chat page handle it
      // (it subscribes to the match-specific Pusher channel and will catch it too).
      // We still show the banner as a secondary notification — the chat page
      // will deduplicate via its own processedRef.
      const path = window.location.pathname;
      if (path.includes(`/chat/${sig.matchId}`)) return;

      hapticSuccess();
      setPendingCall({
        matchId: sig.matchId,
        partnerId: sig.senderId,
        partnerName: sig.callerName || 'Someone',
        partnerPhoto: sig.callerPhoto || null,
        callType: sig.callType || 'video',
        offerData: sig.data,
        signalId: sig.id,
      });

      startRingtone();

      // Auto-dismiss after 45 s (call timeout)
      setTimeout(() => {
        setPendingCall((cur) => {
          if (cur?.signalId === sig.id) {
            stopRingtone();
            return null;
          }
          return cur;
        });
      }, 45_000);
    },
    [startRingtone, stopRingtone]
  );

  /* ── Pusher + polling subscription ── */
  useEffect(() => {
    if (!myId) return;

    const pusher = getPusherClient();
    const channel = pusher?.subscribe(`call-signal-global-${myId}`);
    channel?.bind('signal', handleOffer);

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/calls/incoming');
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.signals)) {
          for (const sig of data.signals) handleOffer(sig);
        }
      } catch { /* silent */ }
    }, 2500);

    return () => {
      channel?.unbind('signal', handleOffer);
      pusher?.unsubscribe(`call-signal-global-${myId}`);
      clearInterval(interval);
    };
  }, [myId, handleOffer]);

  /* ── Decline ── */
  const handleDecline = useCallback(async () => {
    if (!pendingCall) return;
    hapticMedium();
    stopRingtone();

    try {
      await fetch('/api/calls/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: pendingCall.matchId,
          receiverId: pendingCall.partnerId,
          type: 'decline',
          callType: pendingCall.callType,
        }),
      });
    } catch {}

    setPendingCall(null);
    setCallAccepted(false);
  }, [pendingCall, stopRingtone]);

  /* ── Accept — open CallModal directly (no navigation!) ── */
  const handleAccept = useCallback(() => {
    if (!pendingCall) return;
    hapticSuccess();
    stopRingtone();
    setCallAccepted(true); // hides banner, shows CallModal
  }, [pendingCall, stopRingtone]);

  /* ── Close after call ends ── */
  const handleCallClose = useCallback(() => {
    setPendingCall(null);
    setCallAccepted(false);
  }, []);

  // Nothing to show
  if (!pendingCall) return null;

  // Call is active — render the full CallModal
  if (callAccepted && myId) {
    return (
      <CallModal
        key={`global-call-${pendingCall.matchId}-${pendingCall.signalId}`}
        isOpen
        matchId={pendingCall.matchId}
        partnerId={pendingCall.partnerId}
        partnerName={pendingCall.partnerName}
        partnerPhoto={pendingCall.partnerPhoto}
        myId={myId}
        initialCallType={pendingCall.callType}
        initialMode="incoming"
        incomingOfferData={pendingCall.offerData}
        onClose={handleCallClose}
      />
    );
  }

  // Incoming banner (ringing state)
  const isVideo = pendingCall.callType === 'video';

  return (
    <div
      className="fixed top-0 inset-x-0 z-[99998] flex justify-center pointer-events-none"
      style={{ paddingTop: 'calc(0px + env(safe-area-inset-top, 12px))' }}
    >
      <style>{`
        @keyframes globalCallSlideDown {
          from { opacity: 0; transform: translateY(-110%); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        className="pointer-events-auto mx-4 mt-3 w-full max-w-sm rounded-[28px] overflow-hidden shadow-[0_24px_64px_-10px_rgba(0,0,0,0.85)]"
        style={{ animation: 'globalCallSlideDown 0.4s cubic-bezier(0.16,1,0.3,1) forwards' }}
      >
        {/* Gradient top border */}
        <div className="h-0.5 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-500" />

        {/* Dark glass body */}
        <div className="bg-[#0d0d1a]/95 backdrop-blur-2xl border border-white/15">
          <div className="flex items-center gap-3.5 px-4 py-3.5">
            {/* Avatar with pulsing ring */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 bg-neutral-800">
                <SafeImage
                  src={pendingCall.partnerPhoto ?? undefined}
                  name={pendingCall.partnerName}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute inset-0 rounded-full border-2 border-emerald-400/60 animate-ping" />
            </div>

            {/* Text info */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-white/55 uppercase tracking-widest">
                {isVideo ? '📹 Incoming Video Call' : '📞 Incoming Call'} · Infyn
              </p>
              <h3 className="text-[17px] font-extrabold text-white leading-tight truncate mt-0.5">
                {pendingCall.partnerName}
              </h3>
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" />
                End-to-End Encrypted
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              {/* Decline */}
              <button
                type="button"
                onClick={handleDecline}
                className="w-11 h-11 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                aria-label="Decline call"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.72 14.76c-.36-.39-2.29-1.92-2.29-1.92-.51-.43-1.14-.43-1.5 0l-1.23 1.55c-.3.38-.76.49-1.18.27-1.49-.78-3.08-2.03-4.26-3.75-.6-.87-.32-1.38.1-1.74l1.28-1.07c.42-.35.47-.94.11-1.47L7.6 4.6C7.27 4.1 6.68 3.95 6.2 4.24L4.25 5.42C3.34 5.95 2.68 7.01 3.08 8.42c.95 3.33 3.68 7.02 6.22 8.97 2.65 2.02 6.3 3.44 9.18 2.33 1.28-.49 2.01-1.62 1.57-2.79l-.83-2.17z" />
                </svg>
              </button>

              {/* Accept */}
              <button
                type="button"
                onClick={handleAccept}
                className="w-11 h-11 rounded-full bg-emerald-500/25 border border-emerald-500/50 text-emerald-400 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                style={{ animation: 'none' }}
                aria-label="Accept call"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
