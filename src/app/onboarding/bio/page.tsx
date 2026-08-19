'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hapticLight, hapticMedium } from '../../lib/haptics';

const BackChevron = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const PROMPT_BANK = [
  { category: '✨ About Me', prompts: [
    "I'm weirdly good at…",
    "Two truths and a lie…",
    "My most irrational fear is…",
    "The most spontaneous thing I've done…",
    "My love language is…",
    "People would describe me as…",
  ]},
  { category: '💬 Conversation Starters', prompts: [
    "Let's debate about…",
    "Ask me about…",
    "The way to win me over is…",
    "I'll know it's time to leave a party when…",
    "My hot take is…",
    "Change my mind about…",
  ]},
  { category: '🌙 Lifestyle', prompts: [
    "My perfect weekend is…",
    "I'm happiest when…",
    "My go-to karaoke song is…",
    "The best travel I've ever done…",
    "My guilty pleasure is…",
    "I recharge by…",
  ]},
  { category: '💕 Looking For', prompts: [
    "I'm looking for someone who…",
    "My ideal first date is…",
    "The couple I look up to most…",
    "I fall for people who…",
    "Green flags I look for…",
    "My relationship goal is…",
  ]},
];

const ALL_PROMPTS = PROMPT_BANK.flatMap((b) => b.prompts);
const MAX_PROMPTS = 3;

interface SelectedPrompt {
  prompt: string;
  answer: string;
}

type Screen = 'main' | 'picker';

