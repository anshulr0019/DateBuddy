'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hapticLight, hapticMedium, hapticWarning } from '../../lib/haptics';

/* ─────────────────────────────────────────────────
   Basic Info — "First Impression" onboarding wizard

   One question per screen (Hinge-style). The saved
   shape of `onboarding_basic` ({ name, dateOfBirth,
   gender, lookingFor }) and the route flow are
   unchanged — the wizard is purely presentation.
───────────────────────────────────────────────── */

const NEXT_ROUTE = '/onboarding/location';

const STEP_COUNT = 4;
const TOTAL_STEPS = 7;

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male', glyph: 'male' },
  { value: 'female', label: 'Female', glyph: 'female' },
  { value: 'non-binary', label: 'Non-binary', glyph: 'non-binary' },
  { value: 'other', label: 'Other', glyph: 'other' },
] as const;

const LOOKING_OPTIONS = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'everyone', label: 'Everyone' },
] as const;

/* Deterministic particle field — fixed positions avoid any
   server/client render mismatch and keep the DOM tiny. */
const PARTICLES = [
  { left: '12%', top: '78%', size: 4, delay: '0s', dur: '13s', o: 0.28, color: 'var(--infyn-rose)' },
  { left: '26%', top: '92%', size: 3, delay: '2.2s', dur: '11s', o: 0.22, color: 'var(--infyn-rose)' },
  { left: '44%', top: '85%', size: 5, delay: '4.6s', dur: '15s', o: 0.18, color: 'var(--infyn-blush)' },
  { left: '63%', top: '95%', size: 3, delay: '1.4s', dur: '12s', o: 0.24, color: 'var(--infyn-rose)' },
  { left: '78%', top: '82%', size: 4, delay: '3.8s', dur: '14s', o: 0.2, color: 'var(--infyn-rose)' },
  { left: '90%', top: '90%', size: 3, delay: '6s', dur: '12s', o: 0.22, color: 'var(--infyn-blush)' },
  { left: '52%', top: '99%', size: 4, delay: '7.5s', dur: '13s', o: 0.16, color: 'var(--infyn-rose)' },
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
  @keyframes bi-step-in {
    0% { opacity: 0; transform: translateX(26px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  @keyframes bi-step-in-back {
    0% { opacity: 0; transform: translateX(-26px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  @keyframes bi-step-out {
    0% { opacity: 1; transform: translateX(0); }
    100% { opacity: 0; transform: translateX(-26px); }
  }
  .bi-step-enter { animation: bi-step-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .bi-step-enter-back { animation: bi-step-in-back 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .bi-step-leave { animation: bi-step-out 0.2s cubic-bezier(0.5, 0, 0.75, 0) both; }
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
  @keyframes bi-halo {
    0% { box-shadow: 0 0 0 0 rgba(255, 107, 157, 0.0); }
    40% { box-shadow: 0 0 0 10px rgba(255, 107, 157, 0.0); }
    60% { box-shadow: 0 0 0 0 rgba(255, 107, 157, 0.0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 107, 157, 0.0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .bi-rise, .bi-headline, .bi-pop, .bi-error-in, .bi-shake, .bi-leave,
    .bi-step-enter, .bi-step-enter-back, .bi-step-leave {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
    }
    .bi-sheen, .bi-particle { display: none !important; }
    .bi-halo { animation: none !important; }
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

/* Gender glyphs — hand-drawn Mars/Venus/non-binary/sparkle */
function GenderGlyph({ glyph, className = '' }: { glyph: string; className?: string }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };
  switch (glyph) {
    case 'male':
      return (
        <svg {...common}>
          <circle cx="10" cy="11" r="6" />
          <path d="M14.5 6.5 21 0" />
          <path d="M15 0h6v6" />
        </svg>
      );
    case 'female':
      return (
        <svg {...common}>
          <circle cx="12" cy="10" r="5.5" />
          <path d="M12 15.5v6" />
          <path d="M8.5 21.5h7" />
          <path d="M12 4V1.5" />
          <path d="M9.5 2.5h5" />
        </svg>
      );
    case 'non-binary':
      return (
        <svg {...common}>
          <circle cx="12" cy="10" r="5.5" />
          <path d="M12 4V1.5" />
          <path d="M9.5 2.5h5" />
          <path d="M14.5 14.5l6 6" />
          <path d="M20.5 15.5V20.5H15.5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M12 1c.7 4.5 2 6.5 5 8-3 1.5-4.3 3.5-5 8-.7-4.5-2-6.5-5-8 3-1.5 4.3-3.5 5-8z" />
        </svg>
      );
  }
}

export default function BasicInfoPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    lookingFor: '',
  });
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [backDirection, setBackDirection] = useState(false);
  const [ready, setReady] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [shake, setShake] = useState(false);
  const [dobFocused, setDobFocused] = useState(false);
  const [progressIn, setProgressIn] = useState(false);

  const nameWrapRef = useRef<HTMLDivElement>(null);
  const dobWrapRef = useRef<HTMLDivElement>(null);
  const genderWrapRef = useRef<HTMLDivElement>(null);
  const lookingWrapRef = useRef<HTMLDivElement>(null);
  const stepWrapRef = useRef<HTMLDivElement>(null);
  const reducedMotionRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  // Resume a half-finished session, or prefill the name from Google sign-in.
  useEffect(() => {
    try {
      const savedBasic = localStorage.getItem('onboarding_basic');
      const googleUser = localStorage.getItem('google_user');
      const parsed = savedBasic ? JSON.parse(savedBasic) : null;
      if (parsed) {
        setFormData((prev) => ({
          ...prev,
          name: parsed.name ?? prev.name,
          dateOfBirth: parsed.dateOfBirth ?? prev.dateOfBirth,
          gender: parsed.gender ?? prev.gender,
          lookingFor: parsed.lookingFor ?? prev.lookingFor,
        }));
      } else if (googleUser) {
        const g = JSON.parse(googleUser);
        if (g.name) setFormData((prev) => ({ ...prev, name: g.name }));
      }
      // Jump to the first unanswered question so a refresh resumes mid-wizard.
      if (parsed) {
        if (!parsed.name) setStep(0);
        else if (!parsed.dateOfBirth) setStep(1);
        else if (!parsed.gender) setStep(2);
        else setStep(3);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
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
        ? 'You need to be at least 18 to join Infyn.'
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

  const persist = () => {
    try {
      localStorage.setItem('onboarding_basic', JSON.stringify(formData));
    } catch { /* storage quota — non-blocking here */ }
  };

  const goToStep = (next: number, back = false) => {
    if (leaving || phase !== 'idle') return;
    setBackDirection(back);
    setLeaving(true);
    hapticLight();
    const t = window.setTimeout(() => {
      setLeaving(false);
      setShowErrors(false);
      setStep(next);
      stepWrapRef.current?.scrollTo({ top: 0 });
    }, 200);
    timersRef.current.push(t);
  };

  const rejectCurrentStep = () => {
    setShowErrors(true);
    hapticWarning();
    setShake(true);
    const t = window.setTimeout(() => setShake(false), 400);
    timersRef.current.push(t);
    const wrap = step === 0 ? nameWrapRef : step === 1 ? dobWrapRef : step === 2 ? genderWrapRef : lookingWrapRef;
    wrap.current?.scrollIntoView({
      behavior: reducedMotionRef.current ? 'auto' : 'smooth',
      block: 'center',
    });
  };

  const handleContinue = () => {
    if (phase !== 'idle' || leaving) return;

    if (!isStepValid) {
      rejectCurrentStep();
      return;
    }

    persist();

    if (step < STEP_COUNT - 1) {
      goToStep(step + 1, false);
      return;
    }

    hapticMedium();
    if (reducedMotionRef.current) {
      router.push(NEXT_ROUTE);
      return;
    }
    setPhase('saving');
    timersRef.current.push(window.setTimeout(() => setPhase('done'), 240));
    timersRef.current.push(window.setTimeout(() => router.push(NEXT_ROUTE), 700));
  };

  const handleBack = () => {
    if (leaving || phase !== 'idle') return;
    if (step === 0) {
      router.back();
      return;
    }
    goToStep(step - 1, true);
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
    'relative rounded-2xl border border-infyn-border/80 bg-infyn-surface/75 backdrop-blur-xl ' +
    'shadow-[0_10px_30px_-18px_rgba(32,26,22,0.16)] transition-all duration-300 ' +
    'focus-within:-translate-y-[2px] focus-within:border-infyn-rose/45 focus-within:bg-infyn-surface/90 ' +
    'focus-within:shadow-[0_0_0_4px_rgba(32,26,22,0.1),0_18px_40px_-16px_rgba(32,26,22,0.16)]';

  const isStepValid =
    step === 0 ? nameValid : step === 1 ? ageValid : step === 2 ? Boolean(formData.gender) : Boolean(formData.lookingFor);

  const stepAnim = leaving
    ? 'bi-step-leave'
    : backDirection
      ? 'bi-step-enter-back'
      : 'bi-step-enter';

  return (
    <div className="min-h-screen h-dvh w-full bg-infyn-paper flex justify-center overflow-hidden font-sans">
      <style>{STYLES}</style>
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col bg-infyn-paper shadow-2xl sm:border-x sm:border-infyn-ink/5 overflow-hidden">
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

        {/* HEADER — back + luminous progress + sub-step segments */}
        <div className="bi-rise flex-shrink-0 z-20 px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-2">
          <div className="flex items-center gap-3.5">
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-infyn-border/80 bg-infyn-surface/70 text-infyn-ink/70 shadow-[0_4px_16px_-8px_rgba(32,26,22,0.15)] backdrop-blur-xl transition-all duration-200 active:scale-[0.92] hover:bg-infyn-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-infyn-rose/40 cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div
              className="flex-1 h-[6px] rounded-full bg-infyn-ink/[0.06] overflow-hidden"
              role="progressbar"
              aria-valuenow={1}
              aria-valuemin={1}
              aria-valuemax={TOTAL_STEPS}
              aria-label={`Onboarding progress: step 1 of ${TOTAL_STEPS}`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-infyn-rose to-infyn-rose shadow-[0_0_8px_rgba(32,26,22,0.16)] transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: progressIn ? `${(1 / TOTAL_STEPS) * 100}%` : '2%' }}
              />
            </div>
            <span className="text-[12px] font-bold tabular-nums text-infyn-ink/45">1 of {TOTAL_STEPS}</span>
          </div>

          {/* Sub-step segments — shows where you are inside this question group */}
          <div className="mt-3 flex gap-1.5 px-1">
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <div
                key={i}
                className={`h-[4px] flex-1 rounded-full transition-all duration-500 ${
                  i < step
                    ? 'bg-gradient-to-r from-infyn-rose/70 to-infyn-rose/70'
                    : i === step
                      ? 'bg-gradient-to-r from-infyn-rose to-infyn-rose shadow-[0_0_8px_rgba(32,26,22,0.16)]'
                      : 'bg-infyn-ink/[0.07]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div
          ref={stepWrapRef}
          className={`flex-1 min-h-0 z-10 overflow-y-auto scrollbar-none px-6 pb-4 ${
            phase === 'done' ? 'bi-leave' : ''
          } ${stepAnim}`}
        >
          {!ready ? null : (
            <div className="min-h-full flex flex-col justify-center py-6">
              {step === 0 && (
                <div key="s-name" className="flex flex-col">
                  <div className="bi-headline mb-8 text-center" style={{ animationDelay: '40ms' }}>
                    <h1 className="text-[30px] leading-[1.12] font-normal tracking-tight text-infyn-ink font-display">
                      What should
                      <br />
                      we call{' '}
                      <span className="bg-gradient-to-r from-infyn-rose to-infyn-rose bg-clip-text text-transparent">
                        you
                      </span>
                      ?
                    </h1>
                    <p className="mt-2.5 text-[14.5px] leading-relaxed text-infyn-ink/55">
                      Your first name — it’s how people will know you.
                    </p>
                  </div>

                  <div className="bi-rise flex justify-center" style={{ animationDelay: '120ms' }}>
                    <div ref={nameWrapRef} className={`w-full max-w-[300px] ${shake ? 'bi-shake' : ''}`}>
                      <div className={fieldShell}>
                        <input
                          id="bi-name"
                          type="text"
                          value={formData.name}
                          maxLength={30}
                          autoComplete="given-name"
                          autoCapitalize="words"
                          enterKeyHint="next"
                          placeholder="Your name"
                          aria-invalid={Boolean(showErrors && errors.name)}
                          aria-describedby={showErrors && errors.name ? 'bi-name-error' : undefined}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          onFocus={(e) => scrollFieldIntoView(e.currentTarget.closest('div'))}
                          onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                          autoFocus
                          className="peer w-full h-[64px] rounded-2xl bg-transparent px-5 pt-6 pb-2 pr-12 text-center text-[16px] font-semibold text-infyn-ink placeholder-transparent caret-infyn-rose focus:outline-none"
                        />
                        <label
                          htmlFor="bi-name"
                          className="pointer-events-none absolute left-0 right-0 top-[11px] text-center text-[10.5px] font-bold uppercase tracking-[0.14em] text-infyn-ink/45 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-infyn-ink/35 peer-focus:top-[11px] peer-focus:translate-y-0 peer-focus:text-[10.5px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-[0.14em] peer-focus:text-infyn-rose"
                        >
                          First name
                        </label>
                        {nameValid && (
                          <span className="bi-pop pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-infyn-rose to-infyn-rose text-white shadow-[0_2px_8px_rgba(32,26,22,0.16)]">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        )}
                      </div>
                      {showErrors && errors.name && <FieldError id="bi-name-error">{errors.name}</FieldError>}
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div key="s-dob" className="flex flex-col">
                  <div className="bi-headline mb-8 text-center" style={{ animationDelay: '40ms' }}>
                    <h1 className="text-[30px] leading-[1.12] font-normal tracking-tight text-infyn-ink font-display">
                      When&apos;s your
                      <br />
                      <span className="bg-gradient-to-r from-infyn-rose to-infyn-rose bg-clip-text text-transparent">
                        birthday
                      </span>
                      ?
                    </h1>
                    <p className="mt-2.5 text-[14.5px] leading-relaxed text-infyn-ink/55">
                      So we can show your age alongside your profile.
                    </p>
                  </div>

                  <div className="bi-rise flex justify-center" style={{ animationDelay: '120ms' }}>
                    <div ref={dobWrapRef} className={`w-full max-w-[300px] ${shake ? 'bi-shake' : ''}`}>
                      <div className={fieldShell}>
                        <div className="h-[64px] px-5 pt-[26px] pb-2 pr-20 text-center text-[16px] font-semibold text-infyn-ink whitespace-nowrap overflow-hidden text-ellipsis">
                          {formData.dateOfBirth ? formatBirthday(formData.dateOfBirth) : ''}
                        </div>
                        <span
                          className={`pointer-events-none absolute left-0 right-0 text-center transition-all duration-200 ${
                            dobFloated
                              ? `top-[11px] text-[10.5px] font-bold uppercase tracking-[0.14em] ${dobFocused ? 'text-infyn-rose' : 'text-infyn-ink/45'}`
                              : 'top-1/2 -translate-y-1/2 text-[15px] font-medium text-infyn-ink/35'
                          }`}
                        >
                          Birthday
                        </span>
                        {ageValid ? (
                          <span
                            key={age}
                            className="bi-pop bi-halo pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-infyn-rose/12 to-infyn-rose/12 px-3 py-1 text-[12.5px] font-bold text-infyn-ink/75 ring-1 ring-infyn-rose/30"
                          >
                            <svg aria-hidden width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--infyn-rose)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 1c.7 4.5 2 6.5 5 8-3 1.5-4.3 3.5-5 8-.7-4.5-2-6.5-5-8 3-1.5 4.3-3.5 5-8z" />
                            </svg>
                            {age}
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
                            className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${dobFocused ? 'text-infyn-rose' : 'text-infyn-ink/30'}`}
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

                      {/* Privacy trust chip */}
                      <div
                        className={`mt-3 flex items-center justify-center gap-1.5 text-[12px] font-medium leading-snug px-2 ${
                          ageValid ? 'text-[#16A34A] bi-fade' : 'text-infyn-ink/45'
                        }`}
                      >
                        <svg
                          aria-hidden
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="flex-shrink-0"
                        >
                          <rect x="3" y="11" width="18" height="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        {ageValid ? (
                          <span>
                            Nice — you’ll appear as <b>{age}</b>
                          </span>
                        ) : (
                          <span>Your birthday is never shown — we only display your age.</span>
                        )}
                      </div>

                      {dobErrorVisible && <FieldError id="bi-dob-error">{errors.dateOfBirth}</FieldError>}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div key="s-gender" className="flex flex-col">
                  <div className="bi-headline mb-8 text-center" style={{ animationDelay: '40ms' }}>
                    <h1 className="text-[30px] leading-[1.12] font-normal tracking-tight text-infyn-ink font-display">
                      Which describes
                      <br />
                      <span className="bg-gradient-to-r from-infyn-rose to-infyn-rose bg-clip-text text-transparent">
                        you
                      </span>
                      ?
                    </h1>
                    <p className="mt-2.5 text-[14.5px] leading-relaxed text-infyn-ink/55">
                      This shows next to your name — you can change it anytime.
                    </p>
                  </div>

                  <div className="bi-rise" style={{ animationDelay: '120ms' }}>
                    <div
                      ref={genderWrapRef}
                      className={`grid grid-cols-2 gap-2.5 max-w-[320px] mx-auto ${shake ? 'bi-shake' : ''}`}
                      role="group"
                      aria-label="Which describes you best"
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
                            className={`relative flex h-[88px] flex-col items-center justify-center gap-1.5 rounded-2xl border text-[13.5px] backdrop-blur-md transition-all duration-200 active:scale-[0.96] cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-infyn-rose/40 ${
                              selected
                                ? 'border-transparent bg-gradient-to-br from-infyn-rose/12 to-infyn-rose/12 font-bold text-infyn-ink ring-1 ring-infyn-rose/45 shadow-[0_8px_24px_-12px_rgba(32,26,22,0.16)]'
                                : 'border-infyn-border/80 bg-infyn-surface/70 font-semibold text-infyn-ink/55 shadow-[0_4px_16px_-12px_rgba(32,26,22,0.16)] hover:text-infyn-ink/80'
                            }`}
                          >
                            <GenderGlyph
                              glyph={option.glyph}
                              className={`transition-colors duration-200 ${selected ? 'text-infyn-rose' : 'text-infyn-ink/40'}`}
                            />
                            {option.label}
                            {selected && (
                              <span className="bi-pop absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-infyn-rose to-infyn-rose text-white shadow-[0_2px_8px_rgba(32,26,22,0.16)] ring-2 ring-infyn-paper">
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
                      <div className="max-w-[320px] mx-auto text-center">
                        <FieldError id="bi-gender-error">{errors.gender}</FieldError>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div key="s-looking" className="flex flex-col">
                  <div className="bi-headline mb-8 text-center" style={{ animationDelay: '40ms' }}>
                    <h1 className="text-[30px] leading-[1.12] font-normal tracking-tight text-infyn-ink font-display">
                      Who would you
                      <br />
                      like to{' '}
                      <span className="bg-gradient-to-r from-infyn-rose to-infyn-rose bg-clip-text text-transparent">
                        meet
                      </span>
                      ?
                    </h1>
                    <p className="mt-2.5 text-[14.5px] leading-relaxed text-infyn-ink/55">
                      We’ll use this to shape your discovery feed.
                    </p>
                  </div>

                  <div className="bi-rise" style={{ animationDelay: '120ms' }}>
                    <div className="max-w-[320px] mx-auto">
                      <div
                        ref={lookingWrapRef}
                        className={`relative grid grid-cols-3 rounded-2xl bg-infyn-ink/[0.05] p-1 ${shake ? 'bi-shake' : ''}`}
                        role="group"
                        aria-label="Who would you like to meet"
                        aria-describedby={showErrors && errors.lookingFor ? 'bi-looking-error' : undefined}
                      >
                        {lookingIndex >= 0 && (
                          <span
                            aria-hidden
                            className="bi-fade absolute left-1 top-1 bottom-1 w-[calc((100%-8px)/3)] rounded-xl bg-infyn-surface shadow-[0_4px_14px_-4px_rgba(32,26,22,0.16)] ring-1 ring-infyn-rose/20 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
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
                              className={`relative z-10 h-12 rounded-xl text-[13.5px] transition-colors duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-infyn-rose/40 ${
                                selected ? 'font-bold text-infyn-ink' : 'font-semibold text-infyn-ink/45 active:text-infyn-ink/70'
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Recommended hint */}
                      {!formData.lookingFor && (
                        <p className="mt-3.5 flex items-start gap-1.5 text-center justify-center text-[12.5px] font-medium text-infyn-ink/45 leading-snug">
                          <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--infyn-rose)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-[2px] flex-shrink-0">
                            <path d="M9 18h6" />
                            <path d="M10 22h4" />
                            <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z" />
                          </svg>
                          <span><b className="text-infyn-rose">Everyone</b> is the most popular choice — matches you with more people.</span>
                        </p>
                      )}
                      {showErrors && errors.lookingFor && (
                        <div className="text-center">
                          <FieldError id="bi-looking-error">{errors.lookingFor}</FieldError>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER — Continue CTA */}
        <div className="bi-rise flex-shrink-0 z-20 px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-infyn-paper via-infyn-paper/92 to-transparent" style={{ animationDelay: '420ms' }}>
          <button
            onClick={handleContinue}
            aria-disabled={!isStepValid}
            aria-busy={phase === 'saving'}
            className={`group relative h-[56px] w-full overflow-hidden rounded-[20px] text-[15.5px] font-bold transition-all duration-300 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-infyn-rose/50 focus-visible:ring-offset-2 ${
              shake ? 'bi-shake' : ''
            } ${
              isStepValid || phase !== 'idle'
                ? 'bg-gradient-to-r from-infyn-rose to-infyn-rose text-white shadow-[0_16px_40px_-12px_rgba(32,26,22,0.16)] active:scale-[0.97]'
                : 'border border-infyn-ink/8 bg-infyn-ink/[0.05] text-infyn-ink/35 active:scale-[0.99]'
            }`}
          >
            {isStepValid && phase === 'idle' && (
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
                  <span className="bi-pop flex h-6 w-6 items-center justify-center rounded-full bg-infyn-surface/25">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  All set
                </>
              ) : step < STEP_COUNT - 1 ? (
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
              ) : (
                <>
                  That&apos;s me
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
          <p className="mt-3 text-center text-[12px] font-medium text-infyn-ink/35">
            {step === 1
              ? 'We never share your birthday — only your age'
              : 'This appears on your profile — you can edit it anytime'}
          </p>
        </div>
      </div>
    </div>
  );
}

/* Soft inline validation — calm copy, no alert banners. */
function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} role="status" className="bi-error-in mt-2 ml-1 flex items-start justify-center gap-1.5 text-[12.5px] font-medium leading-snug text-rose-500/90">
      <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-[1.5px] flex-shrink-0">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {children}
    </p>
  );
}