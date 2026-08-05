'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Ic } from '../components/icons';
import { AuroraBackground, GlassCard, VerifiedBadge, GradientText, SafeImage, Skeleton } from '../components/shared';

/* ─────────────────────────────────────────────────
   Types & helpers
───────────────────────────────────────────────── */

interface ApiPhoto {
  id?: number;
  url?: string;
  orderIndex?: number;
}

interface Profile {
  name: string;
  age: number | null;
  photo: string;
  photos: string[];
  bio: string;
  location: string;
  interests: string[];
  profession: string;
  education: string;
  verified: boolean;
}

const EMPTY_PROFILE: Profile = {
  name: '',
  age: null,
  photo: '',
  photos: [],
  bio: '',
  location: '',
  interests: [],
  profession: '',
  education: '',
  verified: false,
};

function calcAge(dob: unknown): number | null {
  if (!dob || (typeof dob !== 'string' && !(dob instanceof Date))) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age > 0 && age < 120 ? age : null;
}

interface StrengthResult {
  percent: number;
  hint: string;
  route: string;
}

function calcStrength(p: Profile): StrengthResult {
  let percent = 0;
  percent += Math.min(p.photos.length, 3) * 10; // up to 30
  if (p.bio.trim().length >= 20) percent += 20;
  if (p.interests.length >= 3) percent += 15;
  else if (p.interests.length > 0) percent += 8;
  if (p.verified) percent += 15;
  if (p.location) percent += 10;
  if (p.age !== null) percent += 10;

  if (p.photos.length < 3) {
    const n = 3 - p.photos.length;
    return { percent, hint: `Add ${n} more photo${n > 1 ? 's' : ''} to boost your profile`, route: '/onboarding/photos' };
  }
  if (p.bio.trim().length < 20) {
    return { percent, hint: 'Write a short bio so people get to know you', route: '/onboarding/bio' };
  }
  if (p.interests.length < 3) {
    return { percent, hint: 'Add a few interests to get better matches', route: '/onboarding/interests' };
  }
  if (!p.verified) {
    return { percent, hint: 'Verify your profile to earn the badge', route: '/verification' };
  }
  if (percent < 100) {
    return { percent, hint: 'Complete your basic info to reach 100%', route: '/onboarding/basic-info' };
  }
  return { percent: 100, hint: 'Your profile is complete', route: '/onboarding/basic-info' };
}

