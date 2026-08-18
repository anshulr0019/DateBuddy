'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeImage } from './shared';
import { hapticLight, hapticMedium, hapticSuccess } from '../lib/haptics';

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

/* ── Modern High-Contrast Icons ── */
function MicIcon({ slashed }: { slashed?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
      {slashed && <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.8" stroke="#EF4444" />}
    </svg>
  );
}

function VideoIcon({ slashed }: { slashed?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" fill="currentColor" opacity="0.3" />
      <rect x="1" y="5" width="15" height="14" rx="3" ry="3" />
      {slashed && <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.8" stroke="#EF4444" />}
    </svg>
  );
}

function SpeakerIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={active ? 'currentColor' : 'none'} />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function FlipCameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4v6h6" />
      <path d="M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  );
}

function PhoneEndIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.72 14.76c-.36-.39-2.29-1.92-2.29-1.92-.51-.43-1.14-.43-1.5 0l-1.23 1.55c-.3.38-.76.49-1.18.27-1.49-.78-3.08-2.03-4.26-3.75-.6-.87-.32-1.38.1-1.74l1.28-1.07c.42-.35.47-.94.11-1.47L7.6 4.6C7.27 4.1 6.68 3.95 6.2 4.24L4.25 5.42C3.34 5.95 2.68 7.01 3.08 8.42c.95 3.33 3.68 7.02 6.22 8.97 2.65 2.02 6.3 3.44 9.18 2.33 1.28-.49 2.01-1.62 1.57-2.79l-.83-2.17z" />
    </svg>
  );
}

function PhoneAcceptIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/* ── Glass Pill Button ── */
function GlassControlBtn({
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
        className={`flex h-15 w-15 items-center justify-center rounded-full backdrop-blur-xl transition-all duration-200 active:scale-90 shadow-lg border ${
          warning
            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 ring-2 ring-rose-500/30'
            : active
            ? 'bg-white text-gray-900 border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]'
            : 'bg-white/[0.12] text-white/90 border-white/20 hover:bg-white/[0.22] hover:border-white/35'
        }`}
      >
        {children}
      </div>
      <span className="text-[11.5px] text-white/70 font-semibold tracking-wide group-hover:text-white transition-colors">
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

  const sendSignal = useCallback(
    async (type: string, data?: any) => {
      try {
        await fetch('/api/calls/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId, receiverId: partnerId, type, callType, data }),
        });
      } catch {}
    },
    [matchId, partnerId, callType]
  );

  const endCallCleanup = useCallback(() => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    setCallStatus('ended');
    setTimeout(onClose, 1000);
  }, [onClose]);

  const handleEndCall = useCallback(() => {
    hapticMedium();
    sendSignal('end');
    endCallCleanup();
  }, [sendSignal, endCallCleanup]);

  const handleDeclineCall = useCallback(() => {
    hapticMedium();
    sendSignal('decline');
    endCallCleanup();
  }, [sendSignal, endCallCleanup]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal('candidate', e.candidate);
    };
    pc.ontrack = (e) => {
      const stream = e.streams?.[0];
      if (stream) {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        hapticSuccess();
        setCallStatus('connected');
        setCallDuration(0);
        durationTimerRef.current = setInterval(() => setCallDuration((p) => p + 1), 1000);
      } else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        endCallCleanup();
      }
    };
    pcRef.current = pc;
    return pc;
  }, [sendSignal, endCallCleanup]);

  const startOutgoingCall = useCallback(async () => {
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
      if (localVideoRef.current && callType === 'video') localVideoRef.current.srcObject = stream;
      const pc = createPeerConnection();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal('offer', offer);
    } catch {
      endCallCleanup();
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
      if (localVideoRef.current && callType === 'video') localVideoRef.current.srcObject = stream;
      const pc = createPeerConnection();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      if (incomingOfferData) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingOfferData));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal('answer', answer);
      }
      setCallStatus('connected');
    } catch {
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
  const isRinging = callStatus === 'calling' || callStatus === 'incoming';

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-modal="true"
      className="fixed inset-0 z-[99999] overflow-hidden bg-[#0A0A0E] font-sans select-none flex flex-col justify-between"
    >
      {/* ── CINEMATIC AMBIENT LIGHTING BACKGROUND ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Ambient Pulsing Gradient Spheres */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#FF6B9D]/20 blur-[100px] animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-[#7B68EE]/20 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-[#4F46E5]/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Blurred Partner Photo Overlay (for audio/ringing) */}
        {partnerPhoto && !isVideoActive && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25 scale-110 filter blur-3xl transition-opacity duration-700"
            style={{ backgroundImage: `url(${partnerPhoto})` }}
          />
        )}
        <div className={`absolute inset-0 transition-all duration-700 ${isVideoActive ? 'bg-black' : 'bg-gradient-to-b from-black/60 via-black/40 to-black/80'}`} />
      </div>

      {/* ── Hidden Remote Audio Element ── */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* ── Fullscreen Remote Video Stream ── */}
      {callType === 'video' && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            isVideoActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />
      )}

      {/* Vignette Shadow Overlay on Active Video */}
      {isVideoActive && (
        <>
          <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-10" />
          <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />
        </>
      )}

      {/* ── TOP BAR: Header & Status ── */}
      <header
        className="relative z-20 flex flex-col items-center text-center px-6"
        style={{ paddingTop: 'calc(2.5rem + env(safe-area-inset-top, 0px))' }}
      >
        {/* Security Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/80 text-[11px] font-semibold tracking-wide mb-3 shadow-xs">
          <LockIcon />
          <span>Infyn End-to-End Encrypted</span>
        </div>

        {/* Remote Caller Name */}
        <h1 className={`font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] ${
          isVideoActive ? 'text-[22px]' : 'text-[32px]'
        }`}>
          {partnerName}
        </h1>

        {/* Live Call State / Duration Counter */}
        <div className="flex items-center gap-2 mt-1.5">
          {callStatus === 'connected' && (
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]" />
          )}
          <p className={`font-bold tracking-wide drop-shadow-md ${
            callStatus === 'connected' ? 'text-emerald-400 text-[14px]' : 'text-white/70 text-[14.5px]'
          }`}>
            {callStatus === 'calling' && 'Calling\u2026'}
            {callStatus === 'incoming' && (callType === 'video' ? 'Incoming Video Call\u2026' : 'Incoming Audio Call\u2026')}
            {callStatus === 'connected' && formatTimer(callDuration)}
            {callStatus === 'ended' && 'Call Ended'}
          </p>
        </div>
      </header>

      {/* ── HERO CENTER AREA ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto">
        {/* Audio Mode Hero: Floating Avatar with Acoustic Pulse Waveforms */}
        {!isVideoActive && (
          <div className="relative flex items-center justify-center">
            {/* Pulsing Sonar Ripple Rings */}
            {isRinging && (
              <>
                <div className="absolute h-40 w-40 rounded-full border-2 border-[#FF6B9D]/30 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute h-56 w-56 rounded-full border border-[#7B68EE]/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.4s' }} />
                <div className="absolute h-72 w-72 rounded-full border border-white/10 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.8s' }} />
              </>
            )}

            {/* Avatar Glow Ring */}
            <div className="relative h-32 w-32 rounded-full p-1 bg-gradient-to-tr from-[#FF6B9D] via-[#7B68EE] to-[#38BDF8] shadow-[0_0_40px_rgba(255,107,157,0.35)]">
              <div className="h-full w-full rounded-full overflow-hidden border-2 border-black bg-neutral-900">
                <SafeImage
                  src={partnerPhoto ?? undefined}
                  name={partnerName}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Live Audio Visualizer Frequency Waves (When Connected) */}
            {isAudioActive && (
              <div className="absolute -bottom-10 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
                <span className="w-1 h-3 rounded-full bg-[#FF6B9D] animate-bounce" style={{ animationDuration: '0.6s' }} />
                <span className="w-1 h-5 rounded-full bg-[#E86AC7] animate-bounce" style={{ animationDuration: '0.8s', animationDelay: '0.1s' }} />
                <span className="w-1 h-7 rounded-full bg-[#7B68EE] animate-bounce" style={{ animationDuration: '0.7s', animationDelay: '0.2s' }} />
                <span className="w-1 h-4 rounded-full bg-[#38BDF8] animate-bounce" style={{ animationDuration: '0.9s', animationDelay: '0.15s' }} />
                <span className="w-1 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDuration: '0.6s', animationDelay: '0.25s' }} />
              </div>
            )}
          </div>
        )}

        {/* Video Mode Self-Preview PiP (Top-Right Glass Capsule) */}
        {callType === 'video' && (
          <div className="absolute top-2 right-5 h-44 w-32 rounded-[26px] overflow-hidden bg-black/80 border-2 border-white/30 shadow-[0_12px_36px_rgba(0,0,0,0.7)] backdrop-blur-md transition-all duration-300">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover scale-x-[-1]"
            />
            {/* Quick Flip Action Badge on PiP */}
            <button
              onClick={flipCamera}
              className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white/90 hover:bg-black/80 active:scale-90 transition-transform cursor-pointer"
              aria-label="Flip camera"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
        {/* 1. INCOMING CALL CONTROLS (Swipe/Tap to Accept or Decline) */}
        {callStatus === 'incoming' && (
          <div className="w-full max-w-sm flex items-center justify-between px-6 animate-page-entry">
            {/* Decline Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleDeclineCall}
                className="flex h-18 w-18 items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-rose-500 text-white shadow-[0_8px_25px_rgba(244,63,94,0.5)] border border-rose-400/40 active:scale-90 transition-all cursor-pointer"
                aria-label="Decline Call"
              >
                <PhoneEndIcon />
              </button>
              <span className="text-[12.5px] font-bold text-white/70">Decline</span>
            </div>

            {/* Accept Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptCall}
                className="flex h-18 w-18 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white shadow-[0_8px_30px_rgba(16,185,129,0.6)] border border-emerald-300/40 active:scale-90 transition-all cursor-pointer animate-bounce"
                style={{ animationDuration: '2s' }}
                aria-label="Accept Call"
              >
                <PhoneAcceptIcon />
              </button>
              <span className="text-[12.5px] font-bold text-emerald-400">Accept</span>
            </div>
          </div>
        )}

        {/* 2. AUDIO CALL ACTIVE CONTROLS (Clean Glass Grid) */}
        {isAudioActive && (
          <div className="w-full max-w-sm flex flex-col items-center gap-6">
            <div className="flex items-center justify-center gap-8">
              <GlassControlBtn
                label={isMuted ? 'Muted' : 'Mute'}
                active={isMuted}
                warning={isMuted}
                onClick={toggleMute}
              >
                <MicIcon slashed={isMuted} />
              </GlassControlBtn>

              <GlassControlBtn
                label={isSpeaker ? 'Speaker On' : 'Speaker'}
                active={isSpeaker}
                onClick={() => setIsSpeaker((p) => !p)}
              >
                <SpeakerIcon active={isSpeaker} />
              </GlassControlBtn>
            </div>

            {/* End Call Button */}
            <button
              type="button"
              onClick={handleEndCall}
              className="flex h-16 w-36 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold text-[14px] shadow-[0_8px_25px_rgba(244,63,94,0.45)] border border-rose-400/30 active:scale-95 transition-transform cursor-pointer"
              aria-label="End Call"
            >
              <PhoneEndIcon />
              <span>End Call</span>
            </button>
          </div>
        )}

        {/* 3. VIDEO CALL ACTIVE CONTROLS (Floating Glass Dock Bar) */}
        {isVideoActive && (
          <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-black/60 backdrop-blur-2xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
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
                isMuted ? 'bg-rose-500/30 text-rose-400 border border-rose-500/50' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <MicIcon slashed={isMuted} />
            </button>

            <button
              onClick={toggleVideo}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-90 cursor-pointer ${
                isVideoOff ? 'bg-rose-500/30 text-rose-400 border border-rose-500/50' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              aria-label={isVideoOff ? 'Turn on Camera' : 'Turn off Camera'}
            >
              <VideoIcon slashed={isVideoOff} />
            </button>

            <button
              onClick={handleEndCall}
              className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-[0_4px_16px_rgba(244,63,94,0.5)] active:scale-90 transition-all cursor-pointer"
              aria-label="End Call"
            >
              <PhoneEndIcon />
            </button>
          </div>
        )}

        {/* 4. OUTGOING RINGING: End / Cancel Action */}
        {callStatus === 'calling' && (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleEndCall}
              className="flex h-18 w-18 items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-rose-500 text-white shadow-[0_8px_25px_rgba(244,63,94,0.5)] border border-rose-400/40 active:scale-90 transition-all cursor-pointer"
              aria-label="Cancel Call"
            >
              <PhoneEndIcon />
            </button>
            <span className="text-[12.5px] font-bold text-white/70">Cancel</span>
          </div>
        )}
      </footer>
    </div>
  );
}
