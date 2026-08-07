'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning } from '../lib/haptics';

type Step = 'info' | 'camera' | 'processing' | 'submitted' | 'pending' | 'verified' | 'failed';

const STYLES = `
  @keyframes vfy-rise {
    0% { opacity: 0; transform: translateY(16px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .vfy-rise { animation: vfy-rise 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }

  @keyframes vfy-pop {
    0% { opacity: 0; transform: scale(0.5); }
    60% { opacity: 1; transform: scale(1.1); }
    100% { opacity: 1; transform: scale(1); }
  }
  .vfy-pop { animation: vfy-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

  @keyframes vfy-spin { to { transform: rotate(360deg); } }
  .vfy-spin { animation: vfy-spin 0.8s linear infinite; }

  @keyframes vfy-pulse-ring {
    0% { transform: scale(1); opacity: 0.7; }
    100% { transform: scale(1.9); opacity: 0; }
  }
  .vfy-ring {
    position: absolute; inset: -16px; border-radius: 9999px;
    border: 2px solid #22C55E; opacity: 0;
    animation: vfy-pulse-ring 2s cubic-bezier(0.22, 1, 0.36, 1) 0.4s infinite;
  }
  .vfy-ring-2 {
    position: absolute; inset: -28px; border-radius: 9999px;
    border: 1.5px solid #7B68EE; opacity: 0;
    animation: vfy-pulse-ring 2s cubic-bezier(0.22, 1, 0.36, 1) 0.8s infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .vfy-rise, .vfy-pop { animation: none !important; opacity: 1 !important; transform: none !important; }
    .vfy-ring, .vfy-ring-2 { animation: none !important; }
  }
`;

const BENEFITS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    title: 'Stand out from the crowd',
    sub: 'Blue badge on your profile shows you\'re the real deal',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    title: 'Get 50% more matches',
    sub: 'Verified profiles are trusted and get seen more often',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Quick & easy',
    sub: 'Takes under 2 minutes — reviewed within 24 hours',
  },
];

const HOW_STEPS = [
  { n: '1', text: 'Take a quick selfie video following the on-screen pose' },
  { n: '2', text: 'Our team reviews your submission within 24 hours' },
  { n: '3', text: 'Your blue verified badge appears on your profile' },
];

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Go back"
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/70 text-[#1A1A2E]/70 shadow-[0_4px_16px_-8px_rgba(26,26,46,0.15)] backdrop-blur-xl transition-all duration-200 active:scale-[0.92] cursor-pointer"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );
}