const TABS = [
  { id: 'photos', label: 'Photos' },
  { id: 'communities', label: 'Communities' },
  { id: 'events', label: 'Events' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/* ─────────────────────────────────────────────────
   Page
───────────────────────────────────────────────── */

export default function ProfilePage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<TabId>('photos');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isCached, setIsCached] = useState(false);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [connections, setConnections] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    // Connections count loads independently — a failure here never blocks the page
    fetch('/api/matches', { signal })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.success && Array.isArray(data.matches)) setConnections(data.matches.length);
      })
      .catch(() => {});

    async function loadProfile() {
      setStatus('loading');
      setIsCached(false);
      try {
        const res = await fetch('/api/auth/me', { signal });

        if (res.status === 401) {
          // Session expired or account deleted — never show stale local data.
          // ?switch=true stops the middleware bouncing the stale cookie back to /discover.
          router.replace('/welcome?switch=true');
          return;
        }

        const data = await res.json();
        if (!res.ok || !data.success || !data.user) {
          throw new Error(data?.message || `Request failed (${res.status})`);
        }

        const u = data.user;
        const sortedPhotos: string[] = Array.isArray(u.photos)
          ? [...(u.photos as ApiPhoto[])]
              .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
              .map(p => p.url)
              .filter((url): url is string => Boolean(url))
          : [];

        setProfile({
          name: u.name || '',
          age: calcAge(u.dateOfBirth),
          photo: sortedPhotos[0] || '',
          photos: sortedPhotos,
          bio: u.bio || '',
          location: u.city || '',
          interests: Array.isArray(u.interests)
            ? Array.from(new Set(u.interests.filter((i: unknown) => typeof i === 'string')))
            : [],
          profession: u.profession || '',
          education: u.education || '',
          verified: u.isVerified ?? false,
        });
        setStatus('ready');
        return;
      } catch {
        if (signal.aborted) return;
      }

      // Network failure only: fall back to locally saved onboarding data, labeled as cached
      try {
        const basicInfo = JSON.parse(localStorage.getItem('onboarding_basic') || '{}');
        if (basicInfo.name) {
          const photos = (JSON.parse(localStorage.getItem('onboarding_photos') || '[]') as string[]).filter(
            p => typeof p === 'string' && p.trim().length > 0
          );
          const bioData = JSON.parse(localStorage.getItem('onboarding_bio') || '{}');
          const interests = (JSON.parse(localStorage.getItem('onboarding_interests') || '[]') as string[]).filter(
            i => typeof i === 'string'
          );

          setProfile({
            ...EMPTY_PROFILE,
            name: basicInfo.name,
            age: calcAge(basicInfo.dateOfBirth),
            photo: photos[0] || '',
            photos,
            bio: bioData.bio || bioData.promptAnswer || '',
            location: localStorage.getItem('onboarding_location') || '',
            interests: Array.from(new Set(interests)),
          });
          setIsCached(true);
          setStatus('ready');
          return;
        }
      } catch {
        /* corrupt local data — fall through to error state */
      }

      setStatus('error');
    }

    loadProfile();
    return () => controller.abort();
  }, [reloadKey, router]);

  const strength = useMemo(() => calcStrength(profile), [profile]);

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const idx = TABS.findIndex(t => t.id === activeSection);
      const next = e.key === 'ArrowRight' ? (idx + 1) % TABS.length : (idx + TABS.length - 1) % TABS.length;
      setActiveSection(TABS[next].id);
      document.getElementById(`profile-tab-${TABS[next].id}`)?.focus();
    },
    [activeSection]
  );

  const subtitle = [profile.profession, profile.education].filter(Boolean).join(' · ');

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex-1 min-h-0 z-10 overflow-y-auto scrollbar-none pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
            {status === 'loading' && <ProfileSkeleton />}

            {status === 'error' && (
              <div className="flex h-full items-center justify-center px-6">
                <GlassCard className="w-full p-8 text-center">
                  <p className="text-[40px] mb-3" aria-hidden>📡</p>
                  <h1 className="text-[18px] font-semibold text-[#1A1A2E] mb-1.5">Couldn&apos;t load your profile</h1>
                  <p className="text-[13px] text-[#1A1A2E]/60 mb-6">Check your connection and try again.</p>
                  <button
                    onClick={() => setReloadKey(k => k + 1)}
                    className="h-12 w-full rounded-2xl bg-[#F43F5E] hover:bg-[#E11D48] text-[15px] font-semibold text-white transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    Retry
                  </button>
                </GlassCard>
              </div>
            )}

            {status === 'ready' && (
              <>
                {/* Hero */}
                <div className="relative h-64 w-full overflow-hidden">
                  <SafeImage src={profile.photo} name={profile.name} alt="" eager className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAF7] via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A2E]/30 to-transparent" />
                  <div className="absolute left-4 top-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
                    <button
                      onClick={() => router.push('/settings')}
                      aria-label="Settings"
                      className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all cursor-pointer active:scale-95"
                    >
                      <Ic.Settings />
                    </button>
                  </div>
                  <div className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
                    <button
                      onClick={() => router.push('/onboarding/basic-info')}
                      aria-label="Edit profile"
                      className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all cursor-pointer active:scale-95"
                    >
                      <Ic.Edit />
                    </button>
                  </div>
                </div>

                {/* Profile info */}
                <div className="relative -mt-16 px-4">
                  {isCached && (
                    <div className="mb-3 flex items-center justify-center rounded-2xl border border-[#F9C0D0]/60 bg-[#FFF0F4]/90 px-4 py-2 backdrop-blur-md" role="status">
                      <span className="text-[12px] font-medium text-[#1A1A2E]/70">Offline — showing your saved profile</span>
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="mb-4 flex items-end justify-between">
                    <div className="story-ring h-[88px] w-[88px]">
                      <div className="story-ring-inner h-full w-full overflow-hidden rounded-full">
                        <SafeImage src={profile.photo} name={profile.name} alt="" eager className="h-full w-full rounded-full object-cover" />
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/onboarding/basic-info')}
                      className="flex min-h-[44px] items-center gap-1.5 rounded-2xl border border-[#1A1A2E]/15 bg-white/80 px-4 py-2 text-[13px] font-medium text-[#1A1A2E] backdrop-blur-md hover:bg-white transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      <Ic.Edit />
                      Edit Profile
                    </button>
                  </div>

                  {/* Name & info */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[#1A1A2E]">
                        {profile.name}
                        {profile.age !== null && `, ${profile.age}`}
                      </h1>
                      {profile.verified && (
                        <span role="img" aria-label="Verified profile">
                          <VerifiedBadge />
                        </span>
                      )}
                    </div>
                    {subtitle && <p className="text-[14px] text-[#1A1A2E]/60 mb-1">{subtitle}</p>}
                    {profile.location && (
                      <div className="flex items-center gap-1 text-[#1A1A2E]/60">
                        <Ic.MapPin />
                        <span className="text-[13px]">{profile.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats — real data only */}
                  <GlassCard className="mb-4 p-4">
                    <div className="grid grid-cols-3 divide-x divide-[#1A1A2E]/[0.06] text-center">
                      {[
                        [connections === null ? '—' : String(connections), 'Connections'],
                        [String(profile.photos.length), 'Photos'],
                        [String(profile.interests.length), 'Interests'],
                      ].map(([n, l]) => (
                        <div key={l} className="px-4">
                          <p className="text-[20px] font-semibold tracking-[-0.02em]">
                            <GradientText>{n}</GradientText>
                          </p>
                          <p className="text-[11px] text-[#1A1A2E]/65 mt-0.5">{l}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  {/* Bio & interests */}
                  <GlassCard className="mb-4 p-5">
                    {profile.bio ? (
                      <p className="text-[14px] leading-relaxed text-[#1A1A2E]/75">{profile.bio}</p>
                    ) : (
                      <button
                        onClick={() => router.push('/onboarding/bio')}
                        className="flex min-h-[44px] w-full items-center gap-2 text-[14px] text-[#F43F5E] font-medium cursor-pointer"
                      >
                        <Ic.Plus />
                        Write a bio — profiles with bios get more matches
                      </button>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.interests.map(t => (
                        <span key={t} className="rounded-full bg-[#FFF0F4] border border-[#F9C0D0]/60 px-3 py-1 text-[12px] font-medium text-[#F43F5E]">
                          {t}
                        </span>
                      ))}
                      <button
                        onClick={() => router.push('/onboarding/interests')}
                        aria-label="Add interests"
                        className="flex items-center gap-1 rounded-full border border-dashed border-[#1A1A2E]/25 px-3 py-1 text-[12px] font-medium text-[#1A1A2E]/60 hover:border-[#F43F5E]/50 hover:text-[#F43F5E] transition-all cursor-pointer"
                      >
                        <Ic.Plus />
                        {profile.interests.length === 0 ? 'Add interests' : 'Add'}
                      </button>
                    </div>
                  </GlassCard>

                  {/* Profile completion — computed from real profile data */}
                  <button
                    onClick={() => router.push(strength.route)}
                    className="mb-4 block w-full rounded-[24px] border border-white/80 bg-white/80 p-5 text-left shadow-[0_10px_30px_-15px_rgba(26,26,46,0.08)] backdrop-blur-md cursor-pointer hover:border-[#F43F5E]/30 transition-all active:scale-[0.99]"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[14px] font-semibold text-[#1A1A2E]">Profile Strength</span>
                      <span className="text-[13px] font-semibold text-[#F43F5E]">{strength.percent}%</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={strength.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Profile strength"
                      className="h-1.5 w-full overflow-hidden rounded-full bg-[#1A1A2E]/[0.08]"
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#F43F5E] to-[#FB7185] transition-all duration-500"
                        style={{ width: `${strength.percent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[12px] text-[#1A1A2E]/60">
                      {strength.hint}
                      {strength.percent < 100 && <span className="text-[#F43F5E] font-medium"> →</span>}
                    </p>
                  </button>

                  {/* Content tabs */}
                  <div
                    role="tablist"
                    aria-label="Profile sections"
                    onKeyDown={handleTabKeyDown}
                    className="relative mb-4 flex gap-1 rounded-2xl bg-white/70 p-1.5 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(31,38,135,0.07)] overflow-hidden"
                  >
                    <div
                      aria-hidden
                      className="absolute top-1.5 h-[calc(100%-12px)] rounded-xl bg-white shadow-md border border-[#1A1A2E]/10 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                      style={{
                        width: 'calc((100% - 12px) / 3)',
                        left: 6,
                        transform: `translateX(${TABS.findIndex(t => t.id === activeSection) * 100}%)`,
                      }}
                    />
                    {TABS.map(t => (
                      <button
                        key={t.id}
                        id={`profile-tab-${t.id}`}
                        role="tab"
                        aria-selected={activeSection === t.id}
                        aria-controls={`profile-panel-${t.id}`}
                        tabIndex={activeSection === t.id ? 0 : -1}
                        onClick={() => setActiveSection(t.id)}
                        className={`relative z-10 min-h-[44px] flex-1 rounded-xl py-2 text-[13px] font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none ${
                          activeSection === t.id ? 'text-[#F43F5E]' : 'text-[#1A1A2E]/60 hover:text-[#1A1A2E]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Photos */}
                  {activeSection === 'photos' && (
                    <div id="profile-panel-photos" role="tabpanel" aria-labelledby="profile-tab-photos" className="animate-popover-enter">
                      {profile.photos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {profile.photos.map((src, i) => (
                            <div key={`${src}-${i}`} className="aspect-square overflow-hidden rounded-2xl border border-[#1A1A2E]/10 shadow-2xs">
                              <SafeImage src={src} alt={`Photo ${i + 1} of ${profile.photos.length}`} className="h-full w-full object-cover" />
                            </div>
                          ))}
                          {profile.photos.length < 6 && (
                            <button
                              onClick={() => router.push('/onboarding/photos')}
                              aria-label="Add photo"
                              className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-[#1A1A2E]/20 text-[#1A1A2E]/45 hover:border-[#F43F5E]/50 hover:text-[#F43F5E] transition-all cursor-pointer"
                            >
                              <Ic.Plus />
                            </button>
                          )}
                        </div>
                      ) : (
                        <EmptyState
                          emoji="📸"
                          title="No photos yet"
                          subtitle="Profiles with photos get way more attention"
                          cta="Add photos"
                          onCta={() => router.push('/onboarding/photos')}
                        />
                      )}
                    </div>
                  )}

                  {/* Communities */}
                  {activeSection === 'communities' && (
                    <div id="profile-panel-communities" role="tabpanel" aria-labelledby="profile-tab-communities" className="animate-popover-enter">
                      <EmptyState
                        emoji="🫶"
                        title="No communities yet"
                        subtitle="Find your people — join a community that shares your vibe"
                        cta="Explore communities"
                        onCta={() => router.push('/home')}
                      />
                    </div>
                  )}

                  {/* Events */}
                  {activeSection === 'events' && (
                    <div id="profile-panel-events" role="tabpanel" aria-labelledby="profile-tab-events" className="animate-popover-enter">
                      <EmptyState
                        emoji="🗓️"
                        title="No upcoming events"
                        subtitle="Meet people in real life at meetups near you"
                        cta="Explore meetups"
                        onCta={() => router.push('/meetups')}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </AuroraBackground>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Local pieces
───────────────────────────────────────────────── */

function EmptyState({
  emoji,
  title,
  subtitle,
  cta,
  onCta,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <GlassCard className="p-8 text-center">
      <p className="text-[36px] mb-2" aria-hidden>{emoji}</p>
      <p className="text-[15px] font-semibold text-[#1A1A2E] mb-1">{title}</p>
      <p className="text-[13px] text-[#1A1A2E]/60 mb-5">{subtitle}</p>
      <button
        onClick={onCta}
        className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-[#F43F5E] hover:bg-[#E11D48] px-6 text-[14px] font-semibold text-white transition-all duration-200 active:scale-95 cursor-pointer"
      >
        {cta}
      </button>
    </GlassCard>
  );
}

function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading profile">
      <div className="animate-skeleton h-64 w-full" />
      <div className="relative -mt-16 px-4">
        <div className="mb-4 flex items-end justify-between">
          <Skeleton className="h-[88px] w-[88px] rounded-full" />
          <Skeleton className="h-11 w-32" />
        </div>
        <Skeleton className="mb-2 h-7 w-48" />
        <Skeleton className="mb-4 h-4 w-36" />
        <Skeleton className="mb-4 h-[88px] w-full rounded-[24px]" />
        <Skeleton className="mb-4 h-32 w-full rounded-[24px]" />
        <Skeleton className="mb-4 h-24 w-full rounded-[24px]" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
