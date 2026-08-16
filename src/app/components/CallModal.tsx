'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SafeImage } from './shared';

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

/* ── Small reusable icon components ── */
function MicIcon({ slashed }: { slashed?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
      {slashed && <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.5" />}
    </svg>
  );
}

function VideoIcon({ slashed }: { slashed?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      {slashed && <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.5" />}
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
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
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M18.72 14.76c-.36-.39-2.29-1.92-2.29-1.92-.51-.43-1.14-.43-1.5 0l-1.23 1.55c-.3.38-.76.49-1.18.27-1.49-.78-3.08-2.03-4.26-3.75-.6-.87-.32-1.38.1-1.74l1.28-1.07c.42-.35.47-.94.11-1.47L7.6 4.6C7.27 4.1 6.68 3.95 6.2 4.24L4.25 5.42C3.34 5.95 2.68 7.01 3.08 8.42c.95 3.33 3.68 7.02 6.22 8.97 2.65 2.02 6.3 3.44 9.18 2.33 1.28-.49 2.01-1.62 1.57-2.79l-.83-2.17z" />
    </svg>
  );
}

function PhoneAcceptIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
    </svg>
  );
}

/* ── Control Button ── */
function CtrlBtn({
  label,
  active,
  red,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  red?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 cursor-pointer select-none group`}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-150 active:scale-90 shadow-md
          ${red
            ? 'bg-red-500 text-white'
            : active
            ? 'bg-white/20 text-white ring-2 ring-white/40'
            : 'bg-white/10 text-white hover:bg-white/20'
          }`}
      >
        {children}
      </div>
      <span className="text-[11px] text-white/70 font-medium tracking-wide">{label}</span>
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
  const [callType] = useState<'audio' | 'video'>(initialCallType);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

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

  const handleEndCall = useCallback(() => { sendSignal('end'); endCallCleanup(); }, [sendSignal, endCallCleanup]);
  const handleDeclineCall = useCallback(() => { sendSignal('decline'); endCallCleanup(); }, [sendSignal, endCallCleanup]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pc.onicecandidate = (e) => { if (e.candidate) sendSignal('candidate', e.candidate); };
    pc.ontrack = (e) => {
      const stream = e.streams?.[0];
      if (stream) {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
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
        video: callType === 'video'
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
    } catch { endCallCleanup(); }
  }, [callType, createPeerConnection, sendSignal, endCallCleanup]);

  const handleAcceptCall = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'video'
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
    } catch { endCallCleanup(); }
  }, [callType, createPeerConnection, incomingOfferData, sendSignal, endCallCleanup]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialMode === 'outgoing' && callStatus === 'calling' && !pcRef.current) startOutgoingCall();
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/calls/signal?matchId=${matchId}`);
        const data = await res.json();
        if (res.ok && data.success) {
          for (const sig of data.signals ?? []) {
            if (sig.type === 'answer' && pcRef.current) await pcRef.current.setRemoteDescription(new RTCSessionDescription(sig.data));
            else if (sig.type === 'candidate' && pcRef.current) await pcRef.current.addIceCandidate(new RTCIceCandidate(sig.data));
            else if (sig.type === 'decline' || sig.type === 'end') endCallCleanup();
          }
        }
      } catch {}
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, initialMode, callStatus, matchId, startOutgoingCall, endCallCleanup]);

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
  };
  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsVideoOff(!track.enabled); }
  };
  const flipCamera = async () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;
    const current = videoTrack.getSettings().facingMode ?? 'user';
    const next = current === 'user' ? 'environment' : 'user';
    const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: next } }).catch(() => null);
    if (!newStream || !pcRef.current) return;
    const newTrack = newStream.getVideoTracks()[0];
    const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
    if (sender) sender.replaceTrack(newTrack);
    videoTrack.stop();
    if (localVideoRef.current) localVideoRef.current.srcObject = new MediaStream([newTrack]);
  };

  if (!isOpen) return null;

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const isRinging = callStatus === 'calling' || callStatus === 'incoming';
  const isVideoActive = callType === 'video' && callStatus === 'connected';
  const isAudioActive = callType === 'audio' && callStatus === 'connected';

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-modal="true"
      className="fixed inset-0 z-[99999] overflow-hidden"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}
    >
      {/* ── Background: blurred photo for audio / dark for video ── */}
      <div className="absolute inset-0">
        {partnerPhoto ? (
          <img
            src={partnerPhoto}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
              isVideoActive ? 'opacity-0' : 'opacity-100'
            }`}
          />
        ) : null}
        {/* dark overlay */}
        <div
          className={`absolute inset-0 transition-all duration-700 ${
            isVideoActive
              ? 'bg-black'
              : partnerPhoto
              ? 'bg-black/55 backdrop-blur-2xl'
              : 'bg-gradient-to-b from-[#1C1C1E] to-[#2C2C2E]'
          }`}
        />
      </div>

      {/* ── Remote audio ── */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* ── Remote video (full screen, video call active) ── */}
      {callType === 'video' && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            isVideoActive ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* ── CONTENT ── */}
      <div className="relative z-10 flex h-full flex-col justify-between text-white px-5"
        style={{ paddingTop: 'calc(3rem + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))' }}>

        {/* ── TOP: Name + status ── */}
        <div className={`flex flex-col items-center text-center transition-all duration-500 ${isVideoActive ? 'items-start text-left' : ''}`}>
          {/* Video ringing: small self-preview top-right */}
          {callType === 'video' && isRinging && (
            <div className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] right-4 h-32 w-24 rounded-2xl overflow-hidden bg-black border border-white/20 shadow-2xl">
              <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover scale-x-[-1]" />
            </div>
          )}

          {/* Audio call: big centered avatar */}
          {callType === 'audio' && (
            <div className="relative mt-10 mb-6 mx-auto">
              {/* Ripple rings */}
              {isRinging && (
                <>
                  <div className="absolute inset-0 m-auto rounded-full border border-white/20 animate-ping scale-150 h-full w-full" />
                  <div className="absolute inset-0 m-auto rounded-full border border-white/10 animate-ping scale-[2] h-full w-full" style={{ animationDelay: '0.3s' }} />
                </>
              )}
              <div className="relative h-[110px] w-[110px] rounded-full overflow-hidden border-[3px] border-white/30 shadow-2xl">
                <SafeImage src={partnerPhoto ?? undefined} name={partnerName} className="h-full w-full object-cover" />
              </div>
            </div>
          )}

          <h1 className={`font-bold tracking-tight ${isVideoActive ? 'text-xl mt-1' : 'text-[28px]'}`}>
            {partnerName}
          </h1>
          <p className={`mt-1 font-medium ${isVideoActive ? 'text-[13px] text-white/70' : 'text-[15px] text-white/60'}`}>
            {callStatus === 'calling' && 'Ringing\u2026'}
            {callStatus === 'incoming' && (callType === 'video' ? 'DateBuddy Video\u2026' : 'DateBuddy Audio\u2026')}
            {callStatus === 'connected' && formatTimer(callDuration)}
            {callStatus === 'ended' && 'Call Ended'}
          </p>
        </div>

        {/* ── MIDDLE: Self PiP for active video call ── */}
        {isVideoActive && (
          <div className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] right-4 h-36 w-[104px] rounded-2xl overflow-hidden bg-black border-[1.5px] border-white/25 shadow-2xl">
            <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover scale-x-[-1]" />
          </div>
        )}

        {/* ── BOTTOM CONTROLS ── */}
        <div className="flex flex-col items-center gap-6">

          {/* ── INCOMING call: decline + accept ── */}
          {callStatus === 'incoming' && (
            <>
              {/* label hint above buttons */}
              <div className="flex w-full justify-between px-6">
                <span className="text-[13px] text-white/70 font-medium">Decline</span>
                <span className="text-[13px] text-white/70 font-medium">Accept</span>
              </div>
              <div className="flex w-full items-center justify-between px-6">
                {/* Decline */}
                <button
                  type="button"
                  onClick={handleDeclineCall}
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-red-500 text-white shadow-xl active:scale-90 transition-transform cursor-pointer"
                  aria-label="Decline"
                >
                  <PhoneEndIcon />
                </button>

                {/* Accept */}
                <button
                  type="button"
                  onClick={handleAcceptCall}
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-green-500 text-white shadow-xl active:scale-90 transition-transform cursor-pointer"
                  aria-label="Accept"
                >
                  <PhoneAcceptIcon />
                </button>
              </div>
            </>
          )}

          {/* ── AUDIO ACTIVE: WhatsApp/iOS style 2-row grid ── */}
          {isAudioActive && (
            <>
              {/* Row 1: Mute, Keypad, Speaker */}
              <div className="flex w-full justify-around">
                <CtrlBtn label="Mute" active={isMuted} onClick={toggleMute}>
                  <MicIcon slashed={isMuted} />
                </CtrlBtn>
                <CtrlBtn label="Speaker" active={isSpeaker} onClick={() => setIsSpeaker((p) => !p)}>
                  <SpeakerIcon />
                </CtrlBtn>
                <CtrlBtn label="Camera Off" active={isVideoOff} onClick={toggleVideo}>
                  <VideoIcon slashed={isVideoOff} />
                </CtrlBtn>
              </div>
              {/* Row 2: End Call centred */}
              <button
                type="button"
                onClick={handleEndCall}
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-red-500 text-white shadow-xl active:scale-90 transition-transform cursor-pointer"
                aria-label="End Call"
              >
                <PhoneEndIcon />
              </button>
            </>
          )}

          {/* ── VIDEO ACTIVE: FaceTime-style 1-row bar ── */}
          {isVideoActive && (
            <div className="flex w-full items-end justify-around">
              <CtrlBtn label="Flip" onClick={flipCamera}>
                <FlipCameraIcon />
              </CtrlBtn>
              <CtrlBtn label="Mute Mic" active={isMuted} onClick={toggleMute}>
                <MicIcon slashed={isMuted} />
              </CtrlBtn>
              <CtrlBtn label="Camera Off" active={isVideoOff} onClick={toggleVideo}>
                <VideoIcon slashed={isVideoOff} />
              </CtrlBtn>
              {/* End — bigger & red */}
              <button
                type="button"
                onClick={handleEndCall}
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-red-500 text-white shadow-xl active:scale-90 transition-transform cursor-pointer"
                aria-label="End Call"
              >
                <PhoneEndIcon />
              </button>
            </div>
          )}

          {/* ── CALLING/RINGING: just End Call ── */}
          {callStatus === 'calling' && (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleEndCall}
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-red-500 text-white shadow-xl active:scale-90 transition-transform cursor-pointer"
                aria-label="Cancel"
              >
                <PhoneEndIcon />
              </button>
              <span className="text-[13px] text-white/60 font-medium">End Call</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