export default function VerificationPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('info');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch('/api/users/verification');
        if (res.status === 401) { router.replace('/welcome'); return; }
        if (!res.ok) return;
        const data = await res.json();
        const status = data?.verification?.status;
        if (status === 'pending') setStep('pending');
        else if (status === 'verified') setStep('verified');
      } catch { /* offline — show info screen */ }
    }
    loadStatus();
  }, [router]);

  const handleTakePhoto = async () => {
    setStep('processing');
    setError('');
    hapticMedium();
    try {
      const res = await fetch('/api/users/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.status === 401) { router.replace('/welcome'); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        hapticWarning();
        setError(data.message || 'Could not submit your verification.');
        setStep('failed');
        return;
      }
      hapticSuccess();
      setStep(data.status === 'verified' ? 'verified' : 'submitted');
    } catch {
      hapticWarning();
      setError('Network error. Please check your connection and try again.');
      setStep('failed');
    }
  };

  /* ── Shared shell ── */
  const Shell = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
    <div className={`h-dvh w-full flex justify-center overflow-hidden font-sans ${dark ? 'bg-[#0d0917]' : 'bg-[#FAFAF7]'}`}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className={`relative h-full w-full max-w-[440px] flex flex-col overflow-hidden ${dark ? '' : 'bg-[#FAFAF7]'}`}>
        {!dark && (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
            <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-[#FF6B9D]/10 blur-[60px]" />
            <div className="absolute -right-20 top-10 h-80 w-80 rounded-full bg-[#7B68EE]/08 blur-[70px]" />
            <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-[#FFB4D0]/12 blur-[60px]" />
          </div>
        )}
        {children}
      </div>
    </div>
  );

  /* ── Info ── */
  if (step === 'info') return (
    <Shell>
      <div className="flex-shrink-0 z-10 px-5 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-3">
        <BackButton onClick={() => router.back()} />
      </div>

      <div className="flex-1 min-h-0 z-10 overflow-y-auto scrollbar-none px-5 pb-6">
        <div className="vfy-rise mb-8" style={{ animationDelay: '60ms' }}>
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#22C55E]/15 to-[#7B68EE]/15 border border-[#22C55E]/25 shadow-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <h1 className="text-[30px] font-black tracking-tight text-[#1A1A2E] leading-[1.1] mb-2">
            Get Your Blue<br />
            <span className="bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] bg-clip-text text-transparent">Verified Badge</span>
          </h1>
          <p className="text-[14.5px] text-[#1A1A2E]/55 leading-relaxed">
            A quick selfie video proves you&apos;re genuine — and unlocks more matches.
          </p>
        </div>

        {/* Benefits */}
        <div className="vfy-rise space-y-3 mb-6" style={{ animationDelay: '120ms' }}>
          {BENEFITS.map((b, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-[22px] border border-white/80 bg-white/80 p-4 shadow-[0_4px_20px_-10px_rgba(26,26,46,0.08)] backdrop-blur-md"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B9D]/12 to-[#7B68EE]/12 text-[#7B68EE] border border-[#7B68EE]/15">
                {b.icon}
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#1A1A2E]">{b.title}</p>
                <p className="text-[12.5px] text-[#1A1A2E]/55 mt-0.5 leading-snug">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="vfy-rise rounded-[22px] border border-white/80 bg-white/80 p-5 shadow-[0_4px_20px_-10px_rgba(26,26,46,0.08)] backdrop-blur-md" style={{ animationDelay: '180ms' }}>
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#1A1A2E]/45 mb-4">How it works</p>
          <div className="space-y-3.5">
            {HOW_STEPS.map((s) => (
              <div key={s.n} className="flex items-start gap-3.5">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] text-white text-[11px] font-black shadow-sm">
                  {s.n}
                </div>
                <p className="text-[13.5px] text-[#1A1A2E]/70 leading-snug pt-0.5">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 z-10 px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#FAFAF7] via-[#FAFAF7]/90 to-transparent">
        <button
          onClick={() => { hapticLight(); setStep('camera'); }}
          className="group relative w-full h-14 rounded-2xl overflow-hidden bg-gradient-to-r from-[#FF6B9D] via-[#E86AC7] to-[#7B68EE] text-white text-[15px] font-bold shadow-[0_12px_32px_-10px_rgba(255,107,157,0.55)] active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          Start Verification
        </button>
        <p className="mt-2.5 text-center text-[11.5px] text-[#1A1A2E]/40">
          Your video is never stored — used only to verify your identity
        </p>
      </div>
    </Shell>
  );

  /* ── Camera ── */
  if (step === 'camera') return (
    <Shell dark>
      <div className="flex-shrink-0 px-5 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-3">
        <button
          onClick={() => setStep('info')}
          aria-label="Go back"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/80 active:scale-[0.92] transition-all cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Camera frame */}
        <div className="relative w-64 h-80 mb-8">
          <div className="absolute inset-0 rounded-[32px] overflow-hidden border-2 border-white/20 bg-white/5 flex items-center justify-center">
            <div className="text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
                <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <p className="text-white/40 text-[13px]">Camera preview</p>
            </div>
          </div>
          {/* Face oval overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-40 h-52 rounded-full border-2 border-white/50 border-dashed" />
          </div>
          {/* Corner brackets */}
          {[
            'top-4 left-4 border-t-2 border-l-2',
            'top-4 right-4 border-t-2 border-r-2',
            'bottom-4 left-4 border-b-2 border-l-2',
            'bottom-4 right-4 border-b-2 border-r-2',
          ].map((cls, i) => (
            <div key={i} className={`absolute h-6 w-6 ${cls} border-white/80 rounded-sm`} />
          ))}
        </div>

        {/* Pose instructions */}
        <div className="rounded-[22px] bg-white/10 backdrop-blur-md border border-white/15 p-4 w-full mb-6">
          <p className="text-white font-bold text-[14px] text-center mb-3">Follow these poses</p>
          <div className="flex justify-center gap-8">
            {[['👋', 'Wave'], ['😊', 'Smile'], ['↩️', 'Turn']].map(([emoji, label]) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-3xl">{emoji}</span>
                <span className="text-white/60 text-[11px] font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Record button */}
      <div className="flex-shrink-0 flex items-center justify-center pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
        <button
          onClick={handleTakePhoto}
          aria-label="Record verification video"
          className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/30 active:scale-95 transition-all cursor-pointer"
        >
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] shadow-[0_0_32px_rgba(255,107,157,0.6)]" />
        </button>
      </div>
    </Shell>
  );

  /* ── Processing ── */
  if (step === 'processing') return (
    <Shell>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9D]/15 to-[#7B68EE]/15 border border-[#7B68EE]/20 mb-6">
          <svg className="vfy-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7B68EE" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 12a9 9 0 1 1-6.2-8.56" />
          </svg>
        </div>
        <h2 className="text-[22px] font-extrabold text-[#1A1A2E] mb-2">Submitting…</h2>
        <p className="text-[14px] text-[#1A1A2E]/55 max-w-[240px] leading-relaxed">
          This will only take a moment
        </p>
      </div>
    </Shell>
  );

  /* ── Submitted / Pending ── */
  if (step === 'submitted' || step === 'pending') return (
    <Shell>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="vfy-pop relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#F59E0B]/15 to-[#F97316]/15 border border-[#F59E0B]/25 mb-6">
          <span className="text-4xl">⏳</span>
        </div>
        <h1 className="vfy-rise text-[24px] font-extrabold text-[#1A1A2E] mb-3" style={{ animationDelay: '100ms' }}>
          Under Review
        </h1>
        <p className="vfy-rise text-[14.5px] text-[#1A1A2E]/60 max-w-[280px] leading-relaxed" style={{ animationDelay: '160ms' }}>
          {step === 'submitted'
            ? "Thanks! Our team will review your submission. Your badge will appear on your profile once approved."
            : "You've already submitted — our team is reviewing it. Your badge will appear once approved."}
        </p>
      </div>
      <div className="flex-shrink-0 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
        <button
          onClick={() => router.push('/profile')}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[15px] font-bold shadow-[0_12px_32px_-10px_rgba(255,107,157,0.55)] active:scale-[0.985] transition-all cursor-pointer"
        >
          Back to Profile
        </button>
      </div>
    </Shell>
  );

  /* ── Verified ── */
  if (step === 'verified') return (
    <Shell>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="vfy-pop relative mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#22C55E]/20 to-[#7B68EE]/20 border border-[#22C55E]/30">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="vfy-ring" />
          <div className="vfy-ring-2" />
        </div>
        <h1 className="vfy-rise text-[28px] font-extrabold text-[#1A1A2E] mb-3 tracking-tight" style={{ animationDelay: '100ms' }}>
          You&apos;re Verified! 🎉
        </h1>
        <p className="vfy-rise text-[14.5px] text-[#1A1A2E]/60 max-w-[260px] leading-relaxed" style={{ animationDelay: '160ms' }}>
          Your blue badge is now live on your profile. Expect more matches!
        </p>
      </div>
      <div className="flex-shrink-0 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
        <button
          onClick={() => { hapticSuccess(); router.push('/profile'); }}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#7B68EE] text-white text-[15px] font-bold shadow-[0_12px_32px_-10px_rgba(34,197,94,0.45)] active:scale-[0.985] transition-all cursor-pointer"
        >
          View My Profile
        </button>
      </div>
    </Shell>
  );

  /* ── Failed ── */
  return (
    <Shell>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="vfy-pop flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 border border-rose-200 text-[#F43F5E] mb-6">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="vfy-rise text-[22px] font-extrabold text-[#1A1A2E] mb-2" style={{ animationDelay: '80ms' }}>
          Couldn&apos;t Submit
        </h2>
        <p className="vfy-rise text-[14px] text-[#1A1A2E]/60 max-w-[260px] leading-relaxed mb-8" style={{ animationDelay: '140ms' }}>
          {error || 'Something went wrong. Check your connection and try again.'}
        </p>
      </div>
      <div className="flex-shrink-0 px-5 space-y-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
        <button
          onClick={() => { hapticLight(); setStep('camera'); }}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[15px] font-bold shadow-[0_12px_32px_-10px_rgba(255,107,157,0.55)] active:scale-[0.985] transition-all cursor-pointer"
        >
          Try Again
        </button>
        <button
          onClick={() => router.push('/profile')}
          className="w-full h-12 rounded-2xl border border-[#1A1A2E]/10 bg-white/80 text-[#1A1A2E] text-[14px] font-bold active:scale-[0.98] transition-all cursor-pointer"
        >
          Maybe Later
        </button>
      </div>
    </Shell>
  );
}
