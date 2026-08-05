'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PEOPLE, Person } from '../data/mockData';
import { Ic } from '../components/icons';
import { AuroraBackground, GlassCard, OnlineDot, VerifiedBadge, SafeImage } from '../components/shared';

type ConnTab = 'Friends' | 'Dating' | 'Networking' | 'Requests' | 'Suggestions';

export default function ConnectionsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<ConnTab>('Friends');
  const [requestsList, setRequestsList] = useState<Person[]>([PEOPLE[3], PEOPLE[4]]);
  const [realMatches, setRealMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs: ConnTab[] = ['Friends', 'Dating', 'Networking', 'Requests', 'Suggestions'];

  useEffect(() => {
    async function loadMatches() {
      try {
        const res = await fetch('/api/matches');
        const data = await res.json();
        if (data.success && data.matches) {
          setRealMatches(data.matches);
        }
      } catch (err) {
        console.warn('⚠️ Error fetching matches API:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  // Combine real matches from DB with category filter
  const getFilteredProfiles = (): any[] => {
    if (realMatches.length > 0) {
      return realMatches.map(m => ({
        id: m.id,
        partnerId: m.partnerId,
        name: m.name,
        age: m.age || 24,
        profession: m.profession || 'Creative Professional',
        distance: m.distance || '1.2km away',
        photo: m.photo,
        online: m.online ?? true,
        verified: m.verified ?? true,
      }));
    }

    switch (tab) {
      case 'Friends':
        return PEOPLE.filter((p) => p.id === 1 || p.id === 3 || p.id === 5);
      case 'Dating':
        return PEOPLE.filter((p) => p.id === 2 || p.id === 4 || p.id === 6);
      case 'Networking':
        return PEOPLE.filter((p) => p.profession.includes('UX') || p.profession.includes('Manager') || p.profession.includes('Founder') || p.profession.includes('Google'));
      case 'Suggestions':
        return PEOPLE.slice(2, 6);
      default:
        return PEOPLE;
    }
  };

  const currentProfiles = getFilteredProfiles();

  const handleAcceptRequest = (id: number) => {
    setRequestsList((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDeclineRequest = (id: number) => {
    setRequestsList((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans select-none">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-gray-200/60 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-col h-full w-full z-10 overflow-hidden">
            
            {/* FIXED TOP HEADER & CATEGORY TABS */}
            <div className="flex-shrink-0 z-20 px-4 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-3 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-2xs">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h1 className="text-[22px] font-extrabold tracking-tight text-[#1E293B]">Connections</h1>
                  <p className="text-[12.5px] text-[#1E293B]/60 font-medium">Your circle is growing 💫</p>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200/70 bg-white/80 px-3 py-1 backdrop-blur-md shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[#1E293B]/70">{currentProfiles.length} Connected</span>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-shrink-0 rounded-full px-4 py-1.5 text-[13px] font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                      tab === t
                        ? 'bg-[#F43F5E] text-white shadow-2xs'
                        : 'border border-gray-200/80 bg-white/90 text-[#1E293B]/70 hover:bg-white hover:text-[#1E293B]'
                    }`}
                  >
                    {t} {t === 'Requests' && requestsList.length > 0 && `(${requestsList.length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* SCROLLABLE CONNECTIONS GRID */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
              
              {/* Requests Tab Banner */}
              {tab === 'Requests' && (
                <div className="flex flex-col gap-3 mb-4">
                  {requestsList.length > 0 ? (
                    requestsList.map((p) => (
                      <GlassCard key={p.id} className="animate-bubble-enter p-4 border border-gray-200/70 shadow-2xs">
                        <div className="flex items-center gap-3.5">
                          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full shadow-2xs">
                            <SafeImage src={p.photo} name={p.name} alt={p.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-bold text-[#1E293B] truncate">{p.name}, {p.age}</p>
                            <p className="text-[12px] text-[#1E293B]/60 truncate">{p.profession}</p>
                            <p className="text-[11px] text-[#1E293B]/45 mt-0.5">{p.mutuals} mutual connections</p>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2.5">
                          <button
                            onClick={() => handleAcceptRequest(p.id)}
                            className="flex-1 rounded-2xl bg-[#F43F5E] py-2 text-[13px] font-bold text-white cursor-pointer active:scale-95 hover:bg-[#E11D48] transition-all shadow-2xs"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(p.id)}
                            className="flex-1 rounded-2xl border border-gray-200/80 bg-white py-2 text-[13px] font-semibold text-[#1E293B]/70 cursor-pointer active:scale-95 hover:bg-gray-50 transition-all"
                          >
                            Decline
                          </button>
                        </div>
                      </GlassCard>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-[14px] font-bold text-[#1E293B]/60">No pending connection requests ✨</p>
                    </div>
                  )}
                </div>
              )}

              {/* Loading State */}
              {loading && tab !== 'Requests' && (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-44 rounded-3xl bg-white/60 animate-pulse" />
                  ))}
                </div>
              )}

              {/* Grid of Profile Cards for Active Category */}
              {!loading && tab !== 'Requests' && (
                <div className="grid grid-cols-2 gap-3">
                  {currentProfiles.map((p, i) => (
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
                        <h3 className="text-[14.5px] font-bold text-[#1E293B] leading-tight truncate w-full">{p.name}</h3>
                        <p className="text-[11.5px] text-[#1E293B]/55 mt-0.5 truncate w-full">{p.profession}</p>
                        <div className="mt-1.5 flex items-center justify-center gap-1 text-[#1E293B]/45">
                          <Ic.MapPin />
                          <span className="text-[11px] font-medium">{p.distance}</span>
                        </div>
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
