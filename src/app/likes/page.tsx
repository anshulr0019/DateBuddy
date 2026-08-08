'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuroraBackground, GlassCard, SafeImage, VerifiedBadge } from '../components/shared';
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

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans select-none">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-gray-200/60 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-col h-full w-full z-10 overflow-hidden">

            {/* Header */}
            <div className="flex-shrink-0 z-20 px-4 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-3 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-[22px] font-extrabold tracking-tight text-[#1E293B]">Who Liked You</h1>
                    {isGold && (
                      <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[10px] font-black uppercase tracking-wider">
                        GOLD
                      </span>
                    )}
                  </div>
                  <p className="text-[12.5px] text-[#1E293B]/60 font-medium">
                    {loading ? 'Loading…' : `${count} ${count === 1 ? 'person' : 'people'} liked your profile`}
                  </p>
                </div>
                <div className="text-[28px]">💛</div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">

              {/* Loading skeletons */}
              {loading && (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-52 rounded-3xl bg-white/60 animate-pulse" />
                  ))}
                </div>
              )}

              {/* Error */}
              {!loading && error && (
                <div className="text-center py-16 px-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-[#F43F5E] mb-4 mx-auto shadow-sm text-2xl">⚠️</div>
                  <h3 className="text-[18px] font-bold text-[#1E293B] mb-2">Couldn't load likes</h3>
                  <p className="text-[14px] text-[#1E293B]/55 max-w-[260px] mx-auto leading-relaxed mb-6">
                    Check your connection and try again.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] px-6 py-3 text-[14px] font-bold text-white cursor-pointer active:scale-95 transition-all"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Free tier — locked/blurred paywall state */}
              {!loading && !error && !isGold && count > 0 && (
                <div className="space-y-4">
                  {/* Blurred preview grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
                      <div
                        key={i}
                        className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-[#FF6B9D]/20 to-[#7B68EE]/20 border border-white/60"
                      >
                        {/* Blurred silhouette */}
                        <div className="absolute inset-0 flex items-end justify-center pb-4">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FF6B9D" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <div className="absolute inset-0 backdrop-blur-xl" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-[28px]">🔒</div>
                        </div>
                      </div>
                    ))}
                    {count > 4 && (
                      <div className="aspect-[3/4] rounded-3xl bg-gradient-to-br from-[#FF6B9D]/10 to-[#7B68EE]/10 border border-dashed border-[#FF6B9D]/30 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-[22px] font-black text-[#FF6B9D]">+{count - 4}</div>
                          <div className="text-[11px] font-bold text-[#1E293B]/50 mt-1">more</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upgrade CTA */}
                  <GlassCard className="p-5 text-center border border-[#F9C0D0]/60 bg-gradient-to-br from-[#FFF0F4] to-white">
                    <div className="text-[36px] mb-2">👑</div>
                    <h3 className="text-[17px] font-extrabold text-[#1A1A2E] mb-1">
                      {count} {count === 1 ? 'person' : 'people'} liked you!
                    </h3>
                    <p className="text-[13px] text-[#1A1A2E]/60 mb-4 leading-relaxed">
                      Upgrade to Gold to see who they are and match with them instantly.
                    </p>
                    <button
                      onClick={() => { hapticLight(); router.push('/premium'); }}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[14px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      Unlock with Gold ✨
                    </button>
                  </GlassCard>
                </div>
              )}

              {/* Empty state — no likes yet */}
              {!loading && !error && count === 0 && (
                <div className="text-center py-16 px-6">
                  <div className="relative mb-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B9D]/15 to-[#7B68EE]/15 border border-[#FF6B9D]/25 mx-auto shadow-sm">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6B9D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-[20px] font-bold text-[#1E293B] mb-2">No likes yet</h3>
                  <p className="text-[14.5px] text-[#1E293B]/55 max-w-[280px] mx-auto leading-relaxed mb-6">
                    Complete your profile and start swiping — the more you engage, the more people will find you! 💫
                  </p>
                  <button
                    onClick={() => router.push('/discover')}
                    className="rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] px-6 py-3 text-[14px] font-bold text-white cursor-pointer active:scale-95 transition-all shadow-sm"
                  >
                    Start Discovering
                  </button>
                </div>
              )}

              {/* Gold — full profiles grid */}
              {!loading && !error && isGold && count > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {likers.map((liker, i) => (
                    <GlassCard
                      key={liker.id}
                      className="animate-bubble-enter flex flex-col justify-between items-center text-center p-4 overflow-hidden border border-gray-200/70 hover:border-[#F43F5E]/30 transition-all shadow-2xs"
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
                        <h3 className="text-[14.5px] font-bold text-[#1E293B] leading-tight truncate w-full">
                          {liker.name}{liker.age ? `, ${liker.age}` : ''}
                        </h3>
                        {liker.city && (
                          <div className="mt-1.5 flex items-center justify-center gap-1 text-[#1E293B]/45">
                            <Ic.MapPin />
                            <span className="text-[11px] font-medium">{liker.city}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => { hapticLight(); router.push('/discover'); }}
                        className="mt-3.5 w-full rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#FB7185] py-1.5 text-[12px] font-bold text-white hover:opacity-90 transition-all active:scale-95 cursor-pointer shadow-2xs"
                      >
                        💛 Like Back
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
