'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useCurrentUser } from '../lib/useCurrentUser';
import { getPusherClient } from '@/lib/pusher-client';
import { hapticSuccess, hapticMedium } from '../lib/haptics';
import { SafeImage } from './shared';

const CallModal = dynamic(() => import('./CallModal').then((mod) => mod.CallModal), {
  ssr: false,
});

interface IncomingCall {
  matchId: number;
  partnerId: number;
  partnerName: string;
  partnerPhoto: string | null;
  callType: 'audio' | 'video';
  offerData: any;
  signalId: string;
  callSessionId: string;
}

/* ── Minimalist Phone Icons ── */
function PhoneDeclineIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.72 14.76c-.36-.39-2.29-1.92-2.29-1.92-.51-.43-1.14-.43-1.5 0l-1.23 1.55c-.3.38-.76.49-1.18.27-1.49-.78-3.08-2.03-4.26-3.75-.6-.87-.32-1.38.1-1.74l1.28-1.07c.42-.35.47-.94.11-1.47L7.6 4.6C7.27 4.1 6.68 3.95 6.2 4.24L4.25 5.42C3.34 5.95 2.68 7.01 3.08 8.42c.95 3.33 3.68 7.02 6.22 8.97 2.65 2.02 6.3 3.44 9.18 2.33 1.28-.49 2.01-1.62 1.57-2.79l-.83-2.17z" />
    </svg>
  );
}

function PhoneAcceptIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
    </svg>
  );
}