export default function BioPage() {
  const router = useRouter();
  const [bio, setBio] = useState('');
  const [selectedPrompts, setSelectedPrompts] = useState<SelectedPrompt[]>([]);
  const [screen, setScreen] = useState<Screen>('main');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleNext = () => {
    localStorage.setItem('onboarding_bio', JSON.stringify({ bio, selectedPrompts }));
    hapticMedium();
    router.push('/onboarding/interests');
  };

  const handleSkip = () => {
    hapticLight();
    router.push('/onboarding/interests');
  };

  const openPickerForNew = () => {
    if (selectedPrompts.length >= MAX_PROMPTS) return;
    setEditingIndex(null);
    setScreen('picker');
  };

  const openPickerForEdit = (idx: number) => {
    setEditingIndex(idx);
    setScreen('picker');
  };

  const selectPrompt = useCallback((prompt: string) => {
    hapticLight();
    if (editingIndex !== null) {
      // Replace the prompt at this index, keep its answer if same prompt
      setSelectedPrompts((prev) => prev.map((sp, i) =>
        i === editingIndex ? { prompt, answer: sp.prompt === prompt ? sp.answer : '' } : sp
      ));
    } else {
      setSelectedPrompts((prev) => [...prev, { prompt, answer: '' }]);
    }
    setScreen('main');
  }, [editingIndex]);

  const updateAnswer = (idx: number, answer: string) => {
    setSelectedPrompts((prev) => prev.map((sp, i) => i === idx ? { ...sp, answer } : sp));
  };

  const removePrompt = (idx: number) => {
    hapticLight();
    setSelectedPrompts((prev) => prev.filter((_, i) => i !== idx));
  };

  const usedPrompts = new Set(selectedPrompts.map((sp) => sp.prompt));

  // ─── Prompt Picker Screen ──────────────────────────────────────────────────
  if (screen === 'picker') {
    return (
      <div className="min-h-screen h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
        <div className="relative h-full w-full max-w-[440px] sm:max-w-lg flex flex-col bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5">
          {/* Ambient */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
            <div className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-[#FF6B9D]/08 blur-[60px]" />
            <div className="absolute -right-16 bottom-1/3 h-64 w-64 rounded-full bg-[#7B68EE]/07 blur-[60px]" />
          </div>

          {/* Header */}
          <div className="flex-shrink-0 z-20 px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-4 border-b border-black/[0.04] bg-[#FAFAF7]/80 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setScreen('main')}
                aria-label="Go back"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-[#1A1A2E]/70 shadow-[0_4px_16px_-8px_rgba(26,26,46,0.12)] backdrop-blur-xl transition-all active:scale-[0.92] cursor-pointer"
              >
                {BackChevron}
              </button>
              <div>
                <h1 className="text-[20px] font-black text-[#1A1A2E] leading-tight">Pick a Prompt</h1>
                <p className="text-[12px] text-[#1A1A2E]/45 font-medium">
                  {editingIndex !== null ? 'Choose a replacement' : `${selectedPrompts.length}/${MAX_PROMPTS} selected`}
                </p>
              </div>
            </div>
          </div>

          {/* Prompt list */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-5 py-4 space-y-5">
            {PROMPT_BANK.map((bank) => (
              <div key={bank.category}>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#1A1A2E]/40 mb-2.5 px-1">
                  {bank.category}
                </p>
                <div className="space-y-2">
                  {bank.prompts.map((prompt) => {
                    const isUsed = usedPrompts.has(prompt) && selectedPrompts[editingIndex ?? -1]?.prompt !== prompt;
                    const isCurrentEdit = selectedPrompts[editingIndex ?? -1]?.prompt === prompt;
                    return (
                      <button
                        key={prompt}
                        disabled={isUsed}
                        onClick={() => selectPrompt(prompt)}
                        className={`w-full text-left rounded-[18px] px-4 py-3.5 text-[14px] font-semibold transition-all active:scale-[0.98] cursor-pointer border ${
                          isCurrentEdit
                            ? 'border-[#FF6B9D]/50 bg-gradient-to-r from-[#FF6B9D]/10 to-[#7B68EE]/10 text-[#1A1A2E]'
                            : isUsed
                            ? 'border-transparent bg-white/40 text-[#1A1A2E]/30 cursor-not-allowed'
                            : 'border-white/80 bg-white/80 text-[#1A1A2E] shadow-[0_2px_8px_-4px_rgba(26,26,46,0.07)] hover:bg-white hover:border-[#FF6B9D]/30'
                        }`}
                      >
                        {prompt}
                        {isCurrentEdit && (
                          <span className="ml-2 text-[11px] font-bold text-[#FF6B9D]">current</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="h-6" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Bio + Prompts Screen ─────────────────────────────────────────────
  return (
    <div className="min-h-screen h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
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
            <p className="text-[14.5px] text-[#1A1A2E]/55 mt-1.5">Write a bio and add up to 3 prompts to show your personality</p>
          </div>

          {/* Bio input */}
          <div className="rounded-[22px] border border-white/80 bg-white/80 p-4 shadow-[0_4px_20px_-10px_rgba(26,26,46,0.07)] backdrop-blur-md mb-5">
            <label htmlFor="bio-input" className="block text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#1A1A2E]/45 mb-2">Your Bio</label>
            <textarea
              id="bio-input"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 150))}
              placeholder="Write a short, engaging bio…"
              className="w-full min-h-[96px] px-4 py-3 rounded-xl border border-[#1A1A2E]/10 bg-white/90 text-[#1A1A2E] text-[16px] font-medium focus:outline-none focus:border-[#FF6B9D] focus:ring-2 focus:ring-[#FF6B9D]/15 transition-all resize-none placeholder:text-[#1A1A2E]/30 caret-[#FF6B9D]"
              maxLength={150}
            />
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

          {/* Prompts section */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#1A1A2E]/45">
                Prompts · {selectedPrompts.length}/{MAX_PROMPTS}
              </p>
              {selectedPrompts.length > 0 && (
                <span className="text-[11px] font-semibold text-[#7B68EE]">
                  Drag to reorder
                </span>
              )}
            </div>

            {/* Selected prompts */}
            <div className="space-y-3 mb-3">
              {selectedPrompts.map((sp, idx) => (
                <div
                  key={idx}
                  className="rounded-[22px] border border-[#FF6B9D]/20 bg-gradient-to-br from-[#FF6B9D]/[0.06] to-[#7B68EE]/[0.06] p-4 shadow-[0_4px_20px_-10px_rgba(255,107,157,0.15)]"
                >
                  {/* Prompt header row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <button
                      onClick={() => openPickerForEdit(idx)}
                      className="flex-1 text-left text-[13px] font-bold text-[#FF6B9D] leading-snug cursor-pointer hover:underline"
                      aria-label="Change prompt"
                    >
                      {sp.prompt}
                    </button>
                    <button
                      onClick={() => removePrompt(idx)}
                      aria-label="Remove prompt"
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-black/5 text-[#1A1A2E]/40 hover:bg-rose-50 hover:text-rose-400 transition-all active:scale-90 cursor-pointer"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={sp.answer}
                    onChange={(e) => updateAnswer(idx, e.target.value.slice(0, 100))}
                    placeholder="Your answer…"
                    aria-label={`Answer to: ${sp.prompt}`}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#FF6B9D]/25 bg-white/80 text-[#1A1A2E] text-[15px] font-medium focus:outline-none focus:border-[#FF6B9D] focus:ring-2 focus:ring-[#FF6B9D]/15 caret-[#FF6B9D] placeholder:text-[#1A1A2E]/30"
                  />
                  <div className="flex justify-end mt-1 pr-1">
                    <span className="text-[10px] text-[#1A1A2E]/30">{sp.answer.length}/100</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add prompt button */}
            {selectedPrompts.length < MAX_PROMPTS && (
              <button
                onClick={openPickerForNew}
                className="w-full flex items-center justify-center gap-2.5 rounded-[22px] border-2 border-dashed border-[#FF6B9D]/30 bg-[#FF6B9D]/[0.04] py-4 text-[14px] font-bold text-[#FF6B9D]/70 hover:bg-[#FF6B9D]/[0.08] hover:border-[#FF6B9D]/50 active:scale-[0.99] transition-all cursor-pointer"
                aria-label="Add a prompt"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add a prompt
                <span className="text-[12px] font-medium text-[#1A1A2E]/30">
                  ({MAX_PROMPTS - selectedPrompts.length} left)
                </span>
              </button>
            )}
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
