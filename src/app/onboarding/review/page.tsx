'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { hapticMedium, hapticSuccess, hapticWarning } from '../../lib/haptics';

const BackChevron = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

interface ProfilePreview {
  name: string;
  age: number;
  photo: string;
  bio: string;
  interests: string[];
}

function calcAge(dob: string): number {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return 24;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  if (today.getMonth() + 1 < d.getMonth() + 1 ||
    (today.getMonth() + 1 === d.getMonth() + 1 && today.getDate() < d.getDate())) {
    age -= 1;
  }
  return Math.max(18, age);
}

function calcStrength(): number {
  try {
    const photos = JSON.parse(localStorage.getItem('onboarding_photos') || '[]') as string[];
    const bio = JSON.parse(localStorage.getItem('onboarding_bio') || '{}') as Record<string, string>;
    const interests = JSON.parse(localStorage.getItem('onboarding_interests') || '[]') as string[];
    let s = 30;
    s += Math.min(photos.filter(p => p?.trim()).length, 4) * 10; // up to 40
    if (bio.bio?.trim().length >= 15 || bio.promptAnswer?.trim().length >= 10) s += 20;
    s += Math.min(interests.length, 1) * 10; // at least 1 interest = +10
    return Math.min(s, 100);
  } catch { return 50; }
}

