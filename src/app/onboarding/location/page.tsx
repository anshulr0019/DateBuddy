'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
  'Nagpur', 'Indore', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara',
];

export default function LocationPage() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredCities = city
    ? INDIAN_CITIES.filter(c => c.toLowerCase().includes(city.toLowerCase()))
    : INDIAN_CITIES;

  const handleNext = () => {
    if (!city) {
      setError('Please select your city');
      return;
    }
    setError('');

    localStorage.setItem('onboarding_location', city);
    router.push('/onboarding/photos');
  };

  const handleAutoDetect = () => {
    // Simulate GPS detection
    setCity('Mumbai');
    setShowSuggestions(false);
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
              <div className="h-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] rounded-full transition-all duration-500" style={{ width: '28%' }} />
            </div>
            <span className="text-[12px] font-bold text-[#1A1A2E]/50">2/7</span>
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
            <h1 className="text-[26px] font-black text-[#1A1A2E] tracking-tight">Where are you located?</h1>
            <p className="text-[14px] text-[#1A1A2E]/60 mt-1">This helps us discover nearby matches for you</p>
          </div>

          <div className="space-y-4">
            {/* Auto Detect Button */}
            <button
              type="button"
              onClick={handleAutoDetect}
              className="w-full h-13 rounded-2xl border border-[#FF6B9D]/30 bg-gradient-to-r from-[#FF6B9D]/10 to-[#7B68EE]/10 text-[#FF6B9D] text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-[#FF6B9D]/15 transition-all cursor-pointer shadow-sm"
            >
              <span className="text-base">📍</span>
              <span>Auto-detect my location</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-[#1A1A2E]/10" />
              <span className="text-[#1A1A2E]/40 text-[12px] font-semibold uppercase tracking-wider">or search city</span>
              <div className="flex-1 h-px bg-[#1A1A2E]/10" />
            </div>

            {/* City Input */}
            <div className="relative">
              <div className="rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-[0_4px_20px_-10px_rgba(26,26,46,0.06)] backdrop-blur-md">
                <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2 uppercase tracking-wider">Select Your City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Enter your city (e.g. Mumbai, Delhi)"
                  className="w-full h-12 px-4 rounded-xl border border-[#1A1A2E]/10 bg-white/90 text-[#1A1A2E] text-[16px] font-medium focus:outline-none focus:border-[#FF6B9D] focus:ring-2 focus:ring-[#FF6B9D]/20 transition-all placeholder:text-[#1A1A2E]/35"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute z-30 w-full mt-2 bg-white/95 rounded-[20px] border border-white/80 shadow-[0_12px_40px_-12px_rgba(26,26,46,0.15)] backdrop-blur-xl max-h-60 overflow-y-auto scrollbar-none">
                  {filteredCities.map((cityName) => (
                    <button
                      key={cityName}
                      type="button"
                      onClick={() => {
                        setCity(cityName);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-5 py-3 hover:bg-[#FF6B9D]/10 border-b border-[#1A1A2E]/5 last:border-b-0 text-[14px] font-medium text-[#1A1A2E] transition-colors"
                    >
                      📍 {cityName}
                    </button>
                  ))}
                  {filteredCities.length === 0 && (
                    <div className="px-5 py-4 text-[#1A1A2E]/50 text-[14px]">No cities found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="flex-shrink-0 z-20 px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#FAFAF7] via-[#FAFAF7]/90 to-transparent border-t border-black/5">
          <button
            onClick={handleNext}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[15px] font-bold shadow-[0_10px_25px_-5px_rgba(255,107,157,0.5)] active:scale-[0.985] transition-all cursor-pointer"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
