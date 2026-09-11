'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SafeImage } from './shared';
import { hapticLight, hapticMedium } from '../lib/haptics';
import { formatLastSeen } from '../lib/time';

interface PartnerProfile {
  id: number;
  matchId: number;
  name: string;
  age: number | null;
  city: string | null;
  bio: string | null;
  isVerified: boolean;
  instagramHandle: string | null;
  snapchatHandle: string | null;
  photos: string[];
  interests: string[];
  prompts: { question: string; answer: string }[];
  lastActiveAt?: string | null;
}

interface Props {
  isOpen: boolean;
  partnerId: number | null;
  matchId: number | null;
  initialData?: { name: string; photo: string | null; verified?: boolean };
  onClose: () => void;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id="ig-grad-sheet" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f09433" />
          <stop offset="50%" stopColor="#dc2743" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="url(#ig-grad-sheet)" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="url(#ig-grad-sheet)" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1" fill="url(#ig-grad-sheet)" />
    </svg>
  );
}

function SnapchatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFC00" aria-hidden>
      <path d="M12.002 2C8.686 2 6.5 4.186 6.5 7.5c0 1.258.384 2.378.384 2.878 0 .2-.224.368-.456.456-.704.266-1.572.766-1.572 1.666 0 .848.784 1.348 1.456 1.488.24.05.388.24.388.48 0 1.298-1.544 3.018-2.6 3.656-.376.226-.6.626-.6 1.066 0 .8.712 1.31 1.744 1.31.528 0 1.056-.12 1.544-.3.264-.1.44.08.384.34-.344 1.54-1.256 1.96-1.256 2.47 0 .42.44.75 1.12.75.92 0 2.05-.62 3.46-1.74.52-.41.93-.41 1.45 0 1.41 1.12 2.54 1.74 3.46 1.74.68 0 1.12-.33 1.12-.75 0-.51-.91-.93-1.26-2.47-.05-.26.12-.44.38-.34.49.18 1.02.3 1.54.3 1.03 0 1.74-.51 1.74-1.31 0-.44-.22-.84-.6-1.07-1.06-.63-2.6-2.35-2.6-3.65 0-.24.15-.43.39-.48.67-.14 1.45-.64 1.45-1.49 0-.9-.86-1.4-1.57-1.66-.23-.09-.45-.26-.45-.46 0-.5.38-1.62.38-2.88C17.5 4.186 15.318 2 12.002 2z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function BlockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function VerifiedBadge() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--infyn-rose)" aria-label="Verified profile">
      <path d="M12 2l2.4 2.4 3.3-.5.6 3.3 3 1.5-1.5 3 1.5 3-3 1.5-.6 3.3-3.3-.5L12 22l-2.4-2.4-3.3.5-.6-3.3-3-1.5 1.5-3-1.5-3 3-1.5.6-3.3 3.3.5z" />
      <path d="M9.5 12.2l1.8 1.8 3.6-3.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// Drag pull required to commit dismissal (in pixels)
const DISMISS_DRAG_THRESHOLD_PX = 150;

