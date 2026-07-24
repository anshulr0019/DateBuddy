'use client';

import { useRouter } from 'next/navigation';
import { PEOPLE, EVENTS } from '../data/mockData';
import { Ic } from '../components/icons';
import { AuroraBackground, GlassCard, OnlineDot, SafeImage, VerifiedBadge } from '../components/shared';
import FloatingNav from '../components/FloatingNav';

export default function HomePage() {
  const router = useRouter();
  const todaysPicks = PEOPLE.slice(0, 3);

  return (
    <div className="h-[100dvh] w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[420px] flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex-1 min-h-0 z-10 overflow-y-auto scrollbar-none px-4 pt-6 pb-28 animate-page-enter">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-[22px] font-bold tracking-tight text-[#1A1A2E]">Good morning 👋</h1>
                <p className="text-[13px] text-[#1A1A2E]/50">Your curated picks for today</p>
              </div>
              <div className="flex gap-2">
                <button className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-[#1A1A2E]/10 shadow-sm hover:bg-[#FAFAF7] transition-all cursor-pointer">
                  <Ic.Bell />
                  <div className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#FF6B9D]" />
                </button>
              </div>
            </div>

            {/* Item 13: TODAY'S PICKS — 3 Large Profile Cards */}
            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-[#1A1A2E]/50">Today&apos;s Picks</h2>
                <button onClick={() => router.push('/discover')} className="text-[12px] font-semibold text-[#FF6B9D] hover:underline cursor-pointer">
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {todaysPicks.map((person) => (
                  <GlassCard key={person.id} className="p-4 overflow-hidden border border-[#1A1A2E]/10">
                    <div className="flex items-center gap-4">
                      {/* Photo */}
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl">
                        <SafeImage src={person.photo} name={person.name} alt={person.name} className="h-full w-full object-cover" />
                        {person.online && <OnlineDot className="absolute bottom-1 right-1 h-3.5 w-3.5" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="text-[16px] font-bold text-[#1A1A2E] truncate">{person.name}, {person.age}</h3>
                          {person.verified && <VerifiedBadge />}
                        </div>
                        <p className="text-[12px] text-[#1A1A2E]/60 truncate mb-1">{person.profession}</p>
                        <div className="flex items-center gap-1 text-[#1A1A2E]/40 text-[11px]">
                          <Ic.MapPin />
                          <span>{person.distance}</span>
                        </div>
                      </div>

                      {/* Connect CTA */}
                      <button
                        onClick={() => router.push('/discover')}
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#FF6B9D]/10 text-[#FF6B9D] hover:bg-[#FF6B9D] hover:text-white transition-all cursor-pointer"
                        aria-label="Connect"
                      >
                        <Ic.Heart filled />
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* EVENTS NEAR YOU */}
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-[#1A1A2E]/50">Events Near You</h2>
              </div>
              <GlassCard className="p-0 overflow-hidden border border-[#1A1A2E]/10">
                {EVENTS.slice(0, 3).map((e, i) => (
                  <div key={e.id} className={`flex w-full items-center gap-3.5 p-4 text-left ${i < 2 ? 'border-b border-[#1A1A2E]/[0.06]' : ''}`}>
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#1A1A2E]/5 text-xl">
                      {e.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-[#1A1A2E] leading-tight">{e.title}</p>
                      <p className="text-[12px] text-[#1A1A2E]/50 mt-0.5">{e.date} · {e.attendees} going</p>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-[#1A1A2E]/5 px-2.5 py-1 text-[11px] font-semibold text-[#1A1A2E]/70">{e.tag}</span>
                  </div>
                ))}
              </GlassCard>
            </div>
          </div>
        </AuroraBackground>
        {/* STATIC FOOTER NAVIGATION */}
        <FloatingNav />
      </div>
    </div>
  );
}
