'use client';

import { useState } from 'react';
import { CONVOS } from '../data/mockData';
import { Ic } from '../components/icons';
import { AuroraBackground, OnlineDot, SafeImage } from '../components/shared';
import FloatingNav from '../components/FloatingNav';

export default function MessagesPage() {
  const [search, setSearch] = useState('');
  const filtered = CONVOS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-[100dvh] w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[420px] flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex-1 min-h-0 z-10 overflow-y-auto scrollbar-none px-4 pt-6 pb-28 animate-page-enter">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Messages</h1>
                <p className="text-[13px] text-[#1A1A2E]/50">{CONVOS.filter(c => c.unread > 0).length} unread conversations</p>
              </div>
              <div className="flex gap-2">
                <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 shadow-sm backdrop-blur-md hover:bg-white/90 transition-all cursor-pointer">
                  <Ic.Bell />
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] text-white shadow-[0_6px_20px_-8px_rgba(123,104,238,0.6)] transition hover:scale-105 cursor-pointer">
                  <Ic.Plus />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-5">
              <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[#1A1A2E]/30">
                <Ic.Search />
              </div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="h-12 w-full rounded-2xl border border-[#1A1A2E]/10 bg-white/80 pl-10 pr-4 text-[15px] text-[#1A1A2E] placeholder-[#1A1A2E]/25 outline-none backdrop-blur-md transition-all focus:border-transparent focus:ring-2 focus:ring-[#FF6B9D]/40 focus:shadow-[0_8px_24px_-12px_rgba(255,107,157,0.5)]"
              />
            </div>

            {/* Active stories row */}
            <div className="mb-5">
              <span className="mb-3 block text-[12px] font-medium uppercase tracking-wide text-[#1A1A2E]/50">Active Now</span>
              <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none">
                {CONVOS.filter(c => c.online).map(c => (
                  <button key={c.id} className="flex flex-shrink-0 flex-col items-center gap-1.5 cursor-pointer">
                    <div className="story-ring h-[62px] w-[62px]">
                      <div className="story-ring-inner h-full w-full overflow-hidden rounded-full">
                        <SafeImage src={c.photo} name={c.name} alt={c.name} className="h-full w-full object-cover" />
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-[#1A1A2E]/60">{c.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex flex-col gap-0.5">
              {filtered.map((c, i) => (
                <button key={c.id}
                  className="animate-float-in relative flex w-full items-center gap-3.5 rounded-[22px] p-3.5 text-left transition-all hover:bg-white/55 active:scale-[0.99] cursor-pointer"
                  style={{ animationDelay: `${i * 50}ms` }}>
                  {c.pinned && (
                    <div className="absolute right-8 text-[#7B68EE]/40">
                      <Ic.Pin />
                    </div>
                  )}
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full">
                    <SafeImage src={c.photo} name={c.name} alt={c.name} className="h-full w-full object-cover" />
                    {c.online && <OnlineDot className="absolute bottom-0 right-0 h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[15px] ${c.unread > 0 ? 'font-semibold' : 'font-medium'} text-[#1A1A2E]`}>{c.name}</span>
                      <span className="text-[12px] text-[#1A1A2E]/40">{c.time}</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between">
                      <span className={`truncate text-[13px] ${c.unread > 0 ? 'text-[#1A1A2E]/65' : 'text-[#1A1A2E]/40'}`}>{c.lastMsg}</span>
                      {c.unread > 0 && (
                        <div className="ml-2 flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] px-1 text-[10px] font-bold text-white">
                          {c.unread}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
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
