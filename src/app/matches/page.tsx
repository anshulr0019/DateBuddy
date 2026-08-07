'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ic } from '../components/icons';
import { AuroraBackground, GlassCard, OnlineDot, VerifiedBadge, SafeImage } from '../components/shared';

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

export default function ConnectionsPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
          setMatches(data.matches);
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

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans select-none">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-gray-200/60 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-col h-full w-full z-10 overflow-hidden">

            <div className="flex-shrink-0 z-20 px-4 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-3 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-[22px] font-extrabold tracking-tight text-[#1E293B]">Connections</h1>
                  <p className="text-[12.5px] text-[#1E293B]/60 font-medium">Your circle is growing 💫</p>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200/70 bg-white/80 px-3 py-1 backdrop-blur-md shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[#1E293B]/70">
                    {matches.length} Connected
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
              {loading && (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-44 rounded-3xl bg-white/60 animate-pulse" />
                  ))}
                </div>
              )}

              {!loading && error && (
                <div className="text-center py-16 px-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-[#F43F5E] mb-4 mx-auto shadow-sm">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <h3 className="text-[18px] font-bold text-[#1E293B] mb-2">Couldn&apos;t load your connections</h3>
                  <p className="text-[14px] text-[#1E293B]/55 max-w-[260px] mx-auto leading-relaxed mb-6">
                    Check your connection and try again.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] px-6 py-3 text-[14px] font-bold text-white cursor-pointer active:scale-95 hover:shadow-[0_8px_24px_-8px_rgba(255,107,157,0.45)] transition-all shadow-sm"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!loading && !error && matches.length === 0 && (
                <div className="text-center py-16 px-6">
                  <div className="relative mb-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B9D]/15 to-[#7B68EE]/15 border border-[#FF6B9D]/25 mx-auto shadow-sm">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6B9D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-[20px] font-bold text-[#1E293B] mb-2">No connections yet</h3>
                  <p className="text-[14.5px] text-[#1E293B]/55 max-w-[280px] mx-auto leading-relaxed mb-6">
                    Start swiping to find your people. When you both like each other, you&apos;ll match and can start chatting! ✨
                  </p>
                  <button
                    onClick={() => router.push('/discover')}
                    className="rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] px-6 py-3 text-[14px] font-bold text-white cursor-pointer active:scale-95 hover:shadow-[0_8px_24px_-8px_rgba(255,107,157,0.45)] transition-all shadow-sm"
                  >
                    Start Discovering
                  </button>
                </div>
              )}

              {!loading && !error && matches.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {matches.map((p, i) => (
                    <GlassCard
                      key={p.id}
                      className="animate-bubble-enter flex flex-col justify-between items-center text-center p-4 overflow-hidden border border-gray-200/70 hover:border-[#F43F5E]/30 transition-all shadow-2xs"
                      style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
                    >
                      <div className="flex flex-col items-center w-full">
                        <div className="relative mx-auto mb-2.5 h-20 w-20 overflow-hidden rounded-full shadow-2xs">
                          <SafeImage src={p.photo} name={p.name} alt={p.name} className="h-full w-full object-cover" />
                          {p.online && <OnlineDot className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5" />}
                          {p.verified && (
                            <div className="absolute top-0 right-0">
                              <VerifiedBadge />
                            </div>
                          )}
                        </div>
                        <h3 className="text-[14.5px] font-bold text-[#1E293B] leading-tight truncate w-full">
                          {p.name}{p.age ? `, ${p.age}` : ''}
                        </h3>
                        {p.city && (
                          <div className="mt-1.5 flex items-center justify-center gap-1 text-[#1E293B]/45">
                            <Ic.MapPin />
                            <span className="text-[11px] font-medium">{p.city}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => router.push(`/chat/${p.id}`)}
                        className="mt-3.5 w-full rounded-full bg-[#FFF0F4] border border-[#F9C0D0]/60 py-1.5 text-[12px] font-bold text-[#F43F5E] hover:bg-[#F43F5E] hover:text-white transition-all active:scale-95 cursor-pointer shadow-2xs"
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
