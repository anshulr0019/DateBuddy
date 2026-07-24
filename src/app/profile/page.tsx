'use client';

import { useState } from 'react';
import { PEOPLE, COMMUNITIES, EVENTS } from '../data/mockData';
import { Ic } from '../components/icons';
import { AuroraBackground, GlassCard, OnlineDot, VerifiedBadge, GradientText, SafeImage } from '../components/shared';
import FloatingNav from '../components/FloatingNav';

export default function ProfilePage() {
  const me = PEOPLE[0];
  const [activeSection, setActiveSection] = useState<'posts' | 'communities' | 'events'>('posts');

  return (
    <div className="h-[100dvh] w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[420px] flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex-1 min-h-0 z-10 overflow-y-auto scrollbar-none pb-28 animate-page-enter">
            {/* Hero */}
            <div className="relative h-64 w-full overflow-hidden">
              <SafeImage src={me.photo} name={me.name} alt={me.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAF7] via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A2E]/30 to-transparent" />
              <div className="absolute left-4 top-6 flex gap-2">
                <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all cursor-pointer">
                  <Ic.Settings />
                </button>
              </div>
              <div className="absolute right-4 top-6">
                <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all cursor-pointer">
                  <Ic.Edit />
                </button>
              </div>
            </div>

            {/* Profile info */}
            <div className="relative -mt-16 px-4">
              {/* Avatar */}
              <div className="mb-4 flex items-end justify-between">
                <div className="relative">
                  <div className="story-ring h-[88px] w-[88px]">
                    <div className="story-ring-inner h-full w-full overflow-hidden rounded-full">
                      <SafeImage src={me.photo} name={me.name} alt={me.name} className="h-full w-full rounded-full object-cover" />
                    </div>
                  </div>
                  <OnlineDot className="absolute bottom-1 right-1 h-4 w-4" />
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 rounded-2xl border border-[#1A1A2E]/15 bg-white/80 px-4 py-2 text-[13px] font-medium text-[#1A1A2E] backdrop-blur-md hover:bg-white transition-all cursor-pointer">
                    <Ic.Edit />
                    Edit Profile
                  </button>
                </div>
              </div>

              {/* Name & info */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-[24px] font-semibold tracking-[-0.02em]">{me.name}</h2>
                  {me.verified && <VerifiedBadge />}
                </div>
                <p className="text-[14px] text-[#1A1A2E]/55 mb-1">{me.profession} · {me.education}</p>
                <div className="flex items-center gap-1 text-[#1A1A2E]/45">
                  <Ic.MapPin />
                  <span className="text-[13px]">{me.location}</span>
                </div>
              </div>

              {/* Stats */}
              <GlassCard className="mb-4 p-4">
                <div className="grid grid-cols-3 divide-x divide-[#1A1A2E]/[0.06] text-center">
                  {[['284', 'Connections'], ['12', 'Communities'], ['47', 'Posts']].map(([n, l]) => (
                    <div key={l} className="px-4">
                      <p className="text-[20px] font-semibold tracking-[-0.02em]">
                        <GradientText>{n}</GradientText>
                      </p>
                      <p className="text-[11px] text-[#1A1A2E]/50 mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Bio */}
              <GlassCard className="mb-4 p-5">
                <p className="text-[14px] leading-relaxed text-[#1A1A2E]/70">{me.bio}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {me.tags.map(t => (
                    <span key={t} className="rounded-full bg-[#FF6B9D]/10 px-3 py-1 text-[12px] font-medium text-[#FF6B9D]">{t}</span>
                  ))}
                </div>
              </GlassCard>

              {/* Profile completion */}
              <GlassCard className="mb-4 p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[14px] font-semibold">Profile Strength</span>
                  <span className="text-[13px] font-semibold text-[#FF6B9D]">78%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1A1A2E]/[0.08]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] transition-all duration-500 w-[78%]" />
                </div>
                <p className="mt-2 text-[12px] text-[#1A1A2E]/45">Add 2 more prompts to boost your profile</p>
              </GlassCard>

              {/* Content tabs */}
              <div className="mb-4 flex gap-1 rounded-2xl bg-white/60 p-1 backdrop-blur-md">
                {(['posts', 'communities', 'events'] as const).map(s => (
                  <button key={s} onClick={() => setActiveSection(s)}
                    className={`flex-1 rounded-xl py-2 text-[13px] font-medium transition-all capitalize cursor-pointer ${
                      activeSection === s ? 'bg-white shadow-sm text-[#1A1A2E]' : 'text-[#1A1A2E]/45'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Posts grid */}
              {activeSection === 'posts' && (
                <div className="grid grid-cols-3 gap-1.5">
                  {[me.photo, ...PEOPLE.slice(1, 6).map(p => p.photo)].map((src, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-[14px]">
                      <SafeImage src={src} alt="" className="h-full w-full object-cover transition-transform hover:scale-105" />
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'communities' && (
                <div className="flex flex-col gap-3">
                  {COMMUNITIES.filter(c => c.joined).map(c => (
                    <GlassCard key={c.id} className="flex items-center gap-3 p-4">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl">
                        <SafeImage src={c.photo} name={c.name} alt={c.name} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold">{c.emoji} {c.name}</p>
                        <p className="text-[12px] text-[#1A1A2E]/50">{c.members} members</p>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}

              {activeSection === 'events' && (
                <div className="flex flex-col gap-3">
                  {EVENTS.slice(0, 2).map(e => (
                    <GlassCard key={e.id} className="flex items-center gap-3 p-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B9D]/15 to-[#7B68EE]/15 text-2xl">
                        {e.emoji}
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold">{e.title}</p>
                        <p className="text-[12px] text-[#1A1A2E]/50">{e.date}</p>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          </div>
        </AuroraBackground>
        {/* STATIC FOOTER NAVIGATION */}
        <FloatingNav />
      </div>
    </div>
  );
}
