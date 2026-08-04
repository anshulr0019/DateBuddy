'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    router.push('/onboarding/interests');
  };

  const handleSkip = () => {
    router.push('/onboarding/interests');
  };

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        {/* Progress Bar Header */}
        <div className="flex-shrink-0 z-20 px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-2">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 border border-[#1A1A2E]/10 text-[#1A1A2E] shadow-sm backdrop-blur-md hover:bg-white transition-all cursor-pointer"
            >
              ←
            </button>
            <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden p-0.5 border border-white/60">
              <div className="h-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] rounded-full transition-all duration-500" style={{ width: '56%' }} />
            </div>
            <span className="text-[12px] font-bold text-[#1A1A2E]/50">4/7</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 z-10 px-6 overflow-y-auto scrollbar-none pb-6">
          <div className="mb-6">
            <h1 className="text-[26px] font-black text-[#1A1A2E] tracking-tight">Tell us about yourself</h1>
            <p className="text-[14px] text-[#1A1A2E]/60 mt-1">Write a bio or answer a fun prompt to stand out</p>
          </div>

          {/* Bio Input Card */}
          <div className="rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-[0_4px_20px_-10px_rgba(26,26,46,0.06)] backdrop-blur-md mb-5">
            <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2 uppercase tracking-wider">Your Bio</label>
            <div className="relative">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                placeholder="Write a short, engaging bio..."
                className="w-full min-h-[100px] p-3.5 rounded-xl border border-[#1A1A2E]/10 bg-white/90 text-[#1A1A2E] text-[16px] font-medium focus:outline-none focus:border-[#FF6B9D] focus:ring-2 focus:ring-[#FF6B9D]/20 transition-all resize-none placeholder:text-[#1A1A2E]/35"
                maxLength={150}
              />
              <div className="text-right text-[11px] font-semibold text-[#1A1A2E]/40 mt-1">
                {bio.length}/150
              </div>
            </div>
          </div>

          {/* Prompts Section */}
          <div>
            <label className="block text-[13px] font-bold text-[#1A1A2E] mb-3 uppercase tracking-wider">Or answer a fun prompt:</label>
            <div className="space-y-3">
              {PROMPTS.slice(0, 3).map((prompt) => (
                <div
                  key={prompt}
                  onClick={() => {
                    setSelectedPrompt(prompt);
                    setPromptAnswer('');
                  }}
                  className={`rounded-[20px] border p-4 transition-all cursor-pointer shadow-sm ${
                    selectedPrompt === prompt
                      ? 'border-[#FF6B9D] bg-gradient-to-r from-[#FF6B9D]/10 to-[#7B68EE]/10'
                      : 'border-white/80 bg-white/80 hover:bg-white'
                  }`}
                >
                  <p className="text-[14px] font-semibold text-[#1A1A2E]">{prompt}</p>
                  {selectedPrompt === prompt && (
                    <input
                      type="text"
                      value={promptAnswer}
                      onChange={(e) => setPromptAnswer(e.target.value)}
                      placeholder="Your answer..."
                      className="mt-3 w-full h-11 px-3.5 rounded-xl border border-[#FF6B9D]/30 bg-white text-[#1A1A2E] text-[16px] font-medium focus:outline-none focus:border-[#FF6B9D]"
                      autoFocus
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex-shrink-0 z-20 px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#FAFAF7] via-[#FAFAF7]/90 to-transparent border-t border-black/5 space-y-2.5">
          <button
            onClick={handleNext}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[15px] font-bold shadow-[0_10px_25px_-5px_rgba(255,107,157,0.5)] active:scale-[0.985] transition-all cursor-pointer"
          >
            Continue →
          </button>
          <button
            onClick={handleSkip}
            className="w-full py-2 text-[13px] font-semibold text-[#1A1A2E]/50 hover:text-[#1A1A2E] transition-colors cursor-pointer text-center"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
