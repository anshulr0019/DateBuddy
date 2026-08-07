'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { hapticLight, hapticMedium } from '../../lib/haptics';

const BackChevron = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const PROMPTS = [
  "My perfect weekend is...",
  "I'm weirdly good at...",
  "Let's debate about...",
  "My go-to karaoke song is...",
  "The way to my heart is...",
  "I'm looking for someone who...",
];

export default function BioPage() {
  const router = useRouter();
  const [bio, setBio] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [promptAnswer, setPromptAnswer] = useState('');

  const handleNext = () => {
    localStorage.setItem('onboarding_bio', JSON.stringify({ bio, selectedPrompt, promptAnswer }));
    hapticMedium();
    router.push('/onboarding/interests');
  };

  const handleSkip = () => {
    hapticLight();
    router.push('/onboarding/interests');
  };

  const selectPrompt = (prompt: string) => {
    hapticLight();
    setSelectedPrompt(prompt === selectedPrompt ? '' : prompt);
    setPromptAnswer('');
  };

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">

        {/* Ambient */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-[#FF6B9D]/08 blur-[60px]" />
          <div className="absolute -right-16 bottom-1/3 h-64 w-64 rounded-full bg-[#7B68EE]/07 blur-[60px]" />
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
              aria-valuenow={4}
              aria-valuemin={1}
              aria-valuemax={7}
              aria-label="Onboarding step 4 of 7"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] shadow-[0_0_8px_rgba(255,107,157,0.5)] transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: '57.1%' }}
              />
            </div>
            <span className="text-[12px] font-bold tabular-nums text-[#1A1A2E]/45">4 of 7</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 z-10 px-6 overflow-y-auto scrollbar-none pb-6">
          <div className="mb-6">
            <h1 className="text-[28px] font-black text-[#1A1A2E] tracking-tight leading-[1.1]">Tell us about yourself</h1>
            <p className="text-[14.5px] text-[#1A1A2E]/55 mt-1.5">Write a bio or answer a fun prompt to stand out</p>
          </div>

          {/* Bio input */}
          <div className="rounded-[22px] border border-white/80 bg-white/80 p-4 shadow-[0_4px_20px_-10px_rgba(26,26,46,0.07)] backdrop-blur-md mb-5">
            <label htmlFor="bio-input" className="block text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#1A1A2E]/45 mb-2">Your Bio</label>
            <div className="relative">
              <textarea
                id="bio-input"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                placeholder="Write a short, engaging bio…"
                className="w-full min-h-[96px] px-4 py-3 rounded-xl border border-[#1A1A2E]/10 bg-white/90 text-[#1A1A2E] text-[16px] font-medium focus:outline-none focus:border-[#FF6B9D] focus:ring-2 focus:ring-[#FF6B9D]/15 transition-all resize-none placeholder:text-[#1A1A2E]/30 caret-[#FF6B9D]"
                maxLength={150}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1">
              <span className={`text-[11px] font-medium transition-colors ${bio.length > 130 ? 'text-[#FF6B9D]' : 'text-[#1A1A2E]/30'}`}>
                {bio.length}/150
              </span>
              {bio.length >= 20 && (
                <span className="text-[11px] font-bold text-[#22C55E] flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Good length
                </span>
              )}
            </div>
          </div>

          {/* Prompts */}
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#1A1A2E]/45 mb-3">Or answer a fun prompt</p>
            <div className="space-y-2.5">
              {PROMPTS.map((prompt) => {
                const isSelected = selectedPrompt === prompt;
                return (
                  <div
                    key={prompt}
                    onClick={() => selectPrompt(prompt)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && selectPrompt(prompt)}
                    aria-pressed={isSelected}
                    className={`rounded-[20px] border p-4 transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                      isSelected
                        ? 'border-[#FF6B9D]/50 bg-gradient-to-br from-[#FF6B9D]/[0.08] to-[#7B68EE]/[0.08] shadow-[0_4px_20px_-8px_rgba(255,107,157,0.2)]'
                        : 'border-white/80 bg-white/80 shadow-[0_2px_8px_-4px_rgba(26,26,46,0.06)] hover:bg-white hover:border-[#1A1A2E]/15'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] font-semibold text-[#1A1A2E] leading-snug">{prompt}</p>
                      <div className={`h-5 w-5 rounded-full border-2 flex-shrink-0 ml-3 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-transparent bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE]'
                          : 'border-[#1A1A2E]/20'
                      }`}>
                        {isSelected && (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <input
                        type="text"
                        value={promptAnswer}
                        onChange={(e) => setPromptAnswer(e.target.value)}
                        placeholder="Your answer…"
                        aria-label={`Answer to: ${prompt}`}
                        className="mt-3 w-full h-11 px-3.5 rounded-xl border border-[#FF6B9D]/30 bg-white text-[#1A1A2E] text-[16px] font-medium focus:outline-none focus:border-[#FF6B9D] focus:ring-2 focus:ring-[#FF6B9D]/15 caret-[#FF6B9D]"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 z-20 px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#FAFAF7] via-[#FAFAF7]/90 to-transparent border-t border-black/[0.04] space-y-2.5">
          <button
            onClick={handleNext}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[15px] font-bold shadow-[0_10px_28px_-8px_rgba(255,107,157,0.5)] active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            Continue
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <button
            onClick={handleSkip}
            className="w-full py-2.5 text-[13px] font-semibold text-[#1A1A2E]/45 hover:text-[#1A1A2E]/70 transition-colors cursor-pointer text-center min-h-[44px] flex items-center justify-center"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
