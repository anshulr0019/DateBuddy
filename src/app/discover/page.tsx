'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import styles from './discover.module.css';
import DiscoverProfileCard from './components/DiscoverProfileCard';
import DiscoverActionBar from './components/DiscoverActionBar';
import { useRouter } from 'next/navigation';
import { Ic } from '../components/icons';
import { MatchScreen } from '../components/MatchScreen';
import { useNotifications } from '../context/NotificationContext';
import {
  type FeedProfile,
  type FeedFilters,
  getCachedFeed,
  setCachedFeed,
  markCacheFresh,
  isCacheStale,
  loadFeedPage,
  preloadDeckImages,
} from '../lib/feedCache';
import { hapticLight, hapticMedium, hapticWarning } from '../lib/haptics';
import { useFilters } from '../context/FilterContext';

const SWIPE_ANIMATION_MS = 260;
const REDUCED_EXIT_MS = 160;
const REFILL_THRESHOLD = 3;

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
type SwipeResponse = { unauthorized?: boolean; limitReached?: boolean; message?: string; isMatch?: boolean; matchedUser?: MatchedUser | null };
type LastSwipe = { profile: Profile; action: SwipeAction; promise: Promise<SwipeResponse> };

export default function DiscoverPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();

  const { filters, openFilters } = useFilters();
  const feedFilters: FeedFilters = useMemo(() => ({
    ageMin: filters.ageMin,
    ageMax: filters.ageMax,
    verifiedOnly: filters.verifiedOnly,
  }), [filters.ageMin, filters.ageMax, filters.verifiedOnly]);
  const filtersKey = JSON.stringify(feedFilters);
  const [deckFiltersKey, setDeckFiltersKey] = useState(filtersKey);

  // Seed from the navigation-surviving cache so re-entering Discover
  // (or entering after the nav prefetch landed) renders instantly.
  const [profiles, setProfiles] = useState<Profile[]>(() => getCachedFeed(feedFilters)?.profiles ?? []);
  const [status, setStatus] = useState<Status>(() =>
    getCachedFeed(feedFilters) ? 'ready' : 'loading'
  );
  const [nextCursor, setNextCursor] = useState<number | null>(() => getCachedFeed(feedFilters)?.nextCursor ?? null);
  const [hasMore, setHasMore] = useState(() => getCachedFeed(feedFilters)?.hasMore ?? true);

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [exit, setExit] = useState<{ dir: ExitDir; viaDrag: boolean } | null>(null);
  const [enterAnim, setEnterAnim] = useState(true);
  const [cardKey, setCardKey] = useState(0);
  const [lastSwipe, setLastSwipe] = useState<LastSwipe | null>(null);
  const [undoBusy, setUndoBusy] = useState(false);

  const [matchedUser, setMatchedUser] = useState<MatchedUser | null>(null);
  const [myPhoto, setMyPhoto] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>('You');

  const [likedPrompts, setLikedPrompts] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [feedError, setFeedError] = useState(false);

  const [safetySheetOpen, setSafetySheetOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const swipeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitLockRef = useRef(false);
  const pendingAdvanceRef = useRef<{ id: number } | null>(null);
  const matchedIdsRef = useRef<Set<number>>(new Set());
  const reducedMotionRef = useRef(false);
  const requestRef = useRef<{ key: string } | null>(null);
  const activeFiltersRef = useRef(filtersKey);
  activeFiltersRef.current = filtersKey;

  const currentProfile = profiles[0];

  const loadFeed = useCallback(async (cursor: number | null) => {
    if (requestRef.current?.key === filtersKey) return;
    const request = { key: filtersKey };
    requestRef.current = request;
    setFeedError(false);
    try {
      // First-page loads are deduped with the nav prefetch inside loadFeedPage.
      const result = await loadFeedPage(cursor, feedFilters);
      if (requestRef.current !== request || activeFiltersRef.current !== filtersKey) return;

      if (result.kind === 'unauthorized') {
        router.replace('/welcome');
        return;
      }
      if (result.kind === 'error') throw new Error('Could not load profiles');

      const incoming: Profile[] = result.profiles;
      setProfiles((prev) => {
        // On first-page refresh (cursor === null) drop the stale deck
        if (cursor === null) return incoming;
        const existingIds = new Set(prev.map((p) => p.id));
        return [...prev, ...incoming.filter((p) => !existingIds.has(p.id))];
      });
      setNextCursor(result.nextCursor);
      setHasMore(result.nextCursor !== null && incoming.length > 0);
      setDeckFiltersKey(filtersKey);
      setStatus('ready');
      markCacheFresh(feedFilters);
      preloadDeckImages(incoming);
    } catch {
      if (requestRef.current !== request || activeFiltersRef.current !== filtersKey) return;
      setFeedError(true);
      // Only surface a full-page error when there is nothing to show.
      setStatus((prev) => (prev === 'ready' ? 'ready' : 'error'));
    } finally {
      if (requestRef.current === request) requestRef.current = null;
    }
  }, [router, feedFilters, filtersKey]);

  useEffect(() => {
    const cached = getCachedFeed(feedFilters);
    setProfiles(cached?.profiles ?? []);
    setNextCursor(cached?.nextCursor ?? null);
    setHasMore(cached?.hasMore ?? true);
    setStatus(cached ? 'ready' : 'loading');
    setDeckFiltersKey(filtersKey);
    setCurrentPhotoIndex(0);
    setActionError(null);
    setFeedError(false);
    // Cancel the old deck's visual transition when preferences change.
    if (swipeTimerRef.current) clearTimeout(swipeTimerRef.current);
    pendingAdvanceRef.current = null;
    exitLockRef.current = false;
    setExit(null);
    if (!cached || isCacheStale(feedFilters)) void loadFeed(null);
    return () => { requestRef.current = null; };
  }, [feedFilters, filtersKey, loadFeed]);

  // Never save the previous render's profiles under newly selected filters.
  useEffect(() => {
    if (status !== 'ready' || deckFiltersKey !== filtersKey) return;
    setCachedFeed({ profiles, nextCursor, hasMore }, feedFilters);
  }, [status, profiles, nextCursor, hasMore, feedFilters, filtersKey, deckFiltersKey]);

  useEffect(() => {
    if (status === 'ready' && deckFiltersKey === filtersKey && hasMore && nextCursor !== null && profiles.length <= REFILL_THRESHOLD) {
      void loadFeed(nextCursor);
    }
  }, [status, hasMore, profiles.length, nextCursor, loadFeed, deckFiltersKey, filtersKey]);

  useEffect(() => { setCurrentPhotoIndex(0); }, [currentProfile?.id]);

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
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { reducedMotionRef.current = media.matches; };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const resetDragVisuals = useCallback((_animate: boolean) => {
    if (scrollRef.current) {
      scrollRef.current.style.transform = '';
      scrollRef.current.style.opacity = '';
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
      const data = await res.json().catch(() => ({}));
      if (res.status === 429 && data.limitReached) {
        return { limitReached: true, message: data.message };
      }
      if (!res.ok) throw new Error(`Swipe failed (${res.status})`);
      return data;
    });

    setLastSwipe({ profile: target, action, promise });

    const swipeFiltersKey = filtersKey;
    const restoreTarget = () => {
      if (activeFiltersRef.current !== swipeFiltersKey) return;
      setLastSwipe(cur => cur?.profile.id === target.id ? null : cur);
      setLikedPrompts(cur => Object.fromEntries(Object.entries(cur).filter(([key]) => !key.startsWith(`${target.id}-`))));
      if (pendingAdvanceRef.current?.id === target.id) {
        if (swipeTimerRef.current) clearTimeout(swipeTimerRef.current);
        pendingAdvanceRef.current = null;
        setExit(null);
        resetDragVisuals(false);
        setEnterAnim(true);
        setCardKey(k => k + 1);
        exitLockRef.current = false;
      } else {
        setProfiles(prev => prev.some(p => p.id === target.id) ? prev : exitLockRef.current && prev.length ? [prev[0], target, ...prev.slice(1)] : [target, ...prev]);
        if (!exitLockRef.current) {
          setCurrentPhotoIndex(0);
          setEnterAnim(true);
          setCardKey(k => k + 1);
        }
      }
    };
    promise.then(data => {
      if (data.unauthorized) return;
      if (data.limitReached) {
        restoreTarget();
        setPaywallMessage(data.message ?? "You've hit your daily limit.");
        setPaywallOpen(true);
        hapticWarning();
        return;
      }
      if (data.isMatch && data.matchedUser) {
        matchedIdsRef.current.add(target.id);
        setLastSwipe(cur => cur?.profile.id === target.id ? null : cur);
        setMatchedUser(data.matchedUser);
        const firstName = data.matchedUser.name?.split(' ')[0] ?? 'Someone';
        addNotification({ type: 'match', title: "It's a Match! 🎉", message: `You and ${firstName} liked each other. Say hi! 💬`, avatar: data.matchedUser.photo ?? undefined, actionUrl: '/messages' });
      }
    }).catch(() => {
      hapticWarning();
      restoreTarget();
      setActionError('Your decision wasn’t saved. Check your connection and try again.');
    });

    pendingAdvanceRef.current = { id: target.id };
    swipeTimerRef.current = setTimeout(() => {
      pendingAdvanceRef.current = null;
      setExit(null);
      setCurrentPhotoIndex(0);
      // Drag exits already promoted the next card to full size, so the
      // incoming top card renders in place; button exits play the enter.
      setEnterAnim(!viaDrag);
      setCardKey((k) => k + 1);
      setProfiles((prev) => prev.filter((p) => p.id !== target.id));
      exitLockRef.current = false;
    }, reducedMotionRef.current ? REDUCED_EXIT_MS : SWIPE_ANIMATION_MS);
  }, [profiles, router, resetDragVisuals, addNotification, filtersKey]);

  const togglePromptLike = useCallback((promptKey: string) => {
    if (exitLockRef.current) return;
    const willLike = !likedPrompts[promptKey];
    setLikedPrompts((prev) => ({ ...prev, [promptKey]: willLike }));
    if (willLike) commitSwipe('like', false);
  }, [likedPrompts, commitSwipe]);

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
  const overlayOpen = Boolean(matchedUser) || safetySheetOpen || paywallOpen;
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
      setPaywallOpen(false);
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

  /* ---- Undo ---- */
  const handleUndo = async () => {
    const record = lastSwipe;
    if (!record || undoBusy || exitLockRef.current) return;
    setUndoBusy(true);
    setActionError(null);
    try {
      // If the original swipe never landed, its rollback already restored the card.
      const original = await record.promise.catch(() => null);
      if (!original || original.unauthorized || original.limitReached || original.isMatch || matchedIdsRef.current.has(record.profile.id)) {
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
  const unavailable = status !== 'ready' || !currentProfile;
  const loading = status === 'loading' || (status === 'ready' && !currentProfile && hasMore && !feedError);
  const failed = status === 'error' || (!currentProfile && feedError);
  return (
    <Shell>
      <TopBar />
      {loading ? <div className={styles.loading} role="status" aria-label="Loading profiles">
        <div className={styles.skeletonPhoto} /><div className={styles.skeletonLine} /><div className={styles.skeletonExcerpt} />
        <span className={styles.srOnly}>Finding people for you…</span>
      </div> : unavailable ? <div className={styles.state}>
        <div className={`${styles.stateIcon} ${!failed ? styles.emptyStateIcon : ''}`}><Ic.Heart /></div>
        <p className={styles.eyebrow}>{failed ? 'A little interruption' : 'Room for a new connection'}</p>
        <h2>{failed ? 'Couldn’t load profiles' : 'You’re all caught up'}</h2>
        <p>{failed ? 'Check your connection and try again. We’ll be here.' : 'No more profiles to show right now. Try adjusting your age or verification preferences, or check back later.'}</p>
        {!failed && <button className={styles.primary} onClick={openFilters}>Adjust filters</button>}
        <button className={failed ? styles.primary : styles.textButton} onClick={() => { setStatus('loading'); loadFeed(nextCursor); }}>{failed ? 'Try again' : 'Refresh profiles'}</button>
        {lastSwipe && <button className={styles.textButton} disabled={undoBusy} onClick={handleUndo}>{undoBusy ? 'Undoing…' : 'Undo last decision'}</button>}
      </div> : <div className={styles.deck}>
        <div key={`${currentProfile.id}-${cardKey}`} ref={scrollRef} className={`${styles.profileScroll} ${exit ? styles['exit' + exit.dir] : enterAnim ? styles.enter : ''}`}>
          <DiscoverProfileCard profile={currentProfile} photoIndex={currentPhotoIndex}
            onPhotoChange={(index) => { hapticLight(); setCurrentPhotoIndex(index); }}
            onSafety={() => setSafetySheetOpen(true)}
            likedPrompts={likedPrompts} onPromptLike={togglePromptLike} disabled={Boolean(exit) || undoBusy} />
        </div>
      </div>}
      {feedError && currentProfile && <div role="alert" className={styles.actionError}><span>Couldn’t load more profiles.</span><button className={styles.retryFeed} onClick={() => loadFeed(nextCursor)}>Retry</button></div>}
      {actionError && <div role="alert" className={styles.actionError}><span>{actionError}</span><button onClick={() => setActionError(null)} aria-label="Dismiss error">×</button></div>}
      {!unavailable || loading ? <DiscoverActionBar onPass={() => commitSwipe('pass', false)} onLike={() => commitSwipe('like', false)}
        onSuperLike={() => commitSwipe('super_like', false)} onUndo={handleUndo}
        canUndo={Boolean(lastSwipe)} undoBusy={undoBusy} disabled={Boolean(exit) || undoBusy || unavailable} /> : null}

      {/* SAFETY SHEET */}
      {safetySheetOpen && currentProfile && (
        <div
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Safety options for ${currentProfile.name}`}
          onClick={() => !reportSubmitting && setSafetySheetOpen(false)}
        >
          <div
            className="w-full max-w-[440px] sm:max-w-[400px] bg-[#FAF5EB] rounded-t-[28px] sm:rounded-[28px] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] animate-sheet-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pb-3 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-[#201A16]/15" />
            </div>
            <h2 className="text-[17px] font-extrabold text-[#201A16] mb-1">Report {currentProfile.name}</h2>
            <p className="text-[13px] text-[#201A16]/55 mb-4">
              They won&apos;t be told. We&apos;ll also stop showing you this person.
            </p>

            <div className="space-y-2 mb-4">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.value}
                  disabled={reportSubmitting}
                  onClick={() => handleReport(r.value)}
                  className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-white border border-[#201A16]/8 text-left text-[14px] font-medium text-[#201A16] active:scale-[0.98] transition-transform disabled:opacity-50"
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
              className="w-full min-h-[48px] py-3 text-[14px] font-semibold text-[#201A16]/50 active:opacity-60 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* SWIPE LIMIT PAYWALL */}
      {paywallOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-xl p-6 animate-popover-enter"
          role="dialog"
          aria-modal="true"
          aria-label="Upgrade to Infyn Gold"
        >
          <div className="w-full max-w-[360px] rounded-[32px] bg-white p-8 text-center shadow-2xl flex flex-col items-center overflow-hidden relative">
            {/* Ambient gradient */}
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[32px] overflow-hidden">
              <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-[#9E1B41]/12 blur-[40px]" />
              <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-[#9E1B41]/12 blur-[40px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center w-full">
              <div className="text-[52px] mb-3">👑</div>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9E1B41] bg-[#F6E0E4] border border-[#E8DDC9]/60 px-4 py-1.5 rounded-full">
                Daily Limit Reached
              </div>
              <h2 className="text-[26px] font-extrabold text-[#201A16] mt-3 mb-2 tracking-tight leading-tight">
                Upgrade to Gold
              </h2>
              <p className="text-[14px] text-[#201A16]/60 mb-6 leading-relaxed max-w-[260px]">
                {paywallMessage || "You've used all your free likes for today. Gold gives you unlimited likes every day."}
              </p>

              <div className="w-full space-y-2.5 mb-4">
                {[
                  { icon: '💛', text: 'Unlimited likes every day' },
                  { icon: '👀', text: 'See who already liked you' },
                  { icon: '⭐', text: '5 Super Likes per day' },
                  { icon: '🚀', text: 'Profile boost once a week' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#FAF5EB] border border-[#201A16]/6 text-left">
                    <span className="text-[18px]">{icon}</span>
                    <span className="text-[13px] font-semibold text-[#201A16]/80">{text}</span>
                  </div>
                ))}
              </div>

              <button className={styles.primary} onClick={() => { setPaywallOpen(false); router.push('/premium'); }}>
                Get Infyn Gold
              </button>
              <button
                onClick={() => setPaywallOpen(false)}
                className="w-full min-h-[44px] py-3 text-[14px] font-semibold text-[#201A16]/50 transition-opacity active:opacity-60 mt-1"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MATCH CELEBRATION */}
      <MatchScreen
        theme="editorial"
        isOpen={Boolean(matchedUser)}
        matchedUser={matchedUser}
        myPhoto={myPhoto}
        myName={myName}
        onClose={() => setMatchedUser(null)}
        onSendMessage={() => {
          pushedOverlayRef.current = false;
          closingFromPopRef.current = true;
          setMatchedUser(null);
          router.push('/messages');
        }}
      />
    </Shell>
  );
}

/* ─────────────────────────────────────────────────
   SHELL — shared page frame across every state
───────────────────────────────────────────────── */
function Shell({ children }: { children: React.ReactNode }) {
  return <div className={styles.root}><div className={styles.shell}>{children}</div></div>;
}

function TopBar() {
  const { openNotifications, unreadCount } = useNotifications();
  const { openFilters, filters } = useFilters();
  const count = Number(filters.ageMin !== 20 || filters.ageMax !== 30) + Number(filters.verifiedOnly);
  return <header className={styles.header}>
    <div className={styles.brand}><span className={styles.brandMark} aria-hidden="true" /><div><span className={styles.wordmark}>Infyn</span><h1>Discover</h1></div></div>
    <div className={styles.headerActions}>
      <button className={styles.filterButton} onClick={openFilters} aria-label={`Open discovery filters${count ? `, ${count} active` : ''}`}><Ic.Filter /><span>Filters</span>{count > 0 && <span key={count} className={`${styles.count} animate-attention-pop`}>{count}</span>}</button>
      <button className={styles.iconButton} onClick={openNotifications} aria-label={`Open notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}><Ic.Bell />{unreadCount > 0 && <span key={unreadCount} className={`${styles.unread} animate-attention-pop`} />}</button>
    </div>
  </header>;
}
