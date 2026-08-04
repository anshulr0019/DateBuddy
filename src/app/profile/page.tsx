'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PEOPLE, COMMUNITIES, EVENTS } from '../data/mockData';
import { Ic } from '../components/icons';
import { AuroraBackground, GlassCard, OnlineDot, VerifiedBadge, GradientText, SafeImage } from '../components/shared';

export default function ProfilePage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'posts' | 'communities' | 'events'>('posts');

  const [profile, setProfile] = useState<{
    name: string;
    age: number;
    photo: string;
    photos: string[];
    bio: string;
    location: string;
    interests: string[];
    profession: string;
    education: string;
    verified: boolean;
  }>({
    name: '',
    age: 0,
    photo: '',
    photos: [],
    bio: '',
    location: '',
    interests: [],
    profession: '',
    education: '',
    verified: false,
  });

  const [stats, setStats] = useState({ connections: 4, communities: 3, posts: 8 });

  useEffect(() => {
    // Try fetching from API first, then fall back to localStorage
    async function loadProfile() {
      // Fetch dynamic stats from matches and meetups API
      try {
        const [matchesRes, meetupsRes] = await Promise.all([
          fetch('/api/matches').catch(() => null),
          fetch('/api/meetups').catch(() => null),
        ]);
        if (matchesRes) {
          const mData = await matchesRes.json();
          if (mData.success && mData.matches) {
            setStats(prev => ({ ...prev, connections: mData.matches.length }));
          }
        }
        if (meetupsRes) {
          const mtData = await meetupsRes.json();
          if (mtData.success && mtData.meetups) {
            setStats(prev => ({ ...prev, communities: mtData.meetups.length }));
          }
        }
      } catch {
        /* ignore */
      }

      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success && data.user) {
          const u = data.user;
          const photoUrl = u.photos?.[0]?.url || u.photo || '';
          const photoUrls = u.photos?.map((p: any) => p.url || p).filter(Boolean) || [];
          setProfile({
            name: u.name || 'User',
            age: u.age || (u.dateOfBirth ? new Date().getFullYear() - new Date(u.dateOfBirth).getFullYear() : 24),
            photo: photoUrl,
            photos: photoUrls.length > 0 ? photoUrls : [photoUrl],
            bio: u.bio || 'Living life one day at a time ✨',
            location: u.city || u.location || 'Mumbai',
            interests: u.interests || u.tags || [],
            profession: u.profession || 'Creative Professional',
            education: u.education || '',
            verified: u.verified ?? true,
          });
          return; // API data loaded successfully
        }
      } catch {
        /* fall through to localStorage */
      }

      // Fallback: load from localStorage onboarding data
      try {
        const basicInfo = JSON.parse(localStorage.getItem('onboarding_basic') || '{}');
        const photos = JSON.parse(localStorage.getItem('onboarding_photos') || '[]');
        const bioData = JSON.parse(localStorage.getItem('onboarding_bio') || '{}');
        const locationStr = localStorage.getItem('onboarding_location');
        const interests = JSON.parse(localStorage.getItem('onboarding_interests') || '[]');

        if (basicInfo.name) {
          let age = 24;
          if (basicInfo.dateOfBirth) {
            const dobYear = new Date(basicInfo.dateOfBirth).getFullYear();
            if (!isNaN(dobYear)) {
              age = new Date().getFullYear() - dobYear;
            }
          }

          const validPhotos = photos.filter((p: string) => p && p.trim().length > 0);

          setProfile((prev) => ({
            ...prev,
            name: basicInfo.name,
            age: age || 24,
            photo: validPhotos[0] || prev.photo,
            photos: validPhotos.length > 0 ? validPhotos : prev.photos,
            bio: bioData.bio || bioData.promptAnswer || prev.bio,
            location: locationStr || prev.location,
            interests: interests.length > 0 ? interests : prev.interests,
          }));
        }
      } catch (e) {
        console.warn('Could not load profile from localStorage', e);
      }
    }
    loadProfile();
  }, []);

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex-1 min-h-0 z-10 overflow-y-auto scrollbar-none pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
            {/* Hero */}
            <div className="relative h-64 w-full overflow-hidden">
              <SafeImage src={profile.photo} name={profile.name} alt={profile.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAF7] via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A2E]/30 to-transparent" />
              <div className="absolute left-4 top-6 flex gap-2">
                <button
                  onClick={() => router.push('/settings')}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all cursor-pointer active:scale-95"
                >
                  <Ic.Settings />
                </button>
              </div>
              <div className="absolute right-4 top-6">
                <button
                  onClick={() => router.push('/onboarding/basic-info')}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all cursor-pointer"
                >
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
                      <SafeImage src={profile.photo} name={profile.name} alt={profile.name} className="h-full w-full rounded-full object-cover" />
                    </div>
                  </div>
                  <OnlineDot className="absolute bottom-1 right-1 h-4 w-4" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push('/onboarding/basic-info')}
                    className="flex items-center gap-1.5 rounded-2xl border border-[#1A1A2E]/15 bg-white/80 px-4 py-2 text-[13px] font-medium text-[#1A1A2E] backdrop-blur-md hover:bg-white transition-all cursor-pointer shadow-sm"
                  >
                    <Ic.Edit />
                    Edit Profile
                  </button>
                </div>
              </div>

              {/* Name & info */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-[24px] font-semibold tracking-[-0.02em]">{profile.name}, {profile.age}</h2>
                  {profile.verified && <VerifiedBadge />}
                </div>
                <p className="text-[14px] text-[#1A1A2E]/55 mb-1">{profile.profession} · {profile.education}</p>
                <div className="flex items-center gap-1 text-[#1A1A2E]/45">
                  <Ic.MapPin />
                  <span className="text-[13px]">{profile.location}</span>
                </div>
              </div>

              {/* Dynamic Stats */}
              <GlassCard className="mb-4 p-4">
                <div className="grid grid-cols-3 divide-x divide-[#1A1A2E]/[0.06] text-center">
                  {[
                    [stats.connections.toString(), 'Connections'],
                    [stats.communities.toString(), 'Communities'],
                    [stats.posts.toString(), 'Posts'],
                  ].map(([n, l]) => (
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
                <p className="text-[14px] leading-relaxed text-[#1A1A2E]/75">{profile.bio}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.interests.map(t => (
                    <span key={t} className="rounded-full bg-[#FFF0F4] border border-[#F9C0D0]/60 px-3 py-1 text-[12px] font-medium text-[#F43F5E]">{t}</span>
                  ))}
                </div>
              </GlassCard>

              {/* Profile completion */}
              <GlassCard
                onClick={() => router.push('/onboarding/basic-info')}
                className="mb-4 p-5 cursor-pointer hover:border-[#F43F5E]/30 transition-all group active:scale-[0.99]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[14px] font-semibold flex items-center gap-1.5">
                    Profile Strength
                    <span className="text-[11px] font-normal text-[#F43F5E] opacity-0 group-hover:opacity-100 transition-opacity">→ Tap to complete</span>
                  </span>
                  <span className="text-[13px] font-semibold text-[#F43F5E]">78%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1A1A2E]/[0.08]">
                  <div className="h-full rounded-full bg-[#F43F5E] transition-all duration-500 w-[78%]" />
                </div>
                <p className="mt-2 text-[12px] text-[#1A1A2E]/45">Add 2 more prompts to boost your profile</p>
              </GlassCard>

              {/* Liquid Glass Content Tabs with Spring Sliding Indicator */}
              <div className="relative mb-4 flex gap-1 rounded-2xl bg-white/70 p-1.5 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(31,38,135,0.07)] overflow-hidden">
                <div
                  className="absolute top-1.5 h-[calc(100%-12px)] rounded-xl bg-white shadow-md border border-gray-200/60 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  style={{
                    width: 'calc((100% - 12px) / 3)',
                    left: 6,
                    transform: `translateX(${['posts', 'communities', 'events'].indexOf(activeSection) * 100}%)`,
                  }}
                />
                {(['posts', 'communities', 'events'] as const).map(s => (
                  <button key={s} onClick={() => setActiveSection(s)}
                    className={`relative z-10 flex-1 rounded-xl py-2 text-[13px] font-bold transition-all duration-200 capitalize cursor-pointer active:scale-95 select-none ${
                      activeSection === s ? 'text-[#F43F5E]' : 'text-[#1E293B]/50 hover:text-[#1E293B]'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Posts grid */}
              {activeSection === 'posts' && (
                <div className="grid grid-cols-3 gap-1.5 animate-popover-enter">
                  {[profile.photo, ...PEOPLE.slice(1, 6).map(p => p.photo)].map((src, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-[14px] border border-gray-200/50 shadow-2xs">
                      <SafeImage src={src} alt="" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'communities' && (
                <div className="flex flex-col gap-3 animate-popover-enter">
                  {COMMUNITIES.filter(c => c.joined).map(c => (
                    <GlassCard key={c.id} className="flex items-center gap-3.5 p-4 border border-gray-200/60 shadow-2xs hover:border-[#F43F5E]/30 transition-all">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl shadow-2xs">
                        <SafeImage src={c.photo} name={c.name} alt={c.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14.5px] font-bold text-[#1E293B] truncate">{c.name}</p>
                          <span className="px-2 py-0.5 rounded-full bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[10px] font-bold text-[#F43F5E]">Joined</span>
                        </div>
                        <p className="text-[12px] text-[#1E293B]/55 mt-0.5">{c.members} members</p>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}

              {activeSection === 'events' && (
                <div className="flex flex-col gap-3 animate-popover-enter">
                  {EVENTS.slice(0, 2).map(e => (
                    <GlassCard key={e.id} className="flex items-center gap-3.5 p-4 border border-gray-200/60 shadow-2xs hover:border-[#F43F5E]/30 transition-all">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[#F43F5E] shadow-2xs">
                        <Ic.Compass />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14.5px] font-bold text-[#1E293B] truncate">{e.title}</p>
                        <p className="text-[12px] text-[#1E293B]/55 mt-0.5">{e.date} · {e.attendees} attending</p>
                      </div>
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