export default function ReviewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfilePreview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [strengthPct, setStrengthPct] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Load preview from localStorage
    try {
      const basic = JSON.parse(localStorage.getItem('onboarding_basic') || '{}') as Record<string, string>;
      const photos = JSON.parse(localStorage.getItem('onboarding_photos') || '[]') as string[];
      const bio = JSON.parse(localStorage.getItem('onboarding_bio') || '{}') as Record<string, string>;
      const interests = JSON.parse(localStorage.getItem('onboarding_interests') || '[]') as string[];
      const valid = photos.filter(p => p?.trim());

      setProfile({
        name: basic.name || 'You',
        age: basic.dateOfBirth ? calcAge(basic.dateOfBirth) : 24,
        photo: valid[0] || '',
        bio: bio.bio?.trim() || bio.promptAnswer?.trim() || '',
        interests: (interests as string[]).slice(0, 4),
      });
    } catch { /* use defaults */ }

    // Animate strength ring after mount
    const pct = calcStrength();
    const t = setTimeout(() => { if (mountedRef.current) setStrengthPct(pct); }, 350);
    return () => { mountedRef.current = false; clearTimeout(t); };
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    hapticMedium();
    try {
      const basicInfo = JSON.parse(localStorage.getItem('onboarding_basic') || '{}');
      const location = localStorage.getItem('onboarding_location') || '';
      const photos = JSON.parse(localStorage.getItem('onboarding_photos') || '[]');
      const bio = JSON.parse(localStorage.getItem('onboarding_bio') || '{}');
      const interests = JSON.parse(localStorage.getItem('onboarding_interests') || '[]');
      const preferences = JSON.parse(localStorage.getItem('onboarding_preferences') || '');

      const res = await fetch('/api/users/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basicInfo, location, photos, bio, interests, preferences }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) { window.location.assign('/welcome'); return; }
      if (!res.ok || !data.success) {
        hapticWarning();
        setError(data.message || 'Could not save your profile. Please try again.');
        return;
      }
      hapticSuccess();
      // Go to tutorial first so new users know how to use the app,
      // then tutorial routes to /discover. Hard navigate so the cookie is read fresh.
      window.location.assign('/onboarding/tutorial');
    } catch {
      hapticWarning();
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const circumference = 2 * Math.PI * 28;

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">

        {/* Ambient */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-[#FF6B9D]/08 blur-[60px]" />
          <div className="absolute -right-16 bottom-1/4 h-64 w-64 rounded-full bg-[#7B68EE]/07 blur-[60px]" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 z-20 px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-2">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-[#1A1A2E]/70 shadow-[0_4px_16px_-8px_rgba(26,26,46,0.12)] backdrop-blur-xl transition-all duration-200 active:scale-[0.92] cursor-pointer"
            >
              {BackChevron}
            </button>
            <div
              className="flex-1 h-[6px] rounded-full bg-[#1A1A2E]/[0.06] overflow-hidden"
              role="progressbar"
              aria-valuenow={7}
              aria-valuemin={1}
              aria-valuemax={7}
              aria-label="Onboarding complete"
            >
              <div className="h-full w-full rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] shadow-[0_0_8px_rgba(255,107,157,0.5)]" />
            </div>
            <span className="text-[12px] font-bold text-[#22C55E]">Done!</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 z-10 px-6 overflow-y-auto scrollbar-none pb-6 animate-page-enter">
          <div className="mb-6">
            <h1 className="text-[28px] font-black text-[#1A1A2E] tracking-tight leading-[1.1]">
              Looking good! 🔥
            </h1>
            <p className="text-[14.5px] text-[#1A1A2E]/55 mt-1.5">Here&apos;s your profile in Discover</p>
          </div>

          {/* Profile preview card */}
          {profile && (
            <div className="rounded-[24px] border border-white/80 bg-white/80 shadow-[0_10px_30px_-15px_rgba(26,26,46,0.12)] backdrop-blur-md mb-4 overflow-hidden">
              {/* Photo */}
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt={`${profile.name}'s photo`}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#FF6B9D]/20 to-[#7B68EE]/20 flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h2 className="text-white text-[24px] font-extrabold drop-shadow-md tracking-tight">
                    {profile.name}, {profile.age}
                  </h2>
                </div>
              </div>

              <div className="p-4">
                {profile.bio && (
                  <p className="text-[14px] font-medium text-[#1A1A2E]/75 mb-3 leading-relaxed">{profile.bio}</p>
                )}
                {profile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((i) => (
                      <span key={i} className="rounded-full bg-[#FF6B9D]/10 border border-[#FF6B9D]/20 px-3 py-1 text-[12px] font-semibold text-[#FF6B9D]">
                        {i}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile strength */}
          <div className="rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-[0_4px_20px_-10px_rgba(26,26,46,0.08)] backdrop-blur-md flex items-center gap-4">
            <div className="relative h-16 w-16 flex-shrink-0">
              <svg className="-rotate-90 h-16 w-16" viewBox="0 0 64 64" aria-hidden>
                <circle cx="32" cy="32" r="28" stroke="#E2E8F0" strokeWidth="5" fill="none" />
                <circle
                  cx="32" cy="32" r="28"
                  stroke="url(#rv-grad)"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - strengthPct / 100)}
                  style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
                />
                <defs>
                  <linearGradient id="rv-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF6B9D" />
                    <stop offset="100%" stopColor="#7B68EE" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] font-black text-[#1A1A2E]">{strengthPct}%</span>
              </div>
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#1A1A2E]">Profile Strength</p>
              <p className="text-[12.5px] text-[#1A1A2E]/55 mt-0.5 leading-snug">
                {strengthPct >= 90 ? "You're all set — start discovering!" :
                  strengthPct >= 70 ? "Looking great! You can always add more later." :
                  "Your profile is live. Add more to get better matches."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 z-20 px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#FAFAF7] via-[#FAFAF7]/90 to-transparent border-t border-black/[0.04] space-y-2.5">
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-rose-600 text-[13px] font-semibold leading-snug">
              <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[15px] font-bold shadow-[0_10px_28px_-8px_rgba(255,107,157,0.5)] active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:active:scale-100"
          >
            {submitting ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                </svg>
                Saving Profile…
              </>
            ) : (
              <>
                Start Discovering ✨
              </>
            )}
          </button>
          <button
            onClick={() => router.push('/onboarding/basic-info')}
            disabled={submitting}
            className="w-full h-12 rounded-2xl border border-[#1A1A2E]/10 bg-white/80 text-[#1A1A2E] text-[13.5px] font-bold hover:bg-white transition-all cursor-pointer shadow-sm disabled:opacity-50 active:scale-[0.98]"
          >
            Edit Profile Details
          </button>
        </div>
      </div>
    </div>
  );
}
