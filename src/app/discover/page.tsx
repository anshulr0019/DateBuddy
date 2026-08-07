'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ic } from '../components/icons';
import BrandLogo from '../components/BrandLogo';
import { AuroraBackground, SafeImage, PrimaryButton } from '../components/shared';
import { useNotifications } from '../context/NotificationContext';
import {
  type FeedProfile,
  getCachedFeed,
  setCachedFeed,
  markCacheFresh,
  isCacheStale,
  loadFeedPage,
  preloadDeckImages,
} from '../lib/feedCache';
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning } from '../lib/haptics';
import { useFilters } from '../context/FilterContext';

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
const REDUCED_EXIT_MS = 160;
const REFILL_THRESHOLD = 3;

/* Drag physics */
const STAMP_DRAG_RANGE_PX = 90;     // drag distance at which LIKE/NOPE reach full opacity
const COMMIT_DISTANCE_RATIO = 0.32; // fraction of card width that commits a swipe on release
const COMMIT_VELOCITY = 0.55;       // px/ms fling that commits a swipe below the distance threshold

const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'fake', label: 'Fake profile' },
  { value: 'photos', label: 'Photos are not of this person' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'other', label: 'Something else' },
] as const;

type Profile = FeedProfile;

type MatchedUser = { id: number; name: string; photo: string | null };

type Status = 'loading' | 'ready' | 'error';

type SwipeAction = 'like' | 'pass' | 'super_like';
type ExitDir = 'left' | 'right' | 'up';
type SwipeResponse = { unauthorized?: boolean; isMatch?: boolean; matchedUser?: MatchedUser | null };
type LastSwipe = { profile: Profile; action: SwipeAction; promise: Promise<SwipeResponse> };

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  cardW: number;
  grabTop: boolean;
  locked: boolean;
  dx: number;
  dy: number;
  crossedThreshold: boolean;
  samples: { t: number; x: number; y: number }[];
};

