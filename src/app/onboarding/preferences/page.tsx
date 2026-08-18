'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PreferencesPage() {
  const router = useRouter();
  const [ageRange, setAgeRange] = useState([18, 30]);
  const [distance, setDistance] = useState(50);

  const handleNext = () => {
    const preferences = { ageRange, distance };
    localStorage.setItem('onboarding_preferences', JSON.stringify(preferences));
    router.push('/onboarding/review');
  };

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        {/* Progress Bar Header */}
        <div className="flex-shrink-0 z-20 px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-2">
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
              aria-valuenow={6}
              aria-valuemin={1}
              aria-valuemax={7}
              aria-label="Onboarding progress: step 6 of 7"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] shadow-[0_0_8px_rgba(255,107,157,0.5)] transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: '85.7%' }}
              />
            </div>
            <span className="text-[12px] font-bold tabular-nums text-[#1A1A2E]/45">6 of 7</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 z-10 px-6 overflow-y-auto scrollbar-none pb-6">
          <div className="mb-6">
            <h1 className="text-[26px] font-black text-[#1A1A2E] tracking-tight">Who would you like to meet?</h1>
            <p className="text-[14px] text-[#1A1A2E]/60 mt-1">Set your discovery preferences for age and distance</p>
          </div>

          <div className="space-y-4">
            {/* Age Range Card */}
            <div className="rounded-[20px] border border-white/80 bg-white/80 p-5 shadow-[0_4px_20px_-10px_rgba(26,26,46,0.06)] backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <label className="text-[13px] font-bold text-[#1A1A2E] uppercase tracking-wider">Age Preference</label>
                <span className="text-[15px] font-extrabold text-[#FF6B9D] bg-[#FF6B9D]/10 px-3 py-1 rounded-full">
                  {ageRange[0]} - {ageRange[1]} yrs
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[12px] font-medium text-[#1A1A2E]/50 mb-1">
                    <span>Minimum Age</span>
                    <span>{ageRange[0]} yrs</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="50"
                    value={ageRange[0]}
                    onChange={(e) => {
                      const newMin = parseInt(e.target.value);
                      if (newMin < ageRange[1]) {
                        setAgeRange([newMin, ageRange[1]]);
                      }
                    }}
                    className="w-full accent-[#FF6B9D] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[12px] font-medium text-[#1A1A2E]/50 mb-1">
                    <span>Maximum Age</span>
                    <span>{ageRange[1]} yrs</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="50"
                    value={ageRange[1]}
                    onChange={(e) => {
                      const newMax = parseInt(e.target.value);
                      if (newMax > ageRange[0]) {
                        setAgeRange([ageRange[0], newMax]);
                      }
                    }}
                    className="w-full accent-[#7B68EE] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Distance Card */}
            <div className="rounded-[20px] border border-white/80 bg-white/80 p-5 shadow-[0_4px_20px_-10px_rgba(26,26,46,0.06)] backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[13px] font-bold text-[#1A1A2E] uppercase tracking-wider">Distance Radius</label>
                <span className="text-[15px] font-extrabold text-[#7B68EE] bg-[#7B68EE]/10 px-3 py-1 rounded-full">
                  {distance} km
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={distance}
                onChange={(e) => setDistance(parseInt(e.target.value))}
                className="w-full accent-[#FF6B9D] cursor-pointer mt-2"
              />
            </div>

            <p className="text-[12px] text-[#1A1A2E]/45 text-center pt-2">
              You can adjust these preferences anytime in settings
            </p>
          </div>
        </div>

        {/* Footer Button */}
        <div className="flex-shrink-0 z-20 px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#FAFAF7] via-[#FAFAF7]/90 to-transparent border-t border-black/5">
          <button 
            onClick={handleNext} 
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[15px] font-bold shadow-[0_10px_25px_-5px_rgba(255,107,157,0.5)] active:scale-[0.985] transition-all cursor-pointer"
          >
            Save & Continue →
          </button>
        </div>
      </div>
    </div>
  );
}