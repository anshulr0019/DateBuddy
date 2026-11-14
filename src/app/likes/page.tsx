'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuroraBackground, GlassCard, SafeImage, VerifiedBadge, EmptyState } from '../components/shared';
import { Ic } from '../components/icons';
import { hapticLight } from '../lib/haptics';

type Liker = {
  id: number;
  name: string | null;
  age: number | null;
  city: string | null;
  verified: boolean;
  photo: string | null;
  blurred: boolean;
};

export default function LikesPage() {
  const router = useRouter();
  const [likers, setLikers] = useState<Liker[]>([]);
  const [count, setCount] = useState(0);
  const [isGold, setIsGold] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [likeBackId, setLikeBackId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/likes');
        if (res.status === 401) { router.replace('/welcome'); return; }
        const data = await res.json();
        if (!data.success) { setError(true); return; }
        setLikers(data.likers);
        setCount(data.count);
        setIsGold(data.isGold);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const likeBack = async (liker: Liker) => {
    setLikeBackId(liker.id);
    setActionError(null);
    hapticLight();
    try {
      const res = await fetch('/api/swipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swipedUserId: liker.id, action: 'like' }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.limitReached) {
          setActionError(data.message || 'Daily like limit reached.');
          return;
        }
        setActionError(data.message || 'Could not like back. Please try again.');
        return;
      }
      // Remove this liker from the list — they've been responded to.
      setLikers((prev) => prev.filter((l) => l.id !== liker.id));
      setCount((prev) => Math.max(0, prev - 1));
      if (data.isMatch) {
        router.push('/matches');
      }
    } catch {
      setActionError('Network error. Please try again.');
    } finally {
      setLikeBackId(null);
    }
  };

  return (
    <div className="h-dvh w-full min-h-screen bg-infyn-paper flex justify-center overflow-hidden font-sans select-none">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-[480px] md:max-w-[540px] flex flex-col bg-infyn-paper shadow-2xl sm:border-x sm:border-infyn-border/60 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-col h-full w-full z-10 overflow-hidden">

            {/* Header with Back and Close navigation */}
            <div className="flex-shrink-0 z-20 px-4 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-3 bg-infyn-surface/90 backdrop-blur-xl border-b border-infyn-border/50 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (window.history.length > 1) {
                        router.back();
                      } else {
                        router.push('/discover');
                      }
                    }}
                    aria-label="Go back"
                    className="flex h-11 w-11 items-center justify-center rounded-full text-infyn-ink active:bg-infyn-surface-soft transition-colors cursor-pointer flex-shrink-0"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="font-display text-[24px] leading-tight tracking-tight text-infyn-ink">Who liked you</h1>
                      {isGold && (
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-infyn-rose to-infyn-rose text-white text-[10px] font-black uppercase tracking-wider">
                          GOLD
                        </span>
                      )}
                    </div>
                    {!loading && count > 0 && (
                      <p className="text-[14px] text-infyn-secondary">
                        {count} {count === 1 ? 'person' : 'people'} liked your profile
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">

              {/* Loading skeletons */}
              {loading && (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-52 rounded-3xl animate-skeleton" />
                  ))}
                </div>
              )}

              {/* Error */}
              {!loading && error && (
                <EmptyState
                  tone="error"
                  icon={<Ic.Alert />}
                  title="Couldn’t load likes"
                  body="Check your connection and try again."
                  action={{ label: 'Try again', onClick: () => window.location.reload() }}
                />
              )}

              {/* Free tier — locked/blurred paywall state */}
              {!loading && !error && !isGold && count > 0 && (
                <div className="space-y-4">
                  {/* Blurred preview grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
                      <div
                        key={i}
                        className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-infyn-rose/20 to-infyn-rose/20 border border-infyn-border/60"
                      >
                        {/* Blurred silhouette */}
                        <div className="absolute inset-0 flex items-end justify-center pb-4">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--infyn-rose)" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <div className="absolute inset-0 backdrop-blur-xl" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="grid h-11 w-11 place-items-center rounded-full bg-infyn-surface/90 text-infyn-rose" aria-hidden><Ic.Heart filled /></span>
                        </div>
                      </div>
                    ))}
                    {count > 4 && (
                      <div className="aspect-[3/4] rounded-3xl bg-gradient-to-br from-infyn-rose/10 to-infyn-rose/10 border border-dashed border-infyn-rose/30 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-[22px] font-black text-infyn-rose">+{count - 4}</div>
                          <div className="text-[11px] font-bold text-infyn-ink/50 mt-1">more</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upgrade CTA */}
                  <GlassCard className="p-5 text-center border border-infyn-rose-line/60 bg-gradient-to-br from-infyn-blush to-white">
                    <h3 className="font-display text-[24px] leading-tight text-infyn-ink mb-1">
                      {count} {count === 1 ? 'person' : 'people'} liked you
                    </h3>
                    <p className="text-[14px] text-infyn-secondary mb-4 leading-relaxed">
                      Upgrade to Gold to see who they are and match with them instantly.
                    </p>
                    <button
                      onClick={() => { hapticLight(); router.push('/premium'); }}
                      className="w-full min-h-[52px] rounded-full bg-infyn-rose text-[#fff8f0] text-[15px] font-semibold active:scale-[0.985] transition-transform cursor-pointer"
                    >
                      See who with Gold
                    </button>
                  </GlassCard>
                </div>
              )}

              {/* Empty state — no likes yet */}
              {!loading && !error && count === 0 && (
                <EmptyState
                  icon={<Ic.Heart />}
                  title="No likes yet"
                  body="A complete profile with a few photos and prompts gets noticed sooner."
                  action={{ label: 'Start discovering', onClick: () => router.push('/discover') }}
                  secondary={{ label: 'Edit my profile', onClick: () => router.push('/profile') }}
                />
              )}

              {/* Gold — full profiles grid */}
              {!loading && !error && isGold && count > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {likers.map((liker, i) => (
                    <GlassCard
                      key={liker.id}
                      className="animate-bubble-enter flex flex-col justify-between items-center text-center p-4 overflow-hidden border border-infyn-border/70 hover:border-infyn-rose/30 transition-all shadow-2xs"
                      style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
                    >
                      <div className="flex flex-col items-center w-full">
                        <div className="relative mx-auto mb-2.5 h-20 w-20 overflow-hidden rounded-full shadow-2xs">
                          <SafeImage src={liker.photo} name={liker.name ?? '?'} alt={liker.name ?? 'Profile'} className="h-full w-full object-cover" />
                          {liker.verified && (
                            <div className="absolute top-0 right-0">
                              <VerifiedBadge />
                            </div>
                          )}
                        </div>
                        <h3 className="text-[14.5px] font-bold text-infyn-ink leading-tight truncate w-full">
                          {liker.name}{liker.age ? `, ${liker.age}` : ''}
                        </h3>
                        {liker.city && (
                          <div className="mt-1.5 flex items-center justify-center gap-1 text-infyn-ink/45">
                            <Ic.MapPin />
                            <span className="text-[11px] font-medium">{liker.city}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => likeBack(liker)}
                        disabled={likeBackId !== null}
                        className="font-system mt-3.5 w-full rounded-full bg-gradient-to-r from-infyn-rose to-infyn-rose py-1.5 text-[12px] font-bold text-white hover:opacity-90 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-default shadow-2xs"
                      >
                        {likeBackId === liker.id ? 'Matching…' : '💛 Like Back'}
                      </button>
                    </GlassCard>
                  ))}
                  {actionError && (
                    <div
                      role="alert"
                      className="col-span-2 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-rose-600 text-[13px] font-semibold text-center"
                    >
                      {actionError}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </AuroraBackground>
      </div>
    </div>
  );
}
