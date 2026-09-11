'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeImage } from './shared';
import { hapticLight, hapticMedium, hapticSuccess } from '../lib/haptics';
import { getPusherClient } from '@/lib/pusher-client';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

interface CallModalProps {
  isOpen: boolean;
  matchId: number;
  partnerId: number;
  partnerName: string;
  partnerPhoto: string | null;
  myId: number;
  initialCallType?: 'audio' | 'video';
  initialMode?: 'outgoing' | 'incoming';
  incomingOfferData?: any;
  onClose: () => void;
}

/* ── Minimalist Clean Icons ── */
function MicIcon({ slashed }: { slashed?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
      {slashed && <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.5" stroke="#EF4444" />}
    </svg>
  );
}

function VideoIcon({ slashed }: { slashed?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" fill="currentColor" opacity="0.3" />
      <rect x="1" y="5" width="15" height="14" rx="3" ry="3" />
      {slashed && <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.5" stroke="#EF4444" />}
    </svg>
  );
}

function SpeakerIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={active ? 'currentColor' : 'none'} />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function FlipCameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4v6h6" />
      <path d="M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  );
}

function PhoneEndIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.72 14.76c-.36-.39-2.29-1.92-2.29-1.92-.51-.43-1.14-.43-1.5 0l-1.23 1.55c-.3.38-.76.49-1.18.27-1.49-.78-3.08-2.03-4.26-3.75-.6-.87-.32-1.38.1-1.74l1.28-1.07c.42-.35.47-.94.11-1.47L7.6 4.6C7.27 4.1 6.68 3.95 6.2 4.24L4.25 5.42C3.34 5.95 2.68 7.01 3.08 8.42c.95 3.33 3.68 7.02 6.22 8.97 2.65 2.02 6.3 3.44 9.18 2.33 1.28-.49 2.01-1.62 1.57-2.79l-.83-2.17z" />
    </svg>
  );
}

function PhoneAcceptIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/* ── Minimalist Frosted Control Button ── */
function MinimalControlBtn({
  label,
  active,
  warning,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  warning?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        hapticLight();
        onClick?.();
      }}
      className="flex flex-col items-center gap-2 cursor-pointer select-none group focus:outline-none"
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-150 active:scale-95 border ${
          warning
            ? 'bg-[#ba1a1a]/20 text-[#ff8dab] border-[#ba1a1a]/40'
            : active
            ? 'bg-[#7d1d3f] text-white border-[#ffb1c3]/30'
            : 'bg-white/10 text-white/90 border-white/10 hover:bg-white/20'
        }`}
      >
        {children}
      </div>
      <span className="text-[11px] text-neutral-400 font-medium tracking-wide group-hover:text-white transition-colors">
        {label}
      </span>
    </button>
  );
}

export function CallModal({
  isOpen,
  matchId,
  partnerId,
  partnerName,
  partnerPhoto,
  myId,
  initialCallType = 'video',
  initialMode = 'outgoing',
  incomingOfferData = null,
  onClose,
}: CallModalProps) {
  const [callStatus, setCallStatus] = useState<'calling' | 'incoming' | 'connected' | 'ended'>(
    initialMode === 'incoming' ? 'incoming' : 'calling'
  );
  const [callType, setCallType] = useState<'audio' | 'video'>(initialCallType);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    setCallType(initialCallType);
  }, [initialCallType]);

  useEffect(() => {
    setCallStatus(initialMode === 'incoming' ? 'incoming' : 'calling');
  }, [initialMode]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingCandidatesRef = useRef<any[]>([]);
  const processedSignalIdsRef = useRef<Set<string>>(new Set());
  const offerDataRef = useRef<any>(incomingOfferData);
  const outgoingStartedRef = useRef(false);

  // Call session identifier for chat history logging & deduplication
  const callSessionIdRef = useRef<string>(`call-${matchId}-${Date.now()}`);
  const hasLoggedRef = useRef(false);
  const durationRef = useRef(0);
  durationRef.current = callDuration;

  useEffect(() => {
    if (incomingOfferData) {
      offerDataRef.current = incomingOfferData;
    }
  }, [incomingOfferData]);

  // Log call history to the database
  const logCallHistory = useCallback(
    async (status: 'completed' | 'missed' | 'declined' | 'cancelled', durationSecs: number) => {
      if (hasLoggedRef.current) return;
      hasLoggedRef.current = true;
      try {
        await fetch('/api/calls/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId,
            partnerId,
            callType,
            status,
            duration: durationSecs,
            callSessionId: callSessionIdRef.current,
          }),
        });
      } catch (err) {
        console.warn('Failed to log call history:', err);
      }
    },
    [matchId, partnerId, callType]
  );

  const sendSignal = useCallback(
    async (type: string, data?: any) => {
      try {
        await fetch('/api/calls/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId, receiverId: partnerId, type, callType, data }),
        });
      } catch (err) {
        console.warn('Failed to send signal:', err);
      }
    },
    [matchId, partnerId, callType]
  );

  const endCallCleanup = useCallback(
    (reasonStatus?: 'completed' | 'missed' | 'declined' | 'cancelled') => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }

      // Record call history in chat
      const finalDuration = durationRef.current;
      const statusToLog =
        reasonStatus || (finalDuration > 0 ? 'completed' : initialMode === 'outgoing' ? 'missed' : 'declined');
      logCallHistory(statusToLog, finalDuration);

      setCallStatus('ended');
      setTimeout(onClose, 1000);
    },
    [initialMode, logCallHistory, onClose]
  );

  const handleEndCall = useCallback(() => {
    hapticMedium();
    sendSignal('end');
    endCallCleanup();
  }, [sendSignal, endCallCleanup]);

  const handleDeclineCall = useCallback(() => {
    hapticMedium();
    sendSignal('decline');
    endCallCleanup('declined');
  }, [sendSignal, endCallCleanup]);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) {
      return pcRef.current;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal('candidate', e.candidate.toJSON ? e.candidate.toJSON() : e.candidate);
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams?.[0] || new MediaStream([e.track]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        hapticSuccess();
        setCallStatus('connected');
        if (!durationTimerRef.current) {
          setCallDuration(0);
          durationTimerRef.current = setInterval(() => setCallDuration((p) => p + 1), 1000);
        }
      } else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        endCallCleanup();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [sendSignal, endCallCleanup]);

  const handleIncomingSignal = useCallback(
    async (sig: any) => {
      if (!sig || !sig.type) return;
      if (sig.id) {
        if (processedSignalIdsRef.current.has(sig.id)) return;
        processedSignalIdsRef.current.add(sig.id);
      }

      switch (sig.type) {
        case 'offer': {
          offerDataRef.current = sig.data;
          break;
        }

        case 'answer': {
          const pc = pcRef.current;
          if (pc && pc.signalingState === 'have-local-offer') {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(sig.data));
              setCallStatus('connected');
              if (!durationTimerRef.current) {
                setCallDuration(0);
                durationTimerRef.current = setInterval(() => setCallDuration((p) => p + 1), 1000);
              }
              for (const cand of pendingCandidatesRef.current) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (candErr) {
                  console.warn('Error adding queued candidate on caller:', candErr);
                }
              }
              pendingCandidatesRef.current = [];
            } catch (err) {
              console.error('Error applying remote answer:', err);
            }
          }
          break;
        }

        case 'candidate': {
          if (!sig.data) break;
          const pc = pcRef.current;
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(sig.data));
            } catch (candErr) {
              console.warn('Error adding immediate ICE candidate:', candErr);
            }
          } else {
            pendingCandidatesRef.current.push(sig.data);
          }
          break;
        }

        case 'decline': {
          hapticMedium();
          endCallCleanup('declined');
          break;
        }

        case 'end': {
          endCallCleanup();
          break;
        }

        default:
          break;
      }
    },
    [endCallCleanup]
  );

  // Realtime Signal Listener
  useEffect(() => {
    if (!isOpen || !matchId || !myId) return;

    const pusher = getPusherClient();
    const channelName = `call-signal-${matchId}-${myId}`;
    const channel = pusher?.subscribe(channelName);

    const onPusherSignal = (signal: any) => {
      handleIncomingSignal(signal);
    };

    channel?.bind('signal', onPusherSignal);

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/calls/signal?matchId=${matchId}`);
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.signals)) {
          for (const s of data.signals) {
            handleIncomingSignal(s);
          }
        }
      } catch {}
    }, 1000);

    return () => {
      channel?.unbind('signal', onPusherSignal);
      pusher?.unsubscribe(channelName);
      clearInterval(pollInterval);
    };
  }, [isOpen, matchId, myId, handleIncomingSignal]);

  const startOutgoingCall = useCallback(async () => {
    if (outgoingStartedRef.current) return;
    outgoingStartedRef.current = true;

    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video:
          callType === 'video'
            ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }
      const pc = createPeerConnection();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal('offer', offer);
    } catch (err) {
      console.error('Error starting outgoing call:', err);
      endCallCleanup('cancelled');
    }
  }, [callType, createPeerConnection, sendSignal, endCallCleanup]);

  const handleAcceptCall = useCallback(async () => {
    try {
      hapticSuccess();
      const constraints: MediaStreamConstraints = {
        audio: true,
        video:
          callType === 'video'
            ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }
      const pc = createPeerConnection();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offerToUse = offerDataRef.current || incomingOfferData;
      if (offerToUse) {
        await pc.setRemoteDescription(new RTCSessionDescription(offerToUse));
        for (const cand of pendingCandidatesRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (candErr) {
            console.warn('Error adding queued candidate on receiver:', candErr);
          }
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal('answer', answer);
      }
      setCallStatus('connected');
    } catch (err) {
      console.error('Error accepting call:', err);
      endCallCleanup();
    }
  }, [callType, createPeerConnection, incomingOfferData, sendSignal, endCallCleanup]);

  useEffect(() => {
    if (!isOpen) return;
    if (callStatus === 'calling') {
      startOutgoingCall();
    }
  }, [isOpen, callStatus, startOutgoingCall]);

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  const flipCamera = async () => {
    if (callType !== 'video' || !localStreamRef.current) return;
    try {
      const currentTrack = localStreamRef.current.getVideoTracks()[0];
      const currentFacing = currentTrack.getSettings().facingMode;
      const newFacing = currentFacing === 'environment' ? 'user' : 'environment';
      currentTrack.stop();
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing, width: { ideal: 640 }, height: { ideal: 480 } },
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      localStreamRef.current.removeTrack(currentTrack);
      localStreamRef.current.addTrack(newVideoTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(newVideoTrack);
    } catch {}
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const isVideoActive = callType === 'video' && callStatus === 'connected';
  const isAudioActive = callType === 'audio' && callStatus === 'connected';

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-modal="true"
      className="fixed inset-0 z-[99999] overflow-hidden font-sans select-none flex flex-col justify-between"
      style={{ background: 'radial-gradient(circle at 50% 40%, rgb(62, 18, 39) 0%, rgb(36, 12, 25) 50%, rgb(17, 5, 13) 100%)' }}
    >
      {/* ── DEEP BURGUNDY ATMOSPHERIC BACKDROP ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {partnerPhoto && !isVideoActive && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-8 scale-105 filter blur-2xl"
            style={{ backgroundImage: `url(${partnerPhoto})` }}
          />
        )}
        {/* Burgundy ambient glow - top */}
        <div className="absolute rounded-full opacity-25 blur-3xl pointer-events-none" style={{ background: '#7d1d3f', width: '20rem', height: '20rem', top: '-4rem', left: '50%', transform: 'translateX(-50%)' }} />
        {/* Burgundy ambient glow - bottom */}
        <div className="absolute rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#a1395a', width: '24rem', height: '18rem', bottom: '7rem', left: '50%', transform: 'translateX(-50%)' }} />
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#7d1d3f]/20 via-transparent to-transparent" />
      </div>

      {/* ── Hidden Remote Audio Element ── */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* ── Fullscreen Remote Video Stream ── */}
      {callType === 'video' && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            isVideoActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />
      )}

      {/* Dark Burgundy Gradients for Controls Contrast */}
      {isVideoActive && (
        <>
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-10" />
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#7d1d3f]/25 to-transparent pointer-events-none z-10" />
        </>
      )}

      {/* ── TOP BAR: Minimalist Header & Status ── */}
      <header
        className="relative z-20 flex flex-col items-center text-center px-6"
        style={{ paddingTop: 'calc(2.5rem + env(safe-area-inset-top, 0px))' }}
      >
        {/* Security & Quality Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#49423e]/30 backdrop-blur-md text-[#ffb1c3] text-[11px] font-bold tracking-widest uppercase mb-3">
          <LockIcon />
          <span>{callType === 'audio' ? 'HD Audio · Encrypted' : 'Infyn · End-to-End Encrypted'}</span>
        </div>

        {/* Remote Caller Name */}
        <h1
          className={`font-bold tracking-wide ${
            isVideoActive ? 'text-[20px] drop-shadow-md text-white' : 'text-[28px] text-[#ffd9e0]'
          }`}
          style={!isVideoActive ? { fontFamily: "'Playfair Display', Georgia, serif" } : undefined}
        >
          {partnerName}
        </h1>

        {/* Live Call State / Duration Counter */}
        <div className="flex items-center gap-2 mt-1">
          {callStatus === 'connected' && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
          <p
            className={`font-medium tracking-wider ${
              callStatus === 'connected' ? 'text-[#ffb1c3] text-[13px] tabular-nums' : 'text-[#ffb1c3]/70 text-[14px]'
            }`}
          >
            {callStatus === 'calling' && 'Calling…'}
            {callStatus === 'incoming' &&
              (callType === 'video' ? 'Incoming Video Call…' : 'Incoming Audio Call…')}
            {callStatus === 'connected' && formatTimer(callDuration)}
            {callStatus === 'ended' && 'Call Ended'}
          </p>
        </div>
      </header>

      {/* ── HERO CENTER AREA ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto">
        {/* Audio Mode Hero: Clean Centered Avatar */}
        {!isVideoActive && (
          <div className="relative flex flex-col items-center justify-center">
            {/* Large Pulsing Avatar with Concentric Waves */}
            <div className="relative flex items-center justify-center w-56 h-56">
              {/* Wave Layer 3 - outer ping */}
              <div
                className="absolute inset-0 rounded-full opacity-10 animate-ping pointer-events-none"
                style={{ background: '#ffb1c3', animationDuration: '3.2s' }}
              />
              {/* Wave Layer 2 - mid pulse */}
              <div
                className="absolute inset-5 rounded-full opacity-30 animate-pulse pointer-events-none"
                style={{ background: '#7d1d3f', animationDuration: '2.1s' }}
              />
              {/* Wave Layer 1 - inner aura */}
              <div
                className="absolute inset-10 rounded-full opacity-20 blur-md pointer-events-none"
                style={{ background: '#ffb1c3' }}
              />
              {/* Velvet Plum Core Avatar Disc */}
              <div
                className="relative z-10 w-32 h-32 rounded-full shadow-2xl flex items-center justify-center overflow-hidden"
                style={{
                  background: 'radial-gradient(circle at 35% 30%, #5f0129 0%, #2f0014 80%)',
                  boxShadow: '0 12px 36px -4px rgba(13, 1, 7, 0.7), inset 0 0 0 1.5px rgba(255, 177, 195, 0.35)',
                }}
              >
                <SafeImage
                  src={partnerPhoto ?? undefined}
                  name={partnerName}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Voice State Indicator with Equalizer Bars */}
            {isAudioActive && (
              <div className="flex flex-col items-center gap-2 mt-3">
                <span className="text-[14px] text-[#ffd9e0] font-semibold tracking-wide">Speaking</span>
                {/* Equalizer Visualizer Bars */}
                <div className="flex items-center gap-1 h-5 px-3 py-1 rounded-full" style={{ background: 'rgba(73, 66, 62, 0.35)', backdropFilter: 'blur(8px)' }}>
                  <span className="w-1 rounded-full bg-[#ffb1c3] inline-block animate-pulse" style={{ height: '14px', animationDuration: '0.6s' }} />
                  <span className="w-1 rounded-full bg-[#ffd9e0] inline-block animate-pulse" style={{ height: '18px', animationDuration: '0.45s' }} />
                  <span className="w-1 rounded-full bg-[#ffd9e0] inline-block animate-pulse" style={{ height: '11px', animationDuration: '0.7s' }} />
                  <span className="w-1 rounded-full bg-[#ffb1c3] inline-block animate-pulse" style={{ height: '16px', animationDuration: '0.5s' }} />
                  <span className="w-1 rounded-full bg-[#ffb1c3] inline-block animate-pulse" style={{ height: '8px', animationDuration: '0.65s' }} />
                </div>
              </div>
            )}
            {!isAudioActive && !isVideoActive && (
              <div className="mt-5 flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'rgba(73, 66, 62, 0.35)', backdropFilter: 'blur(8px)' }}>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[12px] text-[#ffb1c3] font-medium tracking-wide">Camera Off • Audio Active</span>
              </div>
            )}
          </div>
        )}

        {/* Video Mode Self-Preview PiP (Top-Right Sleek Capsule) */}
        {callType === 'video' && (
          <div className="absolute top-2 right-5 h-44 w-32 rounded-2xl overflow-hidden bg-black/60 border border-white/20 shadow-2xl transition-all duration-300">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover scale-x-[-1]"
            />
            {/* "You" label badge */}
            <div className="absolute top-1.5 right-1.5">
              <span className="px-1.5 py-0.5 rounded bg-black/50 text-[9px] font-bold text-white uppercase tracking-wider">You</span>
            </div>
            {/* Quick Flip Action */}
            <button
              onClick={flipCamera}
              className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 border border-white/15 text-white/90 hover:bg-black/80 active:scale-95 transition-transform cursor-pointer"
              aria-label="Flip camera"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6" />
                <path d="M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
            </button>
          </div>
        )}
      </main>

      {/* ── BOTTOM CONTROLS DOCK ── */}
      <footer
        className="relative z-20 flex flex-col items-center px-6"
        style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* 1. INCOMING CALL CONTROLS (Accept or Decline) */}
        {callStatus === 'incoming' && (
          <div className="w-full max-w-xs flex items-center justify-between px-4">
            {/* Decline Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleDeclineCall}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ba1a1a] text-white active:scale-95 hover:bg-red-700 transition-all cursor-pointer shadow-lg shadow-[#ba1a1a]/40"
                aria-label="Decline Call"
              >
                <PhoneEndIcon />
              </button>
              <span className="text-[12px] font-medium text-[#ffb1c3]/60">Decline</span>
            </div>

            {/* Accept Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptCall}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white active:scale-95 hover:bg-emerald-600 transition-all cursor-pointer shadow-lg"
                aria-label="Accept Call"
              >
                <PhoneAcceptIcon />
              </button>
              <span className="text-[12px] font-medium text-emerald-400">Accept</span>
            </div>
          </div>
        )}

        {/* 2. AUDIO CALL ACTIVE CONTROLS (Stitch Frosted Pill Dock) */}
        {isAudioActive && (
          <div className="w-full max-w-xs flex flex-col items-center gap-4">
            <div
              className="w-full rounded-full p-2.5 shadow-2xl flex items-center justify-around gap-3"
              style={{ background: 'rgba(73, 66, 62, 0.50)', backdropFilter: 'blur(24px)' }}
            >
              {/* Mic Button */}
              <button
                type="button"
                onClick={() => { hapticLight(); toggleMute(); }}
                className={`flex h-14 w-14 items-center justify-center rounded-full active:scale-95 transition-all cursor-pointer ${
                  isMuted
                    ? 'bg-[#ffdad6] text-[#93000a]'
                    : 'bg-[#49423e]/60 text-[#ffd9e0] hover:bg-[#49423e]'
                }`}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                <MicIcon slashed={isMuted} />
              </button>

              {/* Speaker Button */}
              <button
                type="button"
                onClick={() => { hapticLight(); setIsSpeaker((p) => !p); }}
                className={`flex h-14 w-14 items-center justify-center rounded-full active:scale-95 transition-all cursor-pointer ${
                  isSpeaker
                    ? 'bg-[#ffd9e0] text-[#3f0019]'
                    : 'bg-[#49423e]/60 text-[#ffd9e0] hover:bg-[#49423e]'
                }`}
                aria-label={isSpeaker ? 'Switch to earpiece' : 'Switch to speaker'}
              >
                <SpeakerIcon active={isSpeaker} />
              </button>

              {/* End Call Button */}
              <button
                type="button"
                onClick={handleEndCall}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ba1a1a] text-white hover:bg-[#ba1a1a]/90 active:scale-95 shadow-lg transition-transform cursor-pointer"
                aria-label="End Call"
              >
                <PhoneEndIcon />
              </button>
            </div>
          </div>
        )}

        {/* 3. VIDEO CALL ACTIVE CONTROLS (Floating Minimal Dock) */}
        {isVideoActive && (
          <div className="flex items-center gap-3.5 px-5 py-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
            <button
              onClick={flipCamera}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
              aria-label="Flip Camera"
            >
              <FlipCameraIcon />
            </button>

            <button
              onClick={toggleMute}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-90 cursor-pointer ${
                isMuted ? 'bg-[#ba1a1a] text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <MicIcon slashed={isMuted} />
            </button>

            <button
              onClick={toggleVideo}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-90 cursor-pointer ${
                isVideoOff ? 'bg-[#7d1d3f] text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              aria-label={isVideoOff ? 'Turn on Camera' : 'Turn off Camera'}
            >
              <VideoIcon slashed={isVideoOff} />
            </button>

            <button
              onClick={handleEndCall}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ba1a1a] text-white hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#ba1a1a]/40"
              aria-label="End Call"
            >
              <PhoneEndIcon />
            </button>
          </div>
        )}

        {/* 4. OUTGOING RINGING: Cancel Action */}
        {callStatus === 'calling' && (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleEndCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ba1a1a] text-white active:scale-95 hover:bg-red-700 transition-all cursor-pointer shadow-lg shadow-[#ba1a1a]/40"
              aria-label="Cancel Call"
            >
              <PhoneEndIcon />
            </button>
            <span className="text-[12px] font-medium text-[#ffb1c3]/60">Cancel</span>
          </div>
        )}
      </footer>
    </div>
  );
}
