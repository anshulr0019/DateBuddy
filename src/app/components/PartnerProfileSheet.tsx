'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SafeImage } from './shared';

/* ─────────────────────────────────────────────────
   PartnerProfileSheet
   Premium iOS-style bottom sheet Contact Card for matched partners.
   Opens with spring animation, dismisses by drag-down or backdrop tap.
───────────────────────────────────────────────── */

export interface PartnerProfile {
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
  lastActiveAt?: string | null;
}

interface Props {
  isOpen: boolean;
  partnerId: number | null;
  matchId: number | null;
  initialData?: {
    name: string;
    photo: string | null;
    verified?: boolean;
  };
  onClose: () => void;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f09433" />
          <stop offset="25%" stopColor="#e6683c" />
          <stop offset="50%" stopColor="#dc2743" />
          <stop offset="75%" stopColor="#cc2366" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="url(#ig-grad)" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="url(#ig-grad)" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="url(#ig-grad)" />
    </svg>
  );
}

function SnapchatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFC00" aria-hidden>
      <path
        d="M12 2C9.5 2 8 4.5 8 6v.5C6.5 7 5 7.5 5 7.5s-.5 1.5 1 2c-.5.5-1 1.5-3 1.5 0 0 .5 1.5 4 2 .5 1 1 2.5 4 2.5s3.5-1.5 4-2.5c3.5-.5 4-2 4-2-2 0-2.5-1-3-1.5 1.5-.5 1-2 1-2s-1.5-.5-3-.5V6c0-1.5-1.5-4-4-4z"
        stroke="#888" strokeWidth="0.5"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
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

