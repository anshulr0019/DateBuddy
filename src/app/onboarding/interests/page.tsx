'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { hapticLight, hapticMedium, hapticWarning } from '../../lib/haptics';

const BackChevron = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const INTERESTS = [
  '📷 Photography', '✈️ Travel', '🎵 Music', '💪 Fitness', '🍕 Food',
  '🎨 Art', '🎮 Gaming', '📚 Reading', '🎬 Movies', '💃 Dancing',
  '👨‍🍳 Cooking', '⚽ Sports', '👗 Fashion', '🐶 Pets', '🏃 Running',
  '🧘 Yoga', '🎤 Karaoke', '🌱 Plants', '☕ Coffee', '🍺 Beer',
  '🎭 Theater', '📱 Tech', '🏔️ Hiking', '🏖️ Beach', '🌃 Nightlife',
];

const MIN_INTERESTS = 5;

export default function InterestsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');

  const toggle = (interest: string) => {
    hapticLight();
    setSelected(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
    if (error) setError('');
  };

  const handleNext = () => {
    if (selected.length < MIN_INTERESTS) {
      hapticWarning();
      setError(`Please select at least ${MIN_INTERESTS} interests.`);
      return;
    }
    localStorage.setItem('onboarding_interests', JSON.stringify(selected));
    hapticMedium();
    router.push('/onboarding/preferences');
  };

  const remaining = Math.max(0, MIN_INTERESTS - selected.length);
  const ready = selected.length >= MIN_INTERESTS;

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
              aria-valuenow={5}
              aria-valuemin={1}
              aria-valuemax={7}
              aria-label="Onboarding step 5 of 7"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] shadow-[0_0_8px_rgba(255,107,157,0.5)] transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: '71.4%' }}
              />
            </div>
            <span className="text-[12px] font-bold tabular-nums text-[#1A1A2E]/45">5 of 7</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 z-10 px-6 overflow-y-auto scrollbar-none pb-6">
          {error && (
            <div role="alert" className="mb-4 flex items-start gap-2 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-rose-600 text-[13px] font-semibold leading-snug">
              <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div className="mb-6">
            <h1 className="text-[28px] font-black text-[#1A1A2E] tracking-tight leading-[1.1]">What are you into?</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-[14.5px] text-[#1A1A2E]/55">Pick at least {MIN_INTERESTS}</p>
              {selected.length > 0 && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold transition-all ${
                  ready
                    ? 'bg-[#22C55E]/15 text-[#16A34A] border border-[#22C55E]/25'
                    : 'bg-[#FF6B9D]/12 text-[#FF6B9D] border border-[#FF6B9D]/25'
                }`}>
                  {ready ? (
                    <>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      {selected.length} selected
                    </>
                  ) : `${remaining} more`}
                </span>
              )}
            </div>
          </div>

          <div
            className="flex flex-wrap gap-2.5"
            role="group"
            aria-label="Select your interests"
          >
            {INTERESTS.map((interest) => {
              const on = selected.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(interest)}
                  className={`px-4 py-2.5 rounded-full border text-[13.5px] font-semibold transition-all duration-200 cursor-pointer active:scale-95 select-none ${
                    on
                      ? 'border-transparent bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white shadow-[0_4px_16px_-6px_rgba(255,107,157,0.45)]'
                      : 'border-[#1A1A2E]/10 bg-white/80 text-[#1A1A2E]/75 hover:bg-white hover:border-[#1A1A2E]/20 backdrop-blur-md shadow-sm'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 z-20 px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#FAFAF7] via-[#FAFAF7]/90 to-transparent border-t border-black/[0.04]">
          <button
            onClick={handleNext}
            disabled={!ready}
            className="w-full h-14 rounded-2xl text-[15px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:active:scale-100 bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white shadow-[0_10px_28px_-8px_rgba(255,107,157,0.5)] active:scale-[0.985]"
          >
            Continue
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
