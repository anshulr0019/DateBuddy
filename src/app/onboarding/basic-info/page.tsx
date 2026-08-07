'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hapticLight, hapticMedium, hapticWarning } from '../../lib/haptics';

/* ─────────────────────────────────────────────────
   Basic Info — "First Impression" onboarding screen

   Everything here is presentation: the saved shape of
   `onboarding_basic` ({ name, dateOfBirth, gender,
   lookingFor }) and the route flow are unchanged.
───────────────────────────────────────────────── */

const NEXT_ROUTE = '/onboarding/location';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
] as const;

const LOOKING_OPTIONS = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'everyone', label: 'Everyone' },
] as const;

/* Deterministic particle field — fixed positions avoid any
   server/client render mismatch and keep the DOM tiny. */
const PARTICLES = [
  { left: '12%', top: '78%', size: 4, delay: '0s', dur: '13s', o: 0.28, color: '#FF6B9D' },
  { left: '26%', top: '92%', size: 3, delay: '2.2s', dur: '11s', o: 0.22, color: '#7B68EE' },
  { left: '44%', top: '85%', size: 5, delay: '4.6s', dur: '15s', o: 0.18, color: '#FFB4D0' },
  { left: '63%', top: '95%', size: 3, delay: '1.4s', dur: '12s', o: 0.24, color: '#FF6B9D' },
  { left: '78%', top: '82%', size: 4, delay: '3.8s', dur: '14s', o: 0.2, color: '#7B68EE' },
  { left: '90%', top: '90%', size: 3, delay: '6s', dur: '12s', o: 0.22, color: '#FFB4D0' },
  { left: '52%', top: '99%', size: 4, delay: '7.5s', dur: '13s', o: 0.16, color: '#B76CFF' },
];

/* Scoped animation system. Transform/opacity only (compositor-friendly);
   the single one-shot blur on the headline is the only filter animation. */
const STYLES = `
  @keyframes bi-rise {
    0% { opacity: 0; transform: translateY(16px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .bi-rise {
    opacity: 0;
    animation: bi-rise 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes bi-headline {
    0% { opacity: 0; transform: translateY(18px); filter: blur(8px); }
    100% { opacity: 1; transform: translateY(0); filter: blur(0); }
  }
  .bi-headline {
    opacity: 0;
    animation: bi-headline 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes bi-pop {
    0% { opacity: 0; transform: scale(0.4); }
    60% { opacity: 1; transform: scale(1.08); }
    100% { opacity: 1; transform: scale(1); }
  }
  .bi-pop { animation: bi-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
  @keyframes bi-error-in {
    0% { opacity: 0; transform: translateY(-4px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .bi-error-in { animation: bi-error-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
  /* Opacity-only entrance for elements positioned via inline transform —
     a transform keyframe with fill-mode would override their translateX. */
  @keyframes bi-fade { 0% { opacity: 0; } 100% { opacity: 1; } }
  .bi-fade { animation: bi-fade 0.25s ease-out both; }
  @keyframes bi-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    50% { transform: translateX(4px); }
    75% { transform: translateX(-2px); }
  }
  .bi-shake { animation: bi-shake 0.35s ease-in-out; }
  @keyframes bi-sheen {
    0% { transform: translateX(-160%) skewX(-18deg); }
    22% { transform: translateX(260%) skewX(-18deg); }
    100% { transform: translateX(260%) skewX(-18deg); }
  }
  .bi-sheen {
    animation: bi-sheen 4.5s ease-in-out 0.8s infinite;
  }
  @keyframes bi-drift {
    0% { opacity: 0; transform: translateY(0); }
    12% { opacity: var(--o, 0.2); }
    82% { opacity: var(--o, 0.2); }
    100% { opacity: 0; transform: translateY(-42vh); }
  }
  .bi-particle {
    position: absolute;
    border-radius: 9999px;
    filter: blur(1px);
    opacity: 0;
    animation: bi-drift linear infinite;
  }
  @keyframes bi-leave {
    0% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(-12px) scale(0.985); }
  }
  .bi-leave { animation: bi-leave 0.4s cubic-bezier(0.4, 0, 1, 1) forwards; }
  @keyframes bi-spin { to { transform: rotate(360deg); } }
  .bi-spin { animation: bi-spin 0.7s linear infinite; }

  @media (prefers-reduced-motion: reduce) {
    .bi-rise, .bi-headline, .bi-pop, .bi-error-in, .bi-shake, .bi-leave {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
    }
    .bi-sheen, .bi-particle { display: none !important; }
    .bi-spin { animation: bi-spin 0.7s linear infinite; } /* spinners stay meaningful */
  }
`;

