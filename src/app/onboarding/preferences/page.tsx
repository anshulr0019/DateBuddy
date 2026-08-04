'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PreferencesPage() {
  const router = useRouter();
  const [ageRange, setAgeRange] = useState([18, 30]);
  const [distance, setDistance] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');

  const handleNext = async () => {
    const preferences = { ageRange, distance };
    localStorage.setItem('onboarding_preferences', JSON.stringify(preferences));

    setIsLoading(true);
    setErrorDetails('');

    try {
      const basicInfoStr = localStorage.getItem('onboarding_basic');
      if (!basicInfoStr) {
        setErrorDetails('Your profile details are missing. Please start again from the beginning.');
        return;
      }

      const payload = {
        basicInfo: JSON.parse(basicInfoStr),
        location: localStorage.getItem('onboarding_location') || '',
        photos: JSON.parse(localStorage.getItem('onboarding_photos') || '[]'),
        bio: JSON.parse(localStorage.getItem('onboarding_bio') || '{}'),
        interests: JSON.parse(localStorage.getItem('onboarding_interests') || '[]'),
        preferences,
      };

      const response = await fetch('/api/users/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        router.push('/welcome');
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        router.push('/onboarding/review');
      } else {
        setErrorDetails(data.message || 'Could not save your profile. Please try again.');
      }
    } catch {
      setErrorDetails('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
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
              <div className="h-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] rounded-full transition-all duration-500" style={{ width: '84%' }} />
            </div>
            <span className="text-[12px] font-bold text-[#1A1A2E]/50">6/7</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 z-10 px-6 overflow-y-auto scrollbar-none pb-6">
          <div className="mb-6">
            <h1 className="text-[26px] font-black text-[#1A1A2E] tracking-tight">Who would you like to meet?</h1>
            <p className="text-[14px] text-[#1A1A2E]/60 mt-1">Set your discovery preferences for age and distance</p>
          </div>

          {errorDetails && (
            <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
              <p className="text-rose-600 text-xs font-semibold">{errorDetails}</p>
            </div>
          )}

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
            disabled={isLoading}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[15px] font-bold shadow-[0_10px_25px_-5px_rgba(255,107,157,0.5)] active:scale-[0.985] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving Profile...' : 'Save & Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}