/* ── Global Incoming Call Banner + Modal ──
   Mounts inside the root layout so calls ring from any page in the app.
   Minimalist, high-end floating capsule design with no cheap glowing effects.
*/
export function GlobalCallListener() {
  const auth = useCurrentUser();
  const myId = auth.status === 'authenticated' ? auth.userId : null;

  const [pendingCall, setPendingCall] = useState<IncomingCall | null>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const processedRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const missedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCallRef = useRef<IncomingCall | null>(null);
  const callAcceptedRef = useRef(false);

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
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      };

      beep();
      const id = setInterval(beep, 1600);
      ringIntervalRef.current = id;
      return () => {
        stopped = true;
        clearInterval(id);
        ctx.close();
      };
    } catch {
      return () => {};
    }
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    ringIntervalRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }, []);

  const clearMissedTimeout = useCallback(() => {
    if (missedTimeoutRef.current) clearTimeout(missedTimeoutRef.current);
    missedTimeoutRef.current = null;
  }, []);

  /* ── Handle global call signals ── */
  const handleSignal = useCallback(
    (sig: any) => {
      if (!sig || !sig.type) return;
      if (!sig.id) return;
      if (processedRef.current.has(sig.id)) return;
      processedRef.current.add(sig.id);

      if (sig.type === 'end' || sig.type === 'decline') {
        const current = pendingCallRef.current;
        const matchesCurrentCall = current && (
          sig.callSessionId
            ? sig.callSessionId === current.callSessionId
            : sig.matchId === current.matchId && sig.senderId === current.partnerId
        );
        if (matchesCurrentCall && !callAcceptedRef.current) {
          stopRingtone();
          clearMissedTimeout();
          pendingCallRef.current = null;
          setPendingCall(null);
          setCallAccepted(false);
        }
        return;
      }

      if (sig.type !== 'offer') return;

      hapticSuccess();
      const incoming: IncomingCall = {
        matchId: sig.matchId,
        partnerId: sig.senderId,
        partnerName: sig.callerName || 'Someone',
        partnerPhoto: sig.callerPhoto || null,
        callType: sig.callType || 'video',
        offerData: sig.data,
        signalId: sig.id,
        callSessionId: sig.callSessionId || sig.id,
      };

      callAcceptedRef.current = false;
      pendingCallRef.current = incoming;
      setCallAccepted(false);
      setPendingCall(incoming);
      startRingtone();

      // Auto-dismiss after 45 s (call timeout) & record as missed
      clearMissedTimeout();
      missedTimeoutRef.current = setTimeout(() => {
        const current = pendingCallRef.current;
        if (current?.callSessionId === incoming.callSessionId && !callAcceptedRef.current) {
          stopRingtone();
          pendingCallRef.current = null;
          setPendingCall(null);
          fetch('/api/calls/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              matchId: incoming.matchId,
              receiverId: incoming.partnerId,
              type: 'end',
              callType: incoming.callType,
              callSessionId: incoming.callSessionId,
            }),
          }).catch(() => {});
          fetch('/api/calls/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              matchId: incoming.matchId,
              partnerId: incoming.partnerId,
              callType: incoming.callType,
              status: 'missed',
              duration: 0,
              callSessionId: incoming.callSessionId,
            }),
          }).catch(() => {});
        }
      }, 45_000);
    },
    [clearMissedTimeout, startRingtone, stopRingtone]
  );

  /* ── Pusher + polling subscription ── */
  useEffect(() => {
    if (!myId) return;

    const pusher = getPusherClient();
    const channel = pusher?.subscribe(`call-signal-global-${myId}`);
    channel?.bind('signal', handleSignal);

    let polling = false;
    const pollIncoming = async () => {
      if (document.hidden || !navigator.onLine) return;
      if (polling) return;
      polling = true;
      try {
        const res = await fetch('/api/calls/incoming');
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.signals)) {
          for (const sig of data.signals) handleSignal(sig);
        }
      } catch {
        /* Retry on the next safety poll. */
      } finally {
        polling = false;
      }
    };

    const onSubscribed = () => { void pollIncoming(); };
    const onVisible = () => { if (!document.hidden) void pollIncoming(); };
    channel?.bind('pusher:subscription_succeeded', onSubscribed);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);

    // Catch an offer stored before this listener finished subscribing. The
    // slower safety poll also covers a rare server-side realtime failure.
    void pollIncoming();
    const interval = setInterval(pollIncoming, 10_000);

    return () => {
      channel?.unbind('signal', handleSignal);
      channel?.unbind('pusher:subscription_succeeded', onSubscribed);
      pusher?.unsubscribe(`call-signal-global-${myId}`);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onVisible);
      clearInterval(interval);
    };
  }, [myId, handleSignal]);

  /* ── Decline ── */
  const handleDecline = useCallback(async () => {
    if (!pendingCall) return;
    hapticMedium();
    stopRingtone();
    clearMissedTimeout();

    try {
      await fetch('/api/calls/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: pendingCall.matchId,
          receiverId: pendingCall.partnerId,
          type: 'decline',
          callType: pendingCall.callType,
          callSessionId: pendingCall.callSessionId,
        }),
      });

      // Log declined call in chat
      await fetch('/api/calls/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: pendingCall.matchId,
          partnerId: pendingCall.partnerId,
          callType: pendingCall.callType,
          status: 'declined',
          duration: 0,
          callSessionId: pendingCall.callSessionId,
        }),
      });
    } catch {}

    pendingCallRef.current = null;
    callAcceptedRef.current = false;
    setPendingCall(null);
    setCallAccepted(false);
  }, [clearMissedTimeout, pendingCall, stopRingtone]);

  /* ── Accept — open CallModal directly (no navigation!) ── */
  const handleAccept = useCallback(() => {
    if (!pendingCall) return;
    hapticSuccess();
    stopRingtone();
    clearMissedTimeout();
    callAcceptedRef.current = true;
    setCallAccepted(true);
  }, [clearMissedTimeout, pendingCall, stopRingtone]);

  /* ── Close after call ends ── */
  const handleCallClose = useCallback(() => {
    stopRingtone();
    clearMissedTimeout();
    pendingCallRef.current = null;
    callAcceptedRef.current = false;
    setPendingCall(null);
    setCallAccepted(false);
  }, [clearMissedTimeout, stopRingtone]);

  useEffect(() => () => {
    stopRingtone();
    clearMissedTimeout();
  }, [clearMissedTimeout, stopRingtone]);

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
        initialCallSessionId={pendingCall.callSessionId}
        onClose={handleCallClose}
      />
    );
  }

  // Incoming banner: Minimalist, sleek iOS Floating Capsule
  const isVideo = pendingCall.callType === 'video';

  return (
    <div
      className="fixed top-0 inset-x-0 z-[99998] flex justify-center pointer-events-none"
      style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 12px))' }}
    >
      <style>{`
        @keyframes globalCallSlideDown {
          from { opacity: 0; transform: translateY(-100%) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div
        className="pointer-events-auto mx-4 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-infyn-dark-surface/95 backdrop-blur-2xl border border-white/10"
        style={{ animation: 'globalCallSlideDown 0.35s cubic-bezier(0.16,1,0.3,1) forwards' }}
      >
        <div className="flex items-center gap-3.5 px-4 py-3.5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-neutral-800">
              <SafeImage
                src={pendingCall.partnerPhoto ?? undefined}
                name={pendingCall.partnerName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Text info */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              {isVideo ? 'Incoming Video Call' : 'Incoming Audio Call'}
            </p>
            <h3 className="text-[16px] font-bold text-white leading-tight truncate mt-0.5">
              {pendingCall.partnerName}
            </h3>
            <p className="text-[11px] text-neutral-400 font-normal mt-0.5">
              Infyn · Encrypted
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Decline */}
            <button
              type="button"
              onClick={handleDecline}
              className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              aria-label="Decline call"
            >
              <PhoneDeclineIcon />
            </button>

            {/* Accept */}
            <button
              type="button"
              onClick={handleAccept}
              className="w-10 h-10 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-md"
              aria-label="Accept call"
            >
              <PhoneAcceptIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
