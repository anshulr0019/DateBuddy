'use client';

import { useState } from 'react';
import { PEOPLE } from '../data/mockData';
import { Ic } from '../components/icons';
import { AuroraBackground, GlassCard, OnlineDot, VerifiedBadge, SafeImage } from '../components/shared';
import FloatingNav from '../components/FloatingNav';

type ConnTab = 'Friends' | 'Dating' | 'Networking' | 'Requests' | 'Suggestions'

export default function ConnectionsPage() {
  const [tab, setTab] = useState<ConnTab>('Friends');
  const tabs: ConnTab[] = ['Friends', 'Dating', 'Networking', 'Requests', 'Suggestions'];

  return (
    <div className="h-[100dvh] w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[420px] flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex-1 min-h-0 z-10 overflow-y-auto scrollbar-none px-4 pt-6 pb-28 animate-page-enter">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Connections</h1>
                <p className="text-[13px] text-[#1A1A2E]/50">Your circle is growing 💫</p>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#1A1A2E]/[0.08] bg-white/60 px-3 py-1 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                <span className="text-[11px] font-medium uppercase tracking-wide text-[#1A1A2E]/65">{PEOPLE.length} connected</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {tabs.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all cursor-pointer ${
                    tab === t
                      ? 'bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white shadow-[0_4px_12px_-4px_rgba(123,104,238,0.5)]'
                      : 'border border-[#1A1A2E]/10 bg-white/70 text-[#1A1A2E]/60'
                  }`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Requests */}
            {tab === 'Requests' && (
              <div className="flex flex-col gap-3 mb-5">
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full">
                      <SafeImage src={PEOPLE[3].photo} name={PEOPLE[3].name} alt={PEOPLE[3].name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-[#1A1A2E]">{PEOPLE[3].name}</p>
                      <p className="text-[12px] text-[#1A1A2E]/50">{PEOPLE[3].profession}</p>
                      <p className="text-[11px] text-[#1A1A2E]/40 mt-0.5">{PEOPLE[3].mutuals} mutual connections</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] py-2 text-[13px] font-semibold text-white cursor-pointer">Accept</button>
                    <button className="flex-1 rounded-2xl border border-[#1A1A2E]/15 py-2 text-[13px] font-medium text-[#1A1A2E]/60 cursor-pointer">Decline</button>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Grid of connections */}
            <div className="grid grid-cols-2 gap-3">
              {PEOPLE.map((p, i) => (
                <GlassCard key={p.id} className="animate-float-in text-center p-4 overflow-hidden" style={{ animationDelay: `${i * 65}ms` }}>
                  <div className="relative mx-auto mb-3 h-[88px] w-[88px] overflow-hidden rounded-full">
                    <SafeImage src={p.photo} name={p.name} alt={p.name} className="h-full w-full object-cover" />
                    {p.online && <OnlineDot className="absolute bottom-1 right-1 h-4 w-4" />}
                    {p.verified && (
                      <div className="absolute top-0 right-0">
                        <VerifiedBadge />
                      </div>
                    )}
                  </div>
                  <p className="text-[14px] font-semibold text-[#1A1A2E] leading-tight">{p.name}</p>
                  <p className="text-[11px] text-[#1A1A2E]/45 mt-0.5 truncate">{p.profession}</p>
                  <div className="mt-2 flex items-center justify-center gap-1 text-[#1A1A2E]/40">
                    <Ic.MapPin />
                    <span className="text-[11px]">{p.distance}</span>
                  </div>
                  <button className="mt-3 w-full rounded-full border border-[#FF6B9D]/30 py-1.5 text-[12px] font-medium text-[#FF6B9D] transition-all hover:bg-[#FF6B9D]/10 cursor-pointer">
                    Message
                  </button>
                </GlassCard>
              ))}
            </div>
          </div>
        </AuroraBackground>
        {/* STATIC FOOTER NAVIGATION */}
        <FloatingNav />
      </div>
    </div>
  );
}