export default function DiscoverPage() {
  const router = useRouter();

  // Seed from the navigation-surviving cache so re-entering Discover
  // (or entering after the nav prefetch landed) renders instantly.
  const [profiles, setProfiles] = useState<Profile[]>(() => getCachedFeed()?.profiles ?? []);
  const [status, setStatus] = useState<Status>(() =>
    (getCachedFeed()?.profiles.length ?? 0) > 0 ? 'ready' : 'loading'
  );
  const [nextCursor, setNextCursor] = useState<number | null>(() => getCachedFeed()?.nextCursor ?? null);
  const [hasMore, setHasMore] = useState(() => getCachedFeed()?.hasMore ?? true);

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [exit, setExit] = useState<{ dir: ExitDir; viaDrag: boolean } | null>(null);
  const [enterAnim, setEnterAnim] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [cardKey, setCardKey] = useState(0);
  const [lastSwipe, setLastSwipe] = useState<LastSwipe | null>(null);
  const [undoBusy, setUndoBusy] = useState(false);

  const [matchedUser, setMatchedUser] = useState<MatchedUser | null>(null);
  const [myPhoto, setMyPhoto] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>('You');

  const [likedPrompts, setLikedPrompts] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const [safetySheetOpen, setSafetySheetOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const underCardRef = useRef<HTMLDivElement>(null);
  const likeStampRef = useRef<HTMLDivElement>(null);
  const nopeStampRef = useRef<HTMLDivElement>(null);
  const swipeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitLockRef = useRef(false);
  const pendingAdvanceRef = useRef<{ id: number } | null>(null);
  const matchedIdsRef = useRef<Set<number>>(new Set());
  const dragRef = useRef<DragState | null>(null);
  const didDragRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const fetchingRef = useRef(false);

  const currentProfile = profiles[0];

  const loadFeed = useCallback(async (cursor: number | null) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      // First-page loads are deduped with the nav prefetch inside loadFeedPage.
      const result = await loadFeedPage(cursor);

      if (result.kind === 'unauthorized') {
        router.replace('/welcome');
        return;
      }
      if (result.kind === 'error') throw new Error('Could not load profiles');

      const incoming: Profile[] = result.profiles;
      setProfiles((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        return [...prev, ...incoming.filter((p) => !existingIds.has(p.id))];
      });
      setNextCursor(result.nextCursor);
      setHasMore(result.nextCursor !== null && incoming.length > 0);
      setStatus('ready');
      markCacheFresh();
      preloadDeckImages(incoming);
    } catch {
      // Only surface a full-page error when there is nothing to show.
      setStatus((prev) => (prev === 'ready' ? 'ready' : 'error'));
    } finally {
      fetchingRef.current = false;
    }
  }, [router]);

  useEffect(() => {
    // Cache hit: skip the network entirely unless the deck is stale,
    // in which case refresh in the background (dedup keeps it safe —
    // already-swiped people are excluded server-side).
    if (profiles.length > 0) {
      if (isCacheStale()) loadFeed(null);
      return;
    }
    loadFeed(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadFeed]);

  // Keep the cache in sync with the live deck so leaving and returning
  // resumes exactly where the user left off.
  useEffect(() => {
    if (status !== 'ready') return;
    setCachedFeed({ profiles, nextCursor, hasMore });
  }, [status, profiles, nextCursor, hasMore]);

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

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  /* Drag visuals write straight to the DOM — they run on every pointer
     frame, and a React render per frame would drop the deck to jank. */
  const setDragVisuals = useCallback((dx: number, dy: number, grabTop: boolean, cardW: number) => {
    const card = scrollRef.current;
    if (card) {
      const rot = (dx / cardW) * 14 * (grabTop ? 1 : -1);
      card.style.transition = 'none';
      card.style.transform = `translate3d(${dx}px, ${dy * 0.35}px, 0) rotate(${rot}deg)`;
    }
    const progress = Math.min(Math.abs(dx) / STAMP_DRAG_RANGE_PX, 1);
    const like = likeStampRef.current;
    const nope = nopeStampRef.current;
    if (like) { like.style.transition = 'none'; like.style.opacity = dx > 0 ? String(progress) : '0'; }
    if (nope) { nope.style.transition = 'none'; nope.style.opacity = dx < 0 ? String(progress) : '0'; }
    const under = underCardRef.current;
    if (under && !reducedMotionRef.current) {
      under.style.transition = 'none';
      under.style.transform = `scale(${0.96 + 0.04 * progress}) translateY(${8 * (1 - progress)}px)`;
    }
  }, []);

  const resetDragVisuals = useCallback((animate: boolean) => {
    const card = scrollRef.current;
    if (card) {
      card.style.transition = animate ? 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none';
      card.style.transform = '';
      card.style.opacity = '';
      card.style.willChange = '';
    }
    for (const stamp of [likeStampRef.current, nopeStampRef.current]) {
      if (stamp) { stamp.style.transition = ''; stamp.style.opacity = ''; }
    }
    const under = underCardRef.current;
    if (under) {
      under.style.transition = animate ? 'transform 0.3s ease-out' : 'none';
      under.style.transform = 'scale(0.96) translateY(8px)';
    }
  }, []);

  /* Optimistic swipe: the card leaves on animation time, never network
     time. The request runs in the background; a failure puts the card
     back on top of the deck with an error. */
  const commitSwipe = useCallback((action: SwipeAction, viaDrag: boolean) => {
    if (exitLockRef.current) return;
    const target = profiles[0];
    if (!target) return;

    exitLockRef.current = true;
    setActionError(null);
    hapticMedium();
    const dir: ExitDir = action === 'pass' ? 'left' : action === 'super_like' ? 'up' : 'right';
    setExit({ dir, viaDrag });

    const promise: Promise<SwipeResponse> = fetch('/api/swipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swipedUserId: target.id, action }),
    }).then(async (res) => {
      if (res.status === 401) {
        router.replace('/welcome');
        return { unauthorized: true };
      }
      if (!res.ok) throw new Error(`Swipe failed (${res.status})`);
      return res.json();
    });

    promise
      .then((data) => {
        if (data.unauthorized) return;
        if (data.isMatch && data.matchedUser) {
          // Matches can't be undone — the other person already sees it.
          matchedIdsRef.current.add(target.id);
          setLastSwipe((cur) => (cur && cur.profile.id === target.id ? null : cur));
          setMatchedUser(data.matchedUser);
          hapticSuccess();
        }
      })
      .catch(() => {
        hapticWarning();
        if (pendingAdvanceRef.current?.id === target.id) {
          // Failed before the card left the deck — cancel the advance in place.
          if (swipeTimerRef.current) clearTimeout(swipeTimerRef.current);
          pendingAdvanceRef.current = null;
          setExit(null);
          resetDragVisuals(false);
          setEnterAnim(true);
          setCardKey((k) => k + 1);
          exitLockRef.current = false;
        } else {
          // Already advanced — put them back on top (or next-in-deck if
          // another card is mid-exit, to avoid yanking it away).
          setProfiles((prev) => {
            if (prev.some((p) => p.id === target.id)) return prev;
            if (exitLockRef.current && prev.length > 0) return [prev[0], target, ...prev.slice(1)];
            return [target, ...prev];
          });
          setLastSwipe((cur) => (cur && cur.profile.id === target.id ? null : cur));
          if (!exitLockRef.current) {
            setCurrentPhotoIndex(0);
            setScrollProgress(0);
            setEnterAnim(true);
            setCardKey((k) => k + 1);
          }
        }
        setActionError('Something went wrong. Check your connection and try again.');
      });

    pendingAdvanceRef.current = { id: target.id };
    swipeTimerRef.current = setTimeout(() => {
      pendingAdvanceRef.current = null;
      setExit(null);
      setCurrentPhotoIndex(0);
      setScrollProgress(0);
      // Drag exits already promoted the next card to full size, so the
      // incoming top card renders in place; button exits play the enter.
      setEnterAnim(!viaDrag);
      setCardKey((k) => k + 1);
      setProfiles((prev) => prev.filter((p) => p.id !== target.id));
      setLastSwipe(matchedIdsRef.current.has(target.id) ? null : { profile: target, action, promise });
      exitLockRef.current = false;
    }, reducedMotionRef.current ? REDUCED_EXIT_MS : SWIPE_ANIMATION_MS);
  }, [profiles, router, resetDragVisuals]);

  const togglePromptLike = useCallback((promptKey: string) => {
    if (exitLockRef.current) return;
    const willLike = !likedPrompts[promptKey];
    setLikedPrompts((prev) => ({ ...prev, [promptKey]: willLike }));
    if (willLike) commitSwipe('like', false);
  }, [likedPrompts, commitSwipe]);

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
      setEnterAnim(true);
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
      setEnterAnim(true);
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

  /* ---- Drag gesture ----
     touch-action: pan-y keeps vertical scrolling native; horizontal
     movement is ours. The gesture locks to one axis on first intent:
     horizontal → drag the card, vertical → hand the pointer back to
     the scroller (the browser then fires pointercancel). */
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (exitLockRef.current || overlayOpen || dragRef.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    didDragRef.current = false;
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      cardW: e.currentTarget.clientWidth || 1,
      grabTop: e.clientY - rect.top < rect.height / 2,
      locked: false,
      dx: 0,
      dy: 0,
      crossedThreshold: false,
      samples: [{ t: performance.now(), x: e.clientX, y: e.clientY }],
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.locked) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) + 4) {
        drag.locked = true;
        didDragRef.current = true; // suppresses the trailing click on photo tap zones
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* unsupported */ }
        const card = scrollRef.current;
        if (card) {
          card.style.willChange = 'transform';
          card.style.animation = 'none'; // a drag interrupts the enter animation
        }
      } else if (Math.abs(dy) > 12) {
        dragRef.current = null; // vertical intent — the native scroller owns it
        return;
      } else {
        return;
      }
    }

    drag.dx = dx;
    drag.dy = dy;
    drag.samples.push({ t: performance.now(), x: e.clientX, y: e.clientY });
    if (drag.samples.length > 8) drag.samples.shift();

    setDragVisuals(dx, dy, drag.grabTop, drag.cardW);

    const past = Math.abs(dx) >= STAMP_DRAG_RANGE_PX;
    if (past && !drag.crossedThreshold) {
      drag.crossedThreshold = true;
      hapticLight();
    } else if (!past) {
      drag.crossedThreshold = false;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    if (!drag.locked) return;

    const { dx, dy, cardW, grabTop, samples } = drag;
    const now = performance.now();
    const recent = samples.filter((s) => now - s.t < 120);
    const first = recent[0] ?? samples[0];
    const last = samples[samples.length - 1];
    const dt = Math.max(last.t - first.t, 1);
    const vx = (last.x - first.x) / dt;
    const vy = (last.y - first.y) / dt;

    const shouldCommit =
      Math.abs(dx) > cardW * COMMIT_DISTANCE_RATIO ||
      (Math.abs(vx) > COMMIT_VELOCITY && Math.sign(vx) === Math.sign(dx) && Math.abs(dx) > 24);

    if (!shouldCommit) {
      resetDragVisuals(!reducedMotionRef.current);
      return;
    }

    // Fling the card along the release trajectory, then commit.
    const card = scrollRef.current;
    const stamp = dx > 0 ? likeStampRef.current : nopeStampRef.current;
    if (stamp) stamp.style.opacity = '1';
    if (card) {
      if (reducedMotionRef.current) {
        card.style.transition = 'opacity 0.15s ease';
        card.style.opacity = '0';
      } else {
        const flyX = Math.sign(dx) * cardW * 1.45;
        const flyY = dy * 0.35 + Math.max(-140, Math.min(200, vy * 120));
        const rot = (flyX / cardW) * 16 * (grabTop ? 1 : -1);
        card.style.transition = `transform ${SWIPE_ANIMATION_MS}ms cubic-bezier(0.22, 0.7, 0.4, 1), opacity ${SWIPE_ANIMATION_MS}ms ease-in`;
        card.style.transform = `translate3d(${flyX}px, ${flyY}px, 0) rotate(${rot}deg)`;
        card.style.opacity = '0';
      }
    }
    const under = underCardRef.current;
    if (under && !reducedMotionRef.current) {
      under.style.transition = `transform ${SWIPE_ANIMATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`;
      under.style.transform = 'scale(1) translateY(0px)';
    }
    commitSwipe(dx > 0 ? 'like' : 'pass', true);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    if (drag.locked) resetDragVisuals(!reducedMotionRef.current);
  };

  /* ---- Undo ---- */
  const handleUndo = async () => {
    const record = lastSwipe;
    if (!record || undoBusy || exitLockRef.current) return;
    setUndoBusy(true);
    setActionError(null);
    try {
      // If the original swipe never landed, its rollback already restored the card.
      const original = await record.promise.catch(() => null);
      if (!original || original.unauthorized) {
        setLastSwipe((cur) => (cur === record ? null : cur));
        return;
      }
      const res = await fetch('/api/swipes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swipedUserId: record.profile.id }),
      });
      if (res.status === 401) {
        router.replace('/welcome');
        return;
      }
      if (!res.ok) {
        let message = 'Couldn’t undo that swipe. Please try again.';
        try {
          const data = await res.json();
          if (data?.message) message = data.message;
        } catch { /* keep the default copy */ }
        setActionError(message);
        if (res.status === 409) setLastSwipe((cur) => (cur === record ? null : cur));
        return;
      }
      hapticLight();
      setProfiles((prev) => (prev.some((p) => p.id === record.profile.id) ? prev : [record.profile, ...prev]));
      setLastSwipe((cur) => (cur === record ? null : cur));
      setCurrentPhotoIndex(0);
      setScrollProgress(0);
      setEnterAnim(true);
      setCardKey((k) => k + 1);
    } catch {
      setActionError('Couldn’t undo that swipe. Please try again.');
    } finally {
      setUndoBusy(false);
    }
  };

  // Preload the next photo so advancing never shows a blank frame.
  useEffect(() => {
    const next = currentProfile?.photos?.[currentPhotoIndex + 1];
    if (next) {
      const img = new Image();
      img.src = next;
    }
  }, [currentProfile, currentPhotoIndex]);

  // Preload the next card's first photo so swiping never shows a blank card.
  useEffect(() => {
    const upcoming = profiles[1]?.photos?.[0];
    if (upcoming) {
      const img = new Image();
      img.src = upcoming;
    }
  }, [profiles]);

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
        <div className="flex-shrink-0 flex justify-center items-center gap-2.5 sm:gap-4 pt-1 mb-2 pb-[calc(4.65rem+env(safe-area-inset-bottom,0px))] px-6 z-20">
          <div className="h-12 w-12 rounded-full animate-skeleton" />
          <div className="h-16 w-16 rounded-full animate-skeleton" />
          <div className="h-14 w-14 rounded-full animate-skeleton" />
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

      {/* CARD STACK */}
      <div className="relative flex-1 min-h-0 z-10 mx-6 my-1.5">

      {/* Next card peeking from behind — scales up as the top card is dragged away */}
      {profiles[1] && (
        <div
          key={profiles[1].id}
          ref={underCardRef}
          aria-hidden
          className="absolute inset-0 rounded-[28px] border border-white/80 shadow-[0_12px_40px_-12px_rgba(26,26,46,0.15)] overflow-hidden bg-white pointer-events-none"
          style={{ transform: 'scale(0.96) translateY(8px)' }}
        >
          <SafeImage
            eager
            src={profiles[1].photos[0]}
            name={profiles[1].name}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent pt-16 pb-11 px-6">
            <h2 className="text-[26px] sm:text-[30px] font-extrabold leading-[1.1] text-white tracking-tight drop-shadow-lg">
              {profiles[1].name}, {profiles[1].age}
            </h2>
          </div>
        </div>
      )}

      {/* TOP CARD — scrollable profile, horizontally draggable */}
      <div
        key={cardKey}
        ref={scrollRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onDragStart={(e) => e.preventDefault()}
        className={`absolute inset-0 overflow-y-auto overflow-x-hidden rounded-[28px] scrollbar-none touch-pan-y ${
          exit
            ? exit.viaDrag
              ? '' // drag exits fly on inline styles that keep the release trajectory
              : exit.dir === 'right' ? 'animate-card-swipe-right'
                : exit.dir === 'left' ? 'animate-card-swipe-left'
                : 'animate-card-swipe-up'
            : enterAnim ? 'animate-card-depth-enter' : ''
        }`}
      >
        <div className="relative min-h-full rounded-[28px] border border-white/80 shadow-[0_12px_40px_-12px_rgba(26,26,46,0.15)] overflow-hidden bg-white flex flex-col">

          {/* Hero photo */}
          <div
            className="relative w-full flex-shrink-0 overflow-hidden"
            style={{ height: 'calc(100dvh - 240px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))', minHeight: '380px' }}
          >
            <SafeImage
              eager
              src={currentProfile.photos[currentPhotoIndex]}
              name={currentProfile.name}
              alt={`${currentProfile.name}'s profile photo`}
              className="absolute inset-0 h-full w-full object-cover select-none transition-[filter,transform] duration-200 [-webkit-touch-callout:none]"
              style={{
                filter: `blur(${blurAmount}px)`,
                transform: `scale(${1 + scrollProgress * 0.05})`,
              }}
              onClick={(e) => {
                if (didDragRef.current) return; // a drag release is not a tap
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const maxPhotos = currentProfile.photos.length || 1;
                if (maxPhotos < 2) return;
                hapticLight();
                if (clickX > rect.width / 2) {
                  setCurrentPhotoIndex((prev) => (prev + 1) % maxPhotos);
                } else {
                  setCurrentPhotoIndex((prev) => (prev - 1 + maxPhotos) % maxPhotos);
                }
              }}
            />

            {/* Swipe stamps — opacity tracks drag progress (inline, via refs)
                and snaps to full on button-triggered exits (via class). */}
            <div
              ref={likeStampRef}
              className={`absolute top-12 left-6 z-30 -rotate-12 border-4 border-[#22C55E] text-[#22C55E] bg-black/30 backdrop-blur-xs font-black text-[28px] uppercase tracking-wider px-4 py-1.5 rounded-2xl shadow-xl pointer-events-none transition-opacity duration-150 ${
                exit && !exit.viaDrag && exit.dir === 'right' ? 'opacity-100' : 'opacity-0'
              }`}
            >
              LIKE
            </div>
            <div
              ref={nopeStampRef}
              className={`absolute top-12 right-6 z-30 rotate-12 border-4 border-[#F43F5E] text-[#FF8FA3] bg-black/30 backdrop-blur-xs font-black text-[28px] uppercase tracking-wider px-4 py-1.5 rounded-2xl shadow-xl pointer-events-none transition-opacity duration-150 ${
                exit && !exit.viaDrag && exit.dir === 'left' ? 'opacity-100' : 'opacity-0'
              }`}
            >
              NOPE
            </div>
            <div
              className={`absolute bottom-24 left-1/2 -translate-x-1/2 z-30 border-4 border-[#7B68EE] text-[#DDD6FE] bg-black/30 backdrop-blur-xs font-black text-[24px] uppercase tracking-wider px-4 py-1.5 rounded-2xl shadow-xl pointer-events-none transition-opacity duration-150 whitespace-nowrap ${
                exit?.dir === 'up' ? 'opacity-100' : 'opacity-0'
              }`}
            >
              SUPER LIKE
            </div>

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

      {/* ACTION BUTTONS — sized like Tinder/Hinge: pass < super < like > undo/report */}
      <div className="flex-shrink-0 flex justify-center items-center gap-3 sm:gap-4 pt-1 mb-2 pb-[calc(4.65rem+env(safe-area-inset-bottom,0px))] px-6 z-20">
        {/* Report / more */}
        <button
          onClick={() => setSafetySheetOpen(true)}
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/90 border border-[#1A1A2E]/8 shadow-[0_4px_12px_-6px_rgba(26,26,46,0.10)] transition-all duration-200 active:scale-[0.90] hover:shadow-[0_6px_20px_-8px_rgba(26,26,46,0.15)]"
          aria-label={`Report or block ${currentProfile.name}`}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="#1A1A2E" className="opacity-50">
            <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>

        {/* Pass — smaller; muted since it's a negative action */}
        <button
          onClick={() => commitSwipe('pass', false)}
          className="relative flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white border-2 border-[#1A1A2E]/10 shadow-[0_4px_16px_-8px_rgba(26,26,46,0.10)] transition-all duration-200 active:scale-[0.90] hover:border-[#F43F5E]/30 hover:shadow-[0_6px_20px_-8px_rgba(244,63,94,0.20)]"
          aria-label={`Pass on ${currentProfile.name}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-55">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Super Like — elevated center position */}
        <button
          onClick={() => commitSwipe('super_like', false)}
          className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#7B68EE] shadow-[0_8px_28px_-8px_rgba(123,104,238,0.55)] transition-all duration-200 active:scale-[0.90] hover:bg-[#6A5AE0] hover:shadow-[0_10px_32px_-8px_rgba(123,104,238,0.65)] cursor-pointer"
          aria-label={`Super Like ${currentProfile.name}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white drop-shadow-sm">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>

        {/* Like — largest; positive primary action */}
        <button
          onClick={() => commitSwipe('like', false)}
          className="relative flex h-[66px] w-[66px] items-center justify-center rounded-full bg-gradient-to-br from-[#F43F5E] to-[#FB7185] shadow-[0_8px_28px_-8px_rgba(244,63,94,0.6)] transition-all duration-200 active:scale-[0.90] hover:shadow-[0_10px_32px_-8px_rgba(244,63,94,0.7)] cursor-pointer"
          aria-label={`Like ${currentProfile.name}`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-white drop-shadow-sm">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>

        {/* Undo */}
        <button
          onClick={handleUndo}
          disabled={!lastSwipe || undoBusy}
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/90 border border-[#1A1A2E]/8 shadow-[0_4px_12px_-6px_rgba(26,26,46,0.10)] transition-all duration-200 active:scale-[0.90] disabled:opacity-35 disabled:active:scale-100 cursor-pointer disabled:cursor-default"
          aria-label="Undo last swipe"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-55">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
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
            className="w-full max-w-[440px] sm:max-w-[400px] bg-[#FAFAF7] rounded-t-[28px] sm:rounded-[28px] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] animate-sheet-up"
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
          <div className="w-full max-w-[360px] rounded-[32px] bg-white p-8 text-center shadow-2xl flex flex-col items-center overflow-hidden">
            {/* Ambient gradient behind the card */}
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[32px] overflow-hidden">
              <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-[#FF6B9D]/12 blur-[40px]" />
              <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-[#7B68EE]/12 blur-[40px]" />
            </div>

            <div className="relative mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#F43F5E] bg-[#FFF0F4] border border-[#F9C0D0]/60 px-4 py-1.5 rounded-full animate-scale-pop">
              ✨ New Connection
            </div>
            <h2 className="text-[32px] font-extrabold text-[#1A1A2E] mb-1 tracking-tight leading-tight">
              It&apos;s a Match!
            </h2>
            <p className="text-[14px] text-[#1A1A2E]/60 mb-8">
              You and {matchedUser.name ? matchedUser.name.split(' ')[0] : 'your match'} liked each other 💕
            </p>

            {/* Avatar pair with animated heart */}
            <div className="relative mb-8 flex items-center justify-center">
              {/* Pulse rings behind heart */}
              <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-14 w-14 rounded-full bg-[#F43F5E]/20 animate-pulse-ring" />
              <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-14 w-14 rounded-full bg-[#F43F5E]/15 animate-pulse-ring" style={{ animationDelay: '0.22s' }} />

              <div className="relative h-28 w-28 overflow-hidden rounded-full border-[3px] border-white shadow-lg z-20 -mr-5 ring-2 ring-[#F43F5E]/20">
                <SafeImage src={myPhoto ?? undefined} name={myName} alt="Your profile photo" className="h-full w-full object-cover" />
              </div>
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-[3px] border-white shadow-lg z-20 ring-2 ring-[#7B68EE]/20">
                <SafeImage src={matchedUser.photo ?? undefined} name={matchedUser.name} alt={`${matchedUser.name}'s profile photo`} className="h-full w-full object-cover" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#F43F5E] to-[#FF7B8F] text-white shadow-[0_4px_16px_-4px_rgba(244,63,94,0.5)] animate-scale-pop">
                <Ic.Heart filled />
              </div>
            </div>

            <div className="relative w-full space-y-3 z-10">
              <PrimaryButton onClick={() => {
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
  const { openFilters, activeFilterCount } = useFilters();

  return (
    <header className="flex items-center justify-between rounded-2xl border border-white/75 bg-white/70 px-5 py-2.5 shadow-[0_6px_24px_-8px_rgba(26,26,46,0.08)] backdrop-blur-xl">
      <BrandLogo
        size={34}
        withWordmark
        wordmarkClassName="text-[17px] font-extrabold tracking-tight text-[#1A1A2E] leading-none"
      />
      <div className="flex items-center gap-2">
        {/* Filters / Discovery Preferences */}
        <button
          onClick={openFilters}
          aria-label={activeFilterCount > 0 ? `Open filters, ${activeFilterCount} active` : 'Open filters'}
          className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#1A1A2E]/8 bg-white/80 text-[#1A1A2E]/60 shadow-[0_1px_4px_-2px_rgba(26,26,46,0.04)] transition-transform duration-200 active:scale-[0.94] cursor-pointer"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] text-[9px] font-bold text-white ring-[2px] ring-white shadow-sm px-1">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Notifications */}
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
      </div>
    </header>
  );
}
