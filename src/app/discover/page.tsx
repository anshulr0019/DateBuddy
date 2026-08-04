'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ic } from '../components/icons';
import { AuroraBackground, SafeImage, PrimaryButton } from '../components/shared';
import { useNotifications } from '../context/NotificationContext';

/* ─────────────────────────────────────────────────
   Scoped micro-interaction animations
───────────────────────────────────────────────── */
const DISCOVER_STYLES = `
  @keyframes fade-slide-up {
    0% { opacity: 0; transform: translateY(8px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-slide-up {
    animation: fade-slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
`;

const SWIPE_ANIMATION_MS = 380;
const REFILL_THRESHOLD = 3;

const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'fake', label: 'Fake profile' },
  { value: 'photos', label: 'Photos are not of this person' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'other', label: 'Something else' },
] as const;

type Profile = {
  id: number;
  name: string;
  age: number;
  city: string | null;
  bio: string | null;
  verified: boolean;
  online: boolean;
  distance: string | null;
  photos: string[];
  tags: string[];
  prompts: { q: string; a: string }[];
};

type MatchedUser = { id: number; name: string; photo: string | null };

type Status = 'loading' | 'ready' | 'error';

export default function DiscoverPage() {
  const router = useRouter();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [animatingSwipe, setAnimatingSwipe] = useState<'right' | 'left' | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [cardKey, setCardKey] = useState(0);

  const [matchedUser, setMatchedUser] = useState<MatchedUser | null>(null);
  const [myPhoto, setMyPhoto] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>('You');

  const [likedPrompts, setLikedPrompts] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const [safetySheetOpen, setSafetySheetOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const swipeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionInFlightRef = useRef(false);
  const fetchingRef = useRef(false);

  const currentProfile = profiles[0];

  const loadFeed = useCallback(async (cursor: number | null) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const url = cursor === null ? '/api/feed' : `/api/feed?cursor=${cursor}`;
      const res = await fetch(url);

      if (res.status === 401) {
        router.replace('/welcome');
        return;
      }
      if (!res.ok) throw new Error(`Feed request failed (${res.status})`);

      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Could not load profiles');

      const incoming: Profile[] = data.profiles ?? [];
      setProfiles((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        return [...prev, ...incoming.filter((p) => !existingIds.has(p.id))];
      });
      setNextCursor(data.nextCursor ?? null);
      setHasMore(data.nextCursor !== null && incoming.length > 0);
      setStatus('ready');
    } catch {
      // Only surface a full-page error when there is nothing to show.
      setStatus((prev) => (prev === 'ready' ? 'ready' : 'error'));
    } finally {
      fetchingRef.current = false;
    }
  }, [router]);

  useEffect(() => {
    loadFeed(null);
  }, [loadFeed]);

  // Top up the deck before it runs dry so there is no dead end.
  useEffect(() => {
    if (status === 'ready' && hasMore && profiles.length <= REFILL_THRESHOLD) {
      loadFeed(nextCursor);
    }
  }, [status, hasMore, profiles.length, nextCursor, loadFeed]);

  // Current user's own photo for the match celebration.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.success) return;
        setMyPhoto(data.user?.photos?.[0]?.url ?? null);
        setMyName(data.user?.name ?? 'You');
      } catch {
        /* non-critical — the avatar falls back to initials */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return () => {
      if (swipeTimerRef.current) clearTimeout(swipeTimerRef.current);
    };
  }, []);

  const advanceCard = useCallback((targetId: number) => {
    swipeTimerRef.current = setTimeout(() => {
      setAnimatingSwipe(null);
      setCurrentPhotoIndex(0);
      setScrollProgress(0);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      setCardKey((k) => k + 1);
      setProfiles((prev) => prev.filter((p) => p.id !== targetId));
      actionInFlightRef.current = false;
    }, SWIPE_ANIMATION_MS);
  }, []);

  const handleAction = useCallback(async (action: 'like' | 'pass' | 'super_like') => {
    if (actionInFlightRef.current) return;

    const targetUser = profiles[0];
    if (!targetUser) return;

    actionInFlightRef.current = true;
    setActionError(null);
    setAnimatingSwipe(action === 'pass' ? 'left' : 'right');

    try {
      const res = await fetch('/api/swipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swipedUserId: targetUser.id, action }),
      });

      if (res.status === 401) {
        router.replace('/welcome');
        return;
      }
      if (!res.ok) throw new Error(`Swipe failed (${res.status})`);

      const data = await res.json();
      if (data.isMatch && data.matchedUser) setMatchedUser(data.matchedUser);

      advanceCard(targetUser.id);
    } catch {
      // Keep the profile in the deck — losing it silently is worse than an error.
      actionInFlightRef.current = false;
      setAnimatingSwipe(null);
      setActionError('Something went wrong. Check your connection and try again.');
    }
  }, [profiles, router, advanceCard]);

  const togglePromptLike = useCallback((promptKey: string) => {
    const willLike = !likedPrompts[promptKey];
    setLikedPrompts((prev) => ({ ...prev, [promptKey]: willLike }));
    if (willLike) handleAction('like');
  }, [likedPrompts, handleAction]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(scrollTop / (maxScroll * 0.45), 1));
    }
  }, []);

  const handleBlock = useCallback(async () => {
    const target = profiles[0];
    if (!target) return;
    setSafetySheetOpen(false);
    try {
      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedUserId: target.id }),
      });
      if (!res.ok) throw new Error();
      setProfiles((prev) => prev.filter((p) => p.id !== target.id));
      setCurrentPhotoIndex(0);
      setScrollProgress(0);
      setCardKey((k) => k + 1);
    } catch {
      setActionError('Could not block this person. Please try again.');
    }
  }, [profiles]);

  const handleReport = useCallback(async (reason: string) => {
    const target = profiles[0];
    if (!target) return;
    setReportSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportedUserId: target.id, reason }),
      });
      if (!res.ok) throw new Error();
      // Reporting implies the user does not want to see this person again.
      await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedUserId: target.id }),
      });
      setSafetySheetOpen(false);
      setProfiles((prev) => prev.filter((p) => p.id !== target.id));
      setCurrentPhotoIndex(0);
      setScrollProgress(0);
      setCardKey((k) => k + 1);
    } catch {
      setSafetySheetOpen(false);
      setActionError('Could not submit your report. Please try again.');
    } finally {
      setReportSubmitting(false);
    }
  }, [profiles]);

  // Escape / Android hardware back closes any open overlay. A single history
  // entry is pushed while an overlay is open and consumed again on close, so
  // the back stack is left exactly as we found it.
  const overlayOpen = Boolean(matchedUser) || safetySheetOpen;
  const pushedOverlayRef = useRef(false);
  const closingFromPopRef = useRef(false);

  useEffect(() => {
    if (!overlayOpen) {
      if (pushedOverlayRef.current) {
        pushedOverlayRef.current = false;
        // Only rewind if our own entry is still on top — if the user navigated
        // away instead, going back would undo their navigation.
        if (!closingFromPopRef.current && window.history.state?.dsOverlay) {
          window.history.back();
        }
        closingFromPopRef.current = false;
      }
      return;
    }

    if (!pushedOverlayRef.current) {
      pushedOverlayRef.current = true;
      window.history.pushState({ dsOverlay: true }, '');
    }

    const closeAll = () => {
      setSafetySheetOpen(false);
      setMatchedUser(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll();
    };
    const onPopState = () => {
      closingFromPopRef.current = true;
      pushedOverlayRef.current = false;
      closeAll();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', onPopState);
    };
  }, [overlayOpen]);

  // Preload the next photo so advancing never shows a blank frame.
  useEffect(() => {
    const next = currentProfile?.photos?.[currentPhotoIndex + 1];
    if (next) {
      const img = new Image();
      img.src = next;
    }
  }, [currentProfile, currentPhotoIndex]);

  /* ---- Loading ---- */
  if (status === 'loading') {
    return (
      <Shell>
        <div className="flex-shrink-0 z-20 px-6 pt-[calc(0.875rem+env(safe-area-inset-top,0px))] pb-2">
          <TopBar />
        </div>
        <div className="flex-1 min-h-0 z-10 mx-6 my-1.5">
          <div className="h-full w-full rounded-[28px] animate-skeleton" />
        </div>
        <div className="flex-shrink-0 flex justify-center items-center gap-4 pt-1 mb-2 pb-[calc(4.65rem+env(safe-area-inset-bottom,0px))] px-6 z-20">
          <div className="h-12 w-12 rounded-full animate-skeleton" />
          <div className="h-16 w-16 rounded-full animate-skeleton" />
          <div className="h-16 w-16 rounded-full animate-skeleton" />
          <div className="h-12 w-12 rounded-full animate-skeleton" />
        </div>
      </Shell>
    );
  }

  /* ---- Error ---- */
  if (status === 'error') {
    return (
      <Shell>
        <AuroraBackground subtle>
          <div className="flex-shrink-0 z-20 px-6 pt-[calc(0.875rem+env(safe-area-inset-top,0px))] pb-2">
            <TopBar />
          </div>
          <div className="flex-1 flex items-center justify-center px-8 z-10 pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
            <div className="rounded-[28px] border border-white/80 bg-white/85 px-8 py-10 shadow-[0_16px_48px_-12px_rgba(26,26,46,0.12)] backdrop-blur-md flex flex-col items-center w-full text-center animate-fade-slide-up">
              <div className="flex h-20 w-20 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#FF6B9D]/15 to-[#7B68EE]/15 text-[28px] mb-6 text-[#FF6B9D] ring-1 ring-[#FF6B9D]/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h2 className="text-[26px] font-extrabold text-[#1A1A2E] mb-2 tracking-tight">Couldn&apos;t load profiles</h2>
              <p className="text-[15px] leading-relaxed text-[#1A1A2E]/55 mb-8 max-w-[280px]">Check your connection and try again.</p>
              <PrimaryButton onClick={() => { setStatus('loading'); loadFeed(null); }}>
                Try Again
              </PrimaryButton>
            </div>
          </div>
        </AuroraBackground>
      </Shell>
    );
  }

  /* ---- Empty ---- */
  if (!currentProfile) {
    return (
      <Shell>
        <AuroraBackground subtle>
          <div className="flex-shrink-0 z-20 px-6 pt-[calc(0.875rem+env(safe-area-inset-top,0px))] pb-2">
            <TopBar />
          </div>
          <div className="flex-1 flex items-center justify-center px-8 z-10 pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
            <div className="rounded-[28px] border border-white/80 bg-white/85 px-8 py-10 shadow-[0_16px_48px_-12px_rgba(26,26,46,0.12)] backdrop-blur-md flex flex-col items-center w-full text-center animate-fade-slide-up">
              <div className="flex h-20 w-20 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#FF6B9D]/15 to-[#7B68EE]/15 text-[28px] mb-6 text-[#FF6B9D] ring-1 ring-[#FF6B9D]/10">
                <Ic.Heart filled />
              </div>
              <h2 className="text-[26px] font-extrabold text-[#1A1A2E] mb-2 tracking-tight">You&apos;re all caught up</h2>
              <p className="text-[15px] leading-relaxed text-[#1A1A2E]/55 mb-8 max-w-[280px]">
                No new people nearby right now. Check back soon — new profiles appear every day.
              </p>
              <PrimaryButton
                onClick={() => {
                  setProfiles([]);
                  setNextCursor(null);
                  setHasMore(true);
                  setStatus('loading');
                  loadFeed(null);
                }}
              >
                Refresh
              </PrimaryButton>
            </div>
          </div>
        </AuroraBackground>
      </Shell>
    );
  }

  const blurAmount = scrollProgress * 14;
  const overlayOpacity = scrollProgress * 0.6;
  const detailsOpacity = Math.max(0, scrollProgress * 1.5);
  const detailsInteractive = detailsOpacity > 0.5;

  const hasBio = Boolean(currentProfile.bio && currentProfile.bio.trim());
  const hasTags = currentProfile.tags.length > 0;
  const hasPrompts = currentProfile.prompts.length > 0;
  const hasLocationRow = Boolean(currentProfile.distance || currentProfile.city) || currentProfile.online;
  const hasDetails = hasBio || hasTags || hasPrompts || hasLocationRow;

  return (
    <Shell select="select-none">
      {/* Background Aurora */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
      </div>

      {/* HEADER */}
      <div className="flex-shrink-0 z-20 px-6 pt-[calc(0.875rem+env(safe-area-inset-top,0px))] pb-2">
        <TopBar />
      </div>

      {/* PROFILE CARD */}
      <div
        key={cardKey}
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex-1 min-h-0 z-10 mx-6 my-1.5 overflow-y-auto overflow-x-hidden rounded-[28px] scrollbar-none touch-pan-y ${
          animatingSwipe === 'right' ? 'animate-card-swipe-right'
            : animatingSwipe === 'left' ? 'animate-card-swipe-left'
            : 'animate-card-depth-enter'
        }`}
      >
        <div className="relative min-h-full rounded-[28px] border border-white/80 shadow-[0_12px_40px_-12px_rgba(26,26,46,0.15)] overflow-hidden bg-white flex flex-col">

          {/* Hero photo */}
          <div
            className="relative w-full flex-shrink-0 overflow-hidden"
            style={{ height: 'calc(100dvh - 240px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))', minHeight: '380px' }}
          >
            <SafeImage
              src={currentProfile.photos[currentPhotoIndex]}
              name={currentProfile.name}
              alt={`${currentProfile.name}'s profile photo`}
              className="absolute inset-0 h-full w-full object-cover select-none transition-[filter,transform] duration-200 [-webkit-touch-callout:none]"
              style={{
                filter: `blur(${blurAmount}px)`,
                transform: `scale(${1 + scrollProgress * 0.05})`,
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const maxPhotos = currentProfile.photos.length || 1;
                if (maxPhotos < 2) return;
                if (clickX > rect.width / 2) {
                  setCurrentPhotoIndex((prev) => (prev + 1) % maxPhotos);
                } else {
                  setCurrentPhotoIndex((prev) => (prev - 1 + maxPhotos) % maxPhotos);
                }
              }}
            />

            {animatingSwipe === 'right' && (
              <div className="absolute top-12 left-6 z-30 transform -rotate-12 border-4 border-[#22C55E] text-[#22C55E] bg-black/30 backdrop-blur-xs font-black text-[28px] uppercase tracking-wider px-4 py-1.5 rounded-2xl shadow-xl animate-popover-enter">
                LIKE ❤️
              </div>
            )}
            {animatingSwipe === 'left' && (
              <div className="absolute top-12 right-6 z-30 transform rotate-12 border-4 border-[#94A3B8] text-[#E2E8F0] bg-black/30 backdrop-blur-xs font-black text-[28px] uppercase tracking-wider px-4 py-1.5 rounded-2xl shadow-xl animate-popover-enter">
                NOPE
              </div>
            )}

            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-150"
              style={{ background: `rgba(26,26,46,${overlayOpacity})` }}
            />
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/45 to-transparent pointer-events-none z-10" />

            {/* Photo progress — only meaningful with more than one photo */}
            {currentProfile.photos.length > 1 && (
              <div className="absolute top-3.5 left-5 right-5 flex gap-1.5 z-20">
                {currentProfile.photos.map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-[4px] rounded-full transition-all duration-500 ease-out ${
                      i === currentPhotoIndex ? 'bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)]' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Name & age */}
            <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/95 via-black/50 to-transparent pt-16 pb-11 px-6 pointer-events-none">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-[26px] sm:text-[30px] font-extrabold leading-[1.1] text-white tracking-tight drop-shadow-lg">
                  {currentProfile.name}, {currentProfile.age}
                </h2>
                {currentProfile.verified && (
                  <span
                    title="Identity verified"
                    className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-[#FF6B9D] text-white text-[12px] font-bold shadow-[0_2px_8px_rgba(255,107,157,0.4)] flex-shrink-0"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>
              {(currentProfile.distance || currentProfile.city) && (
                <p className="text-white/95 text-[14px] font-bold tracking-tight flex items-center gap-1.5 drop-shadow-md">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF6B9D]">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {currentProfile.distance ?? currentProfile.city}
                </p>
              )}
            </div>

            {/* Scroll page indicator */}
            {hasDetails && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1.5 pointer-events-none">
                <div className={`w-1.5 h-1.5 rounded-full bg-white transition-opacity duration-300 ${scrollProgress <= 0.3 ? 'opacity-100' : 'opacity-40'}`} />
                <div className={`w-1.5 h-1.5 rounded-full bg-white transition-opacity duration-300 ${scrollProgress > 0.3 ? 'opacity-100' : 'opacity-40'}`} />
              </div>
            )}
          </div>

          {/* DETAILS */}
          {hasDetails && (
            <div
              className={`relative z-10 bg-white/95 backdrop-blur-md transition-opacity duration-300 pb-8 ${detailsInteractive ? '' : 'pointer-events-none'}`}
              style={{ opacity: detailsOpacity }}
              aria-hidden={!detailsInteractive}
            >
              <div className="flex justify-center pt-4 pb-3">
                <div className="w-10 h-1 rounded-full bg-[#1A1A2E]/10" />
              </div>

              {hasBio && (
                <div className="px-6 pb-6 animate-fade-slide-up">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1A1A2E]/40 mb-3">About</h3>
                  <p className="text-[#1A1A2E] text-[15px] leading-relaxed font-normal">{currentProfile.bio}</p>
                </div>
              )}

              {hasTags && (
                <div className="px-6 pb-8 animate-fade-slide-up">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1A1A2E]/40 mb-3">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-4 py-2 rounded-full bg-[#1A1A2E]/5 border border-[#1A1A2E]/8 text-[#1A1A2E]/75 text-[13px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {hasLocationRow && (
                <div className="px-6 pb-8 animate-fade-slide-up">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1A1A2E]/40 mb-3">Location &amp; Activity</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    {(currentProfile.distance || currentProfile.city) && (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1A1A2E]/5 border border-[#1A1A2E]/8 text-[#1A1A2E]/75 text-[13px] font-medium">
                        <Ic.MapPin />
                        {currentProfile.distance ?? currentProfile.city}
                      </span>
                    )}
                    {currentProfile.online && (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50/80 border border-emerald-200/80 text-emerald-700 text-[13px] font-medium">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                        Active Now
                      </span>
                    )}
                  </div>
                </div>
              )}

              {hasPrompts && (
                <div className="px-6 pb-4 animate-fade-slide-up">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1A1A2E]/40 mb-3">Vibe Check</h3>
                  <div className="space-y-3">
                    {currentProfile.prompts.map((p, i) => {
                      const key = `${currentProfile.id}-${i}`;
                      const isLiked = likedPrompts[key];
                      return (
                        <div key={key} className="relative p-5 rounded-2xl bg-white border border-[#1A1A2E]/8 shadow-[0_4px_16px_-6px_rgba(26,26,46,0.06)] flex justify-between items-start gap-4 transition-all duration-200">
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#1A1A2E]/40 mb-1.5">{p.q}</p>
                            <p className="text-[15px] font-semibold text-[#1A1A2E] leading-snug">{p.a}</p>
                          </div>
                          <button
                            onClick={() => togglePromptLike(key)}
                            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-200 active:scale-[0.94] ${
                              isLiked
                                ? 'bg-gradient-to-br from-[#FF6B9D] to-[#FF6B9D]/80 text-white shadow-[0_2px_8px_-2px_rgba(255,107,157,0.4)]'
                                : 'bg-[#1A1A2E]/5 text-[#1A1A2E]/35 border border-[#1A1A2E]/6'
                            }`}
                            aria-label={`Like ${currentProfile.name}'s answer to "${p.q}"`}
                            aria-pressed={Boolean(isLiked)}
                          >
                            <Ic.Heart filled={isLiked} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inline action error */}
      {actionError && (
        <div role="alert" className="flex-shrink-0 z-30 mx-6 mb-1 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5]/60 px-4 py-2.5 text-[13px] font-medium text-[#B91C1C] flex items-center justify-between gap-3">
          <span className="min-w-0">{actionError}</span>
          <button onClick={() => setActionError(null)} aria-label="Dismiss error" className="flex-shrink-0 text-[#B91C1C]/60 active:opacity-60">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex-shrink-0 flex justify-center items-center gap-4 pt-1 mb-2 pb-[calc(4.65rem+env(safe-area-inset-bottom,0px))] px-6 z-20">
        <button
          onClick={() => setSafetySheetOpen(true)}
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/90 border border-[#1A1A2E]/8 shadow-[0_2px_8px_-4px_rgba(26,26,46,0.06)] transition-transform duration-200 active:scale-[0.94]"
          aria-label={`Report or block ${currentProfile.name}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1A1A2E" className="opacity-60">
            <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>

        <button
          onClick={() => handleAction('pass')}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white border-2 border-[#1A1A2E]/10 shadow-[0_2px_8px_-4px_rgba(26,26,46,0.06)] transition-transform duration-200 active:scale-[0.94]"
          aria-label={`Pass on ${currentProfile.name}`}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <button
          onClick={() => handleAction('like')}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#F43F5E] hover:bg-[#E11D48] shadow-[0_8px_24px_-6px_rgba(244,63,94,0.5)] transition-transform duration-200 active:scale-90 cursor-pointer"
          aria-label={`Like ${currentProfile.name}`}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="text-white drop-shadow-sm">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>

        <button
          onClick={() => router.push('/messages')}
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/90 border border-[#1A1A2E]/8 shadow-[0_2px_8px_-4px_rgba(26,26,46,0.06)] transition-transform duration-200 active:scale-90 cursor-pointer"
          aria-label="Go to messages"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* SAFETY SHEET */}
      {safetySheetOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Safety options for ${currentProfile.name}`}
          onClick={() => !reportSubmitting && setSafetySheetOpen(false)}
        >
          <div
            className="w-full max-w-[440px] sm:max-w-[400px] bg-[#FAFAF7] rounded-t-[28px] sm:rounded-[28px] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] animate-popover-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pb-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-[#1A1A2E]/15" />
            </div>
            <h2 className="text-[17px] font-extrabold text-[#1A1A2E] mb-1">Report {currentProfile.name}</h2>
            <p className="text-[13px] text-[#1A1A2E]/55 mb-4">
              They won&apos;t be told. We&apos;ll also stop showing you this person.
            </p>

            <div className="space-y-2 mb-4">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.value}
                  disabled={reportSubmitting}
                  onClick={() => handleReport(r.value)}
                  className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-white border border-[#1A1A2E]/8 text-left text-[14px] font-medium text-[#1A1A2E] active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              disabled={reportSubmitting}
              onClick={handleBlock}
              className="w-full min-h-[48px] py-3 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5]/60 text-[14px] font-bold text-[#B91C1C] active:scale-[0.98] transition-transform disabled:opacity-50 mb-2"
            >
              Block without reporting
            </button>
            <button
              disabled={reportSubmitting}
              onClick={() => setSafetySheetOpen(false)}
              className="w-full min-h-[48px] py-3 text-[14px] font-semibold text-[#1A1A2E]/50 active:opacity-60 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MATCH CELEBRATION */}
      {matchedUser && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-xl p-6 animate-popover-enter"
          role="dialog"
          aria-modal="true"
          aria-label="It's a match"
        >
          <div className="w-full max-w-[360px] rounded-[28px] bg-white p-8 text-center shadow-2xl flex flex-col items-center">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#F43F5E] bg-[#FFF0F4] border border-[#F9C0D0]/60 px-4 py-1.5 rounded-full">✨ New Connection</div>
            <h2 className="text-[30px] font-extrabold text-[#1A1A2E] mb-1 tracking-tight">It&apos;s a Match!</h2>
            <p className="text-[14px] text-[#1A1A2E]/60 mb-8">
              You and {matchedUser.name ? matchedUser.name.split(' ')[0] : 'your match'} liked each other.
            </p>

            <div className="relative mb-8 flex items-center justify-center">
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-[3px] border-white shadow-md z-10 -mr-5">
                <SafeImage src={myPhoto ?? undefined} name={myName} alt="Your profile photo" className="h-full w-full object-cover" />
              </div>
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-[3px] border-white shadow-md z-0">
                <SafeImage src={matchedUser.photo ?? undefined} name={matchedUser.name} alt={`${matchedUser.name}'s profile photo`} className="h-full w-full object-cover" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-[#F43F5E] text-white shadow-md animate-bounce">
                <Ic.Heart filled />
              </div>
            </div>

            <div className="w-full space-y-3">
              <PrimaryButton onClick={() => {
                // Consume our own history entry before navigating, otherwise the
                // rewind would fire after the route change and bounce the user back.
                pushedOverlayRef.current = false;
                closingFromPopRef.current = true;
                setMatchedUser(null);
                router.push('/messages');
              }}>
                Send a Message
              </PrimaryButton>
              <button
                onClick={() => setMatchedUser(null)}
                className="w-full min-h-[44px] py-3 text-[14px] font-semibold text-[#1A1A2E]/50 transition-opacity active:opacity-60"
              >
                Keep Discovering
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

/* ─────────────────────────────────────────────────
   SHELL — shared page frame across every state
───────────────────────────────────────────────── */
function Shell({ children, select = '' }: { children: React.ReactNode; select?: string }) {
  return (
    <div className={`h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans ${select}`}>
      <style>{DISCOVER_STYLES}</style>
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   TOPBAR
───────────────────────────────────────────────── */
function TopBar() {
  const { openNotifications, unreadCount } = useNotifications();

  return (
    <header className="flex items-center justify-between rounded-2xl border border-white/75 bg-white/70 px-5 py-2.5 shadow-[0_6px_24px_-8px_rgba(26,26,46,0.08)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] text-white shadow-[0_4px_12px_-2px_rgba(255,107,157,0.35)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <span className="text-[17px] font-extrabold tracking-tight text-[#1A1A2E] leading-none block">Dil Se</span>
      </div>
      <button
        onClick={openNotifications}
        aria-label={unreadCount > 0 ? `Open notifications, ${unreadCount} unread` : 'Open notifications'}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#1A1A2E]/8 bg-white/80 text-[#1A1A2E]/60 shadow-[0_1px_4px_-2px_rgba(26,26,46,0.04)] transition-transform duration-200 active:scale-[0.94] cursor-pointer"
      >
        <Ic.Bell />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] text-[8px] font-bold text-white ring-[2.5px] ring-white shadow-sm px-1">
            {unreadCount}
          </span>
        )}
      </button>
    </header>
  );
}