/* Calendar-accurate age — the previous year-subtraction let
   17-year-olds through for most of the year. */
function calcAge(iso: string): number | null {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  const beforeBirthday =
    today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

function formatBirthday(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function toISO(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

type Phase = 'idle' | 'saving' | 'done';

export default function BasicInfoPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    lookingFor: '',
  });
  const [showErrors, setShowErrors] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [shake, setShake] = useState(false);
  const [dobFocused, setDobFocused] = useState(false);
  const [progressIn, setProgressIn] = useState(false);

  const nameWrapRef = useRef<HTMLDivElement>(null);
  const dobWrapRef = useRef<HTMLDivElement>(null);
  const genderWrapRef = useRef<HTMLDivElement>(null);
  const lookingWrapRef = useRef<HTMLDivElement>(null);
  const reducedMotionRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  // Resume a half-finished session, or prefill the name from Google sign-in.
  useEffect(() => {
    try {
      const savedBasic = localStorage.getItem('onboarding_basic');
      const googleUser = localStorage.getItem('google_user');
      if (savedBasic) {
        setFormData((prev) => ({ ...prev, ...JSON.parse(savedBasic) }));
      } else if (googleUser) {
        const parsed = JSON.parse(googleUser);
        if (parsed.name) {
          setFormData((prev) => ({ ...prev, name: parsed.name }));
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    router.prefetch(NEXT_ROUTE);
    const raf = requestAnimationFrame(() => setProgressIn(true));
    const timers = timersRef.current;
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [router]);

  const age = formData.dateOfBirth ? calcAge(formData.dateOfBirth) : null;

  const errors = useMemo(() => {
    const dobError = !formData.dateOfBirth
      ? 'Add your birthday so we can show your age.'
      : age !== null && age < 18
        ? 'You need to be at least 18 to join DateBuddy.'
        : age === null || age > 120
          ? 'That date doesn’t look right — double-check the year.'
          : null;
    return {
      name: formData.name.trim() ? null : 'Add your first name — it’s how people will know you.',
      dateOfBirth: dobError,
      gender: formData.gender ? null : 'Pick the option that fits you best.',
      lookingFor: formData.lookingFor ? null : 'Tell us who you’d like to meet.',
    };
  }, [formData, age]);

  const isValid = !errors.name && !errors.dateOfBirth && !errors.gender && !errors.lookingFor;
  const nameValid = formData.name.trim().length >= 2;
  const ageValid = age !== null && age >= 18 && age <= 120;
  // A wrong date deserves feedback immediately, not only after submit.
  const dobErrorVisible = errors.dateOfBirth && (showErrors || formData.dateOfBirth);
  const dobFloated = dobFocused || Boolean(formData.dateOfBirth);
  const lookingIndex = LOOKING_OPTIONS.findIndex((o) => o.value === formData.lookingFor);

  const dateLimits = useMemo(() => {
    const now = new Date();
    return {
      max: toISO(now),
      min: toISO(new Date(now.getFullYear() - 120, now.getMonth(), now.getDate())),
    };
  }, []);

  // Keep the focused field clear of the keyboard once it settles.
  const scrollFieldIntoView = (el: HTMLElement | null) => {
    const t = window.setTimeout(() => {
      el?.scrollIntoView({
        behavior: reducedMotionRef.current ? 'auto' : 'smooth',
        block: 'center',
      });
    }, 260);
    timersRef.current.push(t);
  };

  const handleContinue = () => {
    if (phase !== 'idle') return;

    if (!isValid) {
      setShowErrors(true);
      hapticWarning();
      setShake(true);
      const t = window.setTimeout(() => setShake(false), 400);
      timersRef.current.push(t);
      const firstInvalid = [
        [errors.name, nameWrapRef],
        [errors.dateOfBirth, dobWrapRef],
        [errors.gender, genderWrapRef],
        [errors.lookingFor, lookingWrapRef],
      ].find(([err]) => err) as [string, React.RefObject<HTMLDivElement | null>] | undefined;
      firstInvalid?.[1].current?.scrollIntoView({
        behavior: reducedMotionRef.current ? 'auto' : 'smooth',
        block: 'center',
      });
      return;
    }

    hapticMedium();
    localStorage.setItem('onboarding_basic', JSON.stringify(formData));

    if (reducedMotionRef.current) {
      router.push(NEXT_ROUTE);
      return;
    }
    setPhase('saving');
    timersRef.current.push(window.setTimeout(() => setPhase('done'), 240));
    timersRef.current.push(window.setTimeout(() => router.push(NEXT_ROUTE), 700));
  };

  const selectGender = (value: string) => {
    hapticLight();
    setFormData((prev) => ({ ...prev, gender: value }));
  };

  const selectLookingFor = (value: string) => {
    hapticLight();
    setFormData((prev) => ({ ...prev, lookingFor: value }));
  };

  /* Shared field shell: glass at rest; focus lifts it and blooms a soft glow. */
  const fieldShell =
    'relative rounded-2xl border border-white/80 bg-white/75 backdrop-blur-xl ' +
    'shadow-[0_10px_30px_-18px_rgba(26,26,46,0.18)] transition-all duration-300 ' +
    'focus-within:-translate-y-[2px] focus-within:border-[#FF6B9D]/45 focus-within:bg-white/90 ' +
    'focus-within:shadow-[0_0_0_4px_rgba(255,107,157,0.10),0_18px_40px_-16px_rgba(255,107,157,0.35)]';

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <style>{STYLES}</style>
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        {/* Atmosphere — aurora blobs + slow rising light particles */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div className="aurora-blob aurora-blob-1" />
          <div className="aurora-blob aurora-blob-2" />
          <div className="aurora-blob aurora-blob-3" />
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="bi-particle"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                background: p.color,
                animationDelay: p.delay,
                animationDuration: p.dur,
                ['--o' as string]: p.o,
              }}
            />
          ))}
        </div>

        {/* HEADER — back + luminous progress */}
        <div className="bi-rise flex-shrink-0 z-20 px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-2">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-[#1A1A2E]/70 shadow-[0_4px_16px_-8px_rgba(26,26,46,0.15)] backdrop-blur-xl transition-all duration-200 active:scale-[0.92] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B68EE]/40 cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div
              className="flex-1 h-[6px] rounded-full bg-[#1A1A2E]/[0.06] overflow-hidden"
              role="progressbar"
              aria-valuenow={1}
              aria-valuemin={1}
              aria-valuemax={7}
              aria-label="Onboarding progress: step 1 of 7"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] shadow-[0_0_8px_rgba(255,107,157,0.5)] transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: progressIn ? '14.3%' : '3%' }}
              />
            </div>
            <span className="text-[12px] font-bold tabular-nums text-[#1A1A2E]/45">1 of 7</span>
          </div>
        </div>

        {/* CONTENT */}
        <div
          className={`flex-1 min-h-0 z-10 overflow-y-auto scrollbar-none px-6 pb-8 ${
            phase === 'done' ? 'bi-leave' : ''
          }`}
        >
          <div className="bi-headline mt-5 mb-8" style={{ animationDelay: '80ms' }}>
            <h1 className="text-[32px] leading-[1.12] font-black tracking-tight text-[#1A1A2E]">
              Let&apos;s get to
              <br />
              know{' '}
              <span className="bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] bg-clip-text text-transparent">
                you
              </span>
            </h1>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-[#1A1A2E]/55 max-w-[300px]">
              A few basics to start your profile. You can change any of this later.
            </p>
          </div>

          <div className="space-y-5">
            {/* NAME — floating label, glow focus, earned check */}
            <div className="bi-rise" style={{ animationDelay: '160ms' }}>
              <div ref={nameWrapRef} className={fieldShell}>
                <input
                  id="bi-name"
                  type="text"
                  value={formData.name}
                  maxLength={30}
                  autoComplete="given-name"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  placeholder=" "
                  aria-invalid={Boolean(showErrors && errors.name)}
                  aria-describedby={showErrors && errors.name ? 'bi-name-error' : undefined}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onFocus={(e) => scrollFieldIntoView(e.currentTarget.closest('div'))}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  className="peer w-full h-[64px] rounded-2xl bg-transparent px-5 pt-6 pb-2 pr-12 text-[16px] font-semibold text-[#1A1A2E] placeholder-transparent caret-[#FF6B9D] focus:outline-none"
                />
                <label
                  htmlFor="bi-name"
                  className="pointer-events-none absolute left-5 top-[11px] text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#1A1A2E]/45 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-[#1A1A2E]/35 peer-focus:top-[11px] peer-focus:translate-y-0 peer-focus:text-[10.5px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-[0.14em] peer-focus:text-[#FF6B9D]"
                >
                  First name
                </label>
                {nameValid && (
                  <span className="bi-pop pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] text-white shadow-[0_2px_8px_rgba(255,107,157,0.4)]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>
              {showErrors && errors.name && <FieldError id="bi-name-error">{errors.name}</FieldError>}
            </div>

            {/* BIRTHDAY — native wheel picker under a custom display */}
            <div className="bi-rise" style={{ animationDelay: '220ms' }}>
              <div ref={dobWrapRef} className={fieldShell}>
                <div className="h-[64px] px-5 pt-[26px] pb-2 pr-20 text-[16px] font-semibold text-[#1A1A2E] whitespace-nowrap overflow-hidden text-ellipsis">
                  {formData.dateOfBirth ? formatBirthday(formData.dateOfBirth) : ''}
                </div>
                <span
                  className={`pointer-events-none absolute left-5 transition-all duration-200 ${
                    dobFloated
                      ? `top-[11px] text-[10.5px] font-bold uppercase tracking-[0.14em] ${dobFocused ? 'text-[#FF6B9D]' : 'text-[#1A1A2E]/45'}`
                      : 'top-1/2 -translate-y-1/2 text-[15px] font-medium text-[#1A1A2E]/35'
                  }`}
                >
                  Birthday
                </span>
                {ageValid ? (
                  <span
                    key={age}
                    className="bi-pop pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#FF6B9D]/12 to-[#7B68EE]/12 px-2.5 py-1 text-[12px] font-bold text-[#1A1A2E]/70 ring-1 ring-[#FF6B9D]/25"
                  >
                    {age} yrs
                  </span>
                ) : (
                  <svg
                    aria-hidden
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${dobFocused ? 'text-[#FF6B9D]' : 'text-[#1A1A2E]/30'}`}
                  >
                    <rect x="3" y="4" width="18" height="18" rx="4" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                )}
                <input
                  type="date"
                  aria-label="Birthday"
                  value={formData.dateOfBirth}
                  min={dateLimits.min}
                  max={dateLimits.max}
                  aria-invalid={Boolean(dobErrorVisible)}
                  aria-describedby={dobErrorVisible ? 'bi-dob-error' : undefined}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  onFocus={() => setDobFocused(true)}
                  onBlur={() => setDobFocused(false)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker?.();
                    } catch {
                      /* older browsers focus the field instead */
                    }
                  }}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                />
              </div>
              {dobErrorVisible ? (
                <FieldError id="bi-dob-error">{errors.dateOfBirth}</FieldError>
              ) : (
                !ageValid && (
                  <p className="mt-2 ml-1 text-[12px] font-medium text-[#1A1A2E]/40">
                    You must be at least 18 years old
                  </p>
                )
              )}
            </div>

            {/* GENDER — typography-forward selectable cards */}
            <div className="bi-rise" style={{ animationDelay: '280ms' }}>
              <p className="mb-2.5 ml-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1A1A2E]/40">
                I am
              </p>
              <div
                ref={genderWrapRef}
                className="grid grid-cols-2 gap-2.5"
                role="group"
                aria-label="I am"
                aria-describedby={showErrors && errors.gender ? 'bi-gender-error' : undefined}
              >
                {GENDER_OPTIONS.map((option) => {
                  const selected = formData.gender === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectGender(option.value)}
                      className={`relative h-[52px] rounded-2xl border text-[14px] backdrop-blur-md transition-all duration-200 active:scale-[0.96] cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B68EE]/40 ${
                        selected
                          ? 'border-transparent bg-gradient-to-br from-[#FF6B9D]/12 to-[#7B68EE]/12 font-bold text-[#1A1A2E] ring-1 ring-[#FF6B9D]/45 shadow-[0_8px_24px_-12px_rgba(255,107,157,0.45)]'
                          : 'border-white/80 bg-white/70 font-semibold text-[#1A1A2E]/55 shadow-[0_4px_16px_-12px_rgba(26,26,46,0.2)] hover:text-[#1A1A2E]/80'
                      }`}
                    >
                      {option.label}
                      {selected && (
                        <span className="bi-pop absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] text-white shadow-[0_2px_8px_rgba(255,107,157,0.5)] ring-2 ring-[#FAFAF7]">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {showErrors && errors.gender && (
                <FieldError id="bi-gender-error">{errors.gender}</FieldError>
              )}
            </div>

            {/* SHOW ME — segmented control with sliding pill */}
            <div className="bi-rise" style={{ animationDelay: '340ms' }}>
              <p className="mb-2.5 ml-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1A1A2E]/40">
                Show me
              </p>
              <div
                ref={lookingWrapRef}
                className="relative grid grid-cols-3 rounded-2xl bg-[#1A1A2E]/[0.05] p-1"
                role="group"
                aria-label="Show me"
                aria-describedby={showErrors && errors.lookingFor ? 'bi-looking-error' : undefined}
              >
                {lookingIndex >= 0 && (
                  <span
                    aria-hidden
                    className="bi-fade absolute left-1 top-1 bottom-1 w-[calc((100%-8px)/3)] rounded-xl bg-white shadow-[0_4px_14px_-4px_rgba(26,26,46,0.18)] ring-1 ring-[#FF6B9D]/20 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ transform: `translateX(${lookingIndex * 100}%)` }}
                  />
                )}
                {LOOKING_OPTIONS.map((option) => {
                  const selected = formData.lookingFor === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectLookingFor(option.value)}
                      className={`relative z-10 h-11 rounded-xl text-[13.5px] transition-colors duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B68EE]/40 ${
                        selected ? 'font-bold text-[#1A1A2E]' : 'font-semibold text-[#1A1A2E]/45 active:text-[#1A1A2E]/70'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {showErrors && errors.lookingFor && (
                <FieldError id="bi-looking-error">{errors.lookingFor}</FieldError>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER — Continue CTA */}
        <div className="bi-rise flex-shrink-0 z-20 px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#FAFAF7] via-[#FAFAF7]/92 to-transparent" style={{ animationDelay: '420ms' }}>
          <button
            onClick={handleContinue}
            aria-disabled={!isValid}
            aria-busy={phase === 'saving'}
            className={`group relative h-[56px] w-full overflow-hidden rounded-[20px] text-[15.5px] font-bold transition-all duration-300 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B68EE]/50 focus-visible:ring-offset-2 ${
              shake ? 'bi-shake' : ''
            } ${
              isValid || phase !== 'idle'
                ? 'bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white shadow-[0_16px_40px_-12px_rgba(255,107,157,0.55)] active:scale-[0.97]'
                : 'border border-[#1A1A2E]/8 bg-[#1A1A2E]/[0.05] text-[#1A1A2E]/35 active:scale-[0.99]'
            }`}
          >
            {isValid && phase === 'idle' && (
              <span
                aria-hidden
                className="bi-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              {phase === 'saving' ? (
                <svg aria-hidden className="bi-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                </svg>
              ) : phase === 'done' ? (
                <>
                  <span className="bi-pop flex h-6 w-6 items-center justify-center rounded-full bg-white/25">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  All set
                </>
              ) : (
                <>
                  Continue
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-200 group-active:translate-x-0.5"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </span>
          </button>
          <p className="mt-3 text-center text-[12px] font-medium text-[#1A1A2E]/35">
            This appears on your profile — you can edit it anytime
          </p>
        </div>
      </div>
    </div>
  );
}

/* Soft inline validation — calm copy, no alert banners. */
function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} role="status" className="bi-error-in mt-2 ml-1 flex items-start gap-1.5 text-[12.5px] font-medium leading-snug text-rose-500/90">
      <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-[1.5px] flex-shrink-0">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {children}
    </p>
  );
}