export function PartnerProfileSheet({ isOpen, partnerId, matchId, initialData, onClose, onAudioCall, onVideoCall }: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [visible, setVisible] = useState(false);
  const [safetyAction, setSafetyAction] = useState<'none' | 'block' | 'report' | 'reported'>('none');
  const [safetyBusy, setSafetyBusy] = useState(false);
  const [safetyError, setSafetyError] = useState<string | null>(null);

  const dragStartY = useRef<number | null>(null);
  const dragging = useRef(false);
  const scrollBodyRef = useRef<HTMLDivElement>(null);

  // Open / close animation
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setSafetyAction('none');
      setPhotoIndex(0);
      setTranslateY(0);
    } else {
      const t = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Fetch partner profile
  useEffect(() => {
    if (!isOpen || !partnerId) return;
    setLoading(true);
    setProfile(null);
    fetch(`/api/users/${partnerId}/profile`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setProfile({ ...data.profile, matchId: matchId ?? 0 }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, partnerId, matchId]);

  // ── Drag-to-dismiss in Pixels (Solid Native Physics) ──
  const handleDragStart = useCallback((clientY: number) => {
    const scrollTop = scrollBodyRef.current?.scrollTop ?? 0;
    if (scrollTop > 4) return; // User is scrolling body content, don't drag sheet
    dragStartY.current = clientY;
    dragging.current = true;
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!dragging.current || dragStartY.current === null) return;
    const delta = clientY - dragStartY.current;
    if (delta > 0) {
      // Apply slight rubber-banding resistance
      setTranslateY(delta * 0.85);
    }
  }, []);

  const handleDragEnd = useCallback((clientY: number) => {
    if (!dragging.current || dragStartY.current === null) return;
    const delta = clientY - dragStartY.current;
    dragging.current = false;
    dragStartY.current = null;

    if (delta >= DISMISS_DRAG_THRESHOLD_PX) {
      hapticLight();
      onClose();
    } else {
      setTranslateY(0);
    }
  }, [onClose]);

  const displayPhotos = profile?.photos?.length ? profile.photos : (initialData?.photo ? [initialData.photo] : []);
  const displayName = profile?.name ?? initialData?.name ?? '';
  const displayVerified = profile?.isVerified ?? initialData?.verified ?? false;

  const handleInstagramTap = useCallback(() => {
    if (!profile?.instagramHandle) return;
    window.location.href = `instagram://user?username=${profile.instagramHandle}`;
    setTimeout(() => window.open(`https://instagram.com/${profile.instagramHandle}`, '_blank'), 400);
  }, [profile?.instagramHandle]);

  const handleSnapchatTap = useCallback(() => {
    if (!profile?.snapchatHandle) return;
    window.location.href = `snapchat://add/${profile.snapchatHandle}`;
    setTimeout(() => window.open(`https://www.snapchat.com/add/${profile.snapchatHandle}`, '_blank'), 400);
  }, [profile?.snapchatHandle]);

  const handleConfirmBlock = async () => {
    if (!partnerId) return;
    setSafetyBusy(true);
    setSafetyError(null);
    try {
      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedUserId: partnerId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Could not block user');
      hapticMedium();
      onClose();
      router.push('/messages');
    } catch (err: any) {
      setSafetyError(err?.message || 'Failed to block user');
    } finally {
      setSafetyBusy(false);
    }
  };

  const handleConfirmReport = async (reason: string) => {
    if (!partnerId) return;
    setSafetyBusy(true);
    setSafetyError(null);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportedUserId: partnerId, reason }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Could not submit report');
      hapticLight();
      setSafetyAction('reported');
    } catch (err: any) {
      setSafetyError(err?.message || 'Failed to submit report');
    } finally {
      setSafetyBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center"
      aria-modal="true"
      role="dialog"
      aria-label={`${displayName}'s profile`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300 ${
          isOpen && translateY < 100 ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet container */}
      <div
        className={`relative w-full max-w-[440px] sm:max-w-lg rounded-t-[32px] bg-infyn-dark shadow-[0_-25px_70px_rgba(0,0,0,0.9)] border-t border-white/10 flex flex-col overflow-hidden ${
          isOpen ? 'animate-sheet-slide-up' : 'animate-sheet-slide-down'
        }`}
        style={{
          transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
          transition: dragging.current ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          maxHeight: '94dvh',
        }}
      >
        {/* ── DRAG ZONE & HERO PHOTO ── */}
        <div
          className="relative flex-shrink-0 select-none overflow-hidden rounded-t-[32px]"
          style={{ cursor: 'grab' }}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
          onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientY)}
          onMouseDown={(e) => handleDragStart(e.clientY)}
          onMouseMove={(e) => e.buttons === 1 && handleDragMove(e.clientY)}
          onMouseUp={(e) => handleDragEnd(e.clientY)}
        >
          {/* Top Floating Gradient Vignette Shadow */}
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none z-20" aria-hidden />

          {/* Centered Floating Glass Drag Handle */}
          <div className="absolute top-3 inset-x-0 flex justify-center z-30 pointer-events-none" aria-hidden>
            <div className="w-12 h-1.5 rounded-full bg-infyn-surface/50 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.4)]" />
          </div>

          {/* Top Action Bar: Photo Counter & Close Button */}
          <div className="absolute top-6 inset-x-4 flex items-center justify-between z-30 pointer-events-auto">
            {/* Photo Counter Badge */}
            {displayPhotos.length > 1 ? (
              <div className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white text-[11px] font-bold tracking-wide shadow-sm">
                {photoIndex + 1} / {displayPhotos.length}
              </div>
            ) : <div />}

            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/90 hover:bg-black/60 active:scale-90 transition-all cursor-pointer shadow-md"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Photo Carousel Container */}
          <div className="relative w-full aspect-[4/5] bg-[#121212]">
            {displayPhotos.length > 0 ? (
              <>
                <SafeImage
                  src={displayPhotos[photoIndex]}
                  name={displayName}
                  alt={`${displayName} photo ${photoIndex + 1}`}
                  className="h-full w-full object-cover"
                />

                {/* Bottom Smooth Dark Shadow Overlay */}
                <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-infyn-dark via-infyn-dark/75 to-transparent pointer-events-none z-10" />

                {/* Segmented Story Bars (Top) */}
                {displayPhotos.length > 1 && (
                  <div className="absolute top-2 inset-x-4 flex gap-1.5 z-25 pointer-events-none">
                    {displayPhotos.map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-[2.5px] rounded-full transition-all duration-300"
                        style={{
                          background: i === photoIndex ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
                          boxShadow: i === photoIndex ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Left/Right Tap Zones to Switch Photos */}
                {displayPhotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="absolute left-0 top-12 h-[calc(100%-48px)] w-1/3 cursor-pointer z-15"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoIndex((p) => Math.max(0, p - 1));
                      }}
                      aria-label="Previous photo"
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-12 h-[calc(100%-48px)] w-1/3 cursor-pointer z-15"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoIndex((p) => Math.min(displayPhotos.length - 1, p + 1));
                      }}
                      aria-label="Next photo"
                    />
                  </>
                )}
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#1E1B4B] to-infyn-dark">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-infyn-rose to-infyn-rose flex items-center justify-center shadow-xl">
                  <span className="text-4xl font-black text-white">{displayName.charAt(0).toUpperCase()}</span>
                </div>
              </div>
            )}

            {/* Name, Age, Location Overlay */}
            <div className="absolute bottom-4 left-5 right-5 z-20 pointer-events-none">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[30px] font-black text-white leading-none tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                  {displayName}{profile?.age ? `, ${profile.age}` : ''}
                </h2>
                {displayVerified && <VerifiedBadge />}
              </div>
              <div className="flex items-center gap-3 flex-wrap mt-1.5">
                {profile?.city && (
                  <div className="flex items-center gap-1 text-white/80 text-[13px] font-semibold drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                    <LocationIcon />
                    <span>{profile.city}</span>
                  </div>
                )}
                {profile?.lastActiveAt && (
                  <div className="flex items-center gap-1.5 text-white/80 text-[12px] font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                    {formatLastSeen(profile.lastActiveAt).isOnline ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-emerald-300 font-semibold">Active now</span>
                      </>
                    ) : (
                      <span className="text-white/60">{formatLastSeen(profile.lastActiveAt).label}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* ── END DRAG ZONE ── */}

        {/* ── SCROLLABLE CONTENT BODY ── */}
        <div
          ref={scrollBodyRef}
          className="overflow-y-auto scrollbar-none flex-1"
        >
          <div className="px-5 pt-3 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">

            {/* Loading skeleton */}
            {loading && !profile && (
              <div className="space-y-3 py-3 animate-pulse">
                <div className="h-4 bg-infyn-surface/10 rounded-full w-3/4" />
                <div className="h-4 bg-infyn-surface/10 rounded-full w-1/2" />
              </div>
            )}

            {/* Bio */}
            {profile?.bio && (
              <p className="text-[15px] leading-relaxed text-white/80 mb-5 font-normal">
                {profile.bio}
              </p>
            )}

            {/* Prompts */}
            {profile?.prompts && profile.prompts.length > 0 && (
              <div className="mb-5 space-y-3">
                {profile.prompts.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-[22px] bg-infyn-surface/[0.06] border border-white/10 px-4 py-3.5 backdrop-blur-md shadow-xs"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wider text-infyn-rose-light mb-1.5">{p.question}</p>
                    <p className="text-[14.5px] font-medium text-white/90 leading-snug">{p.answer}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Social Links */}
            {(profile?.instagramHandle || profile?.snapchatHandle) && (
              <div className="flex gap-3 mb-5 flex-wrap">
                {profile.instagramHandle && (
                  <button
                    onClick={handleInstagramTap}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-infyn-surface/[0.07] border border-white/10 hover:bg-infyn-surface/15 active:scale-95 transition-all cursor-pointer shadow-xs"
                    aria-label={`Instagram: @${profile.instagramHandle}`}
                  >
                    <InstagramIcon />
                    <span className="text-[13px] font-bold text-white/90">@{profile.instagramHandle}</span>
                  </button>
                )}
                {profile.snapchatHandle && (
                  <button
                    onClick={handleSnapchatTap}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-infyn-surface/[0.07] border border-white/10 hover:bg-infyn-surface/15 active:scale-95 transition-all cursor-pointer shadow-xs"
                    aria-label={`Snapchat: @${profile.snapchatHandle}`}
                  >
                    <SnapchatIcon />
                    <span className="text-[13px] font-bold text-white/90">@{profile.snapchatHandle}</span>
                  </button>
                )}
              </div>
            )}

            {/* Interests */}
            {profile?.interests && profile.interests.length > 0 && (
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2.5">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span key={interest} className="px-3 py-1.5 rounded-full bg-infyn-surface/[0.08] border border-white/10 text-[12px] font-semibold text-white/85 shadow-2xs">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-infyn-surface/10 mb-5" />

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <button
                onClick={() => { onClose(); if (matchId) router.push(`/chat/${matchId}`); }}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-br from-infyn-rose/25 to-infyn-rose/25 border border-infyn-rose/25 hover:from-infyn-rose/35 hover:to-infyn-rose/35 active:scale-95 transition-all cursor-pointer shadow-sm"
                aria-label="Open chat"
              >
                <span className="text-infyn-rose-light"><ChatIcon /></span>
                <span className="text-[11px] font-bold text-white/80">Message</span>
              </button>
              <button
                onClick={() => { onClose(); onAudioCall?.(); }}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-infyn-rose/20 border border-infyn-rose/30 hover:bg-infyn-rose/30 active:scale-95 transition-all cursor-pointer shadow-sm"
                aria-label="Start audio call"
              >
                <span className="text-infyn-rose-light"><PhoneIcon /></span>
                <span className="text-[11px] font-bold text-white/80">Audio</span>
              </button>
              <button
                onClick={() => { onClose(); onVideoCall?.(); }}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-br from-infyn-rose/20 to-[#FF8C42]/20 border border-infyn-rose/25 hover:from-infyn-rose/30 hover:to-[#FF8C42]/30 active:scale-95 transition-all cursor-pointer shadow-sm"
                aria-label="Start video call"
              >
                <span className="text-[#FF8C42]"><VideoIcon /></span>
                <span className="text-[11px] font-bold text-white/80">Video</span>
              </button>
            </div>

            {/* Danger zone */}
            <div className="flex gap-3">
              <button
                onClick={() => setSafetyAction('block')}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-infyn-surface/[0.05] border border-white/10 text-white/50 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-400 active:scale-95 transition-all cursor-pointer text-[12px] font-bold"
                aria-label="Block user"
              >
                <BlockIcon />
                Block
              </button>
              <button
                onClick={() => setSafetyAction('report')}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-infyn-surface/[0.05] border border-white/10 text-white/50 hover:bg-amber-500/15 hover:border-amber-500/30 hover:text-amber-400 active:scale-95 transition-all cursor-pointer text-[12px] font-bold"
                aria-label="Report user"
              >
                <FlagIcon />
                Report
              </button>
            </div>

            {/* Inline Safety Modals */}
            {safetyAction === 'block' && (
              <div className="mt-4 p-4 rounded-2xl bg-infyn-surface/10 border border-white/15 text-center animate-scale-up">
                <p className="text-[15px] font-bold text-white mb-1">Block {displayName}?</p>
                <p className="text-[12px] text-white/60 mb-3">They won&apos;t be able to contact you, and this match will end.</p>
                {safetyError && <p className="text-[12px] text-rose-400 font-semibold mb-2">{safetyError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmBlock}
                    disabled={safetyBusy}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-[13px] hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {safetyBusy ? 'Blocking…' : 'Yes, Block'}
                  </button>
                  <button
                    onClick={() => setSafetyAction('none')}
                    className="flex-1 py-2.5 rounded-xl bg-infyn-surface/10 text-white/70 font-semibold text-[13px] hover:bg-infyn-surface/15 active:scale-95 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {safetyAction === 'report' && (
              <div className="mt-4 p-4 rounded-2xl bg-infyn-surface/10 border border-white/15 text-center animate-scale-up">
                <p className="text-[15px] font-bold text-white mb-1">Report {displayName}</p>
                <p className="text-[12px] text-white/60 mb-3">Select a reason (anonymous):</p>
                {safetyError && <p className="text-[12px] text-rose-400 font-semibold mb-2">{safetyError}</p>}
                <div className="space-y-1.5 mb-3 text-left">
                  {[
                    { key: 'inappropriate', label: 'Inappropriate content' },
                    { key: 'harassment', label: 'Harassment or bullying' },
                    { key: 'spam', label: 'Spam or scam' },
                    { key: 'fake', label: 'Fake profile' },
                    { key: 'photos', label: 'Inappropriate photos' },
                  ].map((r) => (
                    <button
                      key={r.key}
                      onClick={() => handleConfirmReport(r.key)}
                      disabled={safetyBusy}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-infyn-surface/5 hover:bg-infyn-surface/10 text-[13px] text-white/90 font-medium text-left transition-all active:scale-[0.99] cursor-pointer"
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSafetyAction('none')}
                  className="w-full py-2 rounded-xl bg-infyn-surface/5 text-white/60 font-semibold text-[12px] hover:bg-infyn-surface/10 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            {safetyAction === 'reported' && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center animate-scale-up">
                <p className="text-[15px] font-bold text-emerald-400 mb-1">Report Submitted</p>
                <p className="text-[12px] text-white/70 mb-3">Thank you for helping keep Infyn safe.</p>
                <button
                  onClick={() => setSafetyAction('none')}
                  className="px-4 py-1.5 rounded-xl bg-infyn-surface/10 text-white text-[12px] font-bold hover:bg-infyn-surface/20 cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
        {/* ── END SCROLLABLE CONTENT BODY ── */}

      </div>

      <style jsx>{`
        @keyframes sheet-slide-up {
          0% {
            transform: translateY(100%);
          }
          100% {
            transform: translateY(0%);
          }
        }
        @keyframes sheet-slide-down {
          0% {
            transform: translateY(0%);
          }
          100% {
            transform: translateY(100%);
          }
        }
        .animate-sheet-slide-up {
          animation: sheet-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-sheet-slide-down {
          animation: sheet-slide-down 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
