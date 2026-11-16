'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Ic } from '../components/icons';
import { INTEREST_OPTIONS, plainInterest } from '@/lib/interest-label';
import { BottomSheet } from '../components/BottomSheet';
import { AuroraBackground, GlassCard, VerifiedBadge, GradientText, SafeImage, Skeleton } from '../components/shared';
import { hapticLight } from '../lib/haptics';
import {
  type CachedUserProfile,
  getCachedUserProfile,
  invalidateUserProfileCache,
  loadUserProfile,
  UserProfileRequestError,
} from '../lib/userProfileCache';

/* ─────────────────────────────────────────────────
   Types & helpers
───────────────────────────────────────────────── */

interface Profile {
  name: string;
  age: number | null;
  photo: string;
  photos: string[];
  bio: string;
  location: string;
  interests: string[];
  prompts: { question: string; answer: string }[];
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
  prompts: [],
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

function profileFromUser(u: CachedUserProfile): Profile {
  const sortedPhotos = Array.isArray(u.photos)
    ? u.photos.filter((url): url is string => typeof url === 'string' && url.length > 0)
    : [];
  return {
    name: u.name || '',
    age: calcAge(u.dateOfBirth),
    photo: sortedPhotos[0] || '',
    photos: sortedPhotos,
    bio: typeof u.bio === 'string' ? u.bio : '',
    location: typeof u.city === 'string' ? u.city : '',
    interests: Array.isArray(u.interests)
      ? Array.from(new Set(u.interests.filter((interest): interest is string => typeof interest === 'string')))
      : [],
    prompts: Array.isArray(u.prompts) ? u.prompts : [],
    profession: typeof u.profession === 'string' ? u.profession : '',
    education: typeof u.education === 'string' ? u.education : '',
    verified: u.isVerified ?? false,
  };
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
    return { percent, hint: 'Write a short bio so people get to know you', route: 'edit' };
  }
  if (p.interests.length < 3) {
    return { percent, hint: 'Add a few interests to get better matches', route: 'edit' };
  }
  if (!p.verified) {
    return { percent, hint: 'Verify your profile to earn the badge', route: '/verification' };
  }
  if (percent < 100) {
    return { percent, hint: 'Complete your basic info to reach 100%', route: 'edit' };
  }
  return { percent: 100, hint: 'Your profile is complete', route: 'edit' };
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

let cachedConnections: number | null = null;
let cachedIsGold = false;

export default function ProfilePage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<TabId>('photos');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(() =>
    getCachedUserProfile() ? 'ready' : 'loading'
  );
  const [isCached, setIsCached] = useState(false);
  const [profile, setProfile] = useState<Profile>(() => {
    const cached = getCachedUserProfile();
    return cached ? profileFromUser(cached) : EMPTY_PROFILE;
  });
  const [connections, setConnections] = useState<number | null>(cachedConnections);
  const [reloadKey, setReloadKey] = useState(0);
  const [myMeetups, setMyMeetups] = useState<{ id: number; title: string; category: string; date: string; venueName: string | null; userJoinStatus: string | null }[]>([]);
  const [meetupsLoading, setMeetupsLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState({ name: '', bio: '', city: '', interests: [] as string[] });
  const [editError, setEditError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [photoLightboxOpen, setPhotoLightboxOpen] = useState(false);
  const [isGold, setIsGold] = useState(cachedIsGold);

  const openEditor = useCallback(() => {
    setEditDraft({
      name: profile.name,
      bio: profile.bio,
      city: profile.location,
      interests: profile.interests,
    });
    setEditError('');
    setIsEditing(true);
  }, [profile]);

  const saveProfile = useCallback(async () => {
    if (!editDraft.name.trim()) {
      setEditError('Name cannot be empty');
      return;
    }
    if (!editDraft.city.trim()) {
      setEditError('City cannot be empty');
      return;
    }
    setIsSaving(true);
    setEditError('');
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editDraft.name.trim(),
          bio: editDraft.bio.trim(),
          city: editDraft.city.trim(),
          interests: editDraft.interests,
        }),
      });
      if (res.status === 401) {
        router.replace('/welcome?switch=true');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setEditError(data.message || 'Could not save your changes');
        return;
      }
      invalidateUserProfileCache();
      setIsEditing(false);
      setReloadKey(k => k + 1);
    } catch {
      setEditError('Network error. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  }, [editDraft, router]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    // Connections count loads independently — a failure here never blocks the page
    fetch('/api/matches?countOnly=true', { signal })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.success && typeof data.count === 'number') {
          cachedConnections = data.count; setConnections(data.count);
        }
      })
      .catch(() => {});

    fetch('/api/premium/status', { signal })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.success && d.subscription?.isActive) {
          cachedIsGold = true; setIsGold(true);
        }
      })
      .catch(() => {});

    async function loadProfile() {
      const cached = getCachedUserProfile();
      if (!cached) setStatus('loading');
      setIsCached(Boolean(cached));
      try {
        const user = await loadUserProfile({ force: reloadKey > 0 });
        if (signal.aborted) return;
        setProfile(profileFromUser(user));
        setIsCached(false);
        setStatus('ready');
        return;
      } catch (error) {
        if (signal.aborted) return;
        if (error instanceof UserProfileRequestError && error.status === 401) {
          router.replace('/welcome?switch=true');
          return;
        }
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
            prompts: Array.isArray(bioData.selectedPrompts)
              ? bioData.selectedPrompts.map((p: any) => ({ question: p.prompt || p.question, answer: p.answer }))
              : [],
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

  // Load user's joined meetups when Events tab is active
  useEffect(() => {
    if (activeSection !== 'events') return;
    setMeetupsLoading(true);
    fetch('/api/meetups')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success && Array.isArray(data.meetups)) {
          // Show meetups where the user has joined or has pending status
          setMyMeetups(data.meetups.filter((m: { userJoinStatus: string | null }) => m.userJoinStatus !== null));
        }
      })
      .catch(() => {})
      .finally(() => setMeetupsLoading(false));
  }, [activeSection, reloadKey]);

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
    <div className="h-dvh w-full min-h-screen bg-infyn-paper flex justify-center overflow-hidden font-sans">
      <div className="infyn-screen-arrive relative h-full w-full max-w-[440px] sm:max-w-[480px] md:max-w-[540px] flex flex-col justify-between bg-infyn-paper shadow-2xl sm:border-x sm:border-infyn-ink/5 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex-1 min-h-0 z-10 overflow-y-auto scrollbar-none pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
            {status === 'loading' && <ProfileSkeleton />}

            {status === 'error' && (
              <div className="flex h-full items-center justify-center px-6">
                <GlassCard className="w-full p-8 text-center">
                  <p className="text-[40px] mb-3" aria-hidden>📡</p>
                  <h1 className="text-[18px] font-normal text-infyn-ink mb-1.5 font-display">Couldn&apos;t load your profile</h1>
                  <p className="text-[13px] text-infyn-ink/60 mb-6">Check your connection and try again.</p>
                  <button
                    onClick={() => setReloadKey(k => k + 1)}
                    className="h-12 w-full rounded-2xl bg-infyn-rose hover:bg-[#E11D48] text-[15px] font-semibold text-white transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    Retry
                  </button>
                </GlassCard>
              </div>
            )}

            {status === 'ready' && (
              <>
                {/* Hero — taller, like Hinge/Instagram */}
                <div
                  className="relative w-full overflow-hidden cursor-pointer group"
                  style={{ height: 'min(42dvh, 360px)' }}
                  onClick={() => profile.photo && setPhotoLightboxOpen(true)}
                  role="button"
                  tabIndex={0}
                  aria-label="View your photo"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (profile.photo) setPhotoLightboxOpen(true); } }}
                >
                  <SafeImage src={profile.photo} fallbackSrcs={profile.photos?.slice(1)} name={profile.name} alt="" eager className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-infyn-paper via-infyn-paper/10 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/35 to-transparent pointer-events-none" />
                  <div className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
                    <button
                      onClick={e => { e.stopPropagation(); router.push('/settings'); }}
                      aria-label="Settings"
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-infyn-ink/35 text-white active:scale-95 transition-transform cursor-pointer"
                    >
                      <Ic.Settings />
                    </button>
                  </div>
                </div>

                {/* Profile info */}
                <div className="relative -mt-16 px-4">
                  {isCached && (
                    <div className="mb-3 flex items-center justify-center rounded-2xl border border-infyn-rose-line/60 bg-infyn-blush/90 px-4 py-2 backdrop-blur-md" role="status">
                      <span className="text-[12px] font-medium text-infyn-ink/70">Offline — showing your saved profile</span>
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="mb-4 flex items-end justify-between">
                    <button
                      onClick={() => profile.photo && setPhotoLightboxOpen(true)}
                      aria-label="View your photo"
                      className="story-ring h-[88px] w-[88px] cursor-pointer active:scale-[0.97] transition-all duration-300"
                    >
                      <div className="story-ring-inner h-full w-full overflow-hidden rounded-full shadow-lg">
                        <SafeImage src={profile.photo} fallbackSrcs={profile.photos?.slice(1)} name={profile.name} alt="" eager className="h-full w-full rounded-full object-cover" />
                      </div>
                    </button>
                    <button
                      onClick={openEditor}
                      className="flex min-h-[44px] items-center gap-2 rounded-full border border-infyn-border bg-infyn-surface px-5 text-[14px] font-semibold text-infyn-ink active:scale-[0.97] transition-transform cursor-pointer"
                    >
                      <Ic.Edit />
                      Edit profile
                    </button>
                  </div>

                  {/* Name & info */}
                    <div className="mb-4">
                      {isGold && (
                        <div
                          className="inline-flex items-center gap-1.5 mb-2.5"
                          style={{
                            background: 'var(--infyn-dark)',
                            border: '1px solid rgba(255,255,255,0.13)',
                            borderRadius: 100,
                            padding: '4px 12px 4px 9px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                          }}
                        >
                          <div style={{
                            width: 16, height: 16, borderRadius: 6,
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, flexShrink: 0,
                          }}>
                            ◆
                          </div>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.75)',
                          }}>
                            VIP Gold
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-[24px] font-normal tracking-[-0.02em] text-infyn-ink font-display">
                          {profile.name}
                          {profile.age !== null && `, ${profile.age}`}
                        </h1>
                        {profile.verified && (
                          <span role="img" aria-label="Verified profile">
                            <VerifiedBadge />
                          </span>
                        )}
                      </div>
                      {subtitle && <p className="text-[14px] text-infyn-ink/60 mb-1">{subtitle}</p>}
                      {profile.location && (
                        <div className="flex items-center gap-1 text-infyn-ink/60">
                          <Ic.MapPin />
                          <span className="text-[13px]">{profile.location}</span>
                        </div>
                      )}
                    </div>

                  {/* Stats — real data only */}
                  <GlassCard className="mb-4 p-4">
                    <div className="grid grid-cols-3 divide-x divide-infyn-border/[0.06] text-center">
                      {[
                        [connections === null ? '—' : String(connections), 'Connections'],
                        [String(profile.photos.length), 'Photos'],
                        [String(profile.interests.length), 'Interests'],
                      ].map(([n, l]) => (
                        <div key={l} className="px-4">
                          <p className="text-[20px] font-semibold tracking-[-0.02em]">
                            <GradientText>{n}</GradientText>
                          </p>
                          <p className="text-[11px] text-infyn-ink/65 mt-0.5">{l}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  {/* Bio & interests */}
                  <GlassCard className="mb-4 p-5">
                    {profile.bio ? (
                      <p className="text-[14px] leading-relaxed text-infyn-ink/75">{profile.bio}</p>
                    ) : (
                      <button
                        onClick={openEditor}
                        className="flex min-h-[44px] w-full items-center gap-2 text-[14px] text-infyn-rose font-medium cursor-pointer"
                      >
                        <Ic.Plus />
                        Write a bio — profiles with bios get more matches
                      </button>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.interests.map(t => (
                        <span key={t} className="rounded-full bg-infyn-blush border border-infyn-rose-line/60 px-3 py-1 text-[12px] font-medium text-infyn-rose">
                          {t}
                        </span>
                      ))}
                      <button
                        onClick={openEditor}
                        aria-label="Add interests"
                        className="flex items-center gap-1 rounded-full border border-dashed border-infyn-ink/25 px-3 py-1 text-[12px] font-medium text-infyn-ink/60 hover:border-infyn-rose/50 hover:text-infyn-rose transition-all cursor-pointer"
                      >
                        <Ic.Plus />
                        {profile.interests.length === 0 ? 'Add interests' : 'Add'}
                      </button>
                    </div>
                  </GlassCard>

                  {/* Profile Prompts */}
                  {profile.prompts.length > 0 && (
                    <div className="mb-4 space-y-3">
                      {profile.prompts.map((p, i) => (
                        <GlassCard key={i} className="p-4 border border-infyn-rose/15 bg-gradient-to-br from-white/90 to-infyn-blush/40">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-infyn-rose mb-1.5">{p.question}</p>
                          <p className="text-[14px] font-medium text-infyn-ink leading-snug">{p.answer}</p>
                        </GlassCard>
                      ))}
                    </div>
                  )}

                  {/* Profile completion — computed from real profile data */}
                  <button
                    onClick={() => (strength.route === 'edit' ? openEditor() : router.push(strength.route))}
                    className="mb-4 block w-full rounded-[24px] border border-infyn-border/80 bg-infyn-surface/80 p-5 text-left shadow-[0_10px_30px_-15px_rgba(32,26,22,0.08)] backdrop-blur-md cursor-pointer hover:border-infyn-rose/30 transition-all active:scale-[0.99]"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[14px] font-semibold text-infyn-ink">Profile Strength</span>
                      <span className="text-[13px] font-semibold text-infyn-rose">{strength.percent}%</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={strength.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Profile strength"
                      className="h-1.5 w-full overflow-hidden rounded-full bg-infyn-ink/[0.08]"
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-infyn-rose to-infyn-rose transition-all duration-500"
                        style={{ width: `${strength.percent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[12px] text-infyn-ink/60">
                      {strength.hint}
                      {strength.percent < 100 && <span className="text-infyn-rose font-medium"> →</span>}
                    </p>
                  </button>

                  {/* Content tabs */}
                  <div
                    role="tablist"
                    aria-label="Profile sections"
                    onKeyDown={handleTabKeyDown}
                    className="relative mb-4 flex gap-1 rounded-2xl bg-infyn-surface/70 p-1.5 backdrop-blur-xl border border-infyn-border/80 shadow-[0_8px_32px_rgba(31,38,135,0.07)] overflow-hidden"
                  >
                    <div
                      aria-hidden
                      className="absolute top-1.5 h-[calc(100%-12px)] rounded-xl bg-infyn-surface shadow-md border border-infyn-ink/10 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
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
                        onClick={() => { hapticLight(); setActiveSection(t.id); }}
                        className={`relative z-10 min-h-[44px] flex-1 rounded-xl py-2 text-[13px] font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none ${
                          activeSection === t.id ? 'text-infyn-rose' : 'text-infyn-ink/60 hover:text-infyn-ink'
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
                            <div key={`${src}-${i}`} className="aspect-square overflow-hidden rounded-2xl border border-infyn-ink/10 shadow-2xs">
                              <SafeImage src={src} alt={`Photo ${i + 1} of ${profile.photos.length}`} className="h-full w-full object-cover" />
                            </div>
                          ))}
                          {profile.photos.length < 6 && (
                            <button
                              onClick={() => router.push('/onboarding/photos')}
                              aria-label="Add photo"
                              className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-infyn-ink/20 text-infyn-ink/45 hover:border-infyn-rose/50 hover:text-infyn-rose transition-all cursor-pointer"
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
                      {meetupsLoading ? (
                        <div className="space-y-3">
                          {[1, 2].map(i => (
                            <div key={i} className="h-20 rounded-2xl bg-infyn-ink/[0.04] animate-pulse" />
                          ))}
                        </div>
                      ) : myMeetups.length > 0 ? (
                        <div className="space-y-3">
                          {myMeetups.map(m => {
                            const d = new Date(m.date);
                            const when = d.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
                            const isPending = m.userJoinStatus === 'pending';
                            return (
                              <button
                                key={m.id}
                                onClick={() => router.push(`/meetups/${m.id}`)}
                                className="w-full text-left rounded-2xl border border-infyn-ink/10 bg-infyn-surface/80 backdrop-blur-md p-4 shadow-sm hover:border-infyn-rose/30 transition-all active:scale-[0.99] cursor-pointer"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-semibold text-infyn-ink truncate">{m.title}</p>
                                    {m.venueName && <p className="text-[12px] text-infyn-ink/55 truncate mt-0.5">{m.venueName}</p>}
                                    <p className="text-[11px] text-infyn-ink/45 mt-1">{when}</p>
                                  </div>
                                  {isPending ? (
                                    <span className="shrink-0 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-bold text-amber-600">Pending ⏳</span>
                                  ) : (
                                    <span className="shrink-0 rounded-full bg-infyn-blush border border-infyn-rose-line/60 px-2.5 py-1 text-[11px] font-bold text-infyn-rose">Going ✓</span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <EmptyState
                          emoji="🗓️"
                          title="No upcoming events"
                          subtitle="Meet people in real life at meetups near you"
                          cta="Explore meetups"
                          onCta={() => router.push('/home')}
                        />
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <BottomSheet
            open={isEditing}
            onClose={() => { if (!isSaving) setIsEditing(false); }}
            title="Edit profile"
            footer={
              <button
                onClick={saveProfile}
                disabled={isSaving}
                className="w-full min-h-[54px] rounded-full bg-infyn-rose text-[16px] font-semibold text-[#fff8f0] active:scale-[0.985] transition-transform cursor-pointer disabled:opacity-60"
              >
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
            }
          >
            {editError && (
              <p role="alert" className="mb-4 text-[14px] text-infyn-rose">{editError}</p>
            )}
            <div className="space-y-5">
              <div>
                <label htmlFor="edit-name" className="mb-2 block text-[13px] font-semibold text-infyn-secondary">Name</label>
                <input id="edit-name" value={editDraft.name} maxLength={100}
                  onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                  className="w-full min-h-[48px] rounded-2xl border border-infyn-border bg-infyn-surface px-4 text-[16px] text-infyn-ink outline-none focus:border-infyn-rose focus:shadow-[0_0_0_3px_rgba(158,27,65,0.12)]" />
              </div>
              <div>
                <label htmlFor="edit-city" className="mb-2 block text-[13px] font-semibold text-infyn-secondary">City</label>
                <input id="edit-city" value={editDraft.city} maxLength={100}
                  onChange={e => setEditDraft(d => ({ ...d, city: e.target.value }))}
                  className="w-full min-h-[48px] rounded-2xl border border-infyn-border bg-infyn-surface px-4 text-[16px] text-infyn-ink outline-none focus:border-infyn-rose focus:shadow-[0_0_0_3px_rgba(158,27,65,0.12)]" />
              </div>
              <div>
                <label htmlFor="edit-bio" className="mb-2 block text-[13px] font-semibold text-infyn-secondary flex justify-between">
                  <span>Bio</span><span className="font-normal text-infyn-muted tabular-nums">{editDraft.bio.length}/500</span>
                </label>
                <textarea id="edit-bio" value={editDraft.bio} rows={4}
                  onChange={e => setEditDraft(d => ({ ...d, bio: e.target.value.slice(0, 500) }))}
                  className="w-full min-h-[48px] rounded-2xl border border-infyn-border bg-infyn-surface px-4 text-[16px] text-infyn-ink outline-none focus:border-infyn-rose focus:shadow-[0_0_0_3px_rgba(158,27,65,0.12)] py-3 resize-none leading-relaxed" />
              </div>
              <div>
                <p className="mb-2 block text-[13px] font-semibold text-infyn-secondary flex justify-between">
                  <span>Interests</span><span className="font-normal text-infyn-muted">{editDraft.interests.length} selected</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map(opt => {
                    const on = editDraft.interests.some(i => plainInterest(i) === opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setEditDraft(d => ({
                            ...d,
                            interests: on ? d.interests.filter(i => plainInterest(i) !== opt) : [...d.interests.map(plainInterest), opt],
                          }))
                        }
                        className={`min-h-[40px] rounded-full px-4 text-[14px] transition-colors cursor-pointer ${
                          on ? 'bg-infyn-ink text-infyn-paper font-semibold' : 'border border-infyn-border bg-infyn-surface text-infyn-secondary'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </BottomSheet>

          {/* PHOTO LIGHTBOX — Premium Instagram/Hinge style fullscreen viewer */}
          {photoLightboxOpen && profile.photo && (
            <div
              className="fixed inset-0 z-[200] flex flex-col justify-between items-center bg-black/92 backdrop-blur-2xl animate-photo-backdrop select-none p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(1.25rem+env(safe-area-inset-top,0px))]"
              role="dialog"
              aria-modal="true"
              aria-label="Profile photo lightbox"
              onClick={() => setPhotoLightboxOpen(false)}
            >
              {/* Header Bar */}
              <div className="w-full flex items-center justify-between z-20 px-2" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2 text-white">
                  <span className="text-[15px] font-bold tracking-tight">{profile.name}</span>
                  {profile.verified && <VerifiedBadge />}
                </div>
                <button
                  onClick={() => setPhotoLightboxOpen(false)}
                  aria-label="Close photo viewer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-infyn-surface/15 border border-infyn-border/20 text-white hover:bg-infyn-surface/30 transition-all active:scale-90 cursor-pointer backdrop-blur-md shadow-lg"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* Stage Image */}
              <div
                className="w-full max-w-[420px] my-auto flex items-center justify-center p-2 animate-photo-zoom"
                onClick={e => e.stopPropagation()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.photo}
                  alt={profile.name}
                  className="w-full max-h-[66dvh] object-contain rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-infyn-border/10 select-none"
                  draggable={false}
                />
              </div>

              {/* Bottom Floating Glass Action Bar */}
              <div
                className="z-20 flex items-center justify-center gap-3 w-full max-w-[340px] px-2 mb-2"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => { setPhotoLightboxOpen(false); router.push('/onboarding/photos'); }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-infyn-rose to-infyn-rose px-5 py-3.5 text-[14px] font-bold text-white shadow-xl hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit Photos
                </button>
                <button
                  onClick={() => setPhotoLightboxOpen(false)}
                  className="px-6 py-3.5 rounded-2xl bg-infyn-surface/15 backdrop-blur-xl border border-infyn-border/25 text-[14px] font-bold text-white hover:bg-infyn-surface/25 active:scale-95 transition-all cursor-pointer shadow-lg"
                >
                  Close
                </button>
              </div>
            </div>
          )}
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
      <p className="text-[15px] font-semibold text-infyn-ink mb-1">{title}</p>
      <p className="text-[13px] text-infyn-ink/60 mb-5">{subtitle}</p>
      <button
        onClick={onCta}
        className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-infyn-rose hover:bg-[#E11D48] px-6 text-[14px] font-semibold text-white transition-all duration-200 active:scale-95 cursor-pointer"
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
