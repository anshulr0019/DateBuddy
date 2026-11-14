'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ic } from '../components/icons';
import { AuroraBackground, GlassCard, OnlineDot, VerifiedBadge, SafeImage, EmptyState } from '../components/shared';
import { hapticLight } from '../lib/haptics';

type Match = {
  id: number;
  partnerId: number;
  name: string;
  age: number | null;
  city: string | null;
  photo: string | null;
  online: boolean;
  verified: boolean;
};

// Module-level in-memory cache for 0ms instant display
let cachedMatches: Match[] | null = null;
let cachedLikesCount: number | null = null;

export default function ConnectionsPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>(cachedMatches || []);
  const [loading, setLoading] = useState(!cachedMatches);
  const [error, setError] = useState(false);
  const [likesCount, setLikesCount] = useState<number | null>(cachedLikesCount);

  const recentChatIds = matches.slice(0, 5).map(match => match.id).join(',');
  useEffect(() => {
    recentChatIds.split(',').filter(Boolean).forEach(id => router.prefetch(`/chat/${id}`));
  }, [recentChatIds, router]);

  useEffect(() => {
    async function loadMatches() {
      try {
        const res = await fetch('/api/matches');
        if (res.status === 401) {
          router.replace('/welcome');
          return;
        }
        const data = await res.json();
        if (data.success) {
          cachedMatches = data.matches; setMatches(data.matches);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, [router]);

  useEffect(() => {
    fetch('/api/likes')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.success) { cachedLikesCount = d.count; setLikesCount(d.count); } })
      .catch(() => {});
  }, []);

  return (
    <div className="h-dvh w-full min-h-screen bg-infyn-paper flex justify-center overflow-hidden font-sans select-none">
      <div className="infyn-screen-arrive relative h-full w-full max-w-[440px] sm:max-w-[480px] md:max-w-[540px] flex flex-col justify-between bg-infyn-paper shadow-2xl sm:border-x sm:border-infyn-border/60 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-col h-full w-full z-10 overflow-hidden">

            <div className="flex-shrink-0 z-20 px-5 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-2 bg-infyn-paper">
              <h1 className="font-display text-[30px] leading-tight tracking-tight text-infyn-ink">Connections</h1>
              {!loading && !error && (
                <p className="text-[14px] text-infyn-secondary">
                  {matches.length === 0 ? 'People you match with appear here' : `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`}
                </p>
              )}
            </div>

            {/* Who Liked You teaser row */}
            <button
              onClick={() => { hapticLight(); router.push('/likes'); }}
              className="flex-shrink-0 z-10 mx-4 mt-2 flex min-h-[64px] items-center justify-between rounded-2xl bg-infyn-surface border border-infyn-border px-4 py-3 cursor-pointer active:bg-infyn-surface-soft transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-infyn-blush text-infyn-rose flex-shrink-0" aria-hidden>
                  <Ic.Heart filled />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-semibold text-infyn-ink">
                    {likesCount === null ? 'Who Liked You' : likesCount > 0 ? `${likesCount} ${likesCount === 1 ? 'person' : 'people'} liked you` : 'Who Liked You'}
                  </p>
                  <p className="text-[13px] text-infyn-secondary">
                    {likesCount !== null && likesCount > 0 ? 'Tap to see or upgrade to reveal' : 'See people who already liked you'}
                  </p>
                </div>
              </div>
              {likesCount !== null && likesCount > 0 && (
                <div className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-infyn-rose px-1.5 text-white text-[12px] font-semibold flex-shrink-0">
                  {likesCount}
                </div>
              )}
              {(likesCount === null || likesCount === 0) && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-infyn-ink/35 flex-shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
              )}
            </button>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
              {loading && (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-44 rounded-3xl animate-skeleton" />
                  ))}
                </div>
              )}

              {!loading && error && (
                <EmptyState
                  tone="error"
                  icon={<Ic.Alert />}
                  title="Couldn’t load your connections"
                  body="Check your connection and try again."
                  action={{ label: 'Try again', onClick: () => window.location.reload() }}
                />
              )}

              {!loading && !error && matches.length === 0 && (
                <EmptyState
                  icon={<Ic.Heart />}
                  title="No connections yet"
                  body="When you and someone both like each other, you’ll match and can start chatting."
                  action={{ label: 'Start discovering', onClick: () => router.push('/discover') }}
                />
              )}

              {!loading && !error && matches.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {matches.map((p, i) => (
                    <GlassCard
                      key={p.id}
                      className="animate-bubble-enter flex flex-col justify-between items-center text-center p-4 overflow-hidden border border-infyn-border/70 hover:border-infyn-rose/30 transition-all shadow-2xs"
                      style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
                    >
                      <div className="flex flex-col items-center w-full">
                        <div className="relative mx-auto mb-2.5 h-20 w-20 overflow-hidden rounded-full shadow-2xs">
                          <SafeImage src={p.photo} name={p.name} alt={p.name} width={240} className="h-full w-full object-cover" />
                          {p.online && <OnlineDot className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5" />}
                          {p.verified && (
                            <div className="absolute top-0 right-0">
                              <VerifiedBadge />
                            </div>
                          )}
                        </div>
                        <h3 className="text-[15px] font-semibold text-infyn-ink leading-tight truncate w-full">
                          {p.name}{p.age ? `, ${p.age}` : ''}
                        </h3>
                        {p.city && (
                          <div className="mt-1 flex items-center justify-center gap-1 text-infyn-secondary">
                            <Ic.MapPin />
                            <span className="text-[13px]">{p.city}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => router.push(`/chat/${p.id}`)}
                        className="mt-3.5 w-full min-h-[44px] rounded-full border border-infyn-rose-line text-[14px] font-semibold text-infyn-rose active:bg-infyn-blush transition-colors cursor-pointer"
                        aria-label={`Message ${p.name}`}
                      >
                        Message
                      </button>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>

          </div>
        </AuroraBackground>
      </div>
    </div>
  );
}
