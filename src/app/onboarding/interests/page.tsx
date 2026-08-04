'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const INTERESTS = [
  '📷 Photography', '✈️ Travel', '🎵 Music', '💪 Fitness', '🍕 Food',
  '🎨 Art', '🎮 Gaming', '📚 Reading', '🎬 Movies', '💃 Dancing',
  '👨‍🍳 Cooking', '⚽ Sports', '👗 Fashion', '🐶 Pets', '🏃 Running',
  '🧘 Yoga', '🎤 Karaoke', '🌱 Plants', '☕ Coffee', '🍺 Beer',
  '🎭 Theater', '📱 Tech', '🏔️ Hiking', '🏖️ Beach', '🌃 Nightlife',
];

export default function InterestsPage() {
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [error, setError] = useState('');

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleNext = () => {
    if (selectedInterests.length < 5) {
      setError('Please select at least 5 interests');
      return;
    }
    setError('');

    localStorage.setItem('onboarding_interests', JSON.stringify(selectedInterests));
    router.push('/onboarding/preferences');
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
              <div className="h-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] rounded-full transition-all duration-500" style={{ width: '70%' }} />
            </div>
            <span className="text-[12px] font-bold text-[#1A1A2E]/50">5/7</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 z-10 px-6 overflow-y-auto scrollbar-none pb-6">
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-[13px] font-semibold text-center leading-snug">
              {error}
            </div>
          )}
          <div className="mb-6">
            <h1 className="text-[26px] font-black text-[#1A1A2E] tracking-tight">What are you into?</h1>
            <p className="text-[14px] text-[#1A1A2E]/60 mt-1">
              Select at least 5 interests ({selectedInterests.length}/5 selected)
            </p>
          </div>

          {/* Interests Grid */}
          <div className="flex flex-wrap gap-2.5">
            {INTERESTS.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2.5 rounded-full border text-[13.5px] font-semibold transition-all cursor-pointer shadow-sm active:scale-95 ${
                    isSelected
                      ? 'border-transparent bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white shadow-[0_6px_20px_-5px_rgba(255,107,157,0.4)]'
                      : 'border-[#1A1A2E]/10 bg-white/80 text-[#1A1A2E]/80 hover:bg-white hover:border-[#1A1A2E]/20 backdrop-blur-md'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Button */}
        <div className="flex-shrink-0 z-20 px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#FAFAF7] via-[#FAFAF7]/90 to-transparent border-t border-black/5">
          <button
            onClick={handleNext}
            disabled={selectedInterests.length < 5}
            className={`w-full h-14 rounded-2xl text-[15px] font-bold transition-all cursor-pointer ${
              selectedInterests.length >= 5
                ? 'bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white shadow-[0_10px_25px_-5px_rgba(255,107,157,0.5)] active:scale-[0.985]'
                : 'bg-black/10 text-[#1A1A2E]/35 cursor-not-allowed'
            }`}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