function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function BlockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function VerifiedBadge() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#F43F5E" aria-label="Verified profile">
      <path d="M12 2l2.4 2.4 3.3-.5.6 3.3 3 1.5-1.5 3 1.5 3-3 1.5-.6 3.3-3.3-.5L12 22l-2.4-2.4-3.3.5-.6-3.3-3-1.5 1.5-3-1.5-3 3-1.5.6-3.3 3.3.5z" />
      <path d="M9.5 12.2l1.8 1.8 3.6-3.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function PartnerProfileSheet({ isOpen, partnerId, matchId, initialData, onClose, onAudioCall, onVideoCall }: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [translateY, setTranslateY] = useState(100);
  const [visible, setVisible] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Open/close animation
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setPhotoIndex(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTranslateY(0));
      });
    } else {
      setTranslateY(100);
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
      .then((data) => {
        if (data.success) setProfile({ ...data.profile, matchId: matchId ?? 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, partnerId, matchId]);

  // Drag-to-dismiss handlers
  const handleDragStart = useCallback((clientY: number) => {
    dragStartY.current = clientY;
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (dragStartY.current === null) return;
    const delta = clientY - dragStartY.current;
    if (delta > 0) setTranslateY(Math.min(delta, 300));
  }, []);

  const handleDragEnd = useCallback((clientY: number) => {
    if (dragStartY.current === null) return;
    const delta = clientY - dragStartY.current;
    dragStartY.current = null;
    if (delta > 100) {
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
    const appUrl = `instagram://user?username=${profile.instagramHandle}`;
    const webUrl = `https://instagram.com/${profile.instagramHandle}`;
    window.location.href = appUrl;
    setTimeout(() => { window.open(webUrl, '_blank'); }, 400);
  }, [profile?.instagramHandle]);

  const handleSnapchatTap = useCallback(() => {
    if (!profile?.snapchatHandle) return;
    const appUrl = `snapchat://add/${profile.snapchatHandle}`;
    const webUrl = `https://www.snapchat.com/add/${profile.snapchatHandle}`;
    window.location.href = appUrl;
    setTimeout(() => { window.open(webUrl, '_blank'); }, 400);
  }, [profile?.snapchatHandle]);

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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: translateY < 50 ? 1 : Math.max(0, 1 - (translateY - 50) / 100) }}
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-[440px] sm:max-w-lg rounded-t-[28px] bg-[#0D0D0D] overflow-hidden shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.8)]"
        style={{
          transform: `translateY(${translateY}%)`,
          transition: dragStartY.current !== null ? 'none' : 'transform 0.45s cubic-bezier(0.16,1,0.3,1)',
          maxHeight: '92dvh',
          overflowY: 'auto',
        }}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
        onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientY)}
        onMouseDown={(e) => handleDragStart(e.clientY)}
        onMouseMove={(e) => e.buttons === 1 && handleDragMove(e.clientY)}
        onMouseUp={(e) => handleDragEnd(e.clientY)}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 select-none" aria-hidden>
          <div className="w-10 h-1 rounded-full bg-white/25" />
        </div>

        {/* Photo carousel */}
        <div className="relative w-full aspect-[4/5] bg-[#1A1A1A] select-none">
          {displayPhotos.length > 0 ? (
            <>
              <SafeImage
                src={displayPhotos[photoIndex]}
                name={displayName}
                alt={`${displayName} photo ${photoIndex + 1}`}
                className="h-full w-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent" />

              {/* Photo indicators */}
              {displayPhotos.length > 1 && (
                <div className="absolute top-3 inset-x-3 flex gap-1.5">
                  {displayPhotos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIndex(i)}
                      className="flex-1 h-[3px] rounded-full cursor-pointer transition-all duration-300"
                      style={{ background: i === photoIndex ? '#fff' : 'rgba(255,255,255,0.35)' }}
                      aria-label={`Photo ${i + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Left/Right tap zones */}
              {displayPhotos.length > 1 && (
                <>
                  <button
                    className="absolute left-0 top-0 h-full w-1/3 cursor-pointer"
                    onClick={() => setPhotoIndex((p) => Math.max(0, p - 1))}
                    aria-label="Previous photo"
                  />
                  <button
                    className="absolute right-0 top-0 h-full w-1/3 cursor-pointer"
                    onClick={() => setPhotoIndex((p) => Math.min(displayPhotos.length - 1, p + 1))}
                    aria-label="Next photo"
                  />
                </>
              )}
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] flex items-center justify-center">
                <span className="text-4xl font-black text-white">{displayName.charAt(0).toUpperCase()}</span>
              </div>
            </div>
          )}

          {/* Name overlay on photo */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[28px] font-black text-white leading-none tracking-tight">
                {displayName}
                {profile?.age ? `, ${profile.age}` : ''}
              </h2>
              {displayVerified && <VerifiedBadge />}
            </div>
            {(profile?.city) && (
              <div className="flex items-center gap-1 mt-1 text-white/70 text-[13px] font-medium">
                <LocationIcon />
                {profile.city}
              </div>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">

          {loading && !profile && (
            <div className="space-y-3 py-2 animate-pulse">
              <div className="h-4 bg-white/10 rounded-full w-3/4" />
              <div className="h-4 bg-white/10 rounded-full w-1/2" />
            </div>
          )}

          {/* Bio */}
          {profile?.bio && (
            <p className="text-[15px] leading-relaxed text-white/75 mb-5 font-normal">
              {profile.bio}
            </p>
          )}

          {/* Social Links */}
          {(profile?.instagramHandle || profile?.snapchatHandle) && (
            <div className="flex gap-3 mb-5 flex-wrap">
              {profile.instagramHandle && (
                <button
                  onClick={handleInstagramTap}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/8 border border-white/10 hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
                  aria-label={`Instagram: @${profile.instagramHandle}`}
                >
                  <InstagramIcon />
                  <span className="text-[13px] font-bold text-white/90">@{profile.instagramHandle}</span>
                </button>
              )}
              {profile.snapchatHandle && (
                <button
                  onClick={handleSnapchatTap}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/8 border border-white/10 hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
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
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-2.5">Interests</p>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[12px] font-semibold text-white/80"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-white/8 mb-5" />

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {/* Message */}
            <button
              onClick={() => { onClose(); if (matchId) router.push(`/chat/${matchId}`); }}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-br from-[#FF6B9D]/20 to-[#7B68EE]/20 border border-[#FF6B9D]/20 hover:from-[#FF6B9D]/30 hover:to-[#7B68EE]/30 active:scale-95 transition-all cursor-pointer"
              aria-label="Open chat"
            >
              <span className="text-[#FF6B9D]"><ChatIcon /></span>
              <span className="text-[11px] font-bold text-white/70">Message</span>
            </button>
            {/* Audio Call */}
            <button
              onClick={() => { onClose(); onAudioCall?.(); }}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-[#7B68EE]/15 border border-[#7B68EE]/25 hover:bg-[#7B68EE]/25 active:scale-95 transition-all cursor-pointer"
              aria-label="Start audio call"
            >
              <span className="text-[#7B68EE]"><PhoneIcon /></span>
              <span className="text-[11px] font-bold text-white/70">Audio</span>
            </button>
            {/* Video Call */}
            <button
              onClick={() => { onClose(); onVideoCall?.(); }}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-br from-[#FF6B9D]/15 to-[#FF8C42]/15 border border-[#FF6B9D]/20 hover:from-[#FF6B9D]/25 hover:to-[#FF8C42]/25 active:scale-95 transition-all cursor-pointer"
              aria-label="Start video call"
            >
              <span className="text-[#FF8C42]"><VideoIcon /></span>
              <span className="text-[11px] font-bold text-white/70">Video</span>
            </button>
          </div>

          {/* Danger zone */}
          <div className="flex gap-3">
            <button
              onClick={() => { onClose(); router.push(`/chat/${matchId}?action=block`); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/8 text-white/40 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 active:scale-95 transition-all cursor-pointer text-[12px] font-bold"
              aria-label="Block user"
            >
              <BlockIcon />
              Block
            </button>
            <button
              onClick={() => { onClose(); router.push(`/chat/${matchId}?action=report`); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/8 text-white/40 hover:bg-amber-500/10 hover:border-amber-500/20 hover:text-amber-400 active:scale-95 transition-all cursor-pointer text-[12px] font-bold"
              aria-label="Report user"
            >
              <FlagIcon />
              Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
